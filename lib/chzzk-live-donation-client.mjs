import { EventEmitter } from "node:events";
import WebSocket from "ws";

const API_BASE = "https://api.chzzk.naver.com";
const GAME_API_BASE = "https://comm-api.game.naver.com/nng_main";
const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";

const CHAT_CMD = {
  PING: 0,
  PONG: 10000,
  CONNECT: 100,
  CONNECTED: 10100,
  CHAT: 93101,
  RECENT_CHAT: 15101,
  DONATION: 93102,
};

const CHAT_TYPE = {
  TEXT: 1,
  DONATION: 10,
  SUBSCRIPTION: 11,
  SYSTEM_MESSAGE: 30,
};

function buildCookieHeader(nidAuth, nidSession) {
  if (!nidAuth || !nidSession) {
    return "";
  }
  return `NID_AUT=${nidAuth}; NID_SES=${nidSession}`;
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.message || `CHZZK request failed: ${response.status}`);
  }
  return data;
}

function normalizeLiveStatus(content) {
  if (!content) {
    return null;
  }

  let livePollingStatus = null;
  if (typeof content.livePollingStatusJson === "string" && content.livePollingStatusJson) {
    try {
      livePollingStatus = JSON.parse(content.livePollingStatusJson);
    } catch {
      livePollingStatus = null;
    }
  }

  return {
    ...content,
    livePollingStatus,
    chatChannelId: content.chatChannelId || livePollingStatus?.chatChannelId || null,
  };
}

function safeJsonParse(value, fallback = null) {
  if (!value || typeof value !== "string") {
    return fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function deriveServerId(chatChannelId) {
  const total = String(chatChannelId)
    .split("")
    .map((char) => char.charCodeAt(0))
    .reduce((sum, value) => sum + value, 0);
  return (Math.abs(total) % 9) + 1;
}

function parseMessageEnvelope(message) {
  const profile = safeJsonParse(message.profile, null);
  const extras = safeJsonParse(message.extras, {}) || {};
  const type = message.msgTypeCode || message.messageTypeCode || 0;
  const text = message.msg || message.content || "";
  const time = message.msgTime || message.messageTime || Date.now();

  return {
    type,
    commandType: message.cmd || message.commandType || null,
    message: text,
    time,
    hidden: (message.msgStatusType || message.messageStatusType) === "HIDDEN",
    memberCount: message.mbrCnt || message.memberCount || 0,
    profile,
    extras,
    raw: message,
  };
}

function looksLikeDonation(parsed, packetCmd) {
  if (parsed.type === CHAT_TYPE.DONATION) {
    return true;
  }

  if (parsed.type === CHAT_TYPE.SUBSCRIPTION) {
    return false;
  }

  if (packetCmd !== CHAT_CMD.DONATION) {
    return false;
  }

  const extras = parsed.extras || {};
  return Boolean(
    Number(extras.payAmount || 0) > 0 ||
    extras.donationType ||
    extras.payType ||
    extras.isAnonymous === true
  );
}

export class ChzzkLiveDonationClient extends EventEmitter {
  constructor(options) {
    super();
    this.options = {
      pollIntervalMs: 30_000,
      userAgent: DEFAULT_USER_AGENT,
      ...options,
    };
    this.ws = null;
    this.sid = null;
    this.chatChannelId = null;
    this.accessToken = null;
    this.connected = false;
    this.pollTimer = null;
    this.manualClose = false;
  }

  get hasCookieAuth() {
    return Boolean(this.options.nidAuth && this.options.nidSession);
  }

  get cookieHeader() {
    return buildCookieHeader(this.options.nidAuth, this.options.nidSession);
  }

  async fetchLiveStatus() {
    const data = await fetchJson(`${API_BASE}/polling/v2/channels/${this.options.channelId}/live-status`, {
      headers: {
        "User-Agent": this.options.userAgent,
      },
    });
    return normalizeLiveStatus(data.content ?? null);
  }

  async fetchChatAccessToken(chatChannelId) {
    const headers = {
      "User-Agent": this.options.userAgent,
    };

    if (this.cookieHeader) {
      headers.Cookie = this.cookieHeader;
    }

    const data = await fetchJson(
      `${GAME_API_BASE}/v1/chats/access-token?channelId=${encodeURIComponent(chatChannelId)}&chatType=STREAMING`,
      { headers },
    );

    if (data.code === 42601) {
      throw new Error("Broadcast is age-restricted and requires logged-in cookies.");
    }

    return data.content ?? null;
  }

  async resolveConnectionInfo() {
    const liveStatus = await this.fetchLiveStatus();
    if (!liveStatus?.chatChannelId) {
      throw new Error("Live chat channel could not be resolved. The live may be offline.");
    }

    const tokenInfo = await this.fetchChatAccessToken(liveStatus.chatChannelId);
    if (!tokenInfo?.accessToken) {
      throw new Error("Chat access token could not be resolved.");
    }

    return {
      liveStatus,
      chatChannelId: liveStatus.chatChannelId,
      accessToken: tokenInfo.accessToken,
    };
  }

  async connect() {
    if (this.ws) {
      throw new Error("Already connecting or connected.");
    }

    this.manualClose = false;

    const { chatChannelId, accessToken, liveStatus } = await this.resolveConnectionInfo();
    this.chatChannelId = chatChannelId;
    this.accessToken = accessToken;
    this.emit("liveStatus", liveStatus);

    const serverId = deriveServerId(chatChannelId);
    const socket = new WebSocket(`wss://kr-ss${serverId}.chat.naver.com/chat`);
    this.ws = socket;

    socket.on("open", () => {
      socket.send(
        JSON.stringify({
          ver: "2",
          cid: chatChannelId,
          svcid: "game",
          cmd: CHAT_CMD.CONNECT,
          tid: 1,
          bdy: {
            accTkn: accessToken,
            auth: "READ",
            devType: 2001,
            uid: null,
          },
        }),
      );
      this.startPolling();
    });

    socket.on("message", (payload) => {
      this.handleMessage(payload.toString("utf8"));
    });

    socket.on("close", () => {
      const shouldReconnect = !this.manualClose;
      this.connected = false;
      this.sid = null;
      this.ws = null;
      this.stopPolling();
      this.emit("disconnect");
      if (shouldReconnect) {
        this.reconnect().catch((error) => {
          this.emit("error", error);
        });
      }
    });

    socket.on("error", (error) => {
      this.emit("error", error);
    });
  }

  async disconnect() {
    this.manualClose = true;
    this.stopPolling();
    this.connected = false;
    this.sid = null;
    const socket = this.ws;
    this.ws = null;
    if (socket) {
      socket.close();
    }
  }

  async reconnect() {
    if (this.ws) {
      return;
    }
    await this.connect();
  }

  async pollLiveStatus() {
    if (!this.options.channelId) {
      return;
    }

    try {
      const nextStatus = await this.fetchLiveStatus();
      this.emit("liveStatus", nextStatus);
      const nextChatChannelId = nextStatus?.chatChannelId || null;

      if (nextChatChannelId && this.chatChannelId && nextChatChannelId !== this.chatChannelId) {
        this.chatChannelId = nextChatChannelId;
        if (this.ws) {
          this.ws.close();
        }
      }
    } catch (error) {
      this.emit("error", error);
    }
  }

  startPolling() {
    this.stopPolling();
    if (!this.options.pollIntervalMs) {
      return;
    }
    this.pollTimer = setInterval(() => {
      this.pollLiveStatus();
    }, this.options.pollIntervalMs);
  }

  stopPolling() {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  handleMessage(rawText) {
    let packet;
    try {
      packet = JSON.parse(rawText);
    } catch {
      return;
    }

    this.emit("raw", packet);

    const body = packet.bdy;
    switch (packet.cmd) {
      case CHAT_CMD.CONNECTED:
        this.connected = true;
        this.sid = body?.sid || null;
        this.emit("connect", {
          chatChannelId: this.chatChannelId,
          sid: this.sid,
        });
        return;
      case CHAT_CMD.PING:
        if (this.ws) {
          this.ws.send(JSON.stringify({ cmd: CHAT_CMD.PONG, ver: "2" }));
        }
        return;
      case CHAT_CMD.CHAT:
      case CHAT_CMD.DONATION:
      case CHAT_CMD.RECENT_CHAT: {
        const messages = Array.isArray(body?.messageList) ? body.messageList : Array.isArray(body) ? body : [];
        for (const message of messages) {
          const parsed = parseMessageEnvelope(message);
          if (parsed.type === CHAT_TYPE.TEXT && packet.cmd !== CHAT_CMD.DONATION) {
          this.emit("chat", {
            channelId: this.options.channelId,
            chatChannelId: this.chatChannelId,
            message: parsed.message,
            nickname: parsed.profile?.nickname || "",
            userIdHash: parsed.profile?.userIdHash || "",
            userRoleCode: parsed.profile?.userRoleCode || "",
            profile: parsed.profile,
            extras: parsed.extras,
            hidden: parsed.hidden,
            memberCount: parsed.memberCount,
            time: parsed.time,
            messageTypeCode: parsed.type,
            commandType: parsed.commandType,
            raw: parsed.raw,
          });
          continue;
        }
        if (!looksLikeDonation(parsed, packet.cmd)) {
            continue;
          }
          this.emit("donation", {
            channelId: this.options.channelId,
            chatChannelId: this.chatChannelId,
            message: parsed.message,
            payAmount: Number(parsed.extras?.payAmount || 0),
            donationType: parsed.extras?.donationType || "",
            success: parsed.extras?.success,
            status: parsed.extras?.status || "",
            isAnonymous: Boolean(parsed.extras?.isAnonymous),
            nickname: parsed.profile?.nickname || parsed.extras?.nickname || "",
            userIdHash: parsed.profile?.userIdHash || "",
            userRoleCode: parsed.profile?.userRoleCode || "",
            payType: parsed.extras?.payType || "",
            profile: parsed.profile,
            extras: parsed.extras,
            hidden: parsed.hidden,
            memberCount: parsed.memberCount,
            time: parsed.time,
            messageTypeCode: parsed.type,
            commandType: parsed.commandType,
            raw: parsed.raw,
          });
        }
        return;
      }
      default:
        return;
    }
  }
}

export async function fetchLiveConnectionPreview(channelId, options = {}) {
  const client = new ChzzkLiveDonationClient({ channelId, ...options });
  const liveStatus = await client.fetchLiveStatus();
  if (!liveStatus?.chatChannelId) {
    return {
      liveStatus,
      chatChannelId: null,
      accessTokenReady: false,
    };
  }

  const tokenInfo = await client.fetchChatAccessToken(liveStatus.chatChannelId);
  return {
    liveStatus,
    chatChannelId: liveStatus.chatChannelId,
    accessTokenReady: Boolean(tokenInfo?.accessToken),
  };
}
