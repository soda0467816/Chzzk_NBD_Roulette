import { createServer } from "node:http";
import { stat } from "node:fs/promises";
import { createReadStream } from "node:fs";
import { extname, join, normalize } from "node:path";
import { ChzzkLiveDonationClient } from "./lib/chzzk-live-donation-client.mjs";

const PORT = Number(process.env.PORT || 8787);

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

let unofficialLiveCollector = null;
let unofficialLiveState = {
  running: false,
  connected: false,
  channelId: "",
  mode: "donation",
  lastError: "",
};
const unofficialLiveSubscribers = new Set();

function broadcastUnofficialLiveEvent(type, payload) {
  const message = `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (const response of unofficialLiveSubscribers) {
    response.write(message);
  }
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload));
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) {
    chunks.push(chunk);
  }
  if (!chunks.length) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

async function serveStatic(request, response) {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);
  let requestedPath = requestUrl.pathname === "/" ? "/src/pages/streamer.html" : requestUrl.pathname;

  if (requestedPath === "/overlay.html") {
    requestedPath = "/src/pages/overlay.html";
  } else if (requestedPath.startsWith("/scripts/")) {
    requestedPath = `/src${requestedPath}`;
  } else if (requestedPath.startsWith("/styles/")) {
    requestedPath = `/src${requestedPath}`;
  } else if (requestedPath === "/streamer.html") {
    requestedPath = "/src/pages/streamer.html";
  }

  const filePath = normalize(join(process.cwd(), requestedPath));

  if (!filePath.startsWith(process.cwd())) {
    sendJson(response, 403, { error: "Forbidden" });
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      sendJson(response, 404, { error: "Not found" });
      return;
    }
    response.writeHead(200, {
      "Content-Type": MIME_TYPES[extname(filePath)] || "application/octet-stream",
    });
    createReadStream(filePath).pipe(response);
  } catch {
    sendJson(response, 404, { error: "Not found" });
  }
}

function parseChannelIdFromLiveUrl(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) {
    return "";
  }

  try {
    const url = new URL(value);
    const segments = url.pathname.split("/").filter(Boolean);
    const liveIndex = segments.findIndex((segment) => segment === "live");
    return liveIndex >= 0 ? segments[liveIndex + 1] || "" : "";
  } catch {
    return "";
  }
}

async function stopUnofficialCollector() {
  if (unofficialLiveCollector) {
    const collector = unofficialLiveCollector;
    unofficialLiveCollector = null;
    await collector.disconnect().catch(() => {});
  }

  unofficialLiveState = {
    ...unofficialLiveState,
    running: false,
    connected: false,
    lastError: "",
  };

  broadcastUnofficialLiveEvent("status", unofficialLiveState);
}

async function handleUnofficialCollectorStart(request, response) {
  const body = await readBody(request);
  const channelId = body.channelId || parseChannelIdFromLiveUrl(body.liveUrl);
  const mode = body.mode || "donation";

  if (!channelId) {
    sendJson(response, 400, { error: "channelId or liveUrl is required" });
    return;
  }

  await stopUnofficialCollector();

  const collector = new ChzzkLiveDonationClient({
    channelId,
    nidAuth: body.nidAuth || "",
    nidSession: body.nidSession || "",
  });

  unofficialLiveCollector = collector;
  unofficialLiveState = {
    running: true,
    connected: false,
    channelId,
    mode,
    lastError: "",
  };

  collector.on("connect", () => {
    unofficialLiveState = {
      ...unofficialLiveState,
      running: true,
      connected: true,
      lastError: "",
    };
    broadcastUnofficialLiveEvent("status", unofficialLiveState);
  });

  collector.on("disconnect", () => {
    unofficialLiveState = {
      ...unofficialLiveState,
      connected: false,
    };
    broadcastUnofficialLiveEvent("status", unofficialLiveState);
  });

  collector.on("error", (error) => {
    unofficialLiveState = {
      ...unofficialLiveState,
      connected: false,
      lastError: error?.message || "Unknown live collector error",
    };
    broadcastUnofficialLiveEvent("error", { message: unofficialLiveState.lastError });
    broadcastUnofficialLiveEvent("status", unofficialLiveState);
  });

  collector.on("liveStatus", (liveStatus) => {
    broadcastUnofficialLiveEvent("liveStatus", liveStatus);
  });

  collector.on("donation", (payload) => {
    broadcastUnofficialLiveEvent("donation", payload);
  });

  collector.on("chat", (payload) => {
    broadcastUnofficialLiveEvent("chat", payload);
  });

  await collector.connect();
  sendJson(response, 200, { ok: true, channelId, mode });
}

async function handleUnofficialCollectorStop(response) {
  await stopUnofficialCollector();
  sendJson(response, 200, { ok: true });
}

function handleUnofficialCollectorEvents(request, response) {
  response.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-store",
    Connection: "keep-alive",
  });

  unofficialLiveSubscribers.add(response);
  response.write(`event: status\ndata: ${JSON.stringify(unofficialLiveState)}\n\n`);

  request.on("close", () => {
    unofficialLiveSubscribers.delete(response);
  });
}

function handleUnofficialCollectorStatus(response) {
  sendJson(response, 200, unofficialLiveState);
}

const server = createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, `http://${request.headers.host}`).pathname;

    if (request.method === "GET" && pathname === "/api/unofficial-live/status") {
      handleUnofficialCollectorStatus(response);
      return;
    }

    if (request.method === "GET" && pathname === "/api/unofficial-live/events") {
      handleUnofficialCollectorEvents(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/unofficial-live/start") {
      await handleUnofficialCollectorStart(request, response);
      return;
    }

    if (request.method === "POST" && pathname === "/api/unofficial-live/stop") {
      await handleUnofficialCollectorStop(response);
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Internal Server Error" });
  }
});

server.listen(PORT, () => {
  console.log(`Roulette dev server listening on http://localhost:${PORT}`);
});
