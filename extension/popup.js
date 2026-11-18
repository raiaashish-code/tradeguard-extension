const DEFAULT_RULES = [
  "Is my Stop-Loss strictly defined and entered?",
  "Am I risking less than 1% of total capital?",
  "Is this setup aligned with the higher-timeframe trend (No FOMO)?"
];

const guardEnabledEl = document.getElementById("guardEnabled");
const toggleLabel = document.getElementById("toggleLabel");
const newRuleInput = document.getElementById("newRuleInput");
const addRuleBtn = document.getElementById("addRuleBtn");
const rulesList = document.getElementById("rulesList");
const emptyNotice = document.getElementById("emptyNotice");

const capitalInput = document.getElementById("capitalInput");
const maxRiskInput = document.getElementById("maxRiskInput");
const cooldownSelect = document.getElementById("cooldownSelect");
const maxTradesInput = document.getElementById("maxTradesInput");

const journalList = document.getElementById("journalList");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const clearJournalBtn = document.getElementById("clearJournalBtn");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");
const toastBanner = document.getElementById("toastBanner");
const sessionLockBanner = document.getElementById("sessionLockBanner");

const moodButtons = document.querySelectorAll(".mood-btn");
const activeMoodLabel = document.getElementById("activeMoodLabel");

const statTodayTrades = document.getElementById("statTodayTrades");
const statSkipped = document.getElementById("statSkipped");
const statNetPnl = document.getElementById("statNetPnl");

const panicCard = document.getElementById("panicCard");
const panicControlsRow = document.getElementById("panicControlsRow");
const panicActiveRow = document.getElementById("panicActiveRow");
const panicDurationSelect = document.getElementById("panicDurationSelect");
const panicLockBtn = document.getElementById("panicLockBtn");
const panicTimerText = document.getElementById("panicTimerText");

const openDashboardBtn = document.getElementById("openDashboardBtn");
const openOptionsBtn = document.getElementById("openOptionsBtn");
const openWelcomeBtn = document.getElementById("openWelcomeBtn");
const openMoreSettingsBtn = document.getElementById("openMoreSettingsBtn");
const openFullJournalBtn = document.getElementById("openFullJournalBtn");
const aboutVersionLabel = document.getElementById("aboutVersionLabel");

if (aboutVersionLabel && typeof chrome !== "undefined" && chrome.runtime && chrome.runtime.getManifest) {
  try {
    const mf = chrome.runtime.getManifest();
    if (mf && mf.version) aboutVersionLabel.textContent = "Version " + mf.version;
  } catch (_) {}
}

let toastTimer = null;
let confirmClearTimer = null;
let panicInterval = null;
let sessionLocked = false;

function openExtensionPage(page) {
  if (typeof chrome !== "undefined" && chrome.tabs && chrome.runtime && chrome.runtime.getURL) {
    chrome.tabs.create({ url: chrome.runtime.getURL(page) });
  } else {
    showToast(`Open chrome-extension://${page} in Chrome.`);
  }
}

if (openDashboardBtn) openDashboardBtn.addEventListener("click", () => openExtensionPage("dashboard.html"));
if (openFullJournalBtn) openFullJournalBtn.addEventListener("click", () => openExtensionPage("dashboard.html"));
if (openOptionsBtn) openOptionsBtn.addEventListener("click", () => openExtensionPage("options.html"));
if (openMoreSettingsBtn) openMoreSettingsBtn.addEventListener("click", () => openExtensionPage("options.html"));
if (openWelcomeBtn) openWelcomeBtn.addEventListener("click", () => openExtensionPage("welcome.html"));

function showToast(msg, isWarn = false) {
  if (!toastBanner) return;
  toastBanner.textContent = msg;
  toastBanner.className = "toast-banner show" + (isWarn ? " warn" : "");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastBanner.classList.remove("show");
  }, 3000);
}

tabButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    tabButtons.forEach((b) => b.classList.remove("active"));
    tabContents.forEach((c) => c.classList.remove("active"));
    btn.classList.add("active");
    const target = document.getElementById(btn.dataset.tab);
    if (target) target.classList.add("active");
  });
});

function getNext330PmIstMs() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istNow = new Date(utcMs + 330 * 60000);
  const targetIst = new Date(istNow);
  targetIst.setHours(15, 30, 0, 0);
  if (targetIst.getTime() <= istNow.getTime()) {
    targetIst.setDate(targetIst.getDate() + 1);
  }
  return Date.now() + (targetIst.getTime() - istNow.getTime());
}

function formatDuration(ms) {
  const sec = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatInr(amount) {
  const n = Math.round(Number(amount) || 0);
  if (n > 0) return "+₹" + n.toLocaleString("en-IN");
  if (n < 0) return "-₹" + Math.abs(n).toLocaleString("en-IN");
  return "₹0";
}

function updateToggleLabelState(isActive) {
  if (toggleLabel) {
    toggleLabel.classList.toggle("active", Boolean(isActive));
  }
}

function applySessionLockUI(lockUntil) {
  sessionLocked = Boolean(lockUntil && lockUntil > Date.now());
  if (sessionLockBanner) {
    sessionLockBanner.classList.toggle("show", sessionLocked);
  }
  if (guardEnabledEl) guardEnabledEl.disabled = sessionLocked;
  if (capitalInput) capitalInput.disabled = sessionLocked;
  if (maxRiskInput) maxRiskInput.disabled = sessionLocked;
  if (cooldownSelect) cooldownSelect.disabled = sessionLocked;
  if (maxTradesInput) maxTradesInput.disabled = sessionLocked;
}

function updatePanicUI(panicLockUntil) {
  if (panicInterval) {
    clearInterval(panicInterval);
    panicInterval = null;
  }

  function tick() {
    const remaining = (panicLockUntil || 0) - Date.now();
    const locked = remaining > 0;
    if (panicCard) panicCard.classList.toggle("locked", locked);
    if (panicControlsRow) panicControlsRow.style.display = locked ? "none" : "flex";
    if (panicActiveRow) panicActiveRow.classList.toggle("show", locked);
    if (locked && panicTimerText) {
      panicTimerText.textContent = `Entries Locked: ${formatDuration(remaining)}`;
    } else if (!locked && panicInterval) {
      clearInterval(panicInterval);
      panicInterval = null;
    }
  }

  tick();
  if (panicLockUntil && panicLockUntil > Date.now()) {
    panicInterval = setInterval(tick, 1000);
  }
}

function renderMood(mood) {
  const active = mood || "Calm";
  if (activeMoodLabel) activeMoodLabel.textContent = active;
  moodButtons.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mood === active);
  });
}

function renderStats(data) {
  const journal = Array.isArray(data.tradeJournal) ? data.tradeJournal : [];
  const todayStr = new Date().toDateString();
  const todayCount = journal.filter((t) => {
    try {
      return new Date(t.timestamp).toDateString() === todayStr;
    } catch (_) {
      return false;
    }
  }).length;
  const maxCap = data.maxTradesPerDay || 5;
  if (statTodayTrades) statTodayTrades.textContent = `${todayCount} / ${maxCap}`;
  if (statSkipped) statSkipped.textContent = String(data.tradesSkipped || 0);

  const netPnl = journal.reduce((sum, t) => sum + (Number(t.pnl) || 0), 0);
  if (statNetPnl) {
    statNetPnl.textContent = formatInr(netPnl);
    statNetPnl.className = "stat-val" + (netPnl > 0 ? " pos" : netPnl < 0 ? " neg" : "");
  }
}

function renderRules(rules) {
  rulesList.innerHTML = "";
  if (!rules || rules.length === 0) {
    if (emptyNotice) emptyNotice.style.display = "block";
    return;
  }
  if (emptyNotice) emptyNotice.style.display = "none";

  rules.forEach((rule, index) => {
    const li = document.createElement("li");

    const span = document.createElement("span");
    span.className = "rule-text";
    span.textContent = `${index + 1}. ${rule}`;

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.textContent = "×";
    delBtn.className = "del-btn";
    delBtn.title = sessionLocked ? "Locked during session commitment" : "Delete rule";
    delBtn.disabled = sessionLocked;
    delBtn.addEventListener("click", () => {
      if (sessionLocked) {
        showToast("Session Commitment Lock is active until 3:30 PM IST.", true);
        return;
      }
      const updated = rules.filter((_, i) => i !== index);
      saveData({ rules: updated }, () => renderRules(updated));
    });

    li.append(span, delBtn);
    rulesList.appendChild(li);
  });
}

function renderJournal(trades) {
  journalList.innerHTML = "";
  if (!trades || trades.length === 0) {
    journalList.innerHTML = `<div style="text-align: center; color: #64748b; padding: 18px 0;">No trades logged yet.</div>`;
    return;
  }

  trades.slice().reverse().slice(0, 30).forEach((t) => {
    const item = document.createElement("div");
    item.className = "journal-item";
    const sideClass = t.side === "BUY" ? "badge-buy" : "badge-sell";
    const outcomeBadge =
      t.outcome && t.outcome !== "OPEN"
        ? `<span class="tag-badge">${t.outcome}${t.pnl ? ` (${formatInr(t.pnl)})` : ""}</span>`
        : "";
    item.innerHTML = `
      <div class="journal-top">
        <span class="${sideClass}">${t.side} ${t.quantity}x ${t.symbol}</span>
        <span style="color:#f8fafc;">@ ₹${t.price}</span>
      </div>
      <div class="journal-meta">
        <span>${t.timeString || new Date(t.timestamp).toLocaleTimeString()}</span>
        ${t.strategyTag ? `<span class="tag-badge">${t.strategyTag}</span>` : ""}
        ${t.mindsetTag ? `<span class="tag-badge">${t.mindsetTag}</span>` : ""}
        ${t.riskAmount ? `<span style="color:#38bdf8;">Risk: ₹${t.riskAmount}</span>` : ""}
        ${outcomeBadge}
      </div>
    `;
    journalList.appendChild(item);
  });
}

function loadData(callback) {
  const defaults = {
    rules: DEFAULT_RULES,
    enabled: true,
    capital: 200000,
    maxRiskPercent: 1.0,
    cooldownMinutes: 3,
    maxTradesPerDay: 5,
    panicLockUntil: 0,
    sessionLockUntil: 0,
    currentMood: "Calm",
    tradesSkipped: 0,
    tradeJournal: []
  };
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(defaults, callback);
  } else {
    callback({
      rules: JSON.parse(localStorage.getItem("tradeguard_rules") || JSON.stringify(DEFAULT_RULES)),
      enabled: localStorage.getItem("tradeguard_enabled") !== "false",
      capital: Number(localStorage.getItem("tradeguard_capital") || "200000"),
      maxRiskPercent: Number(localStorage.getItem("tradeguard_maxrisk") || "1.0"),
      cooldownMinutes: Number(localStorage.getItem("tradeguard_cooldown") || "3"),
      maxTradesPerDay: Number(localStorage.getItem("tradeguard_maxtrades") || "5"),
      panicLockUntil: Number(localStorage.getItem("tradekavach_panic_until") || "0"),
      sessionLockUntil: Number(localStorage.getItem("tradekavach_session_lock_until") || "0"),
      currentMood: localStorage.getItem("tradekavach_mood") || "Calm",
      tradesSkipped: Number(localStorage.getItem("tradekavach_skipped") || "0"),
      tradeJournal: JSON.parse(localStorage.getItem("tradeguard_journal") || "[]")
    });
  }
}

function saveData(data, callback) {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set(data, callback);
  } else {
    if (data.rules) localStorage.setItem("tradeguard_rules", JSON.stringify(data.rules));
    if (typeof data.enabled === "boolean") localStorage.setItem("tradeguard_enabled", data.enabled ? "true" : "false");
    if (data.capital !== undefined) localStorage.setItem("tradeguard_capital", String(data.capital));
    if (data.maxRiskPercent !== undefined) localStorage.setItem("tradeguard_maxrisk", String(data.maxRiskPercent));
    if (data.cooldownMinutes !== undefined) localStorage.setItem("tradeguard_cooldown", String(data.cooldownMinutes));
    if (data.maxTradesPerDay !== undefined) localStorage.setItem("tradeguard_maxtrades", String(data.maxTradesPerDay));
    if (data.panicLockUntil !== undefined) localStorage.setItem("tradekavach_panic_until", String(data.panicLockUntil));
    if (data.sessionLockUntil !== undefined) localStorage.setItem("tradekavach_session_lock_until", String(data.sessionLockUntil));
    if (data.currentMood) localStorage.setItem("tradekavach_mood", data.currentMood);
    if (data.tradeJournal) localStorage.setItem("tradeguard_journal", JSON.stringify(data.tradeJournal));
    if (callback) callback();
  }
}

function hydrateAll() {
  loadData((data) => {
    applySessionLockUI(data.sessionLockUntil);
    if (guardEnabledEl) {
      guardEnabledEl.checked = data.enabled !== false;
      updateToggleLabelState(guardEnabledEl.checked);
    }
    renderMood(data.currentMood);
    renderStats(data);
    updatePanicUI(data.panicLockUntil);
    renderRules(data.rules || DEFAULT_RULES);

    if (capitalInput) capitalInput.value = data.capital || 200000;
    if (maxRiskInput) maxRiskInput.value = data.maxRiskPercent || 1.0;
    if (cooldownSelect) cooldownSelect.value = String(data.cooldownMinutes !== undefined ? data.cooldownMinutes : 3);
    if (maxTradesInput) maxTradesInput.value = data.maxTradesPerDay || 5;

    renderJournal(data.tradeJournal || []);
  });
}

hydrateAll();

moodButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const mood = btn.dataset.mood;
    renderMood(mood);
    saveData({ currentMood: mood });
    if (mood === "FOMO" || mood === "Revenge") {
      showToast(`${mood} logged — 5s anti-tilt pause active on next order.`, true);
    } else {
      showToast(`Mindset checked in: ${mood}.`);
    }
  });
});

if (panicLockBtn) {
  panicLockBtn.addEventListener("click", () => {
    const choice = panicDurationSelect ? panicDurationSelect.value : "60";
    const until =
      choice === "eod"
        ? getNext330PmIstMs()
        : Date.now() + (parseInt(choice, 10) || 60) * 60 * 1000;

    saveData({ panicLockUntil: until }, () => {
      updatePanicUI(until);
      showToast("Self-Lockout active. New entries paused; exits remain open.", true);
    });
  });
}

guardEnabledEl.addEventListener("change", () => {
  if (sessionLocked) {
    guardEnabledEl.checked = true;
    showToast("Locked until 3:30 PM IST under Session Commitment.", true);
    return;
  }
  saveData({ enabled: guardEnabledEl.checked });
  updateToggleLabelState(guardEnabledEl.checked);
  showToast(
    guardEnabledEl.checked ? "TradeKavach+ active on trading terminals." : "TradeKavach+ paused.",
    !guardEnabledEl.checked
  );
});

capitalInput.addEventListener("change", () => {
  saveData({ capital: parseFloat(capitalInput.value) || 200000 });
  showToast("Trading capital updated.");
});

maxRiskInput.addEventListener("change", () => {
  saveData({ maxRiskPercent: parseFloat(maxRiskInput.value) || 1.0 });
  showToast("Max risk % updated.");
});

cooldownSelect.addEventListener("change", () => {
  const val = parseInt(cooldownSelect.value, 10) || 0;
  saveData({ cooldownMinutes: val });
  showToast(val === 0 ? "Cooldown disabled." : `Cooldown set to ${val} min.`);
});

maxTradesInput.addEventListener("change", () => {
  const val = Math.max(1, parseInt(maxTradesInput.value, 10) || 5);
  saveData({ maxTradesPerDay: val }, () => hydrateAll());
  showToast("Daily trades cap updated.");
});

function handleAddRule() {
  const text = newRuleInput.value.trim();
  if (!text) return;

  loadData((data) => {
    const current = data.rules || [];
    if (current.length >= 20) {
      showToast("Maximum of 20 active rules reached.", true);
      return;
    }

    const updated = [...current, text];
    saveData({ rules: updated }, () => {
      newRuleInput.value = "";
      renderRules(updated);
      showToast(`Rule #${updated.length} added.`);
    });
  });
}

addRuleBtn.addEventListener("click", handleAddRule);
newRuleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleAddRule();
  }
});

exportCsvBtn.addEventListener("click", () => {
  loadData((data) => {
    const trades = data.tradeJournal || [];
    if (trades.length === 0) {
      showToast("No trades recorded yet in your journal.", true);
      return;
    }

    const headers = [
      "ID",
      "Timestamp",
      "Date Time",
      "Broker",
      "Side",
      "Symbol",
      "Qty",
      "Price",
      "StopLoss",
      "RiskAmount",
      "StrategyTag",
      "MindsetTag",
      "Outcome",
      "PnL_INR"
    ];
    const rows = trades.map((t) => [
      t.id,
      t.timestamp,
      `"${t.timeString || new Date(t.timestamp).toLocaleString()}"`,
      t.broker || "broker",
      t.side,
      `"${t.symbol}"`,
      t.quantity,
      t.price,
      t.stopLoss || "",
      t.riskAmount || "",
      `"${t.strategyTag || ""}"`,
      `"${t.mindsetTag || ""}"`,
      t.outcome || "OPEN",
      t.pnl || 0
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TradeKavachPlus_Journal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("Trade Journal CSV downloaded.");
  });
});

let confirmClearPending = false;
clearJournalBtn.addEventListener("click", () => {
  if (!confirmClearPending) {
    confirmClearPending = true;
    clearJournalBtn.textContent = "Confirm?";
    if (confirmClearTimer) clearTimeout(confirmClearTimer);
    confirmClearTimer = setTimeout(() => {
      confirmClearPending = false;
      clearJournalBtn.textContent = "Clear";
    }, 3000);
    return;
  }

  confirmClearPending = false;
  clearJournalBtn.textContent = "Clear";
  if (confirmClearTimer) clearTimeout(confirmClearTimer);
  saveData({ tradeJournal: [] }, () => {
    renderJournal([]);
    hydrateAll();
    showToast("Local trade log cleared.");
  });
});
