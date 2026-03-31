/*
 * Third-party attribution:
 * This file integrates the "spin-wheel" library by CrazyTim (MIT License).
 * Source repository: https://github.com/CrazyTim/spin-wheel
 * CDN package used at runtime: https://cdn.jsdelivr.net/npm/spin-wheel@5.0.2/dist/spin-wheel-esm.js
 * License notice is preserved in THIRD_PARTY_NOTICES.md.
 */

const STORAGE_KEY = "roulette_overlay_state_v1";
const params = new URLSearchParams(window.location.search);
const transparentMode = params.get("transparent") === "1";

const elements = {
  itemCount: document.getElementById("overlay-item-count"),
  ticketCount: document.getElementById("overlay-ticket-count"),
  statusText: document.getElementById("overlay-status-text"),
  winnerText: document.getElementById("overlay-winner-text"),
  summaryList: document.getElementById("overlay-summary-list"),
  wheelContainer: document.getElementById("overlay-wheel-container"),
};

const state = {
  wheel: null,
  wheelSignature: "",
  wheelReady: false,
  wheelFailed: false,
  snapshot: null,
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatPercent(value) {
  return `${(Number(value) || 0).toFixed(1)}%`;
}

function buildWheelSignature(summary) {
  return JSON.stringify({
    showAmounts: state.snapshot?.showAmounts !== false,
    items: summary.map((item) => ({
      label: item.label,
      totalAmount: item.totalAmount,
      totalTickets: item.totalTickets,
      winPercent: Number(item.winPercent?.toFixed?.(4) ?? item.winPercent ?? 0),
    })),
  });
}

function colorIndexForLabel(label, paletteLength) {
  const text = String(label || "");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = ((hash << 5) - hash + text.charCodeAt(index)) | 0;
  }
  return Math.abs(hash) % paletteLength;
}

function loadSnapshot() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.snapshot = raw ? JSON.parse(raw) : null;
  } catch {
    state.snapshot = null;
  }
}

function renderSummary(summary) {
  if (!summary.length) {
    elements.summaryList.className = "overlay-list empty-state";
    elements.summaryList.textContent = "아직 집계된 항목이 없습니다.";
    return;
  }

  const showAmounts = state.snapshot?.showAmounts !== false;
  elements.summaryList.className = "overlay-list";
  elements.summaryList.innerHTML = summary
    .slice(0, 10)
    .map(
      (item, index) => `
        <article class="overlay-list-row">
          <div class="overlay-rank">${index + 1}</div>
          <div class="overlay-copy">
            <strong>${escapeHtml(item.label)}</strong>
            <small>${formatNumber(item.totalAmount)}원 · ${item.count}건</small>
          </div>
          <div class="overlay-ticket-badge">${formatNumber(item.totalTickets)}칸</div>
        </article>
      `
    )
    .join("");
}

function renderWheel(summary) {
  if (!state.wheelReady) {
    if (state.wheelFailed) {
      elements.winnerText.textContent = "룰렛 엔진을 불러오지 못했습니다.";
    }
    return;
  }

  if (!summary.length) {
    state.wheel.items = [];
    return;
  }

  const palette = ["#ff7a18", "#ffb347", "#0c7c59", "#ffd166", "#bc4b51", "#5c4742"];
  const labelPalette = ["#fffaf3", "#2a180f", "#fffaf3", "#2a180f", "#fffaf3", "#fffaf3"];

  state.wheel.items = summary.map((item, index) => ({
    label: `${item.label}\n${item.totalTickets}칸`,
    weight: item.totalTickets,
    backgroundColor: palette[index % palette.length],
    labelColor: labelPalette[index % labelPalette.length],
  }));
  state.wheel.rotation = 0;
}

function renderSummaryDisplay(summary) {
  if (!summary.length) {
    elements.summaryList.className = "overlay-list empty-state";
    elements.summaryList.textContent = "아직 집계된 항목이 없습니다.";
    return;
  }

  const showAmounts = state.snapshot?.showAmounts !== false;
  elements.summaryList.className = "overlay-list";
  elements.summaryList.innerHTML = summary
    .slice(0, 10)
    .map(
      (item, index) => `
        <article class="overlay-list-row">
          <div class="overlay-rank">${index + 1}</div>
          <div class="overlay-copy">
            <strong>${escapeHtml(item.label)}</strong>
            <small>${showAmounts ? `${formatNumber(item.totalAmount)}원 · ` : ""}${item.count}건 · ${formatPercent(item.winPercent)}</small>
          </div>
          <div class="overlay-ticket-badge">${formatPercent(item.winPercent)}</div>
        </article>
      `
    )
    .join("");
}

function renderSnapshot() {
  const snapshot = state.snapshot;
  const summary = snapshot?.summary || [];
  const wheelSummary = snapshot?.wheelSummary || summary;
  const roster = snapshot?.roster || [];

  elements.itemCount.textContent = formatNumber(summary.length);
  elements.ticketCount.textContent = formatNumber(roster.length);
  elements.statusText.textContent = snapshot?.statusText || "운영 화면에서 항목을 추가하면 여기에 반영됩니다.";
  elements.winnerText.textContent = snapshot?.winnerText || "아직 당첨 항목이 없습니다.";

  renderSummaryDisplay(summary);
  renderWheelDisplay(wheelSummary);
}

function renderWheelDisplay(summary) {
  if (!state.wheelReady) {
    if (state.wheelFailed) {
      elements.winnerText.textContent = "룰렛 엔진을 불러오지 못했습니다.";
    }
    return;
  }

  if (!summary.length) {
    state.wheel.items = [];
    state.wheelSignature = "";
    return;
  }

  const nextSignature = buildWheelSignature(summary);
  if (state.wheelSignature === nextSignature) {
    return;
  }

  const palette = ["#ff7a18", "#ffb347", "#0c7c59", "#ffd166", "#bc4b51", "#5c4742"];
  const labelPalette = ["#fffaf3", "#2a180f", "#fffaf3", "#2a180f", "#fffaf3", "#fffaf3"];

  state.wheel.items = summary.map((item) => {
    const colorIndex = colorIndexForLabel(item.label, palette.length);
    return {
    label: `${item.label}\n${formatPercent(item.winPercent)}`,
    weight: item.totalTickets,
    backgroundColor: palette[colorIndex],
    labelColor: labelPalette[colorIndex],
  };
  });
  state.wheelSignature = nextSignature;
}

function applyOverlayMode() {
  if (transparentMode) {
    document.body.classList.add("overlay-transparent");
  }
}

async function initWheel() {
  try {
    const { Wheel } = await import("https://cdn.jsdelivr.net/npm/spin-wheel@5.0.2/dist/spin-wheel-esm.js");
    state.wheel = new Wheel(elements.wheelContainer, {
      items: [],
      isInteractive: false,
      radius: 0.92,
      borderColor: "rgba(255,255,255,0.82)",
      borderWidth: 6,
      lineColor: "rgba(255,255,255,0.42)",
      lineWidth: 2,
      itemLabelFont: '"Segoe UI", "Apple SD Gothic Neo", sans-serif',
      itemLabelFontSizeMax: 22,
      itemLabelRadius: 0.58,
      itemLabelRadiusMax: 0.28,
      itemLabelAlign: "center",
      itemLabelBaselineOffset: -0.12,
      pointerAngle: 0,
    });
    state.wheelReady = true;
    renderSnapshot();
  } catch {
    state.wheelFailed = true;
    renderSnapshot();
  }
}

window.addEventListener("storage", (event) => {
  if (event.key !== STORAGE_KEY) {
    return;
  }
  loadSnapshot();
  renderSnapshot();
});

loadSnapshot();
applyOverlayMode();
renderSnapshot();
initWheel();
