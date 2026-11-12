const DEFAULT_RULES = [
  "Is my Stop-Loss strictly defined and entered?",
  "Am I risking less than 1% of total capital?",
  "Is this setup aligned with the higher-timeframe trend (No FOMO)?"
];

// Elements
const guardEnabledEl = document.getElementById("guardEnabled");
const toggleLabel = document.getElementById("toggleLabel");
const newRuleInput = document.getElementById("newRuleInput");
const addRuleBtn = document.getElementById("addRuleBtn");
const rulesList = document.getElementById("rulesList");
const emptyNotice = document.getElementById("emptyNotice");

const planBadge = document.getElementById("planBadge");
const accountBtn = document.getElementById("accountBtn");
const planStrip = document.getElementById("planStrip");
const planStripText = document.getElementById("planStripText");
const stripUpgradeBtn = document.getElementById("stripUpgradeBtn");

const capitalInput = document.getElementById("capitalInput");
const maxRiskInput = document.getElementById("maxRiskInput");
const cooldownSelect = document.getElementById("cooldownSelect");
const maxTradesInput = document.getElementById("maxTradesInput");

const journalList = document.getElementById("journalList");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const clearJournalBtn = document.getElementById("clearJournalBtn");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

// Modal Elements
const upgradeModal = document.getElementById("upgradeModal");
const closeUpgradeModal = document.getElementById("closeUpgradeModal");
const activateProBtn = document.getElementById("activateProBtn");
const downgradeFreeBtn = document.getElementById("downgradeFreeBtn");
const googleSignInBtn = document.getElementById("googleSignInBtn");
const authStatusText = document.getElementById("authStatusText");
const googleBtnText = document.getElementById("googleBtnText");

let currentPlan = "free";
let currentUserEmail = null;
let currentRulesState = DEFAULT_RULES;

// Tab Switching
tabButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    tabButtons.forEach(b => b.classList.remove("active"));
    tabContents.forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    const target = document.getElementById(btn.dataset.tab);
    if (target) target.classList.add("active");
  });
});

function updateToggleLabelState(isActive) {
  if (toggleLabel) {
    if (isActive) {
      toggleLabel.classList.add("active");
    } else {
      toggleLabel.classList.remove("active");
    }
  }
}

function updatePlanUI(plan, email) {
  currentPlan = plan || "free";
  currentUserEmail = email || null;

  if (plan === "pro") {
    if (planBadge) {
      planBadge.textContent = "👑 Pro";
      planBadge.className = "plan-badge pro";
    }
    if (accountBtn) {
      accountBtn.innerHTML = "👑 Pro Active";
      accountBtn.style.color = "#fbbf24";
      accountBtn.style.borderColor = "#f59e0b";
    }
    if (planStrip) {
      planStrip.className = "plan-strip pro";
      planStripText.innerHTML = "👑 Pro Trader: <strong>Unlimited Rules Unlocked</strong>";
      if (stripUpgradeBtn) stripUpgradeBtn.style.display = "none";
    }
    if (activateProBtn) {
      activateProBtn.textContent = "✓ Pro Plan Active";
      activateProBtn.style.opacity = "0.7";
      activateProBtn.disabled = true;
    }
    if (downgradeFreeBtn) {
      downgradeFreeBtn.style.display = "block";
    }
  } else {
    if (planBadge) {
      planBadge.textContent = "Free";
      planBadge.className = "plan-badge free";
    }
    if (accountBtn) {
      accountBtn.innerHTML = "👑 Upgrade";
      accountBtn.style.color = "#cbd5e1";
      accountBtn.style.borderColor = "#334155";
    }
    if (planStrip) {
      planStrip.className = "plan-strip";
      planStripText.innerHTML = "Free Plan: <strong>3 Rules max</strong>";
      if (stripUpgradeBtn) stripUpgradeBtn.style.display = "block";
    }
    if (activateProBtn) {
      activateProBtn.textContent = "⭐ Activate Pro License (Instant)";
      activateProBtn.style.opacity = "1";
      activateProBtn.disabled = false;
    }
    if (downgradeFreeBtn) {
      downgradeFreeBtn.style.display = "none";
    }
  }

  // Update Auth box
  if (currentUserEmail) {
    if (authStatusText) authStatusText.textContent = `Signed in as: ${currentUserEmail}`;
    if (googleBtnText) googleBtnText.textContent = "Sign Out";
  } else {
    if (authStatusText) authStatusText.textContent = "Sign in to sync your rules & unlock Pro features across devices";
    if (googleBtnText) googleBtnText.textContent = "Continue with Google";
  }
}

function renderRules(rules) {
  currentRulesState = rules || [];
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
    delBtn.textContent = "×";
    delBtn.className = "del-btn";
    delBtn.title = "Delete rule";
    delBtn.onclick = () => {
      const updated = rules.filter((_, i) => i !== index);
      saveData({ rules: updated });
      renderRules(updated);
    };

    li.append(span, delBtn);
    rulesList.appendChild(li);
  });
}

function renderJournal(trades) {
  journalList.innerHTML = "";
  if (!trades || trades.length === 0) {
    journalList.innerHTML = `<div style="text-align: center; color: #64748b; padding: 20px 0;">No trades logged yet.</div>`;
    return;
  }

  // If free plan, show last 5 trades
  const displayTrades = currentPlan === "pro" ? trades : trades.slice(-5);

  displayTrades.slice().reverse().forEach(t => {
    const item = document.createElement("div");
    item.className = "journal-item";
    const sideClass = t.side === "BUY" ? "badge-buy" : "badge-sell";
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
      </div>
    `;
    journalList.appendChild(item);
  });
}

// Storage abstraction
function loadData(callback) {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get({
      rules: DEFAULT_RULES,
      enabled: true,
      capital: 200000,
      maxRiskPercent: 1.0,
      cooldownMinutes: 3,
      maxTradesPerDay: 5,
      tradeJournal: [],
      userPlan: "free",
      userEmail: null
    }, callback);
  } else {
    callback({
      rules: JSON.parse(localStorage.getItem("tradeguard_rules") || JSON.stringify(DEFAULT_RULES)),
      enabled: localStorage.getItem("tradeguard_enabled") !== "false",
      capital: Number(localStorage.getItem("tradeguard_capital") || "200000"),
      maxRiskPercent: Number(localStorage.getItem("tradeguard_maxrisk") || "1.0"),
      cooldownMinutes: Number(localStorage.getItem("tradeguard_cooldown") || "3"),
      maxTradesPerDay: Number(localStorage.getItem("tradeguard_maxtrades") || "5"),
      tradeJournal: JSON.parse(localStorage.getItem("tradeguard_journal") || "[]"),
      userPlan: localStorage.getItem("tradeguard_plan") || "free",
      userEmail: localStorage.getItem("tradeguard_email") || null
    });
  }
}

function saveData(data, callback) {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set(data, callback);
  } else {
    if (data.rules) localStorage.setItem("tradeguard_rules", JSON.stringify(data.rules));
    if (typeof data.enabled === "boolean") localStorage.setItem("tradeguard_enabled", data.enabled ? "true" : "false");
    if (data.capital) localStorage.setItem("tradeguard_capital", String(data.capital));
    if (data.maxRiskPercent) localStorage.setItem("tradeguard_maxrisk", String(data.maxRiskPercent));
    if (data.cooldownMinutes !== undefined) localStorage.setItem("tradeguard_cooldown", String(data.cooldownMinutes));
    if (data.maxTradesPerDay) localStorage.setItem("tradeguard_maxtrades", String(data.maxTradesPerDay));
    if (data.tradeJournal) localStorage.setItem("tradeguard_journal", JSON.stringify(data.tradeJournal));
    if (data.userPlan) localStorage.setItem("tradeguard_plan", data.userPlan);
    if (data.userEmail !== undefined) localStorage.setItem("tradeguard_email", data.userEmail || "");
    if (callback) callback();
  }
}

// Modal open/close
function openModal() {
  if (upgradeModal) upgradeModal.classList.add("open");
}
function closeModal() {
  if (upgradeModal) upgradeModal.classList.remove("open");
}

if (accountBtn) accountBtn.onclick = openModal;
if (planBadge) planBadge.onclick = openModal;
if (stripUpgradeBtn) stripUpgradeBtn.onclick = openModal;
if (closeUpgradeModal) closeUpgradeModal.onclick = closeModal;

// Activate Pro License
if (activateProBtn) {
  activateProBtn.onclick = () => {
    saveData({ userPlan: "pro", userEmail: currentUserEmail || "trader@tradeguard.app" }, () => {
      updatePlanUI("pro", currentUserEmail || "trader@tradeguard.app");
      renderJournal(tradeJournal);
      closeModal();
      alert("🎉 Welcome to TradeGuard Pro!\n\nUnlimited pre-trade rules, custom cooling-off timers, and advanced 1% risk controls are now unlocked.");
    });
  };
}

// Downgrade to Free Tier (for test purposes)
if (downgradeFreeBtn) {
  downgradeFreeBtn.onclick = () => {
    saveData({ userPlan: "free" }, () => {
      updatePlanUI("free", currentUserEmail);
      renderJournal(tradeJournal);
      closeModal();
      alert("Switched back to Free Tier.");
    });
  };
}

// Sign in with Google simulation
if (googleSignInBtn) {
  googleSignInBtn.onclick = () => {
    if (currentUserEmail) {
      // Sign out
      saveData({ userEmail: null, userPlan: "free" }, () => {
        updatePlanUI("free", null);
      });
    } else {
      // Sign in
      const email = prompt("Enter your Google Account email to sign in:", "rai.aashish@gmail.com") || "rai.aashish@gmail.com";
      saveData({ userEmail: email }, () => {
        updatePlanUI(currentPlan, email);
      });
    }
  };
}

// Initial load
let tradeJournal = [];
loadData((data) => {
  if (guardEnabledEl) {
    guardEnabledEl.checked = data.enabled !== false;
    updateToggleLabelState(guardEnabledEl.checked);
  }
  updatePlanUI(data.userPlan || "free", data.userEmail);
  renderRules(data.rules || DEFAULT_RULES);

  if (capitalInput) capitalInput.value = data.capital || 200000;
  if (maxRiskInput) maxRiskInput.value = data.maxRiskPercent || 1.0;
  if (cooldownSelect) cooldownSelect.value = String(data.cooldownMinutes !== undefined ? data.cooldownMinutes : 3);
  if (maxTradesInput) maxTradesInput.value = data.maxTradesPerDay || 5;

  tradeJournal = data.tradeJournal || [];
  renderJournal(tradeJournal);
});

// Event Listeners
guardEnabledEl.addEventListener("change", () => {
  saveData({ enabled: guardEnabledEl.checked });
  updateToggleLabelState(guardEnabledEl.checked);
});

capitalInput.addEventListener("change", () => {
  saveData({ capital: parseFloat(capitalInput.value) || 200000 });
});

maxRiskInput.addEventListener("change", () => {
  saveData({ maxRiskPercent: parseFloat(maxRiskInput.value) || 1.0 });
});

cooldownSelect.addEventListener("change", () => {
  const val = parseInt(cooldownSelect.value, 10) || 0;
  if (currentPlan === "free" && (val === 1 || val === 5)) {
    alert("⭐ Custom Cooldown Durations (1 min & 5 min) are a TradeGuard Pro feature.\n\nFree plan defaults to standard 3-minute cooling-off.");
    cooldownSelect.value = "3";
    openModal();
    return;
  }
  saveData({ cooldownMinutes: val });
});

maxTradesInput.addEventListener("change", () => {
  saveData({ maxTradesPerDay: parseInt(maxTradesInput.value, 10) || 5 });
});

function handleAddRule() {
  const text = newRuleInput.value.trim();
  if (!text) return;

  loadData((data) => {
    const current = data.rules || [];
    const plan = data.userPlan || "free";

    // Free tier: max 3 rules
    if (plan === "free" && current.length >= 3) {
      newRuleInput.value = "";
      openModal();
      return;
    }

    // Pro tier: max 20 rules
    if (current.length >= 20) {
      alert("TradeGuard supports up to 20 active rules to keep order execution fast.");
      return;
    }

    const updated = [...current, text];
    saveData({ rules: updated }, () => {
      newRuleInput.value = "";
      renderRules(updated);
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

// Export CSV
exportCsvBtn.addEventListener("click", () => {
  loadData((data) => {
    const trades = data.tradeJournal || [];
    if (trades.length === 0) {
      alert("No trades recorded yet in your journal.");
      return;
    }

    const headers = ["ID", "Timestamp", "Date Time", "Broker", "Side", "Symbol", "Qty", "Price", "StopLoss", "RiskAmount", "StrategyTag", "MindsetTag"];
    const rows = trades.map(t => [
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
      `"${t.mindsetTag || ""}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TradeGuard_Journal_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  });
});

// Clear Journal
clearJournalBtn.addEventListener("click", () => {
  if (confirm("Clear local trade log?")) {
    saveData({ tradeJournal: [] }, () => {
      tradeJournal = [];
      renderJournal([]);
    });
  }
});
