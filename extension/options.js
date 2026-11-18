const DEFAULT_RULES = [
  "Is my Stop-Loss strictly defined and entered?",
  "Am I risking less than 1% of total capital?",
  "Is this setup aligned with the higher-timeframe trend (No FOMO)?"
];

const PRESETS = {
  fno: [
    "Is my Stop-Loss strictly defined and entered?",
    "Am I risking less than 1% of total capital?",
    "Is NIFTY / BANKNIFTY spot structure supporting this option side (no fighting momentum)?"
  ],
  equity: [
    "Is this stock showing clean relative volume & sector alignment?",
    "Is my Stop-Loss placed below/above structure (not a random mental SL)?",
    "Is Risk per trade within my 1% capital limit?"
  ],
  swing: [
    "Is the daily/weekly higher-timeframe trend aligned with this entry?",
    "Are upcoming earnings or major RBI/Fed events accounted for?",
    "Have I sized quantity strictly for my 1% swing Stop-Loss?"
  ]
};

const optCapital = document.getElementById("optCapital");
const optMaxRisk = document.getElementById("optMaxRisk");
const optStrictRisk = document.getElementById("optStrictRisk");
const optEnabled = document.getElementById("optEnabled");
const optDailyCap = document.getElementById("optDailyCap");
const optCooldown = document.getElementById("optCooldown");
const optOpeningGuard = document.getElementById("optOpeningGuard");
const optCalmNote = document.getElementById("optCalmNote");
const sessionLockBox = document.getElementById("sessionLockBox");
const sessionLockStatus = document.getElementById("sessionLockStatus");
const lockSessionBtn = document.getElementById("lockSessionBtn");

const optNewRule = document.getElementById("optNewRule");
const optAddRuleBtn = document.getElementById("optAddRuleBtn");
const optRulesList = document.getElementById("optRulesList");

const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const importJsonBtn = document.getElementById("importJsonBtn");
const importJsonInput = document.getElementById("importJsonInput");
const resetDefaultsBtn = document.getElementById("resetDefaultsBtn");
const toastBar = document.getElementById("toastBar");

let toastTimer = null;
let sessionLocked = false;
let confirmLockPending = false;
let confirmResetPending = false;

function showToast(msg, isWarn = false) {
  if (!toastBar) return;
  toastBar.textContent = msg;
  toastBar.className = "toast-bar show" + (isWarn ? " warn" : "");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastBar.classList.remove("show");
  }, 3200);
}

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

function loadAll(cb) {
  const defaults = {
    rules: DEFAULT_RULES,
    enabled: true,
    capital: 200000,
    maxRiskPercent: 1.0,
    cooldownMinutes: 3,
    maxTradesPerDay: 5,
    openingGuardEnabled: true,
    strictRiskConfirm: true,
    calmNote: "Protect capital first. Missing a trade costs ₹0; a revenge trade ruins the whole week.",
    sessionLockUntil: 0,
    tradeJournal: [],
    tradesSkipped: 0,
    rulesTriggered: 0,
    currentMood: "Calm"
  };

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(defaults, cb);
  } else {
    cb({
      ...defaults,
      rules: JSON.parse(localStorage.getItem("tradeguard_rules") || JSON.stringify(DEFAULT_RULES)),
      enabled: localStorage.getItem("tradeguard_enabled") !== "false",
      capital: Number(localStorage.getItem("tradeguard_capital") || "200000"),
      maxRiskPercent: Number(localStorage.getItem("tradeguard_maxrisk") || "1.0"),
      cooldownMinutes: Number(localStorage.getItem("tradeguard_cooldown") || "3"),
      maxTradesPerDay: Number(localStorage.getItem("tradeguard_maxtrades") || "5"),
      sessionLockUntil: Number(localStorage.getItem("tradekavach_session_lock_until") || "0"),
      tradeJournal: JSON.parse(localStorage.getItem("tradeguard_journal") || "[]")
    });
  }
}

function savePatch(patch, cb) {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set(patch, cb);
  } else {
    if (patch.rules) localStorage.setItem("tradeguard_rules", JSON.stringify(patch.rules));
    if (typeof patch.enabled === "boolean") localStorage.setItem("tradeguard_enabled", patch.enabled ? "true" : "false");
    if (patch.capital !== undefined) localStorage.setItem("tradeguard_capital", String(patch.capital));
    if (patch.maxRiskPercent !== undefined) localStorage.setItem("tradeguard_maxrisk", String(patch.maxRiskPercent));
    if (patch.cooldownMinutes !== undefined) localStorage.setItem("tradeguard_cooldown", String(patch.cooldownMinutes));
    if (patch.maxTradesPerDay !== undefined) localStorage.setItem("tradeguard_maxtrades", String(patch.maxTradesPerDay));
    if (patch.sessionLockUntil !== undefined) localStorage.setItem("tradekavach_session_lock_until", String(patch.sessionLockUntil));
    if (patch.tradeJournal) localStorage.setItem("tradeguard_journal", JSON.stringify(patch.tradeJournal));
    if (cb) cb();
  }
}

function applySessionLock(lockUntil) {
  sessionLocked = Boolean(lockUntil && lockUntil > Date.now());
  optCapital.disabled = sessionLocked;
  optMaxRisk.disabled = sessionLocked;
  optStrictRisk.disabled = sessionLocked;
  optEnabled.disabled = sessionLocked;
  optDailyCap.disabled = sessionLocked;
  optCooldown.disabled = sessionLocked;
  optOpeningGuard.disabled = sessionLocked;
  resetDefaultsBtn.disabled = sessionLocked;

  if (sessionLockBox) sessionLockBox.classList.toggle("locked", sessionLocked);
  if (sessionLocked) {
    lockSessionBtn.disabled = true;
    lockSessionBtn.textContent = "Locked Active";
    sessionLockStatus.textContent = `Locked until ${new Date(lockUntil).toLocaleTimeString()} (Market Close)`;
  } else {
    lockSessionBtn.disabled = false;
    lockSessionBtn.textContent = "Lock Session";
    sessionLockStatus.textContent = "Lock rules, daily cap & toggle until NSE market close (3:30 PM IST).";
  }
}

function renderRules(rules) {
  optRulesList.innerHTML = "";
  (rules || []).forEach((rule, idx) => {
    const li = document.createElement("li");
    const span = document.createElement("span");
    span.textContent = `${idx + 1}. ${rule}`;

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "del-btn";
    delBtn.textContent = "×";
    delBtn.disabled = sessionLocked;
    delBtn.addEventListener("click", () => {
      if (sessionLocked) return showToast("Locked until 3:30 PM IST.", true);
      const updated = rules.filter((_, i) => i !== idx);
      savePatch({ rules: updated }, () => {
        renderRules(updated);
        showToast("Rule removed.");
      });
    });

    li.append(span, delBtn);
    optRulesList.appendChild(li);
  });
}

function hydrate() {
  loadAll((data) => {
    applySessionLock(data.sessionLockUntil);
    optCapital.value = data.capital || 200000;
    optMaxRisk.value = data.maxRiskPercent || 1.0;
    optStrictRisk.checked = data.strictRiskConfirm !== false;
    optEnabled.checked = data.enabled !== false;
    optDailyCap.value = data.maxTradesPerDay || 5;
    optCooldown.value = String(data.cooldownMinutes !== undefined ? data.cooldownMinutes : 3);
    optOpeningGuard.checked = data.openingGuardEnabled !== false;
    optCalmNote.value = data.calmNote || "";
    renderRules(data.rules || DEFAULT_RULES);
  });
}

hydrate();

optCapital.addEventListener("change", () => {
  savePatch({ capital: parseFloat(optCapital.value) || 200000 }, () => showToast("Capital saved."));
});
optMaxRisk.addEventListener("change", () => {
  savePatch({ maxRiskPercent: parseFloat(optMaxRisk.value) || 1.0 }, () => showToast("Max risk % saved."));
});
optStrictRisk.addEventListener("change", () => {
  savePatch({ strictRiskConfirm: optStrictRisk.checked }, () => showToast("Strict risk preference saved."));
});
optEnabled.addEventListener("change", () => {
  savePatch({ enabled: optEnabled.checked }, () =>
    showToast(optEnabled.checked ? "Gatekeeper enabled." : "Gatekeeper paused.", !optEnabled.checked)
  );
});
optDailyCap.addEventListener("change", () => {
  savePatch({ maxTradesPerDay: Math.max(1, parseInt(optDailyCap.value, 10) || 5) }, () =>
    showToast("Daily trade cap saved.")
  );
});
optCooldown.addEventListener("change", () => {
  savePatch({ cooldownMinutes: parseInt(optCooldown.value, 10) || 0 }, () => showToast("Cooldown updated."));
});
optOpeningGuard.addEventListener("change", () => {
  savePatch({ openingGuardEnabled: optOpeningGuard.checked }, () =>
    showToast("9:15–9:30 AM IST Opening Guard updated.")
  );
});
optCalmNote.addEventListener("change", () => {
  savePatch({ calmNote: optCalmNote.value.trim() }, () => showToast("Note from Calm You updated."));
});

lockSessionBtn.addEventListener("click", () => {
  if (!confirmLockPending) {
    confirmLockPending = true;
    lockSessionBtn.textContent = "Confirm Lock?";
    setTimeout(() => {
      if (confirmLockPending) {
        confirmLockPending = false;
        if (!sessionLocked) lockSessionBtn.textContent = "Lock Session";
      }
    }, 3500);
    return;
  }
  confirmLockPending = false;
  const until = getNext330PmIstMs();
  savePatch({ sessionLockUntil: until, enabled: true }, () => {
    hydrate();
    showToast("Session Commitment Lock engaged until 3:30 PM IST.", true);
  });
});

document.querySelectorAll(".preset-load").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (sessionLocked) return showToast("Locked until 3:30 PM IST.", true);
    const rules = PRESETS[btn.dataset.preset] || DEFAULT_RULES;
    savePatch({ rules }, () => {
      renderRules(rules);
      showToast(`Loaded "${btn.textContent.replace("+ ", "")}".`);
    });
  });
});

function addRule() {
  const text = optNewRule.value.trim();
  if (!text) return;
  loadAll((data) => {
    const current = data.rules || [];
    if (current.length >= 20) return showToast("Maximum 20 rules reached.", true);
    const updated = [...current, text];
    savePatch({ rules: updated }, () => {
      optNewRule.value = "";
      renderRules(updated);
      showToast(`Rule #${updated.length} added.`);
    });
  });
}

optAddRuleBtn.addEventListener("click", addRule);
optNewRule.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    addRule();
  }
});

resetDefaultsBtn.addEventListener("click", () => {
  if (!confirmResetPending) {
    confirmResetPending = true;
    resetDefaultsBtn.textContent = "Confirm Reset?";
    setTimeout(() => {
      confirmResetPending = false;
      resetDefaultsBtn.textContent = "Reset Rules";
    }, 3000);
    return;
  }
  confirmResetPending = false;
  resetDefaultsBtn.textContent = "Reset Rules";
  savePatch({ rules: DEFAULT_RULES }, () => {
    renderRules(DEFAULT_RULES);
    showToast("Checklist restored to defaults.");
  });
});

exportJsonBtn.addEventListener("click", () => {
  loadAll((data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `TradeKavachPlus_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    showToast("Full backup JSON exported.");
  });
});

exportCsvBtn.addEventListener("click", () => {
  loadAll((data) => {
    const trades = data.tradeJournal || [];
    if (trades.length === 0) return showToast("No trades logged yet.", true);
    const headers = [
      "ID", "Timestamp", "DateTime", "Broker", "Side", "Symbol", "Qty",
      "Price", "StopLoss", "RiskAmount", "StrategyTag", "MindsetTag", "Outcome", "PnL_INR"
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
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const a = document.createElement("a");
    a.href = encodeURI(csv);
    a.download = `TradeKavachPlus_Journal_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast("CSV Journal downloaded.");
  });
});

importJsonBtn.addEventListener("click", () => importJsonInput.click());
importJsonInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "{}"));
      const allowedPatch = {};
      if (Array.isArray(parsed.rules)) allowedPatch.rules = parsed.rules.slice(0, 20);
      if (typeof parsed.capital === "number") allowedPatch.capital = parsed.capital;
      if (typeof parsed.maxRiskPercent === "number") allowedPatch.maxRiskPercent = parsed.maxRiskPercent;
      if (typeof parsed.cooldownMinutes === "number") allowedPatch.cooldownMinutes = parsed.cooldownMinutes;
      if (typeof parsed.maxTradesPerDay === "number") allowedPatch.maxTradesPerDay = parsed.maxTradesPerDay;
      if (typeof parsed.openingGuardEnabled === "boolean") allowedPatch.openingGuardEnabled = parsed.openingGuardEnabled;
      if (typeof parsed.strictRiskConfirm === "boolean") allowedPatch.strictRiskConfirm = parsed.strictRiskConfirm;
      if (typeof parsed.calmNote === "string") allowedPatch.calmNote = parsed.calmNote;
      if (Array.isArray(parsed.tradeJournal)) allowedPatch.tradeJournal = parsed.tradeJournal.slice(-250);

      savePatch(allowedPatch, () => {
        hydrate();
        showToast("Backup restored successfully.");
      });
    } catch (_) {
      showToast("Invalid backup JSON file.", true);
    }
  };
  reader.readAsText(file);
  importJsonInput.value = "";
});
