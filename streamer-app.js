/*
 * Third-party attribution:
 * This file integrates the "spin-wheel" library by CrazyTim (MIT License).
 * Source repository: https://github.com/CrazyTim/spin-wheel
 * CDN package used at runtime: https://cdn.jsdelivr.net/npm/spin-wheel@5.0.2/dist/spin-wheel-esm.js
 * License notice is preserved in THIRD_PARTY_NOTICES.md.
 */

const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "roulette_overlay_state_v1";
const SETTINGS_STORAGE_KEY = "roulette_streamer_settings_v1";
const SAVED_ROULETTES_STORAGE_KEY = "roulette_saved_sets_v1";
const WINNER_HISTORY_STORAGE_KEY = "roulette_winner_history_v1";
const LEGACY_STORAGE_KEYS = [
  STORAGE_KEY,
  SETTINGS_STORAGE_KEY,
  SAVED_ROULETTES_STORAGE_KEY,
  WINNER_HISTORY_STORAGE_KEY,
];
const persistedAppState = {
  settings: {},
  savedRoulettes: [],
  winnerHistory: [],
  overlayState: null,
};
let persistAppStateTimeoutId = null;

const elements = {
  startTimeInput: $("start-time-input"),
  unitAmountInput: $("unit-amount-input"),
  spinDurationInput: $("spin-duration-input"),
  collectionLimitMinutesInput: $("collection-limit-minutes-input"),
  collectionLimitSecondsInput: $("collection-limit-seconds-input"),
  liveUrlInput: $("live-url-input"),
  liveUrlInputMain: $("live-url-input-main"),
  verifyLiveButton: $("verify-live-button"),
  liveSourceModeSelect: $("live-source-mode-select"),
  liveChatPrefixInput: $("live-chat-prefix-input"),
  liveChatPrefixList: $("live-chat-prefix-list"),
  addLiveChatPrefixButton: $("add-live-chat-prefix-button"),
  useLiveChatPrefixInput: $("use-live-chat-prefix-input"),
  useLiveDonationPrefixInput: $("use-live-donation-prefix-input"),
  liveDonationPrefixInput: $("live-donation-prefix-input"),
  liveDonationPrefixList: $("live-donation-prefix-list"),
  addLiveDonationPrefixButton: $("add-live-donation-prefix-button"),
  liveDonationChatInput: $("live-donation-chat-input"),
  liveDonationVideoInput: $("live-donation-video-input"),
  liveDonationMissionInput: $("live-donation-mission-input"),
  liveTargetStatus: $("live-target-status"),
  liveTargetSummary: $("live-target-summary"),
  useNameInput: $("use-name-input"),
  useMessageInput: $("use-message-input"),
  showAmountsInput: $("show-amounts-input"),
  autoRemoveWinnerInput: $("auto-remove-winner-input"),
  autoRerollAfterRemoveInput: $("auto-reroll-after-remove-input"),
  entriesInput: $("entries-input"),
  processButton: $("process-button"),
  copyRosterButton: $("copy-roster-button"),
  setNowButton: $("set-now-button"),
  loadSampleButton: $("load-sample-button"),
  connectButton: $("connect-button"),
  disconnectButton: $("disconnect-button"),
  startLiveCollectionButton: $("start-live-collection-button"),
  stopLiveCollectionButton: $("stop-live-collection-button"),
  resetLiveButton: $("reset-live-button"),
  clearMergesButton: $("clear-merges-button"),
  mergeTargetInput: $("merge-target-input"),
  useSelectedMergeTargetButton: $("use-selected-merge-target-button"),
  applyMergeButton: $("apply-merge-button"),
  clearMergeSelectionButton: $("clear-merge-selection-button"),
  mergeSelectionStatus: $("merge-selection-status"),
  toggleAdminButton: $("toggle-admin-button"),
  adminPanel: $("admin-panel"),
  saveNameInput: $("save-name-input"),
  saveCurrentButton: $("save-current-button"),
  overwriteSaveButton: $("overwrite-save-button"),
  clearActiveSaveButton: $("clear-active-save-button"),
  savedRouletteList: $("saved-roulette-list"),
  activeSaveLabel: $("active-save-label"),
  saveNameInputMain: $("save-name-input-main"),
  saveCurrentButtonMain: $("save-current-button-main"),
  overwriteSaveButtonMain: $("overwrite-save-button-main"),
  clearActiveSaveButtonMain: $("clear-active-save-button-main"),
  savedRouletteListMain: $("saved-roulette-list-main"),
  activeSaveLabelMain: $("active-save-label-main"),
  winnerHistoryList: $("winner-history-list"),
  winnerHistoryPreview: $("winner-history-preview"),
  clearWinnerHistoryButton: $("clear-winner-history-button"),
  clearWinnerHistoryButtonMain: $("clear-winner-history-button-main"),
  startTimeDisplay: $("start-time-display"),
  collectionElapsedDisplay: $("collection-elapsed-display"),
  quickNameInput: $("quick-name-input"),
  quickNameField: $("quick-name-field"),
  quickMessageField: $("quick-message-field"),
  quickManualModeButton: $("quick-manual-mode-button"),
  quickLiveModeButton: $("quick-live-mode-button"),
  collectionModeSummary: $("collection-mode-summary"),
  quickToggleNameButton: $("quick-toggle-name-button"),
  quickToggleMessageButton: $("quick-toggle-message-button"),
  quickAmountInput: $("quick-amount-input"),
  quickMultiplierInput: $("quick-multiplier-input"),
  quickMessageInput: $("quick-message-input"),
  quickTotalSummary: $("quick-total-summary"),
  groupingModeSummary: $("grouping-mode-summary"),
  bulkFormatHint: $("bulk-format-hint") || document.querySelector(".stealth-details .hint"),
  unitAmountSummary: $("unit-amount-summary"),
  unitAmountPresets: $("unit-amount-presets"),
  quickAmountPresets: $("quick-amount-presets"),
  quickMultiplierPresets: $("quick-multiplier-presets"),
  quickAddButton: $("quick-add-button"),
  liveFeedFilteredTab: $("live-feed-filtered-tab"),
  liveFeedRawTab: $("live-feed-raw-tab"),
  summaryAllTab: $("summary-all-tab"),
  summaryDonationTab: $("summary-donation-tab"),
  summaryChatTab: $("summary-chat-tab"),
  summaryFilterTab: $("summary-filter-tab"),
  summaryFilterPanel: $("summary-filter-panel"),
  summaryFilterTarget: $("summary-filter-target"),
  summaryFilterAmountMode: $("summary-filter-amount-mode"),
  summaryFilterAmountValue: $("summary-filter-amount-value"),
  summaryFilterAmountMaxField: $("summary-filter-amount-max-field"),
  summaryFilterAmountValueMax: $("summary-filter-amount-value-max"),
  summaryFilterKeywordMode: $("summary-filter-keyword-mode"),
  summaryFilterKeywordValue: $("summary-filter-keyword-value"),
  applyFilterToRouletteButton: $("apply-filter-to-roulette-button"),
  clearFilterToRouletteButton: $("clear-filter-to-roulette-button"),
  summaryFilterStatus: $("summary-filter-status"),
  liveRawCountBadge: $("live-raw-count-badge"),
  liveRawDonationCountBadge: $("live-raw-donation-count-badge"),
  liveRawChatCountBadge: $("live-raw-chat-count-badge"),
  authStatus: $("auth-status"),
  sessionStatus: $("session-status"),
  collectionStatus: $("collection-status"),
  liveDebugStatus: $("live-debug-status"),
  clearCurrentSummaryButton: $("clear-current-summary-button"),
  validCount: $("valid-count"),
  invalidCount: $("invalid-count"),
  participantCount: $("participant-count"),
  ticketCount: $("ticket-count"),
  summaryTable: $("summary-table"),
  invalidTable: $("invalid-table"),
  invalidPanelCount: $("invalid-panel-count"),
  liveFeed: $("live-feed"),
  mergeSuggestions: $("merge-suggestions"),
  wheelContainer: $("wheel-container"),
  spinButton: $("spin-button"),
  spinRepeatCountInput: $("spin-repeat-count-input"),
  winnerText: $("winner-text"),
  removeWinnerButton: $("remove-winner-button"),
  stopAutoRerollButton: $("stop-auto-reroll-button"),
  skipSpinButton: $("skip-spin-button"),
  shuffleWheelButton: $("shuffle-wheel-button"),
  expandWheelButton: $("expand-wheel-button"),
  collapseWheelButton: $("collapse-wheel-button"),
};

const getLiveDebugFeed = () => $("live-debug-feed");
const getCollectionUntilTimeInput = () => $("collection-until-time-input");
const getUseCollectionDurationInput = () => $("use-collection-duration-input");
const getUseCollectionUntilInput = () => $("use-collection-until-input");

const sampleEntries = [
  "19:05 난바다 3000 민트초코",
  "19:06 김철수 1000 민트 초코",
  "19:07 박하나 2000 파인애플피자",
  "19:09 이서준 3000 민트초코!",
].join("\n");

const state = {
  manualEntries: [],
  liveEntries: [],
  liveDebugEvents: [],
  liveFeedView: "filtered",
  summaryView: "all",
  manualMerges: {},
  summaryEdits: {},
  excludedLabels: [],
  mergeSelection: new Set(),
  savedRoulettes: [],
  activeSavedRouletteId: null,
  winnerHistory: [],
  lastWinnerLabel: null,
  lastWinnerSourceKey: null,
  autoRerollTimeoutId: null,
  invalidTab: "manual",
  summary: [],
  filteredSummary: [],
  excludedSummary: [],
  wheelSummary: [],
  wheelOrder: [],
  roster: [],
  rouletteSummarySource: "all",
  spinSequenceRemaining: 0,
  spinSequenceTotal: 0,
  spinSequenceCompleted: 0,
  spinning: false,
  pendingSpinWinner: null,
  spinFallbackTimeoutId: null,
  ignoredWheelRestCount: 0,
  wheel: null,
  wheelSignature: "",
  wheelReady: false,
  wheelFailed: false,
  wheelExpanded: false,
  liveVerification: {
    channelId: "",
    verified: false,
    open: false,
    liveStatus: "",
    chatChannelId: "",
    checkedAt: null,
    message: "",
  },
  liveCollectionActive: false,
  liveCollectionStartedAtMs: null,
  liveCollectionTickId: null,
  liveCollectionTimeoutId: null,
  lastCollectionStopLabel: "",
  liveConnection: {
    socket: null,
    eventSource: null,
    eventUnlisteners: [],
    channelId: null,
    connectState: "idle",
    collectorRunning: false,
    socketConnected: false,
    lastError: null,
    lastRawAt: null,
  },
};

let liveEventStreamReadyPromise = null;

function formatNumber(value) {
  return new Intl.NumberFormat("ko-KR").format(value);
}

function formatPercent(value) {
  return `${(Number(value) || 0).toFixed(1)}%`;
}

function formatDebugTime(value) {
  if (!value) {
    return "없음";
  }
  if (typeof value === "string") {
    return value;
  }
  try {
    return new Date(value).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "확인 필요";
  }
}

function truncateDisplayText(value, maxLength = 14) {
  const text = String(value || "");
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}

function formatRouletteLabel(item) {
  if (!item) {
    return "";
  }

  const baseLabel =
    String(item.messagePart || "").trim() ||
    String(item.namePart || "").trim() ||
    String(item.label || "").trim();
  const maxLength = state.wheelExpanded ? 10 : 7;
  return baseLabel.length > maxLength ? `${baseLabel.slice(0, maxLength)}…` : baseLabel;
}

function normalizeFilterKeyword(value) {
  return String(value || "").trim().toLowerCase();
}

function readSummaryFilterState() {
  return {
    target: elements.summaryFilterTarget?.value || "all",
    amountMode: elements.summaryFilterAmountMode?.value || "none",
    amountValue: Number(elements.summaryFilterAmountValue?.value || 0),
    amountValueMax: Number(elements.summaryFilterAmountValueMax?.value || 0),
    keywordMode: elements.summaryFilterKeywordMode?.value || "none",
    keywordValue: normalizeFilterKeyword(elements.summaryFilterKeywordValue?.value || ""),
  };
}

function matchesSummaryAmountFilter(item, filter) {
  const amount = Number(item.totalAmount || 0);
  const value = Number.isFinite(filter.amountValue) ? filter.amountValue : 0;
  const maxValue = Number.isFinite(filter.amountValueMax) ? filter.amountValueMax : 0;

  if (filter.amountMode === "atLeast") {
    return amount >= value;
  }
  if (filter.amountMode === "atMost") {
    return amount <= value;
  }
  if (filter.amountMode === "exact") {
    return amount === value;
  }
  if (filter.amountMode === "range") {
    const min = Math.min(value, maxValue);
    const max = Math.max(value, maxValue);
    return amount >= min && amount <= max;
  }
  return true;
}

function matchesSummaryKeywordFilter(item, filter) {
  if (filter.keywordMode === "none" || !filter.keywordValue) {
    return true;
  }

  const haystacks = [
    item.label,
    item.namePart,
    item.messagePart,
    ...(item.senders || []),
  ]
    .map((value) => normalizeFilterKeyword(value))
    .filter(Boolean);

  if (!haystacks.length) {
    return false;
  }

  if (filter.keywordMode === "startsWith") {
    return haystacks.some((value) => value.startsWith(filter.keywordValue));
  }
  if (filter.keywordMode === "exact") {
    return haystacks.some((value) => value === filter.keywordValue);
  }
  return haystacks.some((value) => value.includes(filter.keywordValue));
}

function matchesSummaryTargetFilter(item, filter) {
  if (filter.target === "donation") {
    return item.donationCount > 0;
  }
  if (filter.target === "chat") {
    return item.chatCount > 0;
  }
  return true;
}

function getFilteredSummary(summary) {
  const filter = readSummaryFilterState();
  return summary.filter((item) =>
    matchesSummaryTargetFilter(item, filter) &&
    matchesSummaryAmountFilter(item, filter) &&
    matchesSummaryKeywordFilter(item, filter)
  );
}

function getActiveRouletteSummary(summary, filteredSummary = state.filteredSummary) {
  return state.rouletteSummarySource === "filtered" ? filteredSummary : summary;
}

function renderSummaryFilterControls(filteredSummary = state.filteredSummary) {
  if (elements.summaryFilterTab) {
    elements.summaryFilterTab.classList.toggle("is-active", state.summaryView === "filter");
  }
  if (elements.summaryFilterPanel) {
    elements.summaryFilterPanel.hidden = state.summaryView !== "filter";
  }
  if (elements.summaryFilterAmountMaxField) {
    elements.summaryFilterAmountMaxField.hidden = (elements.summaryFilterAmountMode?.value || "none") !== "range";
  }
  if (elements.applyFilterToRouletteButton) {
    elements.applyFilterToRouletteButton.disabled = !filteredSummary.length;
    elements.applyFilterToRouletteButton.textContent =
      state.rouletteSummarySource === "filtered" ? "필터 결과 적용 중" : "룰렛으로 이관";
  }
  if (elements.clearFilterToRouletteButton) {
    elements.clearFilterToRouletteButton.disabled = state.rouletteSummarySource !== "filtered";
  }
  if (elements.summaryFilterStatus) {
    const targetMap = {
      all: "전체",
      donation: "도네",
      chat: "채팅",
    };
    const filter = readSummaryFilterState();
    const suffix = state.rouletteSummarySource === "filtered"
      ? " · 현재 룰렛은 필터 결과 기준으로 돌고 있습니다."
      : "";
    elements.summaryFilterStatus.textContent = `필터 결과 ${formatNumber(filteredSummary.length)}개 · 대상 ${targetMap[filter.target] || "전체"}${suffix}`;
  }
}

function applyFilteredSummaryToRoulette() {
  if (!state.filteredSummary.length) {
    const message = "현재 필터 결과에 해당하는 항목이 없습니다.";
    elements.winnerText.textContent = message;
    window.alert(message);
    return;
  }
  state.rouletteSummarySource = "filtered";
  saveSettings();
  renderAll();
  elements.winnerText.textContent = "필터 결과를 현재 룰렛 대상으로 이관했습니다.";
}

function clearFilteredSummaryFromRoulette() {
  if (state.rouletteSummarySource !== "filtered") {
    return;
  }
  state.rouletteSummarySource = "all";
  saveSettings();
  renderAll();
  elements.winnerText.textContent = "전체 집계 기준으로 룰렛 대상을 되돌렸습니다.";
}

function buildWinnerAnnouncement(label, options = {}) {
  const summaryItem = state.summary.find((item) => item.label === label);
  const pieces = [options.prefix || "당첨", label];

  if (summaryItem) {
    if (shouldShowAmounts()) {
      pieces.push(`${formatNumber(summaryItem.totalAmount)}원`);
    }
    pieces.push(formatPercent(summaryItem.winPercent));
  }

  if (options.suffix) {
    pieces.push(options.suffix);
  }

  return pieces.join(" · ");
}

function buildWheelSignature(summary) {
  return JSON.stringify({
    showAmounts: shouldShowAmounts(),
    wheelExpanded: state.wheelExpanded,
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

function refreshWheelLayout() {
  if (!state.wheelReady || !state.wheel) {
    return;
  }

  if (typeof state.wheel.resize === "function") {
    state.wheel.resize();
  }
  state.wheelSignature = "";
  renderWheel(state.wheelSummary.length ? state.wheelSummary : state.summary);
}

function setWheelExpanded(expanded) {
  state.wheelExpanded = Boolean(expanded);
  document.body.classList.toggle("wheel-expanded-mode", state.wheelExpanded);
  if (elements.collapseWheelButton) {
    elements.collapseWheelButton.hidden = !state.wheelExpanded;
  }
  if (elements.expandWheelButton) {
    elements.expandWheelButton.hidden = state.wheelExpanded;
  }

  window.setTimeout(() => {
    refreshWheelLayout();
  }, 40);
}

function reconcileWheelOrder(summary) {
  const labels = summary.map((item) => item.label);
  const labelSet = new Set(labels);
  const preserved = state.wheelOrder.filter((label) => labelSet.has(label));
  const missing = labels.filter((label) => !preserved.includes(label));
  state.wheelOrder = [...preserved, ...missing];
  state.wheelSummary = state.wheelOrder
    .map((label) => summary.find((item) => item.label === label))
    .filter(Boolean);
}

function shuffleArray(values) {
  const next = [...values];
  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
}

function shuffleWheelOrder() {
  if (state.spinning) {
    elements.winnerText.textContent = "룰렛을 돌리는 중에는 순서를 섞을 수 없습니다.";
    return;
  }

  if (state.summary.length < 2) {
    elements.winnerText.textContent = "순서를 섞으려면 룰렛 항목이 2개 이상 있어야 합니다.";
    return;
  }

  state.wheelOrder = shuffleArray(state.wheelOrder.length ? state.wheelOrder : state.summary.map((item) => item.label));
  state.wheelSummary = state.wheelOrder
    .map((label) => state.summary.find((item) => item.label === label))
    .filter(Boolean);
  state.wheelSignature = "";
  renderWheel(state.wheelSummary);
  publishOverlayState("룰렛 순서를 섞었습니다.");
  elements.winnerText.textContent = "룰렛 위치를 랜덤으로 섞었습니다.";
}

function readSettings() {
  return cloneValue(persistedAppState.settings || {});
}

function readSavedRoulettes() {
  return cloneValue(Array.isArray(persistedAppState.savedRoulettes) ? persistedAppState.savedRoulettes : []);
}

function writeSavedRoulettes() {
  persistedAppState.savedRoulettes = cloneValue(state.savedRoulettes);
  queuePersistedAppState();
}

function readWinnerHistory() {
  return cloneValue(Array.isArray(persistedAppState.winnerHistory) ? persistedAppState.winnerHistory : []);
}

function writeWinnerHistory() {
  persistedAppState.winnerHistory = cloneValue(state.winnerHistory);
  queuePersistedAppState();
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value));
}

function readLegacyStorageValue(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function readLegacyPersistedAppState() {
  return {
    settings: readLegacyStorageValue(SETTINGS_STORAGE_KEY, {}),
    savedRoulettes: readLegacyStorageValue(SAVED_ROULETTES_STORAGE_KEY, []),
    winnerHistory: readLegacyStorageValue(WINNER_HISTORY_STORAGE_KEY, []),
    overlayState: readLegacyStorageValue(STORAGE_KEY, null),
  };
}

function clearLegacyPersistedAppState() {
  LEGACY_STORAGE_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore local WebView storage cleanup errors.
    }
  });
}

function normalizePersistedAppState(payload = {}) {
  return {
    settings: payload && typeof payload.settings === "object" && payload.settings ? payload.settings : {},
    savedRoulettes: Array.isArray(payload?.savedRoulettes) ? payload.savedRoulettes : [],
    winnerHistory: Array.isArray(payload?.winnerHistory) ? payload.winnerHistory : [],
    overlayState: payload?.overlayState ?? null,
  };
}

function hasPersistedStateData(payload = {}) {
  return Boolean(
    payload.overlayState ||
      (payload.settings && Object.keys(payload.settings).length) ||
      (Array.isArray(payload.savedRoulettes) && payload.savedRoulettes.length) ||
      (Array.isArray(payload.winnerHistory) && payload.winnerHistory.length)
  );
}

async function persistAppStateNow() {
  const snapshot = {
    settings: cloneValue(persistedAppState.settings || {}),
    savedRoulettes: cloneValue(persistedAppState.savedRoulettes || []),
    winnerHistory: cloneValue(persistedAppState.winnerHistory || []),
    overlayState: cloneValue(persistedAppState.overlayState || null),
  };

  if (isTauriRuntime()) {
    await tauriInvoke("save_app_state", { state: snapshot });
    return;
  }

  localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(snapshot.settings));
  localStorage.setItem(SAVED_ROULETTES_STORAGE_KEY, JSON.stringify(snapshot.savedRoulettes));
  localStorage.setItem(WINNER_HISTORY_STORAGE_KEY, JSON.stringify(snapshot.winnerHistory));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot.overlayState));
}

function queuePersistedAppState() {
  if (persistAppStateTimeoutId) {
    clearTimeout(persistAppStateTimeoutId);
  }
  persistAppStateTimeoutId = setTimeout(() => {
    persistAppStateTimeoutId = null;
    persistAppStateNow().catch((error) => {
      console.warn("앱 데이터 저장에 실패했습니다.", error);
    });
  }, 50);
}

async function hydratePersistedAppState() {
  let appState = normalizePersistedAppState();

  if (isTauriRuntime()) {
    try {
      appState = normalizePersistedAppState(await tauriInvoke("load_app_state"));
    } catch (error) {
      console.warn("앱 데이터 불러오기에 실패했습니다.", error);
    }
  } else {
    appState = normalizePersistedAppState(readLegacyPersistedAppState());
  }

  const legacyState = normalizePersistedAppState(readLegacyPersistedAppState());
  if (!hasPersistedStateData(appState) && hasPersistedStateData(legacyState)) {
    appState = legacyState;
    Object.assign(persistedAppState, appState);
    await persistAppStateNow();
  } else {
    Object.assign(persistedAppState, appState);
  }

  clearLegacyPersistedAppState();
}

function saveSettings() {
  const snapshot = {
    startTime: elements.startTimeInput?.value || "",
    unitAmount: Number(elements.unitAmountInput?.value || 1000),
    spinDuration: Number(elements.spinDurationInput?.value || 6),
    useCollectionDuration: Boolean(getUseCollectionDurationInput()?.checked),
    collectionLimitMinutes: Number(elements.collectionLimitMinutesInput?.value || 0),
    collectionLimitSeconds: Number(elements.collectionLimitSecondsInput?.value || 0),
    useCollectionUntil: Boolean(getUseCollectionUntilInput()?.checked),
    collectionUntilTime: getCollectionUntilTimeInput()?.value || "",
    spinRepeatCount: Number(elements.spinRepeatCountInput?.value || 1),
    liveUrl: getLiveUrlValue(),
    liveSourceMode: getLiveSourceMode(),
    useLiveChatPrefix: Boolean(elements.useLiveChatPrefixInput?.checked ?? true),
    liveChatPrefixes: getPrefixValues("chat"),
    liveChatPrefix: getPrefixValues("chat")[0] || "",
    useLiveDonationPrefix: Boolean(elements.useLiveDonationPrefixInput?.checked),
    liveDonationPrefixes: getPrefixValues("donation"),
    liveDonationPrefix: getPrefixValues("donation")[0] || "",
    liveDonationFilter: getLiveDonationFilterState(),
    summaryFilter: readSummaryFilterState(),
    rouletteSummarySource: state.rouletteSummarySource,
    useName: Boolean(elements.useNameInput?.checked),
    useMessage: Boolean(elements.useMessageInput?.checked),
    showAmounts: shouldShowAmounts(),
    autoRemoveWinner: Boolean(elements.autoRemoveWinnerInput?.checked),
    autoRerollAfterRemove: Boolean(elements.autoRerollAfterRemoveInput?.checked),
  };
  persistedAppState.settings = snapshot;
  queuePersistedAppState();
}

function snapshotCurrentRoulette() {
  return {
    manualEntries: cloneValue(state.manualEntries),
    liveEntries: cloneValue(state.liveEntries),
    manualMerges: cloneValue(state.manualMerges),
    summaryEdits: cloneValue(state.summaryEdits),
    excludedLabels: cloneValue(state.excludedLabels),
    settings: {
      startTime: elements.startTimeInput?.value || "",
      unitAmount: Number(elements.unitAmountInput?.value || 1000),
      spinDuration: Number(elements.spinDurationInput?.value || 6),
      useCollectionDuration: Boolean(getUseCollectionDurationInput()?.checked),
      collectionLimitMinutes: Number(elements.collectionLimitMinutesInput?.value || 0),
      collectionLimitSeconds: Number(elements.collectionLimitSecondsInput?.value || 0),
      useCollectionUntil: Boolean(getUseCollectionUntilInput()?.checked),
      collectionUntilTime: getCollectionUntilTimeInput()?.value || "",
      spinRepeatCount: Number(elements.spinRepeatCountInput?.value || 1),
      liveUrl: getLiveUrlValue(),
      liveSourceMode: getLiveSourceMode(),
      useLiveChatPrefix: Boolean(elements.useLiveChatPrefixInput?.checked ?? true),
      liveChatPrefixes: getPrefixValues("chat"),
      liveChatPrefix: getPrefixValues("chat")[0] || "",
      useLiveDonationPrefix: Boolean(elements.useLiveDonationPrefixInput?.checked),
      liveDonationPrefixes: getPrefixValues("donation"),
      liveDonationPrefix: getPrefixValues("donation")[0] || "",
      liveDonationFilter: getLiveDonationFilterState(),
      summaryFilter: readSummaryFilterState(),
      rouletteSummarySource: state.rouletteSummarySource,
      useName: Boolean(elements.useNameInput?.checked),
      useMessage: Boolean(elements.useMessageInput?.checked),
      showAmounts: shouldShowAmounts(),
      autoRemoveWinner: Boolean(elements.autoRemoveWinnerInput?.checked),
      autoRerollAfterRemove: Boolean(elements.autoRerollAfterRemoveInput?.checked),
    },
  };
}

function renderUnitAmountSummary() {
  if (!elements.unitAmountSummary) {
    return;
  }

  const unitAmount = Number(elements.unitAmountInput?.value || 0);
  if (!Number.isFinite(unitAmount) || unitAmount <= 0) {
    elements.unitAmountSummary.textContent = "현재 기준: 단위 금액을 운영 패널에서 설정해 주세요.";
    return;
  }

  elements.unitAmountSummary.textContent = `현재 기준: ${formatNumber(unitAmount)}원마다 1칸`;
}

function parseLiveUrlInfo(rawUrl) {
  const value = String(rawUrl || "").trim();
  if (!value) {
    return { state: "empty", channelToken: null };
  }

  try {
    const url = new URL(value);
    const segments = url.pathname.split("/").filter(Boolean);
    const liveIndex = segments.findIndex((segment) => segment === "live");
    const channelToken = liveIndex >= 0 ? segments[liveIndex + 1] || null : null;
    return { state: channelToken ? "parsed" : "invalid", channelToken };
  } catch {
    return { state: "invalid", channelToken: null };
  }
}

function getLiveUrlValue() {
  return (
    elements.liveUrlInputMain?.value.trim() ||
    elements.liveUrlInput?.value.trim() ||
    ""
  );
}

function syncLiveUrlInputs(source = "main") {
  const mainValue = elements.liveUrlInputMain?.value || "";
  const adminValue = elements.liveUrlInput?.value || "";
  const nextValue = source === "admin" ? adminValue : mainValue;

  if (elements.liveUrlInputMain && elements.liveUrlInputMain.value !== nextValue) {
    elements.liveUrlInputMain.value = nextValue;
  }
  if (elements.liveUrlInput && elements.liveUrlInput.value !== nextValue) {
    elements.liveUrlInput.value = nextValue;
  }
}

function resetLiveVerification() {
  state.liveVerification = {
    channelId: "",
    verified: false,
    open: false,
    liveStatus: "",
    chatChannelId: "",
    checkedAt: null,
    message: "",
  };
}

function hasVerifiedLiveTarget() {
  const liveInfo = parseLiveUrlInfo(getLiveUrlValue());
  return Boolean(
    liveInfo.channelToken &&
      state.liveVerification.verified &&
      state.liveVerification.open &&
      state.liveVerification.channelId === liveInfo.channelToken
  );
}

async function verifyLiveTarget() {
  const liveInfo = parseLiveUrlInfo(getLiveUrlValue());
  if (!liveInfo.channelToken) {
    resetLiveVerification();
    renderStatuses();
    throw new Error("먼저 유효한 방송 주소를 입력해 주세요.");
  }

  const result = await api("/api/unofficial-live/verify", {
    method: "POST",
    body: JSON.stringify({ channelId: liveInfo.channelToken }),
  });

  state.liveVerification = {
    channelId: liveInfo.channelToken,
    verified: true,
    open: Boolean(result.open),
    liveStatus: result.liveStatus || "",
    chatChannelId: result.chatChannelId || "",
    checkedAt: Date.now(),
    message: result.open
      ? "방송이 켜져 있습니다. 이제 실시간 시작을 누르면 됩니다."
      : "현재 방송이 켜져 있지 않습니다. 방송을 시작한 뒤 다시 확인해 주세요.",
  };
  renderStatuses();
  elements.winnerText.textContent = state.liveVerification.message;
  return state.liveVerification;
}

function evaluateLiveTarget() {
  const liveInfo = parseLiveUrlInfo(getLiveUrlValue());

  if (liveInfo.state === "empty") {
    return {
      ok: false,
      level: "idle",
      label: "방송 확인 전",
      summary: "실시간으로 받을 방송 주소를 먼저 넣어 주세요.",
      reason: "방송 주소를 입력해 주세요.",
    };
  }

  if (liveInfo.state === "invalid") {
    return {
      ok: false,
      level: "warn",
      label: "주소 형식 확인 필요",
      summary: "`https://chzzk.naver.com/live/...` 형식인지 확인해 주세요.",
      reason: "방송 주소 형식이 올바르지 않습니다.",
    };
  }

   if (state.liveVerification.channelId !== liveInfo.channelToken) {
    return {
      ok: false,
      level: "warn",
      label: "방송 확인 필요",
      summary: "방송 확인 버튼으로 라이브 OPEN 상태를 먼저 확인해 주세요.",
      reason: "먼저 방송 확인을 눌러 주세요.",
    };
  }

  if (!state.liveVerification.verified) {
    return {
      ok: false,
      level: "warn",
      label: "방송 확인 필요",
      summary: "방송 확인 버튼으로 라이브 OPEN 상태를 먼저 확인해 주세요.",
      reason: "먼저 방송 확인을 눌러 주세요.",
    };
  }

  if (!state.liveVerification.open) {
    return {
      ok: false,
      level: "error",
      label: "방송 꺼짐",
      summary: "현재 라이브가 OPEN 상태가 아닙니다. 방송을 켠 뒤 다시 확인해 주세요.",
      reason: "현재 라이브가 켜져 있지 않습니다.",
    };
  }

  return {
    ok: true,
    level: "success",
    label: "방송 확인됨",
    summary: state.liveVerification.chatChannelId
      ? `채팅 채널 ID: ${state.liveVerification.chatChannelId}`
      : `연결 대상 채널 ID: ${liveInfo.channelToken}`,
    reason: "",
  };
}

function isNameEnabled() {
  return Boolean(elements.useNameInput?.checked);
}

function isMessageEnabled() {
  return Boolean(elements.useMessageInput?.checked);
}

function shouldShowAmounts() {
  return elements.showAmountsInput ? Boolean(elements.showAmountsInput.checked) : true;
}

function syncGroupingDependencies(changed = "") {
  if (!isNameEnabled() && !isMessageEnabled()) {
    if (changed === "name" && elements.useMessageInput) {
      elements.useMessageInput.checked = true;
    } else if (elements.useNameInput) {
      elements.useNameInput.checked = true;
    }
  }
}

function currentGroupingState() {
  return {
    useName: isNameEnabled(),
    useMessage: isMessageEnabled(),
  };
}

function hasCollectedEntries() {
  return state.manualEntries.length > 0 || state.liveEntries.length > 0;
}

function groupingModeDescription(groupingState = currentGroupingState()) {
  if (groupingState.useName && groupingState.useMessage) {
    return "닉네임 + 메시지 기준";
  }
  if (groupingState.useName) {
    return "닉네임 기준";
  }
  return "메시지 기준";
}

function applyGroupingState(groupingState) {
  if (elements.useNameInput) {
    elements.useNameInput.checked = Boolean(groupingState.useName);
  }
  if (elements.useMessageInput) {
    elements.useMessageInput.checked = Boolean(groupingState.useMessage);
  }
  syncGroupingDependencies();
}

function renderGroupingControls() {
  const groupingState = currentGroupingState();
  const modeText = groupingModeDescription(groupingState);

  if (elements.groupingModeSummary) {
    elements.groupingModeSummary.textContent = `${modeText}로 묶는 중입니다. 바꾸면 현재 집계가 바로 다시 계산됩니다.`;
  }

  if (elements.bulkFormatHint) {
    let formatText = "형식: `시간 닉네임 금액 메시지`";
    if (groupingState.useName && !groupingState.useMessage) {
      formatText = "형식: `시간 닉네임 금액`";
    } else if (!groupingState.useName && groupingState.useMessage) {
      formatText = "형식: `시간 금액 메시지`";
    }
    elements.bulkFormatHint.textContent = formatText;
  }

  [
    [elements.quickToggleNameButton, groupingState.useName, "닉네임 기준"],
    [elements.quickToggleMessageButton, groupingState.useMessage, "메시지 기준"],
  ].forEach(([button, enabled, label]) => {
    if (!button) {
      return;
    }
    button.classList.toggle("is-active", enabled);
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
    button.textContent = `${label} ${enabled ? "ON" : "OFF"}`;
  });
}

function sanitizeTicketCount(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function getSummaryEdit(sourceKey) {
  return state.summaryEdits[sourceKey] || null;
}

function updateSummaryEdit(sourceKey, patch) {
  const current = state.summaryEdits[sourceKey] || {};
  const next = { ...current, ...patch };
  if (!next.labelOverride && !next.nameOverride && !next.messageOverride && !Number.isFinite(next.ticketOverride)) {
    delete state.summaryEdits[sourceKey];
    return;
  }
  state.summaryEdits[sourceKey] = next;
}

function clearSummaryEdit(sourceKey, field) {
  const current = state.summaryEdits[sourceKey];
  if (!current) {
    return;
  }
  delete current[field];
  if (!current.labelOverride && !current.nameOverride && !current.messageOverride && !Number.isFinite(current.ticketOverride)) {
    delete state.summaryEdits[sourceKey];
  }
}

function composeGroupingLabel(namePart = "", messagePart = "") {
  if (namePart && messagePart) {
    return messagePart;
  }
  if (namePart) {
    return namePart;
  }
  if (messagePart) {
    return messagePart;
  }
  return "(항목 없음)";
}

function buildGroupingIdentity(entry) {
  const rawMessage = (entry.message || "").trim();
  const mergedMessage = rawMessage ? (state.manualMerges[rawMessage] || rawMessage) : "(메시지 없음)";
  const name = (entry.name || "").trim() || "(닉네임 없음)";

  if (isNameEnabled() && isMessageEnabled()) {
    return {
      sourceKey: `name:${name}\nmessage:${mergedMessage}`,
      namePart: name,
      messagePart: mergedMessage,
      label: composeGroupingLabel(name, mergedMessage),
    };
  }

  if (isNameEnabled()) {
    return {
      sourceKey: `name:${name}`,
      namePart: name,
      messagePart: "",
      label: name,
    };
  }

  return {
    sourceKey: `message:${mergedMessage}`,
    namePart: "",
    messagePart: mergedMessage,
    label: mergedMessage,
  };
}

function isExcludedLabel(sourceKey) {
  return state.excludedLabels.includes(sourceKey);
}

function addExcludedLabel(sourceKey) {
  if (!isExcludedLabel(sourceKey)) {
    state.excludedLabels.push(sourceKey);
  }
}

function removeExcludedLabel(sourceKey) {
  state.excludedLabels = state.excludedLabels.filter((label) => label !== sourceKey);
}

function findSummaryItemBySourceKey(sourceKey, collection = state.summary) {
  return collection.find((item) => item.sourceKey === sourceKey) || null;
}

function removeEntriesBySourceKey(sourceKey) {
  if (!sourceKey) {
    return 0;
  }

  const beforeManual = state.manualEntries.length;
  const beforeLive = state.liveEntries.length;

  state.manualEntries = state.manualEntries.filter((entry) => buildGroupingIdentity(entry).sourceKey !== sourceKey);
  state.liveEntries = state.liveEntries.filter((entry) => buildGroupingIdentity(entry).sourceKey !== sourceKey);

  delete state.summaryEdits[sourceKey];
  removeExcludedLabel(sourceKey);

  return (beforeManual - state.manualEntries.length) + (beforeLive - state.liveEntries.length);
}

function editSummaryName(sourceKey) {
  const item = findSummaryItemBySourceKey(sourceKey);
  if (!item || !item.namePart) {
    return;
  }

  const currentEdit = getSummaryEdit(sourceKey);
  const nextValue = window.prompt(
    "닉네임을 입력해 주세요.\n비워두면 원래 닉네임으로 되돌립니다.",
    currentEdit?.nameOverride || item.namePart
  );

  if (nextValue === null) {
    return;
  }

  const trimmed = nextValue.trim();
  if (!trimmed) {
    clearSummaryEdit(sourceKey, "nameOverride");
    renderAll();
    elements.winnerText.textContent = `"${item.label}" 닉네임 수정을 되돌렸습니다.`;
    return;
  }

  updateSummaryEdit(sourceKey, { nameOverride: trimmed });
  renderAll();
  elements.winnerText.textContent = `닉네임을 "${trimmed}"로 반영했습니다.`;
}

function editSummaryMessage(sourceKey) {
  const item = findSummaryItemBySourceKey(sourceKey);
  if (!item || !item.messagePart) {
    return;
  }

  const currentEdit = getSummaryEdit(sourceKey);
  const nextValue = window.prompt(
    "메시지를 입력해 주세요.\n비워두면 원래 메시지로 되돌립니다.",
    currentEdit?.messageOverride || item.messagePart
  );

  if (nextValue === null) {
    return;
  }

  const trimmed = nextValue.trim();
  if (!trimmed) {
    clearSummaryEdit(sourceKey, "messageOverride");
    renderAll();
    elements.winnerText.textContent = `"${item.label}" 메시지 수정을 되돌렸습니다.`;
    return;
  }

  updateSummaryEdit(sourceKey, { messageOverride: trimmed });
  renderAll();
  elements.winnerText.textContent = `메시지를 "${trimmed}"로 반영했습니다.`;
}

function editSummaryTickets(sourceKey) {
  const item = findSummaryItemBySourceKey(sourceKey);
  if (!item) {
    return;
  }

  const currentEdit = getSummaryEdit(sourceKey);
  const nextValue = window.prompt(
    "칸 수를 입력해 주세요.\n비워두면 원래 칸 수로 되돌립니다.",
    String(currentEdit?.ticketOverride || item.totalTickets)
  );

  if (nextValue === null) {
    return;
  }

  const trimmed = nextValue.trim();
  if (!trimmed) {
    clearSummaryEdit(sourceKey, "ticketOverride");
    renderAll();
    elements.winnerText.textContent = `"${item.label}" 칸 수 수정을 되돌렸습니다.`;
    return;
  }

  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    window.alert("칸 수는 1 이상의 숫자로 입력해 주세요.");
    return;
  }

  updateSummaryEdit(sourceKey, { ticketOverride: Math.floor(parsed) });
  renderAll();
  elements.winnerText.textContent = `"${item.label}" 칸 수를 ${formatNumber(Math.floor(parsed))}칸으로 반영했습니다.`;
}

function excludeSummaryItem(sourceKey) {
  const item = findSummaryItemBySourceKey(sourceKey);
  if (!item) {
    return;
  }

  addExcludedLabel(sourceKey);
  renderAll();
  elements.winnerText.textContent = `"${item.label}" 항목을 제외 목록으로 보냈습니다.`;
}

function deleteSummaryItem(sourceKey) {
  const item = findSummaryItemBySourceKey(sourceKey);
  if (!item) {
    return;
  }

  const confirmed = window.confirm(`"${item.label}" 항목을 완전히 삭제할까요?\n원본 후원 데이터도 함께 제거됩니다.`);
  if (!confirmed) {
    return;
  }

  const removedCount = removeEntriesBySourceKey(sourceKey);
  if (!removedCount) {
    elements.winnerText.textContent = "삭제할 원본 후원을 찾지 못했습니다.";
    return;
  }

  if (state.lastWinnerLabel === item.label) {
    state.lastWinnerLabel = null;
  }

  renderAll();
  elements.winnerText.textContent = `"${item.label}" 항목과 연결된 ${formatNumber(removedCount)}건을 삭제했습니다.`;
}

function restoreExcludedItem(sourceKey) {
  const item = findSummaryItemBySourceKey(sourceKey, state.excludedSummary || []);
  removeExcludedLabel(sourceKey);
  renderAll();
  elements.winnerText.textContent = `"${item?.label || sourceKey}" 항목을 다시 룰렛에 복원했습니다.`;
}

function deleteExcludedItem(sourceKey) {
  const item = findSummaryItemBySourceKey(sourceKey, state.excludedSummary || []);
  const confirmed = window.confirm(`"${item?.label || sourceKey}" 제외 항목을 완전히 삭제할까요?\n원본 후원 데이터도 함께 제거됩니다.`);
  if (!confirmed) {
    return;
  }

  const removedCount = removeEntriesBySourceKey(sourceKey);
  if (!removedCount) {
    elements.winnerText.textContent = "삭제할 원본 후원을 찾지 못했습니다.";
    return;
  }

  if (state.lastWinnerLabel === item?.label) {
    state.lastWinnerLabel = null;
  }

  renderAll();
  elements.winnerText.textContent = `"${item?.label || sourceKey}" 항목과 연결된 ${formatNumber(removedCount)}건을 삭제했습니다.`;
}

function openExcludedSelector() {
  if (!state.summary.length) {
    elements.winnerText.textContent = "먼저 제외할 현재 룰렛 항목이 있어야 합니다.";
    return;
  }

  const guide = state.summary
    .map((item, index) => `${index + 1}. ${item.label} (${formatNumber(item.totalTickets)}칸)`)
    .join("\n");

  const rawInput = window.prompt(
    `제외할 항목 번호를 쉼표로 입력해 주세요.\n\n${guide}`,
    ""
  );

  if (rawInput === null) {
    return;
  }

  const selectedIndexes = [...new Set(
    rawInput
      .split(",")
      .map((value) => Number(value.trim()))
      .filter((value) => Number.isInteger(value) && value >= 1 && value <= state.summary.length)
  )];

  if (!selectedIndexes.length) {
    window.alert("제외할 번호를 하나 이상 올바르게 입력해 주세요.");
    return;
  }

  selectedIndexes.forEach((value) => {
    const item = state.summary[value - 1];
    if (item) {
      addExcludedLabel(item.sourceKey);
    }
  });

  renderAll();
  elements.winnerText.textContent = `${formatNumber(selectedIndexes.length)}개 항목을 제외 목록에 추가했습니다.`;
}

function handleGroupingChange(changed, nextState, previousState = currentGroupingState()) {
  if (state.spinning) {
    window.alert("룰렛을 돌리는 중에는 묶기 기준을 바꿀 수 없습니다.");
    applyGroupingState(previousState);
    renderAll();
    return;
  }

  if (!nextState.useName && !nextState.useMessage) {
    window.alert("닉네임 또는 메시지 기준 중 하나는 켜져 있어야 합니다.");
    applyGroupingState(previousState);
    renderAll();
    return;
  }

  const sameAsBefore =
    nextState.useName === previousState.useName &&
    nextState.useMessage === previousState.useMessage;

  if (sameAsBefore) {
    renderAll();
    return;
  }

  if (hasCollectedEntries()) {
    const confirmed = window.confirm(
      "묶기 기준을 바꾸면 현재 후원 목록을 새 기준으로 다시 묶습니다.\n기존 데이터는 지워지지 않지만 집계 결과와 병합 후보가 즉시 바뀝니다. 계속할까요?"
    );

    if (!confirmed) {
      applyGroupingState(previousState);
      renderAll();
      return;
    }
  }

  applyGroupingState(nextState);
  stopScheduledAutoReroll(false);
  renderAll();
}

function syncNameFieldVisibility() {
  if (elements.quickNameField) {
    elements.quickNameField.hidden = false;
  }
  if (elements.quickMessageField) {
    elements.quickMessageField.hidden = false;
  }
}

function hydrateSettings() {
  const settings = readSettings();

  if (settings.startTime) {
    elements.startTimeInput.value = settings.startTime;
  } else {
    elements.startTimeInput.value = "";
  }

  if (Number.isFinite(settings.unitAmount) && settings.unitAmount > 0) {
    elements.unitAmountInput.value = String(settings.unitAmount);
  }

  if (Number.isFinite(settings.spinDuration) && settings.spinDuration > 0) {
    elements.spinDurationInput.value = String(settings.spinDuration);
  }

  if (elements.collectionLimitMinutesInput) {
    elements.collectionLimitMinutesInput.value = String(
      Number.isFinite(settings.collectionLimitMinutes) && settings.collectionLimitMinutes >= 0
        ? settings.collectionLimitMinutes
        : 0
    );
  }
  if (elements.collectionLimitSecondsInput) {
    elements.collectionLimitSecondsInput.value = String(
      Number.isFinite(settings.collectionLimitSeconds) && settings.collectionLimitSeconds >= 0
        ? settings.collectionLimitSeconds
        : 0
    );
  }
  if (getUseCollectionDurationInput()) {
    const inferredUseDuration = typeof settings.useCollectionDuration === "boolean"
      ? settings.useCollectionDuration
      : ((Number(settings.collectionLimitMinutes || 0) > 0) || (Number(settings.collectionLimitSeconds || 0) > 0));
    getUseCollectionDurationInput().checked = inferredUseDuration;
  }
  if (getCollectionUntilTimeInput()) {
    getCollectionUntilTimeInput().value = typeof settings.collectionUntilTime === "string"
      ? settings.collectionUntilTime
      : "";
  }
  if (getUseCollectionUntilInput()) {
    const inferredUseUntil = typeof settings.useCollectionUntil === "boolean"
      ? settings.useCollectionUntil
      : Boolean(settings.collectionUntilTime);
    getUseCollectionUntilInput().checked = inferredUseUntil;
  }
  syncCollectionLimitUi();
  if (Number.isFinite(settings.spinRepeatCount) && settings.spinRepeatCount > 0 && elements.spinRepeatCountInput) {
    elements.spinRepeatCountInput.value = String(settings.spinRepeatCount);
  }
  if (typeof settings.liveUrl === "string" && elements.liveUrlInput) {
    elements.liveUrlInput.value = settings.liveUrl;
  }
  if (typeof settings.liveUrl === "string" && elements.liveUrlInputMain) {
    elements.liveUrlInputMain.value = settings.liveUrl;
  }
  if (typeof settings.liveSourceMode === "string" && getLiveSourceModeSelect()) {
    getLiveSourceModeSelect().value = settings.liveSourceMode;
  }
  if (typeof settings.useLiveChatPrefix === "boolean" && elements.useLiveChatPrefixInput) {
    elements.useLiveChatPrefixInput.checked = settings.useLiveChatPrefix;
  } else if (elements.useLiveChatPrefixInput) {
    elements.useLiveChatPrefixInput.checked = true;
  }
  const legacyLivePrefix =
    typeof settings.livePrefix === "string" ? settings.livePrefix : "";
  const chatPrefixes =
    Array.isArray(settings.liveChatPrefixes) && settings.liveChatPrefixes.length
      ? settings.liveChatPrefixes
      : (typeof settings.liveChatPrefix === "string" && settings.liveChatPrefix
          ? [settings.liveChatPrefix]
          : (legacyLivePrefix ? [legacyLivePrefix] : []));
  setPrefixRows("chat", chatPrefixes);
  if (typeof settings.useLiveDonationPrefix === "boolean" && elements.useLiveDonationPrefixInput) {
    elements.useLiveDonationPrefixInput.checked = settings.useLiveDonationPrefix;
  }
  const donationPrefixes =
    Array.isArray(settings.liveDonationPrefixes) && settings.liveDonationPrefixes.length
      ? settings.liveDonationPrefixes
      : (typeof settings.liveDonationPrefix === "string" && settings.liveDonationPrefix
          ? [settings.liveDonationPrefix]
          : []);
  setPrefixRows("donation", donationPrefixes);
  syncLivePrefixInputs();
  if (settings.liveDonationFilter && typeof settings.liveDonationFilter === "object") {
    if (getLiveDonationChatInput()) {
      getLiveDonationChatInput().checked = settings.liveDonationFilter.chat !== false;
    }
    if (getLiveDonationVideoInput()) {
      getLiveDonationVideoInput().checked = Boolean(settings.liveDonationFilter.video);
    }
    if (getLiveDonationMissionInput()) {
      getLiveDonationMissionInput().checked = Boolean(settings.liveDonationFilter.mission);
    }
  }
  if (settings.summaryFilter && typeof settings.summaryFilter === "object") {
    if (elements.summaryFilterTarget && typeof settings.summaryFilter.target === "string") {
      elements.summaryFilterTarget.value = settings.summaryFilter.target;
    }
    if (elements.summaryFilterAmountMode && typeof settings.summaryFilter.amountMode === "string") {
      elements.summaryFilterAmountMode.value = settings.summaryFilter.amountMode;
    }
    if (elements.summaryFilterAmountValue && Number.isFinite(settings.summaryFilter.amountValue)) {
      elements.summaryFilterAmountValue.value = String(settings.summaryFilter.amountValue);
    }
    if (elements.summaryFilterAmountValueMax && Number.isFinite(settings.summaryFilter.amountValueMax)) {
      elements.summaryFilterAmountValueMax.value = String(settings.summaryFilter.amountValueMax);
    }
    if (elements.summaryFilterKeywordMode && typeof settings.summaryFilter.keywordMode === "string") {
      elements.summaryFilterKeywordMode.value = settings.summaryFilter.keywordMode;
    }
    if (elements.summaryFilterKeywordValue && typeof settings.summaryFilter.keywordValue === "string") {
      elements.summaryFilterKeywordValue.value = settings.summaryFilter.keywordValue;
    }
  }
  if (typeof settings.rouletteSummarySource === "string") {
    state.rouletteSummarySource = settings.rouletteSummarySource === "filtered" ? "filtered" : "all";
  } else {
    state.rouletteSummarySource = "all";
  }
  if (typeof settings.useName === "boolean" && elements.useNameInput) {
    elements.useNameInput.checked = settings.useName;
  }
  if (typeof settings.useMessage === "boolean" && elements.useMessageInput) {
    elements.useMessageInput.checked = settings.useMessage;
  }
  if (typeof settings.showAmounts === "boolean" && elements.showAmountsInput) {
    elements.showAmountsInput.checked = settings.showAmounts;
  }

  if (typeof settings.autoRemoveWinner === "boolean" && elements.autoRemoveWinnerInput) {
    elements.autoRemoveWinnerInput.checked = settings.autoRemoveWinner;
  }
  if (typeof settings.autoRerollAfterRemove === "boolean" && elements.autoRerollAfterRemoveInput) {
    elements.autoRerollAfterRemoveInput.checked = settings.autoRerollAfterRemove;
  }

  renderUnitAmountSummary();
  syncGroupingDependencies();
}

function hydrateSavedRoulettes() {
  state.savedRoulettes = readSavedRoulettes()
    .sort((a, b) => (b.updatedAt || b.savedAt || 0) - (a.updatedAt || a.savedAt || 0));
}

function hydrateWinnerHistory() {
  state.winnerHistory = readWinnerHistory()
    .sort((a, b) => (b.wonAt || 0) - (a.wonAt || 0));
}

function setUnitAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return;
  }
  elements.unitAmountInput.value = String(amount);
  renderAll();
}

function setQuickAmount(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) {
    return;
  }
  elements.quickAmountInput.value = String(amount);
}

function applyQuickMultiplier(value) {
  const multiplier = Number(value);
  if (!Number.isFinite(multiplier) || multiplier <= 0) {
    return;
  }

  elements.quickMultiplierInput.value = String(multiplier);
  renderQuickTotalSummary();
}

function quickEntryTotal() {
  const baseAmount = Number(elements.quickAmountInput?.value || 0);
  const multiplier = Number(elements.quickMultiplierInput?.value || 1);

  if (!Number.isFinite(baseAmount) || baseAmount <= 0) {
    return null;
  }

  const safeMultiplier = Number.isFinite(multiplier) && multiplier > 0 ? multiplier : 1;
  return {
    baseAmount,
    multiplier: safeMultiplier,
    totalAmount: baseAmount * safeMultiplier,
  };
}

function renderQuickTotalSummary() {
  if (!elements.quickTotalSummary) {
    return;
  }

  const total = quickEntryTotal();
  if (!total) {
    elements.quickTotalSummary.textContent = "총합 미리보기: 금액과 배수를 입력해 주세요.";
    return;
  }

  elements.quickTotalSummary.textContent = `${formatNumber(total.baseAmount)}원 x ${formatNumber(total.multiplier)} = 총 ${formatNumber(total.totalAmount)}원`;
}

function toggleAdminPanel() {
  if (!elements.adminPanel || !elements.toggleAdminButton) {
    return;
  }
  const nextHidden = !elements.adminPanel.hidden;
  elements.adminPanel.hidden = nextHidden;
  elements.toggleAdminButton.textContent = nextHidden ? "운영 패널" : "운영 패널 닫기";
}

function addQuickEntry() {
  const total = quickEntryTotal();
  if (!total) {
    elements.winnerText.textContent = "금액과 배수를 먼저 입력해 주세요.";
    return;
  }

  const name = (elements.quickNameInput?.value || "").trim();
  const message = (elements.quickMessageInput?.value || "").trim();
  const entry = {
    valid: true,
    source: "manual",
    time: timeNow(),
    name,
    amount: total.totalAmount,
    message,
    receivedAt: Date.now(),
  };

  state.manualEntries.push(entry);
  if (elements.quickNameInput) elements.quickNameInput.value = "";
  if (elements.quickMessageInput) elements.quickMessageInput.value = "";
  if (elements.quickAmountInput) elements.quickAmountInput.value = "";
  if (elements.quickMultiplierInput) elements.quickMultiplierInput.value = "1";
  renderQuickTotalSummary();
  renderAll();
  elements.winnerText.textContent = "후원 항목을 추가했습니다.";
}

function importBulkEntries() {
  const raw = elements.entriesInput?.value || "";
  const lines = raw.split(/\r?\n/);
  const parsed = lines
    .map((line, index) => parseBulkLine(line, index))
    .filter(Boolean);

  const validEntries = parsed.filter((entry) => entry.valid);
  if (!validEntries.length) {
    elements.winnerText.textContent = "반영할 수 있는 입력이 없습니다.";
    return;
  }

  state.manualEntries.push(...validEntries);
  if (elements.entriesInput) {
    elements.entriesInput.value = "";
  }
  renderAll();
  elements.winnerText.textContent = `${formatNumber(validEntries.length)}건을 한꺼번에 반영했습니다.`;
}

function ensureLiveSourceModeControl() {
  if (getLiveSourceModeSelect() || !elements.liveChatPrefixInput?.closest(".live-prefix-filter-group")) {
    return;
  }

  const wrapper = document.createElement("label");
  wrapper.innerHTML = `
    <span>실시간 수집 대상</span>
    <select id="live-source-mode-select">
      <option value="donation">도네만</option>
      <option value="chat">채팅만</option>
      <option value="both">도네 + 채팅</option>
    </select>
    <small class="field-hint">도네만, 채팅만, 도네+채팅 중 하나를 고릅니다. 채팅이 포함된 모드에서는 채팅 접두어가 꼭 필요합니다.</small>
  `;

  elements.liveChatPrefixInput.closest(".live-prefix-filter-group")?.before(wrapper);
  wrapper.querySelector("select")?.addEventListener("change", () => {
    saveSettings();
    renderStatuses();
  });
}

function getLiveDonationChatInput() {
  return document.getElementById("live-donation-chat-input");
}

function getLiveDonationVideoInput() {
  return document.getElementById("live-donation-video-input");
}

function getLiveDonationMissionInput() {
  return document.getElementById("live-donation-mission-input");
}

function ensureLiveDonationFilterControl() {
  if (getLiveDonationChatInput() || !elements.liveChatPrefixInput?.closest(".admin-settings-grid")) {
    return;
  }

  const wrapper = document.createElement("fieldset");
  wrapper.className = "live-donation-filter-group";
  wrapper.innerHTML = `
    <legend>도네 유형 필터</legend>
    <label class="toggle-option">
      <input id="live-donation-chat-input" type="checkbox" checked />
      <span>일반 도네</span>
    </label>
    <label class="toggle-option">
      <input id="live-donation-video-input" type="checkbox" />
      <span>영상 도네</span>
    </label>
    <label class="toggle-option">
      <input id="live-donation-mission-input" type="checkbox" />
      <span>미션 도네 (성공만 반영)</span>
    </label>
  `;

  elements.liveChatPrefixInput.closest(".admin-settings-grid")?.append(wrapper);
  [
    getLiveDonationChatInput(),
    getLiveDonationVideoInput(),
    getLiveDonationMissionInput(),
  ].forEach((input) => input?.addEventListener("change", () => {
    saveSettings();
    renderStatuses();
  }));
}

function ensureLiveChatPrefixToggleControl() {
  if (elements.useLiveChatPrefixInput || !elements.liveChatPrefixList?.parentElement) {
    return;
  }

  const targetField = elements.liveChatPrefixList.closest(".prefix-filter-field");
  if (!targetField) {
    return;
  }

  const toggle = document.createElement("label");
  toggle.className = "toggle-option prefix-toggle-option";
  toggle.innerHTML = `
    <input id="use-live-chat-prefix-input" type="checkbox" checked />
    <span>채팅 접두어 사용</span>
  `;

  targetField.before(toggle);
  elements.useLiveChatPrefixInput = toggle.querySelector("input");
  elements.useLiveChatPrefixInput?.addEventListener("change", () => {
    syncLivePrefixInputs();
    saveSettings();
    renderStatuses();
  });
}

function getLiveDonationFilterState() {
  return {
    chat: Boolean(getLiveDonationChatInput()?.checked ?? true),
    video: Boolean(getLiveDonationVideoInput()?.checked ?? false),
    mission: Boolean(getLiveDonationMissionInput()?.checked ?? false),
  };
}

function isMissionDonationSuccessful(payload) {
  const success = payload?.success ?? payload?.extras?.success;
  if (success === true) {
    return true;
  }

  const status = String(payload?.status || payload?.extras?.status || "")
    .trim()
    .toUpperCase();
  if (!status) {
    return false;
  }

  return [
    "SUCCESS",
    "SUCCEED",
    "SUCCEEDED",
    "COMPLETED",
    "COMPLETE",
    "DONE",
    "ACHIEVED",
    "FINISHED",
  ].includes(status);
}

function usesLiveChatPrefix() {
  return Boolean(elements.useLiveChatPrefixInput?.checked ?? true);
}

function usesLiveDonationPrefix() {
  return Boolean(elements.useLiveDonationPrefixInput?.checked);
}

function syncLivePrefixInputs() {
  const chatEnabled = !elements.useLiveChatPrefixInput || usesLiveChatPrefix();
  getPrefixInputs("chat").forEach((input) => {
    input.disabled = !chatEnabled;
  });
  if (elements.addLiveChatPrefixButton) {
    elements.addLiveChatPrefixButton.disabled = !chatEnabled;
  }
  const donationEnabled = !elements.useLiveDonationPrefixInput || usesLiveDonationPrefix();
  getPrefixInputs("donation").forEach((input) => {
    input.disabled = !donationEnabled;
  });
  if (elements.addLiveDonationPrefixButton) {
    elements.addLiveDonationPrefixButton.disabled = !donationEnabled;
  }
}

function isAllowedLiveDonation(payload) {
  const filter = getLiveDonationFilterState();
  const donationType = String(payload?.donationType || payload?.extras?.donationType || "CHAT").toUpperCase();

  if (donationType === "VIDEO") {
    return filter.video;
  }

  if (donationType === "MISSION") {
    return filter.mission && isMissionDonationSuccessful(payload);
  }

  return filter.chat;
}

function ensureLiveDebugPanel() {
  if (getLiveDebugFeed() || !elements.liveFeed?.parentElement) {
    return;
  }

  const wrapper = document.createElement("details");
  wrapper.className = "live-debug-panel";
  wrapper.innerHTML = `
    <summary>실시간 raw 확인</summary>
    <div id="live-debug-feed" class="table-body empty-state compact-table-body">아직 실시간 raw 이벤트가 없습니다.</div>
  `;
  elements.liveFeed.parentElement.append(wrapper);
}

function ensureLiveFeedClearButton() {
  if (elements.clearLiveLogButton || !elements.liveFeedFilteredTab?.parentElement) {
    return;
  }

  const button = document.createElement("button");
  button.id = "clear-live-log-button";
  button.type = "button";
  button.className = "ghost-button";
  button.textContent = "로그 비우기";
  button.title = "최근 후원과 raw 로그를 함께 비웁니다.";
  button.addEventListener("click", clearLiveLogs);
  elements.liveFeedFilteredTab.parentElement.append(button);
  elements.clearLiveLogButton = button;
}

function ensureSkipSpinButton() {
  if (elements.skipSpinButton || !elements.spinButton?.parentElement) {
    return;
  }

  const button = document.createElement("button");
  button.id = "skip-spin-button";
  button.type = "button";
  button.className = "ghost-button";
  button.textContent = "스킵";
  button.disabled = true;
  button.title = "연속 회전 중 남은 결과를 한 번에 확정합니다.";
  button.addEventListener("click", skipSpinSequence);

  const nextSibling = elements.shuffleWheelButton || null;
  elements.spinButton.parentElement.insertBefore(button, nextSibling);
  elements.skipSpinButton = button;
}

function ensureCollectionModePrefixSummary() {
  if (elements.collectionModePrefixSummary || !elements.collectionModeSummary?.parentElement) {
    return;
  }

  const summary = document.createElement("p");
  summary.id = "collection-mode-prefix-summary";
  summary.className = "hint quick-grouping-summary collection-prefix-summary";
  elements.collectionModeSummary.insertAdjacentElement("afterend", summary);
  elements.collectionModePrefixSummary = summary;
}

function formatPrefixSummary(kind) {
  const values = getPrefixValues(kind).filter(Boolean);
  if (kind === "chat") {
    return usesLiveChatPrefix()
      ? (values.length ? values.join(", ") : "입력 필요")
      : "사용 안 함";
  }
  return usesLiveDonationPrefix()
    ? (values.length ? values.join(", ") : "입력 필요")
    : "사용 안 함";
}

function renderCollectionModePrefixSummary() {
  ensureCollectionModePrefixSummary();
  if (!elements.collectionModePrefixSummary) {
    return;
  }

  const parts = [];
  if (usesLiveChatMode()) {
    parts.push(`채팅 필터링: ${formatPrefixSummary("chat")}`);
  }
  if (usesLiveDonationMode()) {
    parts.push(`도네 필터링: ${formatPrefixSummary("donation")}`);
  }

  elements.collectionModePrefixSummary.textContent = parts.length
    ? parts.join("  |  ")
    : "현재는 수동 입력만 반영합니다.";
}

function clearLiveLogs() {
  const hasAnything = state.liveEntries.length || state.liveDebugEvents.length;
  if (!hasAnything) {
    elements.winnerText.textContent = "비울 실시간 로그가 없습니다.";
    return;
  }

  state.liveEntries = [];
  state.liveDebugEvents = [];
  renderAll();
  elements.winnerText.textContent = "최근 후원과 raw 로그를 비웠습니다.";
}

function getLiveChatPrefixFilter() {
  return getPrefixValues("chat")[0] || "";
}

function getLiveDonationPrefixFilter() {
  if (!usesLiveDonationPrefix()) {
    return "";
  }
  return getPrefixValues("donation")[0] || "";
}

function getLiveChatPrefixFilters() {
  if (!usesLiveChatPrefix()) {
    return [];
  }
  return getPrefixValues("chat");
}

function getLiveDonationPrefixFilters() {
  if (!usesLiveDonationPrefix()) {
    return [];
  }
  return getPrefixValues("donation");
}

function getLiveSourceModeSelect() {
  return elements.liveSourceModeSelect || $("live-source-mode-select");
}

function getLiveSourceMode() {
  return getLiveSourceModeSelect()?.value || "donation";
}

function usesLiveChatMode() {
  const mode = getLiveSourceMode();
  return mode === "chat" || mode === "both";
}

function usesLiveDonationMode() {
  const mode = getLiveSourceMode();
  return mode === "donation" || mode === "both";
}

function liveSourceModeLabel(mode = getLiveSourceMode()) {
  if (mode === "chat") {
    return "채팅만";
  }
  if (mode === "both") {
    return "도네+채팅";
  }
  return "도네만";
}

function parseMessageWithPrefix(message, prefix) {
  const rawMessage = String(message || "").trim();

  if (!prefix) {
    return rawMessage;
  }

  if (!rawMessage.startsWith(prefix)) {
    return null;
  }

  const trimmed = rawMessage.slice(prefix.length).trim();
  return trimmed || null;
}

function parseMessageWithPrefixes(message, prefixes = []) {
  const rawMessage = String(message || "").trim();
  if (!prefixes.length) {
    return rawMessage;
  }

  for (const prefix of prefixes) {
    if (!prefix || !rawMessage.startsWith(prefix)) {
      continue;
    }
    const trimmed = rawMessage.slice(prefix.length).trim();
    return trimmed || null;
  }

  return null;
}

function validateLiveCollectionModeRequirements() {
  if (usesLiveChatMode() && usesLiveChatPrefix() && !getLiveChatPrefixFilters().length) {
    return {
      ok: false,
      reason: "채팅 필터링 사용이 켜져 있으면 채팅 필터를 입력해 주세요.",
    };
  }

  if (usesLiveDonationPrefix() && !getLiveDonationPrefixFilters().length) {
    return {
      ok: false,
      reason: "도네 필터링 사용을 켰다면 도네 필터도 입력해 주세요.",
    };
  }

  if (usesLiveDonationMode()) {
    const donationFilter = getLiveDonationFilterState();
    if (!donationFilter.chat && !donationFilter.video && !donationFilter.mission) {
      return {
        ok: false,
        reason: "도네가 포함된 모드에서는 최소 1개 이상의 도네 유형을 선택해 주세요.",
      };
    }
  }

  return { ok: true, reason: "" };
}

function describeLiveSourceMode(mode = getLiveSourceMode()) {
  if (mode === "chat") {
    return "채팅만";
  }
  if (mode === "both") {
    return "도네+채팅";
  }
  return "도네만";
}

function getLiveCollectionSummaryText() {
  if (!state.liveCollectionActive) {
    return "수동 모드입니다. 직접 추가한 항목만 반영합니다.";
  }

  if (usesLiveChatMode() && usesLiveDonationMode() && usesLiveDonationPrefix()) {
    return `실시간 ${describeLiveSourceMode()} 모드입니다. ${usesLiveChatPrefix() ? "채팅 필터링과 " : ""}도네 필터링을 통과한 항목만 반영합니다.`;
  }
  if (usesLiveChatMode()) {
    return usesLiveChatPrefix()
      ? `실시간 ${describeLiveSourceMode()} 모드입니다. 채팅 필터링을 통과한 항목만 반영합니다.`
      : `실시간 ${describeLiveSourceMode()} 모드입니다. 들어오는 채팅을 그대로 반영합니다.`;
  }
  if (usesLiveDonationPrefix()) {
    return `실시간 ${describeLiveSourceMode()} 모드입니다. 도네 필터링을 통과한 항목만 반영합니다.`;
  }
  return `실시간 ${describeLiveSourceMode()} 모드입니다. 들어오는 항목을 자동으로 반영합니다.`;
}

function focusMissingLivePrefixInput() {
  if (usesLiveChatMode() && usesLiveChatPrefix() && !getLiveChatPrefixFilters().length) {
    getPrefixInputs("chat")[0]?.focus();
    return;
  }
  if (usesLiveDonationPrefix() && !getLiveDonationPrefixFilters().length) {
    getPrefixInputs("donation")[0]?.focus();
  }
}

function handleLiveStatusPayload(payload = {}) {
  state.liveConnection.collectorRunning = Boolean(payload.running);
  state.liveConnection.socketConnected = Boolean(payload.connected);
  state.liveConnection.channelId = payload.channel_id || payload.channelId || state.liveConnection.channelId;
  if (payload.last_error) {
    state.liveConnection.lastError = payload.last_error;
  }
  if (payload.running && payload.connected) {
    state.liveConnection.connectState = "subscribed";
  } else if (payload.running) {
    state.liveConnection.connectState = "connecting";
  } else if (state.liveConnection.lastError) {
    state.liveConnection.connectState = "error";
  } else {
    state.liveConnection.connectState = "idle";
  }
  renderStatuses();
}

function handleLiveErrorPayload(payload = {}) {
  state.liveConnection.lastError = payload.message || payload.error || "실시간 연결 중 오류가 발생했습니다.";
  if (!state.liveConnection.socketConnected) {
    state.liveConnection.connectState = "error";
  }
  renderStatuses();
}

function formatLiveEntryTime(rawTime) {
  if (!rawTime) {
    return timeNow();
  }
  const parsed = new Date(rawTime);
  if (Number.isNaN(parsed.getTime())) {
    return timeNow();
  }
  return `${String(parsed.getHours()).padStart(2, "0")}:${String(parsed.getMinutes()).padStart(2, "0")}`;
}

function addLiveChat(payload = {}) {
  state.liveConnection.lastRawAt = Date.now();
  state.liveConnection.socketConnected = true;
  state.liveConnection.collectorRunning = true;
  state.liveConnection.connectState = "subscribed";
  pushLiveDebugEvent("chat", payload);

  if (!state.liveCollectionActive || !usesLiveChatMode()) {
    renderStatuses();
    return;
  }

  const message = parseMessageWithPrefixes(
    payload.message || payload.content || "",
    getLiveChatPrefixFilters(),
  );
  if (!message) {
    renderStatuses();
    return;
  }

  state.liveEntries.push({
    valid: true,
    source: "live",
    liveKind: "chat",
    time: formatLiveEntryTime(payload.time),
    name: sanitizeExternalText(payload.nickname || payload.profile?.nickname || ""),
    amount: 0,
    message: sanitizeExternalText(message),
    receivedAt: Date.now(),
  });
  renderAll();
}

function addLiveDonation(payload = {}) {
  state.liveConnection.lastRawAt = Date.now();
  state.liveConnection.socketConnected = true;
  state.liveConnection.collectorRunning = true;
  state.liveConnection.connectState = "subscribed";
  pushLiveDebugEvent("donation", payload);

  if (!state.liveCollectionActive || !usesLiveDonationMode()) {
    renderStatuses();
    return;
  }

  if (!isAllowedLiveDonation(payload)) {
    renderStatuses();
    return;
  }

  const parsedMessage = parseMessageWithPrefixes(
    payload.message || payload.donationText || payload.content || "",
    getLiveDonationPrefixFilters(),
  );
  if (usesLiveDonationPrefix() && !parsedMessage) {
    renderStatuses();
    return;
  }

  state.liveEntries.push({
    valid: true,
    source: "live",
    liveKind: "donation",
    donationType: String(payload.donationType || payload.extras?.donationType || "CHAT").toUpperCase(),
    donationStatus: String(payload.status || payload.extras?.status || "").toUpperCase(),
    donationSuccess: isMissionDonationSuccessful(payload),
    time: formatLiveEntryTime(payload.time),
    name: sanitizeExternalText(payload.nickname || payload.donatorNickname || payload.profile?.nickname || ""),
    amount: Number(payload.payAmount ?? payload.extras?.payAmount ?? 0),
    message: sanitizeExternalText(parsedMessage || payload.message || payload.donationText || ""),
    receivedAt: Date.now(),
  });
  renderAll();
}

function clearLiveEventBridge() {
  if (state.liveConnection.eventSource) {
    state.liveConnection.eventSource.close();
    state.liveConnection.eventSource = null;
  }
  state.liveConnection.eventUnlisteners.forEach((unlisten) => {
    try {
      if (typeof unlisten === "function") {
        unlisten();
      }
    } catch {}
  });
  state.liveConnection.eventUnlisteners = [];
}

async function ensureLiveEventBridge() {
  if (liveEventStreamReadyPromise) {
    return liveEventStreamReadyPromise;
  }

  liveEventStreamReadyPromise = (async () => {
    clearLiveEventBridge();

    if (isTauriRuntime()) {
      state.liveConnection.eventUnlisteners.push(
        await tauriListen("unofficial-live-status", (event) => handleLiveStatusPayload(event.payload || {})),
      );
      state.liveConnection.eventUnlisteners.push(
        await tauriListen("unofficial-live-error", (event) => handleLiveErrorPayload(event.payload || {})),
      );
      state.liveConnection.eventUnlisteners.push(
        await tauriListen("unofficial-live-chat", (event) => addLiveChat(event.payload || {})),
      );
      state.liveConnection.eventUnlisteners.push(
        await tauriListen("unofficial-live-donation", (event) => addLiveDonation(event.payload || {})),
      );
      return;
    }

    const eventSource = new EventSource("/api/unofficial-live/events");
    state.liveConnection.eventSource = eventSource;
    eventSource.addEventListener("status", (event) => handleLiveStatusPayload(JSON.parse(event.data)));
    eventSource.addEventListener("error", (event) => handleLiveErrorPayload(JSON.parse(event.data)));
    eventSource.addEventListener("chat", (event) => addLiveChat(JSON.parse(event.data)));
    eventSource.addEventListener("donation", (event) => addLiveDonation(JSON.parse(event.data)));
  })().catch((error) => {
    liveEventStreamReadyPromise = null;
    throw error;
  });

  return liveEventStreamReadyPromise;
}

async function connectLiveSession({ allowPending = false } = {}) {
  const liveTarget = evaluateLiveTarget();
  if (!liveTarget.ok) {
    throw new Error(liveTarget.reason || "먼저 방송 확인을 진행해 주세요.");
  }

  const modeCheck = validateLiveCollectionModeRequirements();
  if (!modeCheck.ok) {
    throw new Error(modeCheck.reason);
  }

  await ensureLiveEventBridge();

  state.liveConnection.lastError = null;
  state.liveConnection.channelId = state.liveVerification.channelId;
  state.liveConnection.connectState = "connecting";
  state.liveConnection.collectorRunning = false;
  state.liveConnection.socketConnected = false;
  renderStatuses();

  await api("/api/unofficial-live/start", {
    method: "POST",
    body: JSON.stringify({
      channelId: state.liveVerification.channelId,
      mode: getLiveSourceMode(),
    }),
  });

  state.liveConnection.collectorRunning = true;
  state.liveConnection.connectState = "connecting";
  renderStatuses();

  if (!allowPending) {
    elements.winnerText.textContent = "실시간 연결을 준비 중입니다. 잠시만 기다려 주세요.";
  }
}

async function disconnectLiveSession() {
  try {
    await api("/api/unofficial-live/stop", { method: "POST" });
  } catch {}

  stopLiveCollection("실시간 수집을 종료했습니다.");
  clearLiveEventBridge();
  liveEventStreamReadyPromise = null;
  state.liveConnection.socket = null;
  state.liveConnection.collectorRunning = false;
  state.liveConnection.socketConnected = false;
  state.liveConnection.connectState = "idle";
  state.liveConnection.lastError = null;
  renderStatuses();
}

function handleAddressStatusClick() {
  const targetInput = elements.liveUrlInputMain || elements.liveUrlInput;
  targetInput?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  targetInput?.focus();
}

async function handleSessionStatusClick() {
  const liveTarget = evaluateLiveTarget();
  if (!liveTarget.ok) {
    elements.winnerText.textContent = liveTarget.reason;
    window.alert(liveTarget.reason);
    return;
  }

  if (["connecting", "subscribed"].includes(state.liveConnection.connectState)) {
    elements.winnerText.textContent = "이미 실시간 연결을 준비 중이거나 수신 중입니다.";
    return;
  }

  try {
    await connectLiveSession({ allowPending: true });
  } catch (error) {
    const message = normalizeErrorMessage(error, "실시간 연결을 시작하지 못했습니다.");
    if (state.liveConnection.collectorRunning || state.liveConnection.connectState === "connecting") {
      state.liveConnection.lastError = null;
      state.liveConnection.connectState = "connecting";
      renderStatuses();
      elements.winnerText.textContent = "실시간 연결을 준비 중입니다. 첫 채팅이나 도네가 들어오면 자동으로 수신 상태로 바뀝니다.";
      return;
    }
    state.liveConnection.lastError = message;
    state.liveConnection.connectState = "error";
    renderStatuses();
    throw error;
  }

  elements.winnerText.textContent = "실시간 연결을 준비 중입니다. 첫 채팅이나 도네가 들어오면 자동으로 수신 상태로 바뀝니다.";
}

async function handleCollectionStatusClick() {
  if (state.liveCollectionActive) {
    await disconnectLiveSession();
    return;
  }

  const liveTarget = evaluateLiveTarget();
  if (!liveTarget.ok) {
    elements.winnerText.textContent = liveTarget.reason;
    window.alert(liveTarget.reason);
    return;
  }

  try {
    if (!["subscribed", "connecting"].includes(state.liveConnection.connectState)) {
      await connectLiveSession({ allowPending: true });
    }
    startLiveCollection();
  } catch (error) {
    const message = normalizeErrorMessage(error, "실시간 연결을 시작하지 못했습니다.");
    if (state.liveConnection.collectorRunning || state.liveConnection.connectState === "connecting") {
      startLiveCollection();
      elements.winnerText.textContent = "실시간 연결을 준비 중입니다. 방송이 켜져 있으니 들어오는 항목부터 자동으로 반영합니다.";
      renderStatuses();
      return;
    }
    elements.winnerText.textContent = message;
    state.liveConnection.lastError = message;
    state.liveConnection.connectState = "error";
    renderStatuses();
    window.alert(`실시간 연결을 시작하지 못했습니다.\n\n원인: ${message}\n\n안내: 방송이 켜져 있는지, 접두어와 수집 대상을 다시 확인해 주세요.`);
  }
}

function startLiveCollectionOverride() {
  const modeCheck = validateLiveCollectionModeRequirements();
  if (!modeCheck.ok) {
    elements.winnerText.textContent = modeCheck.reason;
    window.alert(modeCheck.reason);
    focusMissingLivePrefixInput();
    return;
  }
  if (elements.collectionModeSummary) {
    elements.collectionModeSummary.textContent = getLiveCollectionSummaryText();
  }
  renderCollectionModePrefixSummary();

  const liveTarget = evaluateLiveTarget();
  if (!liveTarget.ok) {
    elements.winnerText.textContent = liveTarget.reason;
    if (liveTarget.level !== "idle") {
      window.alert(liveTarget.reason);
    }
    return;
  }
  if (!["subscribed", "connecting"].includes(state.liveConnection.connectState)) {
    elements.winnerText.textContent = "실시간 연결을 준비하는 중입니다. 들어오는 항목은 즉시 자동 반영됩니다.";
    return;
  }

  state.liveCollectionActive = true;
  if (elements.startTimeInput) {
    elements.startTimeInput.value = timeNow();
  }
  renderAll();
  elements.winnerText.textContent = `지금부터 실시간 수집(${describeLiveSourceMode()})을 시작합니다.`;
}

function stopLiveCollectionLegacy() {
  state.liveCollectionActive = false;
  renderAll();
  elements.winnerText.textContent = "실시간 수집을 종료했습니다.";
}

function switchToManualMode() {
  if (!state.liveCollectionActive) {
    elements.winnerText.textContent = "이미 수동 모드입니다.";
    return;
  }
  stopLiveCollection();
}

function switchToLiveMode() {
  if (state.liveCollectionActive) {
    elements.winnerText.textContent = "이미 실시간 모드입니다.";
    return;
  }
  const liveUrl = getLiveUrlValue();
  if (!liveUrl) {
    elements.winnerText.textContent = "실시간 모드를 쓰려면 먼저 방송 주소를 입력해 주세요.";
    const targetInput = elements.liveUrlInputMain || elements.liveUrlInput;
    targetInput?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    targetInput?.focus();
    window.alert("실시간 모드를 쓰려면 먼저 방송 주소를 입력해 주세요.");
    return;
  }
  if (state.liveConnection.connectState !== "subscribed") {
    elements.winnerText.textContent = "실시간 모드를 쓰려면 먼저 실시간 연결을 완료해 주세요.";
    window.alert("실시간 모드를 쓰려면 먼저 실시간 연결을 완료해 주세요.");
    return;
  }
  const liveTarget = evaluateLiveTarget();
  if (!liveTarget.ok) {
    elements.winnerText.textContent = liveTarget.reason;
    window.alert(liveTarget.reason);
    return;
  }
  startLiveCollection();
}

function getSpinRepeatCount() {
  const parsed = Number(elements.spinRepeatCountInput?.value || 1);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(20, Math.floor(parsed)) : 1;
}

function normalizeSpinRepeatCount() {
  const next = getSpinRepeatCount();
  if (elements.spinRepeatCountInput) {
    elements.spinRepeatCountInput.value = String(next);
  }
  return next;
}

function syncSaveNameInputs(source = "admin") {
  const adminValue = elements.saveNameInput?.value || "";
  const mainValue = elements.saveNameInputMain?.value || "";
  const nextValue = source === "main" ? mainValue : adminValue;

  if (elements.saveNameInput && elements.saveNameInput.value !== nextValue) {
    elements.saveNameInput.value = nextValue;
  }
  if (elements.saveNameInputMain && elements.saveNameInputMain.value !== nextValue) {
    elements.saveNameInputMain.value = nextValue;
  }
}

function applySnapshot(snapshot) {
  state.manualEntries = cloneValue(snapshot.manualEntries || []);
  state.liveEntries = cloneValue(snapshot.liveEntries || []);
  state.manualMerges = cloneValue(snapshot.manualMerges || {});
  state.summaryEdits = cloneValue(snapshot.summaryEdits || {});
  state.excludedLabels = cloneValue(snapshot.excludedLabels || []);
  state.mergeSelection.clear();

  if (elements.mergeTargetInput) {
    elements.mergeTargetInput.value = "";
  }

  if (snapshot.settings?.startTime) {
    elements.startTimeInput.value = snapshot.settings.startTime;
  }
  if (Number.isFinite(snapshot.settings?.unitAmount) && snapshot.settings.unitAmount > 0) {
    elements.unitAmountInput.value = String(snapshot.settings.unitAmount);
  }
  if (Number.isFinite(snapshot.settings?.spinDuration) && snapshot.settings.spinDuration > 0) {
    elements.spinDurationInput.value = String(snapshot.settings.spinDuration);
  }
  if (elements.collectionLimitMinutesInput && Number.isFinite(snapshot.settings?.collectionLimitMinutes)) {
    elements.collectionLimitMinutesInput.value = String(snapshot.settings.collectionLimitMinutes);
  }
  if (elements.collectionLimitSecondsInput && Number.isFinite(snapshot.settings?.collectionLimitSeconds)) {
    elements.collectionLimitSecondsInput.value = String(snapshot.settings.collectionLimitSeconds);
  }
  if (getUseCollectionDurationInput()) {
    const inferredUseDuration = typeof snapshot.settings?.useCollectionDuration === "boolean"
      ? snapshot.settings.useCollectionDuration
      : ((Number(snapshot.settings?.collectionLimitMinutes || 0) > 0) || (Number(snapshot.settings?.collectionLimitSeconds || 0) > 0));
    getUseCollectionDurationInput().checked = inferredUseDuration;
  }
  if (getCollectionUntilTimeInput() && typeof snapshot.settings?.collectionUntilTime === "string") {
    getCollectionUntilTimeInput().value = snapshot.settings.collectionUntilTime;
  }
  if (getUseCollectionUntilInput()) {
    const inferredUseUntil = typeof snapshot.settings?.useCollectionUntil === "boolean"
      ? snapshot.settings.useCollectionUntil
      : Boolean(snapshot.settings?.collectionUntilTime);
    getUseCollectionUntilInput().checked = inferredUseUntil;
  }
  syncCollectionLimitUi();
  if (Number.isFinite(snapshot.settings?.spinRepeatCount) && snapshot.settings.spinRepeatCount > 0 && elements.spinRepeatCountInput) {
    elements.spinRepeatCountInput.value = String(snapshot.settings.spinRepeatCount);
  }
  if (typeof snapshot.settings?.liveUrl === "string" && elements.liveUrlInput) {
    elements.liveUrlInput.value = snapshot.settings.liveUrl;
  }
  if (typeof snapshot.settings?.liveUrl === "string" && elements.liveUrlInputMain) {
    elements.liveUrlInputMain.value = snapshot.settings.liveUrl;
  }
  if (typeof snapshot.settings?.liveSourceMode === "string" && getLiveSourceModeSelect()) {
    getLiveSourceModeSelect().value = snapshot.settings.liveSourceMode;
  }
  if (typeof snapshot.settings?.useLiveChatPrefix === "boolean" && elements.useLiveChatPrefixInput) {
    elements.useLiveChatPrefixInput.checked = snapshot.settings.useLiveChatPrefix;
  } else if (elements.useLiveChatPrefixInput) {
    elements.useLiveChatPrefixInput.checked = true;
  }
  const legacyLivePrefix =
    typeof snapshot.settings?.livePrefix === "string" ? snapshot.settings.livePrefix : "";
  const chatPrefixes =
    Array.isArray(snapshot.settings?.liveChatPrefixes) && snapshot.settings.liveChatPrefixes.length
      ? snapshot.settings.liveChatPrefixes
      : (typeof snapshot.settings?.liveChatPrefix === "string" && snapshot.settings.liveChatPrefix
          ? [snapshot.settings.liveChatPrefix]
          : (legacyLivePrefix ? [legacyLivePrefix] : []));
  setPrefixRows("chat", chatPrefixes);
  if (typeof snapshot.settings?.useLiveDonationPrefix === "boolean" && elements.useLiveDonationPrefixInput) {
    elements.useLiveDonationPrefixInput.checked = snapshot.settings.useLiveDonationPrefix;
  }
  const donationPrefixes =
    Array.isArray(snapshot.settings?.liveDonationPrefixes) && snapshot.settings.liveDonationPrefixes.length
      ? snapshot.settings.liveDonationPrefixes
      : (typeof snapshot.settings?.liveDonationPrefix === "string" && snapshot.settings.liveDonationPrefix
          ? [snapshot.settings.liveDonationPrefix]
          : []);
  setPrefixRows("donation", donationPrefixes);
  syncLivePrefixInputs();
  if (snapshot.settings?.liveDonationFilter && typeof snapshot.settings.liveDonationFilter === "object") {
    if (getLiveDonationChatInput()) {
      getLiveDonationChatInput().checked = snapshot.settings.liveDonationFilter.chat !== false;
    }
    if (getLiveDonationVideoInput()) {
      getLiveDonationVideoInput().checked = Boolean(snapshot.settings.liveDonationFilter.video);
    }
    if (getLiveDonationMissionInput()) {
      getLiveDonationMissionInput().checked = Boolean(snapshot.settings.liveDonationFilter.mission);
    }
  }
  if (snapshot.settings?.summaryFilter && typeof snapshot.settings.summaryFilter === "object") {
    if (elements.summaryFilterTarget && typeof snapshot.settings.summaryFilter.target === "string") {
      elements.summaryFilterTarget.value = snapshot.settings.summaryFilter.target;
    }
    if (elements.summaryFilterAmountMode && typeof snapshot.settings.summaryFilter.amountMode === "string") {
      elements.summaryFilterAmountMode.value = snapshot.settings.summaryFilter.amountMode;
    }
    if (elements.summaryFilterAmountValue && Number.isFinite(snapshot.settings.summaryFilter.amountValue)) {
      elements.summaryFilterAmountValue.value = String(snapshot.settings.summaryFilter.amountValue);
    }
    if (elements.summaryFilterAmountValueMax && Number.isFinite(snapshot.settings.summaryFilter.amountValueMax)) {
      elements.summaryFilterAmountValueMax.value = String(snapshot.settings.summaryFilter.amountValueMax);
    }
    if (elements.summaryFilterKeywordMode && typeof snapshot.settings.summaryFilter.keywordMode === "string") {
      elements.summaryFilterKeywordMode.value = snapshot.settings.summaryFilter.keywordMode;
    }
    if (elements.summaryFilterKeywordValue && typeof snapshot.settings.summaryFilter.keywordValue === "string") {
      elements.summaryFilterKeywordValue.value = snapshot.settings.summaryFilter.keywordValue;
    }
  }
  if (typeof snapshot.settings?.rouletteSummarySource === "string") {
    state.rouletteSummarySource = snapshot.settings.rouletteSummarySource === "filtered" ? "filtered" : "all";
  } else {
    state.rouletteSummarySource = "all";
  }
  if (typeof snapshot.settings?.useName === "boolean" && elements.useNameInput) {
    elements.useNameInput.checked = snapshot.settings.useName;
  }
  if (typeof snapshot.settings?.useMessage === "boolean" && elements.useMessageInput) {
    elements.useMessageInput.checked = snapshot.settings.useMessage;
  }
  if (typeof snapshot.settings?.showAmounts === "boolean" && elements.showAmountsInput) {
    elements.showAmountsInput.checked = snapshot.settings.showAmounts;
  }
  if (typeof snapshot.settings?.autoRemoveWinner === "boolean" && elements.autoRemoveWinnerInput) {
    elements.autoRemoveWinnerInput.checked = snapshot.settings.autoRemoveWinner;
  }
  if (typeof snapshot.settings?.autoRerollAfterRemove === "boolean" && elements.autoRerollAfterRemoveInput) {
    elements.autoRerollAfterRemoveInput.checked = snapshot.settings.autoRerollAfterRemove;
  }
}

function saveCurrentRoulette() {
  syncSaveNameInputs();
  const name = elements.saveNameInput?.value.trim();
  const snapshot = snapshotCurrentRoulette();
  const record = {
    id: crypto.randomUUID(),
    name: name || `룰렛 ${new Date().toLocaleString("ko-KR")}`,
    savedAt: Date.now(),
    updatedAt: Date.now(),
    ...snapshot,
  };

  state.savedRoulettes.unshift(record);
  state.activeSavedRouletteId = record.id;
  writeSavedRoulettes();
  renderAll();
  elements.winnerText.textContent = `"${record.name}" 저장 완료`;
}

function overwriteActiveSavedRoulette() {
  if (!state.activeSavedRouletteId) {
    elements.winnerText.textContent = "먼저 저장본을 하나 불러와 주세요.";
    return;
  }

  const targetIndex = state.savedRoulettes.findIndex((item) => item.id === state.activeSavedRouletteId);
  if (targetIndex < 0) {
    state.activeSavedRouletteId = null;
    renderAll();
    return;
  }

  syncSaveNameInputs();
  const current = state.savedRoulettes[targetIndex];
  const nextName = elements.saveNameInput?.value.trim() || current.name;
  state.savedRoulettes[targetIndex] = {
    ...current,
    name: nextName,
    updatedAt: Date.now(),
    ...snapshotCurrentRoulette(),
  };
  state.savedRoulettes.sort((a, b) => (b.updatedAt || b.savedAt || 0) - (a.updatedAt || a.savedAt || 0));
  writeSavedRoulettes();
  renderAll();
  elements.winnerText.textContent = `"${nextName}" 덮어쓰기 완료`;
}

function loadSavedRoulette(id) {
  const snapshot = state.savedRoulettes.find((item) => item.id === id);
  if (!snapshot) {
    return;
  }

  state.activeSavedRouletteId = id;
  if (elements.saveNameInput) {
    elements.saveNameInput.value = snapshot.name;
  }
  if (elements.saveNameInputMain) {
    elements.saveNameInputMain.value = snapshot.name;
  }
  applySnapshot(snapshot);
  renderAll();
  elements.winnerText.textContent = `"${snapshot.name}" 불러오기 완료`;
}

function deleteSavedRoulette(id) {
  const snapshot = state.savedRoulettes.find((item) => item.id === id);
  state.savedRoulettes = state.savedRoulettes.filter((item) => item.id !== id);
  if (state.activeSavedRouletteId === id) {
    state.activeSavedRouletteId = null;
    if (elements.saveNameInput) {
      elements.saveNameInput.value = "";
    }
    if (elements.saveNameInputMain) {
      elements.saveNameInputMain.value = "";
    }
  }
  writeSavedRoulettes();
  renderAll();
  if (snapshot) {
    elements.winnerText.textContent = `"${snapshot.name}" 삭제 완료`;
  }
}

function clearActiveSavedRoulette() {
  state.activeSavedRouletteId = null;
  if (elements.saveNameInput) {
    elements.saveNameInput.value = "";
  }
  if (elements.saveNameInputMain) {
    elements.saveNameInputMain.value = "";
  }
  renderAll();
}

function recordWinner(label, sequence = null) {
  const active = state.savedRoulettes.find((item) => item.id === state.activeSavedRouletteId) || null;
  state.winnerHistory.unshift({
    id: crypto.randomUUID(),
    label,
    sequence,
    wonAt: Date.now(),
    savedRouletteId: active?.id || null,
    savedRouletteName: active?.name || null,
  });
  state.winnerHistory = state.winnerHistory.slice(0, 100);
  writeWinnerHistory();
  renderWinnerHistoryPanel();
}

function deleteWinnerHistoryEntry(id) {
  state.winnerHistory = state.winnerHistory.filter((entry) => entry.id !== id);
  writeWinnerHistory();
  renderWinnerHistoryPanel();
}

function clearWinnerHistory() {
  state.winnerHistory = [];
  writeWinnerHistory();
  renderWinnerHistoryPanel();
  elements.winnerText.textContent = "당첨 내역을 모두 비웠습니다.";
}

function syncAutoRerollDependencies() {
  if (elements.autoRerollAfterRemoveInput?.checked && elements.autoRemoveWinnerInput && !elements.autoRemoveWinnerInput.checked) {
    elements.autoRemoveWinnerInput.checked = true;
  }
}

function resetSpinSequence() {
  state.spinSequenceRemaining = 0;
  state.spinSequenceTotal = 0;
  state.spinSequenceCompleted = 0;
  state.pendingSpinWinner = null;
  if (state.spinFallbackTimeoutId) {
    window.clearTimeout(state.spinFallbackTimeoutId);
    state.spinFallbackTimeoutId = null;
  }
}

function finalizeSpinResult() {
  const winner = state.pendingSpinWinner;
  state.pendingSpinWinner = null;
  state.spinning = false;
  if (state.spinFallbackTimeoutId) {
    window.clearTimeout(state.spinFallbackTimeoutId);
    state.spinFallbackTimeoutId = null;
  }

  if (!winner) {
    elements.spinButton.disabled = state.roster.length === 0 || !state.wheelReady;
    return;
  }

  state.spinSequenceCompleted += 1;
  state.spinSequenceRemaining = Math.max(0, state.spinSequenceRemaining - 1);
  const sequenceLabel = state.spinSequenceTotal > 1 ? `${state.spinSequenceCompleted}/${state.spinSequenceTotal}` : null;

  recordWinner(winner.label, sequenceLabel);
  elements.winnerText.textContent = sequenceLabel
    ? `당첨 (${sequenceLabel}): ${winner.label}`
    : `당첨: ${winner.label}`;

  if (state.spinSequenceRemaining > 0 && state.roster.length > 0) {
    window.setTimeout(() => {
      spinRoulette();
    }, 450);
    return;
  }

  resetSpinSequence();
  renderAll();
  elements.spinButton.disabled = state.roster.length === 0 || !state.wheelReady;
}

function skipSpinSequence() {
  if (!state.spinning || state.spinSequenceTotal <= 1) {
    elements.winnerText.textContent = "연속 회전 중일 때만 스킵할 수 있습니다.";
    return;
  }

  if (state.wheel && typeof state.wheel.stop === "function") {
    try {
      state.ignoredWheelRestCount += 1;
      state.wheel.stop();
    } catch {}
  }
  if (state.spinFallbackTimeoutId) {
    window.clearTimeout(state.spinFallbackTimeoutId);
    state.spinFallbackTimeoutId = null;
  }

  const completedLabels = [];
  const commitWinner = (winner) => {
    state.lastWinnerLabel = winner.label;
    state.lastWinnerSourceKey = winner.sourceKey;
    state.spinSequenceCompleted += 1;
    state.spinSequenceRemaining = Math.max(0, state.spinSequenceRemaining - 1);
    const sequenceLabel = state.spinSequenceTotal > 1 ? `${state.spinSequenceCompleted}/${state.spinSequenceTotal}` : null;
    recordWinner(winner.label, sequenceLabel);
    completedLabels.push(sequenceLabel ? `${sequenceLabel} ${winner.label}` : winner.label);
  };

  if (state.pendingSpinWinner) {
    commitWinner(state.pendingSpinWinner);
    state.pendingSpinWinner = null;
  }

  while (state.spinSequenceRemaining > 0 && state.roster.length > 0) {
    const winnerLabel = state.roster[Math.floor(Math.random() * state.roster.length)];
    const winner =
      (state.wheelSummary.length ? state.wheelSummary : state.summary).find((item) => item.label === winnerLabel) ||
      state.summary.find((item) => item.label === winnerLabel);
    if (!winner) {
      break;
    }
    commitWinner(winner);
  }

  state.spinning = false;
  resetSpinSequence();
  renderAll();
  elements.winnerText.textContent = completedLabels.length
    ? `스킵 완료: ${completedLabels.join(" · ")}`
    : "스킵할 연속 결과가 없습니다.";
}

function stopScheduledAutoReroll(showMessage = true) {
  if (state.autoRerollTimeoutId) {
    window.clearTimeout(state.autoRerollTimeoutId);
    state.autoRerollTimeoutId = null;
    resetSpinSequence();
    renderAll();
    if (showMessage) {
      elements.winnerText.textContent = "다음 자동 재추첨을 취소했습니다.";
    }
  }
}

function removeEntriesByLabel(label) {
  if (!label) {
    return 0;
  }

  const beforeManual = state.manualEntries.length;
  const beforeLive = state.liveEntries.length;
  const matchedItem = state.summary.find((item) => item.label === label);
  if (matchedItem?.sourceKey) {
    return removeEntriesBySourceKey(matchedItem.sourceKey);
  }

  state.manualEntries = state.manualEntries.filter((entry) => buildGroupingLabel(entry) !== label);
  state.liveEntries = state.liveEntries.filter((entry) => buildGroupingLabel(entry) !== label);

  return (beforeManual - state.manualEntries.length) + (beforeLive - state.liveEntries.length);
}

function removeLastWinner() {
  if (!state.lastWinnerLabel) {
    elements.winnerText.textContent = "먼저 룰렛을 돌려 당첨 항목을 만든 뒤 제외해 주세요.";
    return;
  }

  const removedCount = state.lastWinnerSourceKey
    ? removeEntriesBySourceKey(state.lastWinnerSourceKey)
    : removeEntriesByLabel(state.lastWinnerLabel);
  if (!removedCount) {
    elements.winnerText.textContent = `"${state.lastWinnerLabel}" 항목은 이미 제외되어 있습니다.`;
    state.lastWinnerLabel = null;
    state.lastWinnerSourceKey = null;
    renderAll();
    return;
  }

  const removedLabel = state.lastWinnerLabel;
  state.lastWinnerLabel = null;
  state.lastWinnerSourceKey = null;
  renderAll();
  elements.winnerText.textContent = `"${removedLabel}" 항목을 제외했습니다.`;
}

function bindPresetButtons(container, attributeName, handler) {
  if (!container) {
    return;
  }

  container.querySelectorAll(`[${attributeName}]`).forEach((button) => {
    button.addEventListener("click", () => {
      const value = button.getAttribute(attributeName);
      if (!value) {
        return;
      }
      handler(value);
    });
  });
}

function renderSavedRoulettePanel() {
  const active = state.savedRoulettes.find((item) => item.id === state.activeSavedRouletteId) || null;

  if (elements.activeSaveLabel) {
    elements.activeSaveLabel.textContent = `현재 선택: ${active ? active.name : "없음"}`;
  }
  if (elements.activeSaveLabelMain) {
    elements.activeSaveLabelMain.textContent = `현재 선택: ${active ? active.name : "없음"}`;
  }

  if (elements.overwriteSaveButton) {
    elements.overwriteSaveButton.disabled = !active;
  }
  if (elements.overwriteSaveButtonMain) {
    elements.overwriteSaveButtonMain.disabled = !active;
  }

  const saveLists = [elements.savedRouletteList, elements.savedRouletteListMain].filter(Boolean);
  if (!saveLists.length) {
    return;
  }

  if (!state.savedRoulettes.length) {
    saveLists.forEach((container) => {
      container.className = "table-body empty-state";
      container.textContent = "저장된 룰렛이 아직 없습니다.";
    });
    return;
  }

  const markup = state.savedRoulettes.map((item) => `
    <article class="table-row saved-roulette-item ${item.id === state.activeSavedRouletteId ? "is-active" : ""}">
      <div>
        <strong>${escapeHtml(item.name)}</strong>
        <small>${new Date(item.updatedAt || item.savedAt).toLocaleString("ko-KR")} · 수동 ${formatNumber(item.manualEntries?.length || 0)}개 · 실시간 ${formatNumber(item.liveEntries?.length || 0)}개</small>
      </div>
      <div class="action-row tight-row">
        <button type="button" class="ghost-button load-save-button" data-save-id="${escapeHtml(item.id)}">불러오기</button>
        <button type="button" class="ghost-button delete-save-button" data-save-id="${escapeHtml(item.id)}">삭제</button>
      </div>
    </article>
  `).join("");

  saveLists.forEach((container) => {
    container.className = "table-body";
    container.innerHTML = markup;

    container.querySelectorAll(".load-save-button").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-save-id");
        if (id) {
          loadSavedRoulette(id);
        }
      });
    });

    container.querySelectorAll(".delete-save-button").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-save-id");
        if (id) {
          deleteSavedRoulette(id);
        }
      });
    });
  });
}

function renderWinnerHistoryPanel() {
  if (!elements.winnerHistoryList && !elements.winnerHistoryPreview) {
    return;
  }

  if (!state.winnerHistory.length) {
    if (elements.winnerHistoryList) {
      elements.winnerHistoryList.className = "table-body empty-state";
      elements.winnerHistoryList.textContent = "아직 당첨 내역이 없습니다.";
    }
    if (elements.winnerHistoryPreview) {
      elements.winnerHistoryPreview.className = "table-body empty-state";
      elements.winnerHistoryPreview.textContent = "아직 당첨 내역이 없습니다.";
    }
    return;
  }

  const historyMarkup = state.winnerHistory.map((entry) => `
    <article class="table-row winner-history-item">
      <div>
        <strong>${escapeHtml(entry.label)}</strong>
        <small>${entry.sequence ? `${escapeHtml(entry.sequence)} · ` : ""}${new Date(entry.wonAt).toLocaleString("ko-KR")}${entry.savedRouletteName ? ` · ${escapeHtml(entry.savedRouletteName)}` : ""}</small>
      </div>
      <div class="action-row tight-row">
        <button type="button" class="ghost-button delete-winner-history-button" data-history-id="${escapeHtml(entry.id)}">삭제</button>
      </div>
    </article>
  `).join("");

  if (elements.winnerHistoryList) {
    elements.winnerHistoryList.className = "table-body";
    elements.winnerHistoryList.innerHTML = historyMarkup;
    elements.winnerHistoryList.querySelectorAll(".delete-winner-history-button").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.getAttribute("data-history-id");
        if (id) {
          deleteWinnerHistoryEntry(id);
        }
      });
    });
  }

  if (elements.winnerHistoryPreview) {
    const previewItems = state.winnerHistory.map((entry) => `
        <article class="table-row winner-history-preview-item">
          <div>
            <strong>${escapeHtml(entry.label)}</strong>
            <small>${entry.sequence ? `${escapeHtml(entry.sequence)} · ` : ""}${new Date(entry.wonAt).toLocaleString("ko-KR")}</small>
        </div>
      </article>
    `).join("");
    elements.winnerHistoryPreview.className = "table-body compact-table-body";
    elements.winnerHistoryPreview.innerHTML = previewItems;
  }
}

function isTauriRuntime() {
  return Boolean(window.__TAURI__?.core?.invoke);
}

async function tauriInvoke(command, payload = {}) {
  try {
    return await window.__TAURI__.core.invoke(command, payload);
  } catch (error) {
    throw new Error(normalizeErrorMessage(error, `Tauri 명령 실행에 실패했습니다: ${command}`));
  }
}

function normalizeErrorMessage(error, fallback = "알 수 없는 오류") {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === "string") {
    return error || fallback;
  }
  if (error && typeof error === "object") {
    if (typeof error.message === "string" && error.message) {
      return error.message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
  return String(error || fallback);
}

async function tauriListen(eventName, handler) {
  const globalTauri = window.__TAURI__ || {};
  const listen =
    globalTauri?.event?.listen ||
    globalTauri?.core?.listen ||
    null;

  if (typeof listen !== "function") {
    throw new Error("Tauri 이벤트 리스너 API를 찾지 못했습니다.");
  }

  try {
    return await listen(eventName, handler);
  } catch (error) {
    throw new Error(normalizeErrorMessage(error, `이벤트 리스너 연결에 실패했습니다: ${eventName}`));
  }
}

function getPrefixListContainer(kind) {
  return kind === "donation" ? elements.liveDonationPrefixList : elements.liveChatPrefixList;
}

function getBasePrefixInput(kind) {
  return kind === "donation" ? elements.liveDonationPrefixInput : elements.liveChatPrefixInput;
}

function getPrefixAddButton(kind) {
  return kind === "donation" ? elements.addLiveDonationPrefixButton : elements.addLiveChatPrefixButton;
}

function getPrefixInputs(kind) {
  const list = getPrefixListContainer(kind);
  if (!list) {
    const fallback = getBasePrefixInput(kind);
    return fallback ? [fallback] : [];
  }
  return [...list.querySelectorAll(`input[data-prefix-kind="${kind}"]`)];
}

function getPrefixValues(kind) {
  return getPrefixInputs(kind)
    .map((input) => (input.value || "").trim())
    .filter(Boolean);
}

function createPrefixRow(kind, value = "", removable = true) {
  const row = document.createElement("div");
  row.className = "prefix-input-row";

  const input = document.createElement("input");
  input.type = "text";
  input.value = value;
  input.dataset.prefixKind = kind;
  input.placeholder = kind === "donation" ? "예: !도네 또는 룰렛" : "예: ! 또는 바하";
  input.addEventListener("input", () => {
    saveSettings();
    renderStatuses();
  });
  row.append(input);

  if (removable) {
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.className = "ghost-button prefix-remove-button";
    removeButton.textContent = "-";
    removeButton.title = "이 접두어를 제거합니다.";
    removeButton.addEventListener("click", () => {
      row.remove();
      saveSettings();
      renderStatuses();
    });
    row.append(removeButton);
  } else {
    const addButton = getPrefixAddButton(kind);
    if (addButton && addButton.parentElement !== row) {
      row.append(addButton);
    }
  }

  return row;
}

function setPrefixRows(kind, values = []) {
  const list = getPrefixListContainer(kind);
  if (!list) {
    return;
  }

  const nextValues = values.length ? values : [""];
  list.innerHTML = "";
  nextValues.forEach((value, index) => {
    list.append(createPrefixRow(kind, value, index > 0));
  });
}

function addPrefixRow(kind, value = "") {
  const list = getPrefixListContainer(kind);
  if (!list) {
    return;
  }
  list.append(createPrefixRow(kind, value, true));
  const inputs = getPrefixInputs(kind);
  inputs[inputs.length - 1]?.focus();
  saveSettings();
  renderStatuses();
}

async function api(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();
  const body = typeof options.body === "string" && options.body
    ? JSON.parse(options.body)
    : (options.body || {});

  if (isTauriRuntime()) {
    if (method === "POST" && path === "/api/unofficial-live/verify") {
      return tauriInvoke("verify_unofficial_live", {
        payload: { channelId: body.channelId || body.channel_id || "" },
      });
    }
    if (method === "POST" && path === "/api/unofficial-live/start") {
      await tauriInvoke("start_unofficial_live_collector", {
        payload: {
          channelId: body.channelId || body.channel_id || "",
          mode: body.mode || "donation",
        },
      });
      return { ok: true };
    }
    if (method === "POST" && path === "/api/unofficial-live/stop") {
      await tauriInvoke("stop_unofficial_live_collector");
      return { ok: true };
    }
  }

  const response = await fetch(path, {
    ...options,
    method,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new Error(data.error || data.message || `Request failed: ${response.status}`);
  }
  return data;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function sanitizeExternalText(value) {
  return String(value ?? "")
    .replaceAll("\r", " ")
    .replaceAll("\n", " ")
    .replaceAll("\t", " ")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replaceAll("&", "＆")
    .replaceAll("<", "＜")
    .replaceAll(">", "＞")
    .replaceAll('"', "＂")
    .replaceAll("'", "＇")
    .replaceAll("`", "｀")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sanitizeIncomingPayload(value, depth = 0) {
  if (depth > 4) {
    return "[depth-limit]";
  }

  if (typeof value === "string") {
    return sanitizeExternalText(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeIncomingPayload(item, depth + 1));
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, sanitizeIncomingPayload(item, depth + 1)]),
    );
  }

  return value;
}

function timeNow() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

function formatClockDuration(ms = 0) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}분 ${String(seconds).padStart(2, "0")}초`;
}

function getCollectionLimitMs() {
  if (!getUseCollectionDurationInput()?.checked) {
    return 0;
  }
  const minutes = Number(elements.collectionLimitMinutesInput?.value || 0);
  const seconds = Number(elements.collectionLimitSecondsInput?.value || 0);
  const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? Math.floor(minutes) : 0;
  const safeSeconds = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return (safeMinutes * 60 + safeSeconds) * 1000;
}

function getCollectionUntilDeadlineMs() {
  if (!getUseCollectionUntilInput()?.checked) {
    return null;
  }
  const timeText = getCollectionUntilTimeInput()?.value || "";
  if (!timeText || !state.liveCollectionStartedAtMs) {
    return null;
  }

  const [hourText, minuteText] = timeText.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return null;
  }

  const base = new Date(state.liveCollectionStartedAtMs);
  const deadline = new Date(base);
  deadline.setHours(hour, minute, 0, 0);
  if (deadline.getTime() < state.liveCollectionStartedAtMs) {
    deadline.setDate(deadline.getDate() + 1);
  }
  return deadline.getTime();
}

function validateCollectionUntilTime(referenceMs = Date.now()) {
  if (!getUseCollectionUntilInput()?.checked) {
    return { ok: true, deadlineMs: null };
  }

  const timeText = getCollectionUntilTimeInput()?.value || "";
  if (!timeText) {
    return {
      ok: false,
      reason: "`몇 시까지`를 켰다면 종료 시각도 같이 입력해 주세요.",
      deadlineMs: null,
    };
  }

  const [hourText, minuteText] = timeText.split(":");
  const hour = Number(hourText);
  const minute = Number(minuteText);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
    return {
      ok: false,
      reason: "`몇 시까지` 시간 형식을 다시 확인해 주세요.",
      deadlineMs: null,
    };
  }

  const deadline = new Date(referenceMs);
  deadline.setHours(hour, minute, 0, 0);

  if (deadline.getHours() === new Date(referenceMs).getHours()
    && deadline.getMinutes() === new Date(referenceMs).getMinutes()) {
    return {
      ok: false,
      reason: "`몇 시까지`는 현재와 같은 시각은 선택할 수 없습니다.",
      deadlineMs: null,
    };
  }

  return { ok: true, deadlineMs: deadline.getTime() };
}

function getCollectionAutoStopPlan() {
  const startedAt = state.liveCollectionStartedAtMs;
  if (!startedAt) {
    return null;
  }

  const candidates = [];
  const limitMs = getCollectionLimitMs();
  if (limitMs > 0) {
    candidates.push({
      deadlineMs: startedAt + limitMs,
      reason: "설정한 카운팅 시간이 지나 실시간 집계를 자동으로 종료했습니다.",
      mode: "duration",
    });
  }

  const untilDeadlineMs = getCollectionUntilDeadlineMs();
  if (untilDeadlineMs) {
    const timeText = getCollectionUntilTimeInput()?.value || "";
    candidates.push({
      deadlineMs: untilDeadlineMs,
      reason: `${timeText}까지로 설정한 시간이 되어 실시간 집계를 자동으로 종료했습니다.`,
      mode: "until",
    });
  }

  if (!candidates.length) {
    return null;
  }

  candidates.sort((a, b) => a.deadlineMs - b.deadlineMs);
  return candidates[0];
}

function describeCollectionAutoStopPlan(plan = getCollectionAutoStopPlan()) {
  if (!plan) {
    return "";
  }

  if (plan.mode === "until") {
    return `${getCollectionUntilTimeInput()?.value || "--:--"}까지`;
  }

  const minutes = Number(elements.collectionLimitMinutesInput?.value || 0);
  const seconds = Number(elements.collectionLimitSecondsInput?.value || 0);
  return `${minutes}분 ${seconds}초`;
}

function ensureSummaryTimerStatus() {
  const panel = elements.validCount?.closest(".panel");
  const heading = panel?.querySelector("h2");
  if (!panel || !heading) {
    return null;
  }

  let titleRow = panel.querySelector(".summary-header-row");
  if (!titleRow) {
    titleRow = document.createElement("div");
    titleRow.className = "panel-title-row summary-header-row";
    heading.insertAdjacentElement("beforebegin", titleRow);
    titleRow.append(heading);
  }

  let status = document.getElementById("summary-timer-status");
  if (!status) {
    status = document.createElement("span");
    status.id = "summary-timer-status";
    status.className = "hint field-hint-strong summary-timer-status";
    titleRow.append(status);
  }

  if (!elements.clearCurrentSummaryButton) {
    const clearButton = document.createElement("button");
    clearButton.id = "clear-current-summary-button";
    clearButton.type = "button";
    clearButton.className = "ghost-button summary-clear-button";
    clearButton.textContent = "전체 삭제";
    clearButton.title = "현재 집계, 최근 후원, raw 로그를 함께 비웁니다. 당첨 내역은 유지됩니다.";
    clearButton.addEventListener("click", clearCurrentSummary);
    titleRow.insertBefore(clearButton, status);
    elements.clearCurrentSummaryButton = clearButton;
  }

  return status;
}

function clearCurrentSummary() {
  if (state.spinning) {
    elements.winnerText.textContent = "룰렛이 돌아가는 중에는 전체 삭제를 할 수 없습니다.";
    return;
  }

  const hasAnything = Boolean(
    state.manualEntries.length ||
    state.liveEntries.length ||
    state.liveDebugEvents.length ||
    state.excludedLabels.length ||
    Object.keys(state.summaryEdits || {}).length,
  );

  if (!hasAnything) {
    elements.winnerText.textContent = "비울 집계 데이터가 없습니다.";
    return;
  }

  state.manualEntries = [];
  state.liveEntries = [];
  state.liveDebugEvents = [];
  state.manualMerges = {};
  state.summaryEdits = {};
  state.excludedLabels = [];
  state.mergeSelection.clear();
  state.wheelOrder = [];
  state.lastResult = null;

  if (state.liveCollectionActive) {
    state.lastCollectionStopLabel = "";
    state.liveCollectionStartedAtMs = Date.now();
    if (elements.startTimeInput) {
      elements.startTimeInput.value = timeNow();
    }
    scheduleLiveCollectionTimers();
    renderAll();
    elements.winnerText.textContent = "현재 집계를 모두 비우고 지금부터 다시 수집합니다.";
    return;
  }

  if (elements.startTimeInput) {
    elements.startTimeInput.value = "";
  }
  clearLiveCollectionTimers();
  state.liveCollectionStartedAtMs = null;
  state.lastCollectionStopLabel = "";
  renderAll();
  elements.winnerText.textContent = "현재 집계를 모두 비웠습니다.";
}

function clearLiveCollectionTimers() {
  if (state.liveCollectionTickId) {
    window.clearInterval(state.liveCollectionTickId);
    state.liveCollectionTickId = null;
  }
  if (state.liveCollectionTimeoutId) {
    window.clearTimeout(state.liveCollectionTimeoutId);
    state.liveCollectionTimeoutId = null;
  }
}

function syncCollectionTimingUi() {
  if (!elements.startTimeDisplay || !elements.collectionElapsedDisplay) {
    return;
  }

  const summaryTimerStatus = ensureSummaryTimerStatus();

  const startText = elements.startTimeInput?.value || "";
  const isStarted = Boolean(startText);
  elements.startTimeDisplay.textContent = isStarted ? startText : "집계 전";
  elements.startTimeDisplay.classList.toggle("is-idle", !isStarted);

  if (!state.liveCollectionActive || !state.liveCollectionStartedAtMs) {
    elements.collectionElapsedDisplay.textContent = isStarted ? "집계 준비됨" : "연결 후 집계 대기 중";
    if (summaryTimerStatus) {
      if (state.lastCollectionStopLabel) {
        summaryTimerStatus.textContent = `${state.lastCollectionStopLabel} 종료됨`;
      } else {
        const planLabel = describeCollectionAutoStopPlan();
        summaryTimerStatus.textContent = planLabel
          ? `자동 종료 설정 (${planLabel})`
          : "자동 종료 없음";
      }
    }
    return;
  }

  const elapsed = Date.now() - state.liveCollectionStartedAtMs;
  const autoStopPlan = getCollectionAutoStopPlan();
  if (autoStopPlan) {
    const remaining = Math.max(0, autoStopPlan.deadlineMs - Date.now());
    const suffix = autoStopPlan.mode === "until"
      ? `· ${getCollectionUntilTimeInput()?.value || "--:--"}까지`
      : "";
    elements.collectionElapsedDisplay.textContent = `수집 중 · ${formatClockDuration(elapsed)} 경과 · ${formatClockDuration(remaining)} 남음 ${suffix}`.trim();
    if (summaryTimerStatus) {
      summaryTimerStatus.textContent = `남은 시간 ${formatClockDuration(remaining)} (${describeCollectionAutoStopPlan(autoStopPlan)})`;
    }
    return;
  }

  elements.collectionElapsedDisplay.textContent = `수집 중 · ${formatClockDuration(elapsed)} 경과`;
  if (summaryTimerStatus) {
    summaryTimerStatus.textContent = `수집 중 · ${formatClockDuration(elapsed)} 경과`;
  }
}

function scheduleLiveCollectionTimers() {
  clearLiveCollectionTimers();
  syncCollectionTimingUi();

  if (!state.liveCollectionActive || !state.liveCollectionStartedAtMs) {
    return;
  }

  state.liveCollectionTickId = window.setInterval(() => {
    const activePlan = getCollectionAutoStopPlan();
    if (activePlan && Date.now() >= activePlan.deadlineMs) {
      stopLiveCollection(activePlan.reason, describeCollectionAutoStopPlan(activePlan));
      return;
    }
    syncCollectionTimingUi();
  }, 1000);

  const autoStopPlan = getCollectionAutoStopPlan();
  if (autoStopPlan) {
    const delay = Math.max(0, autoStopPlan.deadlineMs - Date.now());
    state.liveCollectionTimeoutId = window.setTimeout(() => {
      stopLiveCollection(autoStopPlan.reason, describeCollectionAutoStopPlan(autoStopPlan));
    }, delay);
  }
}

function handleCollectionLimitToggleChange(kind) {
  const useDurationInput = getUseCollectionDurationInput();
  const useUntilInput = getUseCollectionUntilInput();
  if (!useDurationInput || !useUntilInput) {
    return;
  }

  enforceExclusiveCollectionLimitSelection(kind, true);

  saveSettings();
  syncCollectionLimitUi();
  if (state.liveCollectionActive) {
    scheduleLiveCollectionTimers();
  }
  renderAll();
}

function enforceExclusiveCollectionLimitSelection(preferred = "duration", showMessage = false) {
  const useDurationInput = getUseCollectionDurationInput();
  const useUntilInput = getUseCollectionUntilInput();
  if (!useDurationInput || !useUntilInput) {
    return;
  }
  if (!(useDurationInput.checked && useUntilInput.checked)) {
    return;
  }

  if (preferred === "until") {
    useDurationInput.checked = false;
  } else {
    useUntilInput.checked = false;
  }

  if (showMessage) {
    window.alert("시간 제한은 `카운팅 시간` 또는 `몇 시까지` 중 하나만 선택할 수 있습니다.");
  }
}

function syncCollectionLimitUi() {
  enforceExclusiveCollectionLimitSelection("duration", false);
  const useDuration = Boolean(getUseCollectionDurationInput()?.checked);
  const useUntil = Boolean(getUseCollectionUntilInput()?.checked);

  if (elements.collectionLimitMinutesInput) {
    elements.collectionLimitMinutesInput.disabled = !useDuration;
  }
  if (elements.collectionLimitSecondsInput) {
    elements.collectionLimitSecondsInput.disabled = !useDuration;
  }
  const untilInput = getCollectionUntilTimeInput();
  if (untilInput) {
    untilInput.disabled = !useUntil;
  }
}

function ensureCollectionUntilField() {
  const actionRow = elements.collectionLimitMinutesInput?.closest(".action-row");
  if (!actionRow) {
    return;
  }

  const durationField = elements.collectionLimitMinutesInput?.closest(".collection-limit-field");
  if (durationField && !getUseCollectionDurationInput()) {
    const toggleLabel = document.createElement("label");
    toggleLabel.className = "toggle-option collection-limit-toggle";
    toggleLabel.innerHTML = `
      <input id="use-collection-duration-input" type="checkbox" />
      <span>카운팅 시간 사용</span>
    `;
    durationField.prepend(toggleLabel);
  }

  if (getCollectionUntilTimeInput()) {
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "collection-limit-field collection-until-field";
  wrapper.innerHTML = `
    <label class="toggle-option collection-limit-toggle">
      <input id="use-collection-until-input" type="checkbox" />
      <span>몇 시까지 사용</span>
    </label>
    <span>몇 시까지</span>
    <div class="collection-limit-inputs">
      <input id="collection-until-time-input" type="time" value="" />
    </div>
    <small class="field-hint">비워두면 시각 종료 없이 수집합니다. 같은 시각은 선택할 수 없고, 더 이른 시각은 다음 날로 계산합니다.</small>
  `;

  actionRow.append(wrapper);
  syncCollectionLimitUi();
}

function toMinutes(timeText) {
  const [hour, minute] = timeText.split(":").map(Number);
  return hour * 60 + minute;
}

function parseBulkLine(line, index) {
  const trimmed = line.trim();
  if (!trimmed) {
    return null;
  }

  const fullMatch = trimmed.match(/^(\d{2}:\d{2})\s+(\S+)\s+(\d+)(?:\s+(.+))?$/);
  if (fullMatch) {
    const [, time, name, amountText, message = ""] = fullMatch;
    return {
      raw: trimmed,
      valid: true,
      source: "manual",
      time,
      name,
      amount: Number(amountText),
      message: message.trim(),
      receivedAt: Date.now() + index,
    };
  }

  const messageOnlyMatch = trimmed.match(/^(\d{2}:\d{2})\s+(\d+)(?:\s+(.+))?$/);
  if (messageOnlyMatch) {
    const [, time, amountText, message = ""] = messageOnlyMatch;
    return {
      raw: trimmed,
      valid: true,
      source: "manual",
      time,
      name: "",
      amount: Number(amountText),
      message: message.trim(),
      receivedAt: Date.now() + index,
    };
  }

  if (false) {
    const nameOnlyMatch = trimmed.match(/^(\d{2}:\d{2})\s+(\S+)\s+(\d+)$/);
    if (!nameOnlyMatch) {
      return { raw: trimmed, valid: false, reason: "입력 형식 오류" };
    }

    const [, time, name, amountText] = nameOnlyMatch;
    return {
      raw: trimmed,
      valid: true,
      source: "manual",
      time,
      name,
      amount: Number(amountText),
      message: "",
      receivedAt: Date.now() + index,
    };
  }

  if (false) {
    const noNameMatch = trimmed.match(/^(\d{2}:\d{2})\s+(\d+)(?:\s+(.+))?$/);
    if (!noNameMatch) {
      return { raw: trimmed, valid: false, reason: "입력 형식 오류" };
    }

    const [, time, amountText, message = ""] = noNameMatch;
    return {
      raw: trimmed,
      valid: true,
      source: "manual",
      time,
      name: "",
      amount: Number(amountText),
      message: message.trim(),
      receivedAt: Date.now() + index,
    };
  }

  const match = trimmed.match(/^(\d{2}:\d{2})\s+(\S+)\s+(\d+)(?:\s+(.+))?$/);
  if (!match) {
    return { raw: trimmed, valid: false, reason: "입력 형식 오류" };
  }

  const [, time, name, amountText, message = ""] = match;
  return {
    raw: trimmed,
    valid: true,
    source: "manual",
    time,
    name,
    amount: Number(amountText),
    message: message.trim(),
    receivedAt: Date.now() + index,
  };
}

function normalizeMessageKey(message) {
  return message
    .toLowerCase()
    .normalize("NFKC")
    .replace(/\s+/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function buildGroupingLabel(entry) {
  return buildGroupingIdentity(entry).label;
}

function allEntries() {
  return [...state.manualEntries, ...state.liveEntries];
}

function collectMergeableMessages(validEntries) {
  if (!isMessageEnabled()) {
    return [];
  }

  const counts = new Map();

  for (const entry of validEntries) {
    const raw = (entry.message || "").trim();
    if (!raw || state.manualMerges[raw]) {
      continue;
    }
    counts.set(raw, (counts.get(raw) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count, key: normalizeMessageKey(label) }))
    .sort((a, b) => a.key.localeCompare(b.key, "ko") || b.count - a.count || a.label.localeCompare(b.label, "ko"));
}

function buildMergeSuggestions(validEntries) {
  if (!isMessageEnabled()) {
    return [];
  }

  const groups = new Map();

  for (const entry of validEntries) {
    const raw = (entry.message || "").trim();
    if (!raw || state.manualMerges[raw]) {
      continue;
    }

    const normalized = normalizeMessageKey(raw);
    if (!normalized) {
      continue;
    }

    const bucket = groups.get(normalized) || new Map();
    bucket.set(raw, (bucket.get(raw) || 0) + 1);
    groups.set(normalized, bucket);
  }

  return [...groups.values()]
    .map((bucket) => {
      const variants = [...bucket.entries()]
        .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
        .map(([label, count]) => ({ label, count }));
      return { canonical: variants[0]?.label || "", variants };
    })
    .filter((group) => group.variants.length > 1);
}

function buildComputedState() {
  const startTime = elements.startTimeInput.value || "";
  const unitAmount = Number(elements.unitAmountInput.value || 0);
  const invalidEntries = [];
  const validEntries = [];

  for (const entry of allEntries()) {
    if (!entry.valid) {
      invalidEntries.push(entry);
      continue;
    }

    if (startTime && toMinutes(entry.time) < toMinutes(startTime)) {
      invalidEntries.push({ ...entry, reason: "집계 시작 전" });
      continue;
    }

    const tickets = entry.liveKind === "chat" ? 1 : Math.floor(entry.amount / unitAmount);
    if (!Number.isFinite(tickets) || tickets <= 0) {
      invalidEntries.push({ ...entry, reason: "기준 금액 미만" });
      continue;
    }

    validEntries.push({ ...entry, tickets, ...buildGroupingIdentity(entry) });
  }

  const grouped = new Map();
  for (const entry of validEntries) {
    const current = grouped.get(entry.sourceKey) || {
      sourceKey: entry.sourceKey,
      label: entry.label,
      namePart: entry.namePart,
      messagePart: entry.messagePart,
      totalAmount: 0,
      totalTickets: 0,
      count: 0,
      manualCount: 0,
      liveCount: 0,
      chatCount: 0,
      donationCount: 0,
      videoDonationCount: 0,
      missionDonationCount: 0,
      generalDonationCount: 0,
      senders: new Set(),
    };
    current.totalAmount += entry.amount;
    current.totalTickets += entry.tickets;
    current.count += 1;
    if (entry.source === "live") {
      current.liveCount += 1;
      if (entry.liveKind === "chat") {
        current.chatCount += 1;
      } else {
        current.donationCount += 1;
        if (entry.donationType === "VIDEO") {
          current.videoDonationCount += 1;
        } else if (entry.donationType === "MISSION") {
          current.missionDonationCount += 1;
        } else {
          current.generalDonationCount += 1;
        }
      }
    } else {
      current.manualCount += 1;
    }
    if (entry.name) {
      current.senders.add(entry.name);
    }
    grouped.set(entry.sourceKey, current);
  }

  const groupedItems = [...grouped.values()].map((item) => {
    const edit = getSummaryEdit(item.sourceKey);
    const totalTickets = sanitizeTicketCount(edit?.ticketOverride, item.totalTickets);
    const namePart = (edit?.nameOverride || "").trim() || item.namePart;
    const messagePart = (edit?.messageOverride || "").trim() || item.messagePart;
    const label = (edit?.labelOverride || "").trim() || composeGroupingLabel(namePart, messagePart);
    const isEdited = Boolean(edit?.nameOverride || edit?.messageOverride || edit?.labelOverride || Number.isFinite(edit?.ticketOverride));
    return {
      ...item,
      namePart,
      messagePart,
      label,
      isEdited,
      totalTickets,
      totalAmount: Number.isFinite(edit?.ticketOverride) ? totalTickets * unitAmount : item.totalAmount,
      senders: [...item.senders],
    };
  });

  const excludedSummary = groupedItems
    .filter((item) => isExcludedLabel(item.sourceKey))
    .sort((a, b) => a.label.localeCompare(b.label, "ko"));

  const activeSummary = groupedItems.filter((item) => !isExcludedLabel(item.sourceKey));
  const totalTickets = activeSummary.reduce((sum, item) => sum + item.totalTickets, 0);
  const summary = activeSummary
    .map((item) => ({
      ...item,
      winPercent: totalTickets > 0 ? (item.totalTickets / totalTickets) * 100 : 0,
    }))
    .sort((a, b) => b.totalTickets - a.totalTickets || a.label.localeCompare(b.label, "ko"));

  return {
    validEntries,
    invalidEntries,
    summary,
    excludedSummary,
    roster: summary.flatMap((item) => Array.from({ length: item.totalTickets }, () => item.label)),
    mergeSuggestions: buildMergeSuggestions(validEntries),
    mergeableMessages: collectMergeableMessages(validEntries),
  };
}

function renderStatuses() {
  elements.authStatus.textContent = evaluateLiveTarget().ok ? "주소 확인됨" : "주소 필요";
  elements.sessionStatus.textContent =
    {
      idle: "연결 전",
      connecting: "연결 준비 중",
      connected: "연결됨",
      subscribed: "실시간 수신 중",
      error: "연결 오류",
    }[state.liveConnection.connectState] || "연결 전";
  if (elements.collectionStatus) {
    elements.collectionStatus.textContent = state.liveCollectionActive ? "수집 중" : "수집 대기";
  }
  if (elements.collectionModeSummary) {
    elements.collectionModeSummary.textContent = getLiveCollectionSummaryText();
  }
  renderCollectionModePrefixSummary();
  const liveTarget = evaluateLiveTarget();
  if (elements.liveTargetStatus) {
    elements.liveTargetStatus.textContent = liveTarget.label;
    elements.liveTargetStatus.dataset.state = liveTarget.level;
  }
  if (elements.liveTargetSummary) {
    elements.liveTargetSummary.textContent = liveTarget.summary;
  }
  if (elements.authStatus) {
    elements.authStatus.classList.add("is-clickable");
    elements.authStatus.title = "누르면 방송 주소 확인 또는 입력 위치로 이동합니다.";
  }
  if (elements.sessionStatus) {
    elements.sessionStatus.classList.add("is-clickable");
    elements.sessionStatus.title = "누르면 실시간 연결을 시작하거나 현재 상태를 확인합니다.";
  }
  if (elements.collectionStatus) {
    elements.collectionStatus.classList.add("is-clickable");
    elements.collectionStatus.title = "누르면 수집 시작 또는 종료를 실행합니다.";
  }
  elements.connectButton.disabled = !liveTarget.ok;
  elements.disconnectButton.disabled = !state.liveConnection.socket;
  if (elements.startLiveCollectionButton) {
    elements.startLiveCollectionButton.disabled =
      state.liveConnection.connectState !== "subscribed" || state.liveCollectionActive;
  }
  if (elements.stopLiveCollectionButton) {
    elements.stopLiveCollectionButton.disabled = !state.liveCollectionActive;
  }
  [
    [elements.quickManualModeButton, !state.liveCollectionActive, "수동 모드"],
    [elements.quickLiveModeButton, state.liveCollectionActive, "실시간 모드"],
  ].forEach(([button, enabled, label]) => {
    if (!button) {
      return;
    }
    button.classList.toggle("is-active", enabled);
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
    button.textContent = label;
  });
}

function entriesMatch(left, right) {
  return (
    String(left?.source || "") === String(right?.source || "") &&
    String(left?.liveKind || "") === String(right?.liveKind || "") &&
    String(left?.time || "") === String(right?.time || "") &&
    String(left?.name || "") === String(right?.name || "") &&
    String(left?.message || "") === String(right?.message || "") &&
    Number(left?.amount || 0) === Number(right?.amount || 0) &&
    String(left?.raw || "") === String(right?.raw || "") &&
    Number(left?.receivedAt || 0) === Number(right?.receivedAt || 0)
  );
}

function deleteInvalidEntry(entry) {
  if (!entry) {
    return;
  }

  const confirmed = window.confirm(`"${entry.message || entry.name || entry.raw || "항목"}" 제외 항목을 완전히 삭제할까요?\n원본 데이터도 함께 제거됩니다.`);
  if (!confirmed) {
    return;
  }

  const beforeManual = state.manualEntries.length;
  const beforeLive = state.liveEntries.length;

  state.manualEntries = state.manualEntries.filter((item) => !entriesMatch(item, entry));
  state.liveEntries = state.liveEntries.filter((item) => !entriesMatch(item, entry));

  const removedCount = (beforeManual - state.manualEntries.length) + (beforeLive - state.liveEntries.length);
  renderAll();
  elements.winnerText.textContent = removedCount > 0
    ? "기준 제외 항목을 삭제했습니다."
    : "이미 정리된 항목입니다.";
}

function applyStaticUiCopy() {
  document.title = "난바다의 룰렛";
  const eyebrow = document.querySelector(".hero .eyebrow");
  if (eyebrow) {
    eyebrow.textContent = "NANBADA ROULETTE";
  }
  const title = document.querySelector(".hero h1");
  if (title) {
    title.textContent = "난바다의 룰렛";
  }
  const copy = document.querySelector(".hero .hero-copy");
  if (copy) {
    copy.textContent = "후원 원본은 그대로 저장하고, 현재 기준에 따라 집계 결과와 룰렛 항목만 바로 바꿔가며 운영할 수 있습니다.";
  }
  const compactPanel = document.querySelector(".compact-panel");
  const primaryHint = compactPanel?.querySelector(".hint");
  if (compactPanel && primaryHint && !document.getElementById("admin-panel-hint")) {
    const adminHint = document.createElement("p");
    adminHint.id = "admin-panel-hint";
    adminHint.className = "hint field-hint-strong";
    adminHint.textContent = "실시간 필터링, 수집 대상, 시간 제한 같은 자세한 옵션은 오른쪽 위 운영 패널에서 바꿀 수 있습니다.";
    primaryHint.insertAdjacentElement("afterend", adminHint);
  }
  if (elements.setNowButton) {
    elements.setNowButton.remove();
    elements.setNowButton = null;
  }
}

function renderSummary(summary) {
  if (!summary.length) {
    elements.summaryTable.className = "table-body empty-state";
    elements.summaryTable.textContent = "아직 집계된 항목이 없습니다.";
    return;
  }
  elements.summaryTable.className = "table-body";
  elements.summaryTable.innerHTML = summary.map((item) => `
    <article class="table-row">
      <div>
        <strong>${escapeHtml(item.label)}</strong>
        <small>${item.count}건 · ${formatPercent(item.winPercent)}${shouldShowAmounts() ? ` · 총 ${formatNumber(item.totalAmount)}원` : ""}${item.senders.length ? ` · ${escapeHtml(item.senders.join(", "))}` : ""}</small>
      </div>
      <span class="ticket-pill">${formatNumber(item.totalTickets)}칸</span>
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
        <small>${escapeHtml(entry.reason || "제외됨")}</small>
      </div>
    </article>
  `).join("");
}

function renderLiveFeed(entries) {
  if (!entries.length) {
    elements.liveFeed.className = "table-body empty-state";
    elements.liveFeed.textContent = "아직 들어온 후원이 없습니다.";
    return;
  }
  elements.liveFeed.className = "table-body";
  elements.liveFeed.innerHTML = [...entries]
    .sort((a, b) => b.receivedAt - a.receivedAt)
    .slice(0, 12)
    .map((entry) => {
      const detailPrefix = entry.liveKind === "chat" ? "채팅 1회" : `${formatNumber(entry.amount)}원`;
      return `
      <article class="table-row">
        <div>
          <strong>${escapeHtml(entry.name)}</strong>
          <small>${escapeHtml(entry.time)} · ${detailPrefix} · ${escapeHtml(entry.message || "(메시지 없음)")}</small>
        </div>
        <span class="ticket-pill">${escapeHtml(entry.source === "live" ? "실시간" : "수동")}</span>
      </article>
    `;
    })
    .join("");
}

function renderSummaryDisplay(summary) {
  if (elements.summaryAllTab) {
    elements.summaryAllTab.classList.toggle("is-active", state.summaryView === "all");
  }
  if (elements.summaryDonationTab) {
    elements.summaryDonationTab.classList.toggle("is-active", state.summaryView === "donation");
  }
  if (elements.summaryChatTab) {
    elements.summaryChatTab.classList.toggle("is-active", state.summaryView === "chat");
  }
  renderSummaryFilterControls(state.filteredSummary);

  const displaySummary =
    state.summaryView === "filter"
      ? state.filteredSummary
      : summary.filter((item) => {
        if (state.summaryView === "donation") {
          return item.donationCount > 0;
        }
        if (state.summaryView === "chat") {
          return item.chatCount > 0;
        }
        return true;
      });

  if (!displaySummary.length) {
    elements.summaryTable.className = "table-body empty-state";
    elements.summaryTable.textContent =
      state.summaryView === "all"
        ? "아직 집계된 항목이 없습니다."
        : state.summaryView === "donation"
          ? "아직 집계된 도네 항목이 없습니다."
          : state.summaryView === "chat"
            ? "아직 집계된 채팅 항목이 없습니다."
            : "현재 필터 조건에 맞는 항목이 없습니다.";
    return;
  }

  const showAmounts = shouldShowAmounts();
  const showManualMarker = state.liveCollectionActive || state.liveEntries.length > 0 || state.liveConnection.connectState === "subscribed";
  elements.summaryTable.className = "table-body";
  elements.summaryTable.innerHTML = displaySummary.map((item) => {
    const detailBits = [];
    if (showAmounts) {
      detailBits.push(`총 ${formatNumber(item.totalAmount)}원`);
    }
    detailBits.push(`${item.count}건`);
    if (item.senders.length) {
      detailBits.push(escapeHtml(item.senders.join(", ")));
    }
    detailBits.push(formatPercent(item.winPercent));
    const typeBadges = [];
    if (item.generalDonationCount > 0) {
      typeBadges.push(`<span class="source-pill donation-source-pill">도네 ${formatNumber(item.generalDonationCount)}</span>`);
    }
    if (item.videoDonationCount > 0) {
      typeBadges.push(`<span class="source-pill donation-source-pill">영상도네 ${formatNumber(item.videoDonationCount)}</span>`);
    }
    if (item.missionDonationCount > 0) {
      typeBadges.push(`<span class="source-pill donation-source-pill">미션도네 ${formatNumber(item.missionDonationCount)}</span>`);
    }
    if (item.chatCount > 0) {
      typeBadges.push(`<span class="source-pill chat-source-pill">채팅 ${formatNumber(item.chatCount)}</span>`);
    }
    if (item.manualCount > 0) {
      typeBadges.push(`<span class="source-pill manual-source-pill">수동 ${formatNumber(item.manualCount)}</span>`);
    }
    const fieldCards = [];
    if (item.namePart) {
      const fullName = escapeHtml(item.namePart);
      fieldCards.push(`
        <div class="summary-field-card" title="${fullName}">
          <span class="summary-field-label">닉네임</span>
          <strong class="summary-field-value">${escapeHtml(truncateDisplayText(item.namePart, 12))}</strong>
        </div>
      `);
    }
    if (item.messagePart) {
      const fullMessage = escapeHtml(item.messagePart);
      fieldCards.push(`
        <div class="summary-field-card" title="${fullMessage}">
          <span class="summary-field-label">메시지</span>
          <strong class="summary-field-value">${escapeHtml(truncateDisplayText(item.messagePart, 14))}</strong>
        </div>
      `);
    }

    const isManualTouched = item.manualCount > 0 || item.isEdited;
    return `
      <article class="table-row summary-display-row">
        <div class="summary-display-main">
          ${showManualMarker && isManualTouched ? `<span class="manual-pill">수동</span>` : ""}
          ${typeBadges.length ? `<div class="source-pill-row">${typeBadges.join("")}</div>` : ""}
          ${fieldCards.length ? `<div class="summary-field-grid">${fieldCards.join("")}</div>` : `<strong>${escapeHtml(item.label)}</strong>`}
          <small class="summary-detail-line">${detailBits.join(" · ")}</small>
        </div>
        <div class="action-row tight-row summary-row-actions">
          <span class="ticket-pill">${formatNumber(item.totalTickets)}칸 · ${formatPercent(item.winPercent)}</span>
          ${item.namePart ? `<button type="button" class="ghost-button summary-edit-name-button" data-source-key="${escapeHtml(item.sourceKey)}">닉네임</button>` : ""}
          ${item.messagePart ? `<button type="button" class="ghost-button summary-edit-message-button" data-source-key="${escapeHtml(item.sourceKey)}">메시지</button>` : ""}
          <button type="button" class="ghost-button summary-edit-count-button" data-source-key="${escapeHtml(item.sourceKey)}">칸수</button>
          <button type="button" class="ghost-button summary-exclude-button" data-source-key="${escapeHtml(item.sourceKey)}">제외</button>
          <button type="button" class="ghost-button summary-delete-button" data-source-key="${escapeHtml(item.sourceKey)}">삭제</button>
        </div>
      </article>
    `;
  }).join("");

  elements.summaryTable.querySelectorAll(".summary-edit-name-button").forEach((button) => {
    button.addEventListener("click", () => editSummaryName(button.getAttribute("data-source-key")));
  });
  elements.summaryTable.querySelectorAll(".summary-edit-message-button").forEach((button) => {
    button.addEventListener("click", () => editSummaryMessage(button.getAttribute("data-source-key")));
  });
  elements.summaryTable.querySelectorAll(".summary-edit-count-button").forEach((button) => {
    button.addEventListener("click", () => editSummaryTickets(button.getAttribute("data-source-key")));
  });
  elements.summaryTable.querySelectorAll(".summary-exclude-button").forEach((button) => {
    button.addEventListener("click", () => excludeSummaryItem(button.getAttribute("data-source-key")));
  });
  elements.summaryTable.querySelectorAll(".summary-delete-button").forEach((button) => {
    button.addEventListener("click", () => deleteSummaryItem(button.getAttribute("data-source-key")));
  });
}

function renderLiveFeedDisplay(entries) {
  const rawEvents = state.liveDebugEvents || [];
  const rawDonationCount = rawEvents.filter((entry) => entry.kind === "donation").length;
  const rawChatCount = rawEvents.filter((entry) => entry.kind === "chat").length;

  if (elements.liveRawCountBadge) {
    elements.liveRawCountBadge.textContent = `raw ${rawEvents.length}`;
  }
  if (elements.liveRawDonationCountBadge) {
    elements.liveRawDonationCountBadge.textContent = `도네 ${rawDonationCount}`;
  }
  if (elements.liveRawChatCountBadge) {
    elements.liveRawChatCountBadge.textContent = `채팅 ${rawChatCount}`;
  }

  if (elements.liveFeedFilteredTab) {
    elements.liveFeedFilteredTab.classList.toggle("is-active", state.liveFeedView === "filtered");
    elements.liveFeedFilteredTab.setAttribute("aria-pressed", state.liveFeedView === "filtered" ? "true" : "false");
  }
  if (elements.liveFeedRawTab) {
    elements.liveFeedRawTab.classList.toggle("is-active", state.liveFeedView === "raw");
    elements.liveFeedRawTab.setAttribute("aria-pressed", state.liveFeedView === "raw" ? "true" : "false");
  }

  if (state.liveFeedView === "raw") {
    if (!state.liveDebugEvents.length) {
      elements.liveFeed.className = "table-body empty-state";
      elements.liveFeed.textContent = "아직 실시간 raw 이벤트가 없습니다.";
      return;
    }

    elements.liveFeed.className = "compact-table-body";
    elements.liveFeed.innerHTML = state.liveDebugEvents
      .slice(0, 8)
      .map((entry) => {
        const detailBits = [
          entry.kind,
          entry.messageTypeCode ? `type ${escapeHtml(String(entry.messageTypeCode))}` : "",
          entry.donationType ? escapeHtml(entry.donationType) : "",
          entry.donationStatus ? `status ${escapeHtml(String(entry.donationStatus))}` : "",
          entry.success === null ? "" : `success ${escapeHtml(String(entry.success))}`,
          entry.payAmount ? `${formatNumber(entry.payAmount)}원` : "",
        ].filter(Boolean);

        const rawPreview = escapeHtml(JSON.stringify(entry.payload, null, 2).slice(0, 600));

        return `
          <details class="live-debug-entry">
            <summary>
              <strong>${escapeHtml(entry.nickname || "(익명)")}</strong>
              <small>${escapeHtml(new Date(entry.receivedAt).toLocaleTimeString("ko-KR"))} · ${detailBits.join(" · ") || "raw"}</small>
            </summary>
            <div class="live-debug-copy">
              <p>${escapeHtml(entry.message || "(메시지 없음)")}</p>
              <pre>${rawPreview}</pre>
            </div>
          </details>
        `;
      })
      .join("");
    return;
  }

  if (!entries.length) {
    elements.liveFeed.className = "table-body empty-state";
    elements.liveFeed.textContent = "아직 들어온 후원이 없습니다.";
    return;
  }

  const showAmounts = shouldShowAmounts();
  elements.liveFeed.className = "table-body";
  elements.liveFeed.innerHTML = [...entries]
    .sort((a, b) => b.receivedAt - a.receivedAt)
    .slice(0, 12)
    .map((entry) => {
      const amountLabel = entry.liveKind === "chat"
        ? "채팅 1회"
        : (showAmounts ? `${formatNumber(entry.amount)}원` : "");
      const detailBits = [escapeHtml(entry.time), amountLabel, escapeHtml(entry.message || "(메시지 없음)")].filter(Boolean);
      return `
      <article class="table-row">
        <div>
          <strong>${escapeHtml(entry.name || "(익명)")}</strong>
          <small>${detailBits.join(" · ")}</small>
        </div>
        <span class="ticket-pill">${escapeHtml(entry.source === "live" ? "실시간" : "수동")}</span>
      </article>
    `;
    })
    .join("");
}

function pushLiveDebugEvent(kind, payload) {
  const safePayload = sanitizeIncomingPayload(payload);
  state.liveDebugEvents.unshift({
    id: crypto.randomUUID(),
    kind,
    receivedAt: Date.now(),
    messageTypeCode: safePayload?.messageTypeCode || safePayload?.msgTypeCode || "",
    donationType: safePayload?.donationType || safePayload?.extras?.donationType || "",
    donationStatus: safePayload?.status || safePayload?.extras?.status || "",
    success: safePayload?.success ?? safePayload?.extras?.success ?? null,
    payAmount: Number(safePayload?.payAmount ?? safePayload?.extras?.payAmount ?? 0),
    nickname:
      safePayload?.donatorNickname ||
      safePayload?.nickname ||
      safePayload?.extras?.nickname ||
      safePayload?.profile?.nickname ||
      "",
    message:
      safePayload?.donationText ||
      safePayload?.message ||
      safePayload?.content ||
      "",
    payload: safePayload,
  });
  state.liveDebugEvents = state.liveDebugEvents.slice(0, 20);
  if (state.liveFeedView === "raw") {
    renderLiveFeedDisplay(state.liveEntries);
  }
}

function renderInvalidDisplay(invalidEntries) {
  const excludedSummary = state.excludedSummary || [];
  const manualCount = excludedSummary.length;
  const autoCount = invalidEntries.length;
  const showManualMarker = state.liveCollectionActive || state.liveEntries.length > 0 || state.liveConnection.connectState === "subscribed";

  if (!autoCount && !manualCount) {
    elements.invalidTable.className = "table-body empty-state compact-table-body";
    elements.invalidTable.textContent = "제외된 항목이 없습니다.";
    return;
  }

  const showAmounts = shouldShowAmounts();
  const activeTab = state.invalidTab === "auto" ? "auto" : "manual";
  const excludedMarkup = excludedSummary.map((item) => `
    <article class="table-row">
      <div>
        ${showManualMarker && (item.manualCount > 0 || item.isEdited) ? `<span class="manual-pill">수동</span>` : ""}
        <strong>${escapeHtml(item.label)}</strong>
        <small>${item.namePart ? `닉네임: ${escapeHtml(item.namePart)} · ` : ""}${item.messagePart ? `메시지: ${escapeHtml(item.messagePart)} · ` : ""}수동 제외됨 · ${formatNumber(item.totalTickets)}칸${showAmounts ? ` · ${formatNumber(item.totalAmount)}원` : ""}</small>
      </div>
      <div class="action-row tight-row summary-row-actions">
        <button type="button" class="ghost-button excluded-restore-button" data-source-key="${escapeHtml(item.sourceKey)}">복원</button>
        <button type="button" class="ghost-button excluded-delete-button" data-source-key="${escapeHtml(item.sourceKey)}">삭제</button>
      </div>
    </article>
  `).join("");
  const invalidMarkup = invalidEntries.map((entry) => {
    const title = showAmounts
      ? escapeHtml(entry.raw || "확인 필요")
      : escapeHtml(`${entry.time || "--:--"} · ${entry.name || "익명"} · ${entry.message || "(메시지 없음)"}`);
    return `
      <article class="table-row">
        <div>
          <strong>${title}</strong>
          <small>${escapeHtml(entry.reason || "제외됨")}</small>
        </div>
        <div class="action-row tight-row summary-row-actions">
          <button type="button" class="ghost-button invalid-delete-button" data-invalid-index="${escapeHtml(String(invalidEntries.indexOf(entry)))}">삭제</button>
        </div>
      </article>
    `;
  }).join("");
  const tabContent = activeTab === "manual"
    ? (excludedMarkup || `<div class="empty-state">수동 제외된 항목이 없습니다.</div>`)
    : (invalidMarkup || `<div class="empty-state">기준 제외된 항목이 없습니다.</div>`);
  elements.invalidTable.className = "compact-table-body";
  elements.invalidTable.innerHTML = `
    <div class="invalid-tab-row">
      <button type="button" class="ghost-button invalid-tab-button ${activeTab === "manual" ? "is-active" : ""}" data-invalid-tab="manual">수동 제외 ${formatNumber(manualCount)}</button>
      <button type="button" class="ghost-button invalid-tab-button ${activeTab === "auto" ? "is-active" : ""}" data-invalid-tab="auto">기준 제외 ${formatNumber(autoCount)}</button>
    </div>
    <div class="table-body compact-table-body">${tabContent}</div>
  `;

  elements.invalidTable.querySelectorAll(".invalid-tab-button").forEach((button) => {
    button.addEventListener("click", () => {
      state.invalidTab = button.getAttribute("data-invalid-tab") === "auto" ? "auto" : "manual";
      renderInvalidDisplay(invalidEntries);
    });
  });

  elements.invalidTable.querySelectorAll(".excluded-restore-button").forEach((button) => {
    button.addEventListener("click", () => restoreExcludedItem(button.getAttribute("data-source-key")));
  });
  elements.invalidTable.querySelectorAll(".excluded-delete-button").forEach((button) => {
    button.addEventListener("click", () => deleteExcludedItem(button.getAttribute("data-source-key")));
  });
  elements.invalidTable.querySelectorAll(".invalid-delete-button").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.getAttribute("data-invalid-index"));
      if (Number.isInteger(index) && index >= 0 && invalidEntries[index]) {
        deleteInvalidEntry(invalidEntries[index]);
      }
    });
  });
}

function renderMergeSuggestions(suggestions) {
  if (!suggestions.length) {
    elements.mergeSuggestions.className = "table-body empty-state";
    elements.mergeSuggestions.textContent = "비슷한 문구가 아직 없습니다.";
    return;
  }

  elements.mergeSuggestions.className = "table-body";
  elements.mergeSuggestions.innerHTML = suggestions.map((group) => `
    <article class="table-row">
      <div>
        <strong>${escapeHtml(group.canonical)}</strong>
        <small>${group.variants.map((variant) => `${escapeHtml(variant.label)} (${variant.count})`).join(" · ")}</small>
      </div>
      <div class="action-row tight-row">
        ${group.variants
          .filter((variant) => variant.label !== group.canonical)
          .map((variant) => `
            <button type="button" class="ghost-button merge-action-button" data-source="${escapeHtml(variant.label)}" data-target="${escapeHtml(group.canonical)}">
              ${escapeHtml(variant.label)} 합치기
            </button>
          `)
          .join("")}
      </div>
    </article>
  `).join("");

  elements.mergeSuggestions.querySelectorAll(".merge-action-button").forEach((button) => {
    button.addEventListener("click", () => {
      const source = button.getAttribute("data-source");
      const target = button.getAttribute("data-target");
      if (!source || !target) {
        return;
      }
      state.manualMerges[source] = target;
      renderAll();
    });
  });
}

function renderMergeSelectionStatus() {
  const selected = [...state.mergeSelection];
  if (!elements.mergeSelectionStatus) {
    return;
  }

  if (!selected.length) {
    elements.mergeSelectionStatus.textContent = "아직 선택한 문구가 없습니다.";
    return;
  }

  elements.mergeSelectionStatus.textContent = `${selected.length}개 선택됨 · ${selected.join(", ")}`;
}

function renderManualMergeSuggestions(suggestions, mergeableMessages) {
  if (!mergeableMessages.length) {
    elements.mergeSuggestions.className = "table-body empty-state";
    elements.mergeSuggestions.textContent = "비슷한 문구가 아직 없습니다.";
    renderMergeSelectionStatus();
    return;
  }

  const suggestedKeys = new Set(suggestions.map((group) => normalizeMessageKey(group.canonical)));

  elements.mergeSuggestions.className = "table-body";
  elements.mergeSuggestions.innerHTML = mergeableMessages.map((item) => `
    <label class="table-row merge-option ${state.mergeSelection.has(item.label) ? "is-selected" : ""}">
      <div class="merge-option-main">
        <input type="checkbox" class="merge-option-checkbox" data-label="${escapeHtml(item.label)}" ${state.mergeSelection.has(item.label) ? "checked" : ""} />
        <div>
          <strong>${escapeHtml(item.label)}</strong>
          <small>${formatNumber(item.count)}건${suggestedKeys.has(item.key) ? " · 유사 문구 후보" : ""}</small>
        </div>
      </div>
    </label>
  `).join("");

  elements.mergeSuggestions.querySelectorAll(".merge-option-checkbox").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const label = checkbox.getAttribute("data-label");
      if (!label) {
        return;
      }

      if (checkbox.checked) {
        state.mergeSelection.add(label);
      } else {
        state.mergeSelection.delete(label);
      }
      renderMergeSelectionStatus();
    });
  });

  renderMergeSelectionStatus();
}

function clearMergeSelection() {
  state.mergeSelection.clear();
  if (elements.mergeTargetInput) {
    elements.mergeTargetInput.value = "";
  }
  renderAll();
}

function useSelectedMergeTarget() {
  const selected = [...state.mergeSelection];
  if (!selected.length) {
    elements.winnerText.textContent = "먼저 합칠 문구를 선택해 주세요.";
    return;
  }
  if (elements.mergeTargetInput) {
    elements.mergeTargetInput.value = selected[0];
  }
}

function applySelectedMerge() {
  const selected = [...state.mergeSelection];
  const target = (elements.mergeTargetInput?.value || "").trim();
  if (selected.length < 2) {
    elements.winnerText.textContent = "합치려는 문구를 두 개 이상 선택해 주세요.";
    return;
  }
  if (!target) {
    elements.winnerText.textContent = "대표 문구를 입력해 주세요.";
    elements.mergeTargetInput?.focus();
    return;
  }

  selected.forEach((label) => {
    state.manualMerges[label] = target;
  });
  state.mergeSelection.clear();
  renderAll();
  elements.winnerText.textContent = `"${target}" 기준으로 문구를 합쳤습니다.`;
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
    state.wheelSignature = "";
    return;
  }

  const nextSignature = buildWheelSignature(summary);
  if (state.wheelSignature === nextSignature) {
    return;
  }

  const palette = ["#c7562a", "#f0a15b", "#2f7d5c", "#e7c66a", "#8a4d2e", "#d97f54"];
  const labelPalette = ["#fffaf3", "#2a180f", "#fffaf3", "#2a180f", "#fffaf3", "#2a180f"];

  if (state.wheel) {
    state.wheel.itemLabelFontSizeMax = state.wheelExpanded ? 86 : 68;
    state.wheel.itemLabelRadius = state.wheelExpanded ? 0.84 : 0.8;
    state.wheel.itemLabelRadiusMax = state.wheelExpanded ? 0.22 : 0.24;
  }

  state.wheel.items = summary.map((item) => {
    const colorIndex = colorIndexForLabel(item.label, palette.length);
    return {
      label: formatRouletteLabel(item),
      weight: item.totalTickets,
      backgroundColor: palette[colorIndex],
      labelColor: labelPalette[colorIndex],
    };
  });
  state.wheelSignature = nextSignature;
}

async function initWheel() {
  if (!elements.wheelContainer) {
    state.wheelReady = false;
    state.wheelFailed = true;
    return;
  }

  try {
    const module = await import("https://cdn.jsdelivr.net/npm/spin-wheel@5.0.2/dist/spin-wheel-esm.js");
    const WheelCtor = module.Wheel || module.default?.Wheel || module.default;
    if (typeof WheelCtor !== "function") {
      throw new Error("Wheel constructor not found");
    }

    state.wheel = new WheelCtor(elements.wheelContainer, {
      items: [],
      itemLabelAlign: "right",
      itemLabelBaselineOffset: 0.02,
      itemLabelRadius: state.wheelExpanded ? 0.84 : 0.8,
      itemLabelRadiusMax: state.wheelExpanded ? 0.22 : 0.24,
      itemLabelFontSizeMax: state.wheelExpanded ? 86 : 68,
      lineColor: "#fffaf3",
      lineWidth: 2,
      borderColor: "#fffaf3",
      borderWidth: 4,
      radius: 0.95,
      rotationSpeedMax: 1200,
      isInteractive: false,
    });

    if ("onRest" in state.wheel) {
      state.wheel.onRest = () => {
        if (state.ignoredWheelRestCount > 0) {
          state.ignoredWheelRestCount -= 1;
          return;
        }
        finalizeSpinResult();
      };
    }

    state.wheelReady = true;
    state.wheelFailed = false;
    renderAll();
  } catch (error) {
    state.wheelReady = false;
    state.wheelFailed = true;
    elements.winnerText.textContent = `룰렛을 불러오지 못했습니다: ${normalizeErrorMessage(error)}`;
  }
}

function spinRoulette() {
  if (state.spinning) {
    return;
  }
  if (!state.summary.length || !state.roster.length) {
    elements.winnerText.textContent = "먼저 룰렛에 들어갈 항목을 만들어 주세요.";
    return;
  }

  if (state.spinSequenceRemaining <= 0) {
    const repeatCount = normalizeSpinRepeatCount();
    state.spinSequenceTotal = repeatCount;
    state.spinSequenceRemaining = repeatCount;
    state.spinSequenceCompleted = 0;
  }

  const currentSummary = state.wheelSummary.length ? state.wheelSummary : state.summary;
  const winnerLabel = state.roster[Math.floor(Math.random() * state.roster.length)];
  const winner = currentSummary.find((item) => item.label === winnerLabel) || state.summary.find((item) => item.label === winnerLabel);
  if (!winner) {
    elements.winnerText.textContent = "당첨 항목을 찾지 못했습니다.";
    return;
  }

  state.spinning = true;
  elements.spinButton.disabled = true;
  if (elements.skipSpinButton) {
    elements.skipSpinButton.disabled = !(state.spinSequenceTotal > 1);
  }
  state.pendingSpinWinner = winner;
  state.lastWinnerLabel = winner.label;
  state.lastWinnerSourceKey = winner.sourceKey;
  elements.winnerText.textContent = `당첨: ${winner.label}`;
  publishOverlayState(`당첨: ${winner.label}`);

  if (state.wheel && typeof state.wheel.spinToItem === "function") {
    const winnerIndex = currentSummary.findIndex((item) => item.label === winner.label);
    try {
      state.wheel.spinToItem(
        Math.max(0, winnerIndex),
        Number(elements.spinDurationInput?.value || 6) * 1000,
        true,
        4,
        1,
      );
    } catch {
      finalizeSpinResult();
    }
  } else {
    state.spinFallbackTimeoutId = window.setTimeout(() => {
      state.spinFallbackTimeoutId = null;
      finalizeSpinResult();
    }, Number(elements.spinDurationInput?.value || 6) * 1000);
  }
}

function publishOverlayState(statusText) {
  const snapshot = {
    summary: state.summary,
    wheelSummary: state.wheelSummary,
    roster: state.roster,
    showAmounts: shouldShowAmounts(),
    statusText,
    winnerText: elements.winnerText.textContent,
    updatedAt: Date.now(),
  };
  persistedAppState.overlayState = snapshot;
  queuePersistedAppState();
}

function renderAll() {
  const computed = buildComputedState();
  state.summary = computed.summary;
  state.filteredSummary = getFilteredSummary(computed.summary);
  state.excludedSummary = computed.excludedSummary;
  const activeRouletteSummary = getActiveRouletteSummary(computed.summary, state.filteredSummary);
  reconcileWheelOrder(activeRouletteSummary);
  state.roster = activeRouletteSummary.flatMap((item) => Array.from({ length: item.totalTickets }, () => item.label));
  state.mergeSelection = new Set(
    [...state.mergeSelection].filter((label) => computed.mergeableMessages.some((item) => item.label === label))
  );

  elements.validCount.textContent = formatNumber(computed.validEntries.length);
  const excludedCount = computed.invalidEntries.length + computed.excludedSummary.length;
  elements.invalidCount.textContent = formatNumber(excludedCount);
  elements.participantCount.textContent = formatNumber(activeRouletteSummary.length);
  elements.ticketCount.textContent = formatNumber(state.roster.length);
  if (elements.invalidPanelCount) {
    elements.invalidPanelCount.textContent = `${formatNumber(excludedCount)}개`;
  }
  elements.spinButton.disabled = computed.roster.length === 0 || state.spinning || !state.wheelReady;
  if (elements.skipSpinButton) {
    elements.skipSpinButton.disabled = !(state.spinning && state.spinSequenceTotal > 1);
  }
  if (elements.shuffleWheelButton) {
    elements.shuffleWheelButton.textContent = "순서 섞기";
    elements.shuffleWheelButton.title = "룰렛 항목 배치 순서만 랜덤으로 섞고 확률은 유지합니다.";
  }

  if (elements.expandWheelButton) {
    elements.expandWheelButton.textContent = "전체화면";
    elements.expandWheelButton.title = "룰렛을 크게 보기";
  }
  if (elements.collapseWheelButton) {
    elements.collapseWheelButton.title = "전체화면 닫기";
  }

  if (elements.quickLiveModeButton) {
    elements.quickLiveModeButton.title = "채팅이 많은 방송은 채팅 필터링 사용을 켜는 것을 권장합니다.";
  }
  if (elements.liveChatPrefixInput) {
    elements.liveChatPrefixInput.title = usesLiveChatPrefix()
      ? "채팅 필터링 사용이 켜져 있으면 입력한 말로 시작하는 채팅만 반영합니다."
      : "채팅 필터링 사용을 끄면 들어오는 채팅을 그대로 반영합니다.";
  }
  if (elements.liveDonationPrefixInput) {
    elements.liveDonationPrefixInput.title = "도네 필터링 사용을 켰을 때만 적용됩니다.";
  }

  const summaryHeader = elements.summaryTable?.closest(".table-block")?.querySelector(".table-header");
  if (summaryHeader && !summaryHeader.querySelector("#add-excluded-button")) {
    const addExcludedButton = document.createElement("button");
    addExcludedButton.id = "add-excluded-button";
    addExcludedButton.type = "button";
    addExcludedButton.className = "ghost-button";
    addExcludedButton.textContent = "제외 항목 추가";
    addExcludedButton.title = "현재 룰렛 대상 중 원하는 항목만 골라 제외 목록으로 보냅니다.";
    addExcludedButton.addEventListener("click", openExcludedSelector);
    summaryHeader.append(addExcludedButton);
  }

  renderStatuses();
  syncCollectionTimingUi();
  renderGroupingControls();
  renderUnitAmountSummary();
  renderQuickTotalSummary();
  renderSavedRoulettePanel();
  renderWinnerHistoryPanel();
  renderSummaryDisplay(computed.summary);
  renderInvalidDisplay(computed.invalidEntries);
  renderLiveFeedDisplay(state.liveEntries);
  renderManualMergeSuggestions(computed.mergeSuggestions, computed.mergeableMessages);
  renderWheel(state.wheelSummary.length ? state.wheelSummary : activeRouletteSummary);
  publishOverlayState(elements.winnerText?.textContent || "");
}

function setCollectionStartNow(message = "지금 시각으로 집계 시작 시각을 기록했습니다.") {
  if (elements.startTimeInput) {
    elements.startTimeInput.value = timeNow();
  }
  if (state.liveCollectionActive) {
    state.liveCollectionStartedAtMs = Date.now();
    scheduleLiveCollectionTimers();
  }
  renderAll();
  elements.winnerText.textContent = message;
}

function startLiveCollection() {
  const modeCheck = validateLiveCollectionModeRequirements();
  if (!modeCheck.ok) {
    elements.winnerText.textContent = modeCheck.reason;
    window.alert(modeCheck.reason);
    focusMissingLivePrefixInput();
    return;
  }

  const liveTarget = evaluateLiveTarget();
  if (!liveTarget.ok) {
    elements.winnerText.textContent = liveTarget.reason;
    if (liveTarget.level !== "idle") {
      window.alert(liveTarget.reason);
    }
    return;
  }

  if (!["subscribed", "connecting"].includes(state.liveConnection.connectState)) {
    elements.winnerText.textContent = "먼저 실시간 시작으로 연결을 준비해 주세요.";
    return;
  }

  const untilValidation = validateCollectionUntilTime();
  if (!untilValidation.ok) {
    elements.winnerText.textContent = untilValidation.reason;
    window.alert(untilValidation.reason);
    getCollectionUntilTimeInput()?.focus();
    return;
  }

  state.liveCollectionActive = true;
  state.lastCollectionStopLabel = "";
  state.liveCollectionStartedAtMs = Date.now();
  if (elements.startTimeInput) {
    elements.startTimeInput.value = timeNow();
  }
  scheduleLiveCollectionTimers();
  renderAll();
  elements.winnerText.textContent = `지금부터 실시간 수집(${describeLiveSourceMode()})을 시작합니다.`;
}

function stopLiveCollection(message = "실시간 수집을 종료했습니다.", stopLabel = "") {
  clearLiveCollectionTimers();
  state.liveCollectionActive = false;
  state.liveCollectionStartedAtMs = null;
  state.lastCollectionStopLabel = stopLabel || "";
  renderAll();
  elements.winnerText.textContent = message;
}

async function switchToLiveModeOverride() {
  if (state.liveCollectionActive) {
    elements.winnerText.textContent = "이미 실시간 모드입니다.";
    return;
  }

  if (!getLiveUrlValue()) {
    const targetInput = elements.liveUrlInputMain || elements.liveUrlInput;
    targetInput?.scrollIntoView?.({ behavior: "smooth", block: "center" });
    targetInput?.focus();
    const message = "실시간 모드를 쓰려면 먼저 방송 주소를 입력해 주세요.";
    elements.winnerText.textContent = message;
    window.alert(message);
    return;
  }

  if (!hasVerifiedLiveTarget()) {
    const liveTarget = evaluateLiveTarget();
    elements.winnerText.textContent = liveTarget.reason;
    window.alert(liveTarget.reason);
    return;
  }

  if (!["subscribed", "connecting"].includes(state.liveConnection.connectState)) {
    await connectLiveSession({ allowPending: true });
    if (!["subscribed", "connecting"].includes(state.liveConnection.connectState)) {
      return;
    }
  }

  startLiveCollection();
}

async function handleVerifyLiveButtonClick() {
  try {
    await disconnectLiveSession();
    await verifyLiveTarget();
  } catch (error) {
    const message = error instanceof Error ? error.message : "방송 확인에 실패했습니다.";
    elements.winnerText.textContent = message;
    window.alert(message);
  }
}

function renderStatusesOverride() {
  const liveTarget = evaluateLiveTarget();
  if (elements.authStatus) {
    elements.authStatus.textContent = hasVerifiedLiveTarget()
      ? "방송 확인됨"
      : getLiveUrlValue()
        ? "방송 확인 필요"
        : "주소 필요";
    elements.authStatus.classList.add("is-clickable");
    elements.authStatus.title = "누르면 방송 주소 입력 위치로 이동합니다.";
  }
  if (elements.sessionStatus) {
    elements.sessionStatus.textContent =
      {
        idle: "연결 전",
        connecting: "연결 준비 중",
        connected: "연결됨",
        subscribed: "실시간 수신 중",
        error: "연결 오류",
      }[state.liveConnection.connectState] || "연결 전";
    elements.sessionStatus.classList.add("is-clickable");
    elements.sessionStatus.title = "누르면 실시간 연결 상태를 확인합니다.";
  }
  if (elements.collectionStatus) {
    elements.collectionStatus.textContent = state.liveCollectionActive ? "수집 중" : "수집 대기";
    elements.collectionStatus.classList.add("is-clickable");
    elements.collectionStatus.title = "누르면 실시간 수집 시작 또는 종료를 실행합니다.";
  }
  if (elements.collectionModeSummary) {
    elements.collectionModeSummary.textContent = getLiveCollectionSummaryText();
  }
  renderCollectionModePrefixSummary();
  if (elements.liveDebugStatus) {
    const debugBits = [
      `방송 확인 ${hasVerifiedLiveTarget() ? "완료" : "대기"}`,
      `collector ${state.liveConnection.collectorRunning ? "시작됨" : "대기"}`,
      `소켓 ${state.liveConnection.socketConnected ? "연결됨" : "대기"}`,
      `마지막 raw ${formatDebugTime(state.liveConnection.lastRawAt)}`,
    ];
    if (state.liveConnection.lastError) {
      debugBits.push(`최근 오류 ${state.liveConnection.lastError}`);
    }
    elements.liveDebugStatus.textContent = `연결 디버그: ${debugBits.join(" · ")}`;
  }
  if (elements.liveTargetStatus) {
    elements.liveTargetStatus.textContent = liveTarget.label;
    elements.liveTargetStatus.dataset.state = liveTarget.level;
  }
  if (elements.liveTargetSummary) {
    elements.liveTargetSummary.textContent = liveTarget.summary;
  }
  if (elements.connectButton) {
    elements.connectButton.disabled = !hasVerifiedLiveTarget();
  }
  if (elements.disconnectButton) {
    elements.disconnectButton.disabled = state.liveConnection.connectState === "idle" && !state.liveCollectionActive;
  }
  if (elements.startLiveCollectionButton) {
    elements.startLiveCollectionButton.disabled = !hasVerifiedLiveTarget() || state.liveCollectionActive;
  }
  if (elements.stopLiveCollectionButton) {
    elements.stopLiveCollectionButton.disabled = state.liveConnection.connectState === "idle" && !state.liveCollectionActive;
  }
  [
    [elements.quickManualModeButton, !state.liveCollectionActive, "수동 모드"],
    [elements.quickLiveModeButton, state.liveCollectionActive, "실시간 모드"],
  ].forEach(([button, enabled, label]) => {
    if (!button) {
      return;
    }
    button.classList.toggle("is-active", enabled);
    button.setAttribute("aria-pressed", enabled ? "true" : "false");
    button.textContent = label;
  });
  if (elements.verifyLiveButton) {
    elements.verifyLiveButton.textContent = "방송 확인";
  }
}

async function copyRoster() {
  const source = (state.wheelSummary && state.wheelSummary.length ? state.wheelSummary : state.summary) || [];
  if (!source.length) {
    const message = "복사할 룰렛 항목이 없습니다.";
    elements.winnerText.textContent = message;
    window.alert(message);
    return;
  }

  const text = source
    .map((item) => `${item.label} x${formatNumber(item.totalTickets)}`)
    .join("\n");

  await navigator.clipboard.writeText(text);
  elements.winnerText.textContent = "룰렛 명단을 묶음 형식으로 복사했습니다.";
}

switchToLiveMode = switchToLiveModeOverride;
renderStatuses = renderStatusesOverride;

elements.quickAddButton.addEventListener("click", addQuickEntry);
elements.processButton.addEventListener("click", importBulkEntries);
elements.copyRosterButton.addEventListener("click", copyRoster);
elements.loadSampleButton.addEventListener("click", () => {
  elements.entriesInput.value = sampleEntries;
});
elements.setNowButton?.addEventListener("click", () => {
  setCollectionStartNow();
});
elements.startTimeInput.addEventListener("change", renderAll);
elements.unitAmountInput.addEventListener("input", renderAll);
elements.spinDurationInput.addEventListener("input", saveSettings);
elements.collectionLimitMinutesInput?.addEventListener("input", () => {
  saveSettings();
  if (state.liveCollectionActive) {
    scheduleLiveCollectionTimers();
  }
  renderAll();
});
elements.collectionLimitSecondsInput?.addEventListener("input", () => {
  saveSettings();
  if (state.liveCollectionActive) {
    scheduleLiveCollectionTimers();
  }
  renderAll();
});
document.addEventListener("input", (event) => {
  if (!(event.target instanceof HTMLElement) || event.target.id !== "collection-until-time-input") {
    return;
  }
  saveSettings();
  if (state.liveCollectionActive) {
    scheduleLiveCollectionTimers();
  }
  renderAll();
});
document.addEventListener("change", (event) => {
  if (!(event.target instanceof HTMLInputElement)) {
    return;
  }
  if (event.target.id === "use-collection-duration-input") {
    handleCollectionLimitToggleChange("duration");
  } else if (event.target.id === "use-collection-until-input") {
    handleCollectionLimitToggleChange("until");
  }
});
elements.liveUrlInput?.addEventListener("input", () => {
  syncLiveUrlInputs("admin");
  resetLiveVerification();
  saveSettings();
  renderStatuses();
});
elements.liveUrlInputMain?.addEventListener("input", () => {
  syncLiveUrlInputs("main");
  resetLiveVerification();
  saveSettings();
  renderStatuses();
});
elements.verifyLiveButton?.addEventListener("click", () => {
  handleVerifyLiveButtonClick();
});
elements.liveFeedFilteredTab?.addEventListener("click", () => {
  state.liveFeedView = "filtered";
  renderLiveFeedDisplay(state.liveEntries);
});
elements.liveFeedRawTab?.addEventListener("click", () => {
  state.liveFeedView = "raw";
  renderLiveFeedDisplay(state.liveEntries);
});
elements.summaryAllTab?.addEventListener("click", () => {
  state.summaryView = "all";
  renderSummaryDisplay(state.summary);
});
elements.summaryDonationTab?.addEventListener("click", () => {
  state.summaryView = "donation";
  renderSummaryDisplay(state.summary);
});
elements.summaryChatTab?.addEventListener("click", () => {
  state.summaryView = "chat";
  renderSummaryDisplay(state.summary);
});
elements.summaryFilterTab?.addEventListener("click", () => {
  state.summaryView = "filter";
  renderSummaryDisplay(state.summary);
});
[
  elements.summaryFilterTarget,
  elements.summaryFilterAmountMode,
  elements.summaryFilterAmountValue,
  elements.summaryFilterAmountValueMax,
  elements.summaryFilterKeywordMode,
  elements.summaryFilterKeywordValue,
].filter(Boolean).forEach((element) => {
  const eventName = element instanceof HTMLSelectElement ? "change" : "input";
  element.addEventListener(eventName, () => {
    if (state.summaryView !== "filter") {
      state.summaryView = "filter";
    }
    saveSettings();
    renderAll();
  });
});
elements.applyFilterToRouletteButton?.addEventListener("click", applyFilteredSummaryToRoulette);
elements.clearFilterToRouletteButton?.addEventListener("click", clearFilteredSummaryFromRoulette);
elements.liveChatPrefixInput?.addEventListener("input", saveSettings);
elements.addLiveChatPrefixButton?.addEventListener("click", () => {
  addPrefixRow("chat");
});
elements.useLiveDonationPrefixInput?.addEventListener("change", () => {
  syncLivePrefixInputs();
  saveSettings();
  renderStatuses();
});
elements.liveDonationPrefixInput?.addEventListener("input", saveSettings);
elements.addLiveDonationPrefixButton?.addEventListener("click", () => {
  if (!usesLiveDonationPrefix()) {
    return;
  }
  addPrefixRow("donation");
});
elements.useNameInput?.addEventListener("change", () => {
  const nextState = currentGroupingState();
  handleGroupingChange("name", nextState, {
    useName: !nextState.useName,
    useMessage: nextState.useMessage,
  });
});
elements.useMessageInput?.addEventListener("change", () => {
  const nextState = currentGroupingState();
  handleGroupingChange("message", nextState, {
    useName: nextState.useName,
    useMessage: !nextState.useMessage,
  });
});
elements.quickToggleNameButton?.addEventListener("click", () => {
  const previousState = currentGroupingState();
  handleGroupingChange("name", {
    ...previousState,
    useName: !previousState.useName,
  }, previousState);
});
elements.quickToggleMessageButton?.addEventListener("click", () => {
  const previousState = currentGroupingState();
  handleGroupingChange("message", {
    ...previousState,
    useMessage: !previousState.useMessage,
  }, previousState);
});
elements.quickAmountInput?.addEventListener("input", renderQuickTotalSummary);
elements.quickMultiplierInput?.addEventListener("input", () => {
  renderQuickTotalSummary();
});
elements.autoRemoveWinnerInput?.addEventListener("change", renderAll);
elements.showAmountsInput?.addEventListener("change", renderAll);
elements.autoRerollAfterRemoveInput?.addEventListener("change", () => {
  syncAutoRerollDependencies();
  renderAll();
});
elements.connectButton.addEventListener("click", connectLiveSession);
elements.disconnectButton.addEventListener("click", disconnectLiveSession);
elements.authStatus?.addEventListener("click", handleAddressStatusClick);
elements.sessionStatus?.addEventListener("click", () => {
  handleSessionStatusClick();
});
elements.collectionStatus?.addEventListener("click", () => {
  handleCollectionStatusClick();
});
elements.startLiveCollectionButton?.addEventListener("click", () => {
  handleCollectionStatusClick();
});
elements.stopLiveCollectionButton?.addEventListener("click", () => {
  disconnectLiveSession();
});
elements.quickManualModeButton?.addEventListener("click", switchToManualMode);
elements.quickLiveModeButton?.addEventListener("click", switchToLiveMode);
elements.toggleAdminButton.addEventListener("click", toggleAdminPanel);
elements.saveCurrentButton?.addEventListener("click", saveCurrentRoulette);
elements.saveCurrentButtonMain?.addEventListener("click", saveCurrentRoulette);
elements.overwriteSaveButton?.addEventListener("click", overwriteActiveSavedRoulette);
elements.overwriteSaveButtonMain?.addEventListener("click", overwriteActiveSavedRoulette);
elements.clearActiveSaveButton?.addEventListener("click", clearActiveSavedRoulette);
elements.clearActiveSaveButtonMain?.addEventListener("click", clearActiveSavedRoulette);
elements.clearWinnerHistoryButton?.addEventListener("click", clearWinnerHistory);
elements.clearWinnerHistoryButtonMain?.addEventListener("click", clearWinnerHistory);
elements.removeWinnerButton?.addEventListener("click", removeLastWinner);
elements.stopAutoRerollButton?.addEventListener("click", () => stopScheduledAutoReroll(true));
elements.shuffleWheelButton?.addEventListener("click", shuffleWheelOrder);
elements.expandWheelButton?.addEventListener("click", () => setWheelExpanded(true));
elements.collapseWheelButton?.addEventListener("click", () => setWheelExpanded(false));
  elements.useSelectedMergeTargetButton?.addEventListener("click", useSelectedMergeTarget);
elements.applyMergeButton?.addEventListener("click", applySelectedMerge);
elements.clearMergeSelectionButton?.addEventListener("click", clearMergeSelection);
elements.resetLiveButton.addEventListener("click", () => {
  state.liveEntries = [];
  clearLiveCollectionTimers();
  state.liveCollectionActive = false;
  state.liveCollectionStartedAtMs = null;
  renderAll();
  elements.winnerText.textContent = "실시간 목록을 비우고 수집을 종료했습니다.";
});
elements.clearMergesButton.addEventListener("click", () => {
  state.manualMerges = {};
  state.mergeSelection.clear();
  if (elements.mergeTargetInput) {
    elements.mergeTargetInput.value = "";
  }
  renderAll();
});
elements.spinButton.addEventListener("click", spinRoulette);
elements.spinRepeatCountInput?.addEventListener("change", () => {
  normalizeSpinRepeatCount();
  saveSettings();
});
elements.saveNameInput?.addEventListener("input", () => syncSaveNameInputs("admin"));
elements.saveNameInputMain?.addEventListener("input", () => syncSaveNameInputs("main"));

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && state.wheelExpanded) {
    setWheelExpanded(false);
  }
});

bindPresetButtons(elements.unitAmountPresets, "data-unit-amount", setUnitAmount);
bindPresetButtons(elements.quickAmountPresets, "data-quick-amount", setQuickAmount);
bindPresetButtons(elements.quickMultiplierPresets, "data-quick-multiplier", applyQuickMultiplier);

ensureLiveSourceModeControl();
ensureLiveDonationFilterControl();
ensureLiveChatPrefixToggleControl();
ensureCollectionUntilField();
ensureLiveFeedClearButton();
ensureSkipSpinButton();

async function bootstrapApp() {
  await hydratePersistedAppState();
  hydrateSettings();
  syncGroupingDependencies();
  syncAutoRerollDependencies();
  hydrateSavedRoulettes();
  hydrateWinnerHistory();
  applyStaticUiCopy();
  setWheelExpanded(false);
  renderQuickTotalSummary();
  initWheel();
  renderAll();
}

bootstrapApp().catch((error) => {
  console.error("앱 초기화에 실패했습니다.", error);
  elements.winnerText.textContent = normalizeErrorMessage(error, "앱 초기화에 실패했습니다.");
  syncGroupingDependencies();
  syncAutoRerollDependencies();
  applyStaticUiCopy();
  setWheelExpanded(false);
  renderQuickTotalSummary();
  initWheel();
  renderAll();
});

