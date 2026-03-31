/*
 * Third-party attribution:
 * This file integrates the "spin-wheel" library by CrazyTim (MIT License).
 * Source repository: https://github.com/CrazyTim/spin-wheel
 * CDN package used at runtime: https://cdn.jsdelivr.net/npm/spin-wheel@5.0.2/dist/spin-wheel-esm.js
 * License notice is preserved in THIRD_PARTY_NOTICES.md.
 */

const elements = {
  startTimeInput: document.getElementById("start-time-input"),
  unitAmountInput: document.getElementById("unit-amount-input"),
  spinDurationInput: document.getElementById("spin-duration-input"),
  entriesInput: document.getElementById("entries-input"),
  processButton: document.getElementById("process-button"),
  copyRosterButton: document.getElementById("copy-roster-button"),
  setNowButton: document.getElementById("set-now-button"),
  loadSampleButton: document.getElementById("load-sample-button"),
  authButton: document.getElementById("auth-button"),
  connectButton: document.getElementById("connect-button"),
  disconnectButton: document.getElementById("disconnect-button"),
  resetLiveButton: document.getElementById("reset-live-button"),
  clearMergesButton: document.getElementById("clear-merges-button"),
  authStatus: document.getElementById("auth-status"),
  sessionStatus: document.getElementById("session-status"),
  validCount: document.getElementById("valid-count"),
  invalidCount: document.getElementById("invalid-count"),
  participantCount: document.getElementById("participant-count"),
  ticketCount: document.getElementById("ticket-count"),
  summaryTable: document.getElementById("summary-table"),
  invalidTable: document.getElementById("invalid-table"),
  liveFeed: document.getElementById("live-feed"),
  mergeSuggestions: document.getElementById("merge-suggestions"),
  wheelContainer: document.getElementById("wheel-container"),
  spinButton: document.getElementById("spin-button"),
  winnerText: document.getElementById("winner-text"),
};

const sampleEntries = [
  "19:05 홍길동 3000",
  "19:07 김철수 1000",
  "19:10 홍길동 5000",
  "18:55 방송전후원 1000",
  "19:11 박하늘 900",
].join("\n");

const state = {
  parsedManualEntries: [],
  liveEntries: [],
  summary: [],
  invalidEntries: [],
  roster: [],
  spinning: false,
  wheel: null,
  wheelModuleReady: false,
  wheelModuleError: false,
  auth: null,
  manualMerges: {},
  liveConnection: {
    socket: null,
    sessionKey: null,
    sessionUrl: null,
    channelId: null,
    subscribed: false,
    connectState: "idle",
  },
};

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function parseLine(line, index) {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }
  const match = trimmed.match(/^(\d{2}:\d{2})\s+(\S+)\s+(\d+)$/);
  if (!match) {
    return { raw: trimmed, index, valid: false, reason: "형식 오류", source: "manual" };
  }
  const [, time, name, amountText] = match;
  return { raw: trimmed, index, valid: true, time, name, amount: Number(amountText), source: "manual" };
}

function toMinutes(timeText) {
  const [hour, minute] = timeText.split(":").map(Number);
  return hour * 60 + minute;
}

function timeFromDate(date) {
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

function collectEntries() {
  return [...state.parsedManualEntries, ...state.liveEntries];
}

function getGroupLabel(entry) {
  const message = (entry.message || "").trim();
  if (message) {
    return state.manualMerges[message] || message;
  }
  return `(no message) ${entry.name}`;
}

function normalizeMessageForSuggestion(message) {
  return message
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function buildMergeSuggestions(validEntries) {
  const buckets = new Map();

  for (const entry of validEntries) {
    const message = (entry.message || "").trim();
    if (!message || state.manualMerges[message]) {
      continue;
    }

    const normalized = normalizeMessageForSuggestion(message);
    if (!normalized) {
      continue;
    }

    const bucket = buckets.get(normalized) || new Map();
    bucket.set(message, (bucket.get(message) || 0) + 1);
    buckets.set(normalized, bucket);
  }

  return [...buckets.values()]
    .map((bucket) => {
      const variants = [...bucket.entries()]
        .sort((left, right) => right[1] - left[1] || right[0].length - left[0].length)
        .map(([label, count]) => ({ label, count }));

      return {
        canonical: variants[0]?.label || "",
        variants,
      };
    })
    .filter((group) => group.variants.length > 1);
}

function buildResult() {
  const startTime = elements.startTimeInput.value;
  const unitAmount = Number(elements.unitAmountInput.value);

  if (!startTime || !Number.isFinite(unitAmount) || unitAmount <= 0) {
    return {
      summary: [],
      invalidEntries: [{ raw: "설정값 확인 필요", reason: "시작 시각 또는 기준 금액 오류" }],
      roster: [],
      validEntries: [],
    };
  }

  const startMinutes = toMinutes(startTime);
  const validEntries = [];
  const invalidEntries = [];

  for (const entry of collectEntries()) {
    if (!entry.valid) {
      invalidEntries.push(entry);
      continue;
    }
    if (toMinutes(entry.time) < startMinutes) {
      invalidEntries.push({ ...entry, reason: "집계 시작 전" });
      continue;
    }
    const tickets = Math.floor(entry.amount / unitAmount);
    if (tickets <= 0) {
      invalidEntries.push({ ...entry, reason: "기준 금액 미만" });
      continue;
    }
    validEntries.push({ ...entry, tickets });
  }

  const grouped = new Map();

  for (const entry of validEntries) {
    const groupLabel = getGroupLabel(entry);
    const current = grouped.get(groupLabel) || {
      label: groupLabel,
      totalAmount: 0,
      totalTickets: 0,
      count: 0,
      senders: new Set(),
      donationTypes: new Set(),
    };
    current.totalAmount += entry.amount;
    current.totalTickets += entry.tickets;
    current.count += 1;
    current.senders.add(entry.name);
    current.donationTypes.add(entry.donationType || "CHAT");
    grouped.set(groupLabel, current);
  }

  const summary = [...grouped.values()]
    .map((entry) => ({
      ...entry,
      senders: [...entry.senders],
      donationTypes: [...entry.donationTypes],
    }))
    .sort((left, right) => right.totalTickets - left.totalTickets || left.label.localeCompare(right.label, "ko"));

  const roster = summary.flatMap((entry) => Array.from({ length: entry.totalTickets }, () => entry.label));

  return { summary, invalidEntries, roster, validEntries };
}

function renderSummary(summary) {
  if (!summary.length) {
    elements.summaryTable.className = "table-body empty-state";
    elements.summaryTable.textContent = "집계 결과가 여기 표시됩니다.";
    return;
  }
  elements.summaryTable.className = "table-body";
  elements.summaryTable.innerHTML = summary.map((entry) => `
    <article class="table-row">
      <div>
        <strong>${escapeHtml(entry.label)}</strong>
        <small>총 ${formatNumber(entry.totalAmount)}원 · ${entry.count}건 · ${escapeHtml(entry.senders.join(", "))}</small>
      </div>
      <span class="ticket-pill">${formatNumber(entry.totalTickets)}칸</span>
    </article>
  `).join("");
}

function renderInvalid(invalidEntries) {
  if (!invalidEntries.length) {
    elements.invalidTable.className = "table-body empty-state";
    elements.invalidTable.textContent = "제외된 항목이 없습니다.";
    return;
  }
  elements.invalidTable.className = "table-body";
  elements.invalidTable.innerHTML = invalidEntries.map((entry) => `
    <article class="table-row">
      <div>
        <strong>${escapeHtml(entry.raw || "확인 필요")}</strong>
        <small>${entry.time ? `${escapeHtml(entry.time)} ${escapeHtml(entry.name)} ${formatNumber(entry.amount)}원` : "입력값 검수 필요"}</small>
      </div>
      <span class="reason-pill">${escapeHtml(entry.reason)}</span>
    </article>
  `).join("");
}

function renderLiveFeed() {
  if (!state.liveEntries.length) {
    elements.liveFeed.className = "table-body empty-state";
    elements.liveFeed.textContent = "실시간 후원이 아직 들어오지 않았습니다.";
    return;
  }
  const items = [...state.liveEntries].sort((left, right) => right.receivedAt - left.receivedAt).slice(0, 12);
  elements.liveFeed.className = "table-body";
  elements.liveFeed.innerHTML = items.map((entry) => `
    <article class="table-row">
      <div>
        <strong>${escapeHtml(entry.name)}</strong>
        <small>${escapeHtml(entry.time)} · ${formatNumber(entry.amount)}원 · ${escapeHtml(entry.donationType)}</small>
      </div>
      <span class="ticket-pill">${escapeHtml(entry.message || "메시지 없음")}</span>
    </article>
  `).join("");
}

function renderMergeSuggestions(validEntries) {
  const suggestions = buildMergeSuggestions(validEntries);

  if (!suggestions.length) {
    elements.mergeSuggestions.className = "table-body empty-state";
    elements.mergeSuggestions.textContent = "병합할 유사 문구가 아직 없습니다.";
    return;
  }

  elements.mergeSuggestions.className = "table-body";
  elements.mergeSuggestions.innerHTML = suggestions.map((group, groupIndex) => `
    <article class="table-row">
      <div>
        <strong>${escapeHtml(group.canonical)}</strong>
        <small>${group.variants.map((variant) => `${escapeHtml(variant.label)} (${variant.count})`).join(" · ")}</small>
      </div>
      <div class="action-row" data-merge-group="${groupIndex}">
        ${group.variants
          .filter((variant) => variant.label !== group.canonical)
          .map(
            (variant) => `
              <button
                type="button"
                class="ghost-button merge-action-button"
                data-merge-source="${escapeHtml(variant.label)}"
                data-merge-target="${escapeHtml(group.canonical)}"
              >
                ${escapeHtml(variant.label)} -> 대표로 묶기
              </button>
            `
          )
          .join("")}
      </div>
    </article>
  `).join("");

  elements.mergeSuggestions.querySelectorAll(".merge-action-button").forEach((button) => {
    button.addEventListener("click", () => {
      const source = button.getAttribute("data-merge-source");
      const target = button.getAttribute("data-merge-target");
      if (!source || !target) {
        return;
      }
      state.manualMerges[source] = target;
      renderAll();
    });
  });
}

function createWheelItems(summary) {
  const palette = ["#c7562a", "#f0a15b", "#2f7d5c", "#e7c66a", "#8a4d2e", "#d97f54"];
  const labelPalette = ["#fffaf3", "#2a180f", "#fffaf3", "#2a180f", "#fffaf3", "#2a180f"];
  return summary.map((entry, index) => ({
    label: `${entry.label}\n${entry.totalTickets}칸`,
    weight: entry.totalTickets,
    backgroundColor: palette[index % palette.length],
    labelColor: labelPalette[index % labelPalette.length],
  }));
}

function renderWheel(summary) {
  if (!state.wheelModuleReady) {
    if (state.wheelModuleError) {
      elements.winnerText.textContent = "오픈소스 룰렛 엔진 로드에 실패했습니다. 인터넷 연결을 확인해 주세요.";
    }
    return;
  }
  if (!summary.length) {
    if (state.wheel) {
      state.wheel.items = [];
    }
    elements.winnerText.textContent = "아직 당첨자가 없습니다.";
    return;
  }
  state.wheel.items = createWheelItems(summary);
  state.wheel.rotation = 0;
}

function renderStatuses() {
  const auth = state.auth;
  const live = state.liveConnection;

  elements.authStatus.textContent = !auth?.authenticated
    ? "미인증 상태"
    : `${auth.channelName || "채널"} 인증 완료${auth.channelId ? ` · ${auth.channelId}` : ""}`;

  const liveStateText = {
    idle: "대기 중",
    connecting: "연결 중",
    connected: "소켓 연결됨",
    subscribed: "후원 구독 완료",
    error: "연결 오류",
  }[live.connectState] || "대기 중";

  elements.sessionStatus.textContent = live.channelId ? `${liveStateText} · ${live.channelId}` : liveStateText;
  elements.connectButton.disabled = !auth?.authenticated || state.spinning;
  elements.disconnectButton.disabled = !live.socket;
}

function renderAll() {
  const { summary, invalidEntries, roster, validEntries } = buildResult();
  state.summary = summary;
  state.invalidEntries = invalidEntries;
  state.roster = roster;

  elements.validCount.textContent = formatNumber(validEntries.length);
  elements.invalidCount.textContent = formatNumber(invalidEntries.length);
  elements.participantCount.textContent = formatNumber(summary.length);
  elements.ticketCount.textContent = formatNumber(roster.length);
  elements.spinButton.disabled = roster.length === 0 || state.spinning || !state.wheelModuleReady;
  if (!state.spinning) {
    elements.winnerText.textContent = roster.length === 0 ? "아직 당첨자가 없습니다." : "룰렛 준비 완료";
  }
  renderStatuses();
  renderSummary(summary);
  renderInvalid(invalidEntries);
  renderLiveFeed();
  renderMergeSuggestions(validEntries);
  renderWheel(summary);
}

function parseManualEntries() {
  state.parsedManualEntries = elements.entriesInput.value.split(/\r?\n/).map(parseLine).filter(Boolean);
}

function setCurrentTime() {
  elements.startTimeInput.value = timeFromDate(new Date());
}

async function copyRoster() {
  if (!state.roster.length) {
    elements.winnerText.textContent = "복사할 룰렛 명단이 없습니다.";
    return;
  }
  try {
    await navigator.clipboard.writeText(state.roster.join("\n"));
    elements.winnerText.textContent = "룰렛 명단을 클립보드에 복사했습니다.";
  } catch {
    elements.winnerText.textContent = "클립보드 복사에 실패했습니다.";
  }
}

function spinRoulette() {
  if (!state.roster.length || state.spinning || !state.wheel) {
    return;
  }
  state.spinning = true;
  elements.spinButton.disabled = true;

  const durationMs = Number(elements.spinDurationInput.value) * 1000;
  const winningName = state.roster[Math.floor(Math.random() * state.roster.length)];
  const winningIndex = state.summary.findIndex((entry) => entry.label === winningName);
  if (winningIndex < 0) {
    state.spinning = false;
    elements.spinButton.disabled = false;
    return;
  }
  elements.winnerText.textContent = "룰렛 회전 중...";
  state.wheel.spinToItem(winningIndex, durationMs, true, 6, 1);
}

async function initWheel() {
  try {
    const { Wheel } = await import("https://cdn.jsdelivr.net/npm/spin-wheel@5.0.2/dist/spin-wheel-esm.js");
    state.wheel = new Wheel(elements.wheelContainer, {
      items: [],
      isInteractive: false,
      radius: 0.92,
      borderColor: "#fff7ef",
      borderWidth: 6,
      lineColor: "rgba(255,255,255,0.62)",
      lineWidth: 2,
      itemLabelFont: '"Segoe UI", "Apple SD Gothic Neo", sans-serif',
      itemLabelFontSizeMax: 28,
      itemLabelRadius: 0.58,
      itemLabelRadiusMax: 0.28,
      itemLabelAlign: "center",
      itemLabelBaselineOffset: -0.12,
      rotation: 0,
      pointerAngle: 0,
      onRest: (event) => {
        const winner = state.summary[event.currentIndex]?.label;
        elements.winnerText.textContent = winner ? `당첨: ${winner}` : "룰렛이 멈췄습니다.";
        state.spinning = false;
        elements.spinButton.disabled = state.roster.length === 0;
      },
    });
    state.wheelModuleReady = true;
    renderAll();
  } catch {
    state.wheelModuleError = true;
    elements.winnerText.textContent = "오픈소스 룰렛 엔진을 불러오지 못했습니다. 인터넷 연결이 필요합니다.";
  }
}

async function api(path, options = {}) {
  const response = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed: ${response.status}`);
  }
  return data;
}

async function loadAuthStatus() {
  try {
    state.auth = await api("/api/auth/status");
  } catch {
    state.auth = { authenticated: false };
  }
  renderAll();
}

async function startAuth() {
  try {
    const data = await api("/api/auth/start");
    window.location.href = data.authorizeUrl;
  } catch (error) {
    elements.winnerText.textContent = `인증 시작 실패: ${error.message}`;
  }
}

function ensureSocketIoLoaded() {
  if (window.io) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.0.3/socket.io.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Socket.IO client 로드 실패"));
    document.head.appendChild(script);
  });
}

function addLiveDonation(payload) {
  const amount = Number(payload.payAmount);
  if (!Number.isFinite(amount)) {
    return;
  }
  state.liveEntries.push({
    raw: `${timeFromDate(new Date())} ${payload.donatorNickname || "익명"} ${amount}`,
    valid: true,
    time: timeFromDate(new Date()),
    name: payload.donatorNickname || "익명",
    amount,
    source: "live",
    donationType: payload.donationType || "CHAT",
    message: payload.donationText || "",
    receivedAt: Date.now(),
  });
  renderAll();
}

async function connectLiveSession() {
  if (!state.auth?.authenticated) {
    elements.winnerText.textContent = "먼저 치지직 인증을 완료해 주세요.";
    return;
  }
  try {
    await ensureSocketIoLoaded();
    state.liveConnection.connectState = "connecting";
    renderStatuses();

    const sessionData = await api("/api/session/connect-info");
    state.liveConnection.channelId = sessionData.channelId;
    state.liveConnection.sessionUrl = sessionData.sessionUrl;

    const socket = window.io.connect(sessionData.sessionUrl, {
      reconnection: false,
      forceNew: true,
      timeout: 3000,
      transports: ["websocket"],
    });
    state.liveConnection.socket = socket;

    socket.on("connect", () => {
      state.liveConnection.connectState = "connected";
      renderStatuses();
    });

    socket.on("SYSTEM", async (data) => {
      if (data?.type === "connected" && data?.data?.sessionKey) {
        state.liveConnection.sessionKey = data.data.sessionKey;
        try {
          await api("/api/session/subscribe-donation", {
            method: "POST",
            body: JSON.stringify({ sessionKey: data.data.sessionKey }),
          });
          state.liveConnection.subscribed = true;
          state.liveConnection.connectState = "subscribed";
          renderStatuses();
        } catch (error) {
          state.liveConnection.connectState = "error";
          elements.winnerText.textContent = `후원 구독 실패: ${error.message}`;
          renderStatuses();
        }
      }
    });

    socket.on("DONATION", (payload) => {
      addLiveDonation(payload);
    });

    socket.on("disconnect", () => {
      state.liveConnection.connectState = "idle";
      state.liveConnection.socket = null;
      state.liveConnection.sessionKey = null;
      state.liveConnection.subscribed = false;
      renderStatuses();
    });

    socket.on("connect_error", () => {
      state.liveConnection.connectState = "error";
      elements.winnerText.textContent = "소켓 연결에 실패했습니다.";
      renderStatuses();
    });
  } catch (error) {
    state.liveConnection.connectState = "error";
    elements.winnerText.textContent = `실시간 연결 실패: ${error.message}`;
    renderStatuses();
  }
}

async function disconnectLiveSession() {
  if (state.liveConnection.sessionKey) {
    try {
      await api("/api/session/unsubscribe-donation", {
        method: "POST",
        body: JSON.stringify({ sessionKey: state.liveConnection.sessionKey }),
      });
    } catch {
      // Ignore cleanup errors.
    }
  }
  if (state.liveConnection.socket) {
    state.liveConnection.socket.close();
  }
  state.liveConnection = {
    socket: null,
    sessionKey: null,
    sessionUrl: null,
    channelId: state.liveConnection.channelId,
    subscribed: false,
    connectState: "idle",
  };
  renderStatuses();
}

function resetLiveEntries() {
  state.liveEntries = [];
  renderAll();
}

function clearManualMerges() {
  state.manualMerges = {};
  renderAll();
}

function applyQueryMessages() {
  const params = new URLSearchParams(window.location.search);
  const authResult = params.get("auth");
  if (authResult === "success") {
    elements.winnerText.textContent = "치지직 인증이 완료됐습니다. 실시간 연결을 눌러 주세요.";
  } else if (authResult === "error") {
    elements.winnerText.textContent = "치지직 인증에 실패했습니다. 서버 로그를 확인해 주세요.";
  }
  if (authResult) {
    window.history.replaceState({}, "", window.location.pathname);
  }
}

elements.processButton.addEventListener("click", () => {
  parseManualEntries();
  renderAll();
});
elements.copyRosterButton.addEventListener("click", copyRoster);
elements.setNowButton.addEventListener("click", () => {
  setCurrentTime();
  renderAll();
});
elements.loadSampleButton.addEventListener("click", () => {
  elements.entriesInput.value = sampleEntries;
  parseManualEntries();
  renderAll();
});
elements.authButton.addEventListener("click", startAuth);
elements.connectButton.addEventListener("click", connectLiveSession);
elements.disconnectButton.addEventListener("click", disconnectLiveSession);
elements.resetLiveButton.addEventListener("click", resetLiveEntries);
elements.clearMergesButton.addEventListener("click", clearManualMerges);
elements.spinButton.addEventListener("click", spinRoulette);

parseManualEntries();
applyQueryMessages();
setCurrentTime();
initWheel();
loadAuthStatus();
