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
  validCount: document.getElementById("valid-count"),
  invalidCount: document.getElementById("invalid-count"),
  participantCount: document.getElementById("participant-count"),
  ticketCount: document.getElementById("ticket-count"),
  summaryTable: document.getElementById("summary-table"),
  invalidTable: document.getElementById("invalid-table"),
  wheelContainer: document.getElementById("wheel-container"),
  spinButton: document.getElementById("spin-button"),
  winnerText: document.getElementById("winner-text"),
};

const state = {
  summary: [],
  invalidEntries: [],
  roster: [],
  spinning: false,
  wheel: null,
  wheelModuleReady: false,
  wheelModuleError: false,
};

const sampleEntries = [
  "19:05 홍길동 3000",
  "19:07 김철수 1000",
  "19:10 홍길동 5000",
  "18:55 방송전후원 1000",
  "19:11 박하늘 900",
].join("\n");

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function parseLine(line, index) {
  const trimmed = line.trim();

  if (!trimmed) {
    return null;
  }

  const match = trimmed.match(/^(\d{2}:\d{2})\s+(\S+)\s+(\d+)$/);

  if (!match) {
    return {
      raw: trimmed,
      index,
      valid: false,
      reason: "형식 오류",
    };
  }

  const [, time, name, amountText] = match;

  return {
    raw: trimmed,
    index,
    valid: true,
    time,
    name,
    amount: Number(amountText),
  };
}

function toMinutes(timeText) {
  const [hour, minute] = timeText.split(":").map(Number);
  return hour * 60 + minute;
}

function buildResult() {
  const startTime = elements.startTimeInput.value;
  const unitAmount = Number(elements.unitAmountInput.value);
  const inputText = elements.entriesInput.value;

  if (!startTime || !Number.isFinite(unitAmount) || unitAmount <= 0) {
    return {
      summary: [],
      invalidEntries: [
        {
          raw: "설정값 확인 필요",
          reason: "시작 시각 또는 기준 금액 오류",
        },
      ],
      roster: [],
      validEntries: [],
    };
  }

  const startMinutes = toMinutes(startTime);
  const parsedLines = inputText.split(/\r?\n/).map(parseLine).filter(Boolean);
  const validEntries = [];
  const invalidEntries = [];

  parsedLines.forEach((entry) => {
    if (!entry.valid) {
      invalidEntries.push(entry);
      return;
    }

    if (toMinutes(entry.time) < startMinutes) {
      invalidEntries.push({
        ...entry,
        reason: "집계 시작 전",
      });
      return;
    }

    const tickets = Math.floor(entry.amount / unitAmount);

    if (tickets <= 0) {
      invalidEntries.push({
        ...entry,
        reason: "기준 금액 미만",
      });
      return;
    }

    validEntries.push({
      ...entry,
      tickets,
    });
  });

  const grouped = new Map();
  const getGroupLabel = (entry) => {
    const message = (entry.message || "").trim();
    if (message) {
      return message;
    }
    return `(no message) ${entry.name}`;
  };

  validEntries.forEach((entry) => {
    const groupLabel = getGroupLabel(entry);
    const current = grouped.get(groupLabel) || {
      name: groupLabel,
      totalAmount: 0,
      totalTickets: 0,
      count: 0,
    };

    current.totalAmount += entry.amount;
    current.totalTickets += entry.tickets;
    current.count += 1;
    grouped.set(groupLabel, current);
  });

  const summary = [...grouped.values()].sort((left, right) => {
    return right.totalTickets - left.totalTickets || left.name.localeCompare(right.name, "ko");
  });

  const roster = summary.flatMap((entry) => Array.from({ length: entry.totalTickets }, () => entry.name));

  return { summary, invalidEntries, roster, validEntries };
}

function renderSummary(summary) {
  if (!summary.length) {
    elements.summaryTable.className = "table-body empty-state";
    elements.summaryTable.textContent = "집계 결과가 여기 표시됩니다.";
    return;
  }

  elements.summaryTable.className = "table-body";
  elements.summaryTable.innerHTML = summary
    .map(
      (entry) => `
        <article class="table-row">
          <div>
            <strong>${entry.name}</strong>
            <small>총 ${formatNumber(entry.totalAmount)}원 · ${entry.count}건</small>
          </div>
          <span class="ticket-pill">${formatNumber(entry.totalTickets)}칸</span>
        </article>
      `
    )
    .join("");
}

function renderInvalid(invalidEntries) {
  if (!invalidEntries.length) {
    elements.invalidTable.className = "table-body empty-state";
    elements.invalidTable.textContent = "제외된 항목이 없습니다.";
    return;
  }

  elements.invalidTable.className = "table-body";
  elements.invalidTable.innerHTML = invalidEntries
    .map(
      (entry) => `
        <article class="table-row">
          <div>
            <strong>${entry.raw || "확인 필요"}</strong>
            <small>${entry.time ? `${entry.time} ${entry.name} ${formatNumber(entry.amount)}원` : "입력값 검수 필요"}</small>
          </div>
          <span class="reason-pill">${entry.reason}</span>
        </article>
      `
    )
    .join("");
}

function createWheelItems(summary) {
  const palette = ["#c7562a", "#f0a15b", "#2f7d5c", "#e7c66a", "#8a4d2e", "#d97f54"];
  const labelPalette = ["#fffaf3", "#2a180f", "#fffaf3", "#2a180f", "#fffaf3", "#2a180f"];

  return summary.map((entry, index) => ({
    label: `${entry.name}\n${entry.totalTickets}칸`,
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
  elements.winnerText.textContent = roster.length === 0 ? "아직 당첨자가 없습니다." : "룰렛 준비 완료";

  renderSummary(summary);
  renderInvalid(invalidEntries);
  renderWheel(summary);
}

function setCurrentTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  elements.startTimeInput.value = `${hours}:${minutes}`;
}

async function copyRoster() {
  if (!state.roster.length) {
    elements.winnerText.textContent = "복사할 룰렛 명단이 없습니다.";
    return;
  }

  try {
    await navigator.clipboard.writeText(state.roster.join("\n"));
    elements.winnerText.textContent = "룰렛 명단을 클립보드에 복사했습니다.";
  } catch (error) {
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
  const winningIndex = state.summary.findIndex((entry) => entry.name === winningName);

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
      itemLabelStrokeColor: "rgba(0, 0, 0, 0.12)",
      itemLabelStrokeWidth: 0,
      rotation: 0,
      pointerAngle: 0,
      onRest: (event) => {
        const winner = state.summary[event.currentIndex]?.name;
        elements.winnerText.textContent = winner ? `당첨: ${winner}` : "룰렛이 멈췄습니다.";
        state.spinning = false;
        elements.spinButton.disabled = state.roster.length === 0;
      },
    });

    state.wheelModuleReady = true;
    renderAll();
  } catch (error) {
    state.wheelModuleError = true;
    elements.winnerText.textContent = "오픈소스 룰렛 엔진을 불러오지 못했습니다. 인터넷 연결이 필요합니다.";
  }
}

elements.processButton.addEventListener("click", renderAll);
elements.copyRosterButton.addEventListener("click", copyRoster);
elements.setNowButton.addEventListener("click", () => {
  setCurrentTime();
  renderAll();
});
elements.loadSampleButton.addEventListener("click", () => {
  elements.entriesInput.value = sampleEntries;
  renderAll();
});
elements.spinButton.addEventListener("click", spinRoulette);

initWheel();
