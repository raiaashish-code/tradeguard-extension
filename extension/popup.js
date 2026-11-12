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

const capitalInput = document.getElementById("capitalInput");
const maxRiskInput = document.getElementById("maxRiskInput");
const cooldownSelect = document.getElementById("cooldownSelect");
const maxTradesInput = document.getElementById("maxTradesInput");

const journalList = document.getElementById("journalList");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const clearJournalBtn = document.getElementById("clearJournalBtn");

const tabButtons = document.querySelectorAll(".tab-btn");
const tabContents = document.querySelectorAll(".tab-content");

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

  trades.slice().reverse().forEach(t => {
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
      tradeJournal: []
    }, callback);
  } else {
    // preview fallback
    callback({
      rules: JSON.parse(localStorage.getItem("tradeguard_rules") || JSON.stringify(DEFAULT_RULES)),
      enabled: localStorage.getItem("tradeguard_enabled") !== "false",
      capital: Number(localStorage.getItem("tradeguard_capital") || "200000"),
      maxRiskPercent: Number(localStorage.getItem("tradeguard_maxrisk") || "1.0"),
      cooldownMinutes: Number(localStorage.getItem("tradeguard_cooldown") || "3"),
      maxTradesPerDay: Number(localStorage.getItem("tradeguard_maxtrades") || "5"),
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
    if (data.capital) localStorage.setItem("tradeguard_capital", String(data.capital));
    if (data.maxRiskPercent) localStorage.setItem("tradeguard_maxrisk", String(data.maxRiskPercent));
    if (data.cooldownMinutes !== undefined) localStorage.setItem("tradeguard_cooldown", String(data.cooldownMinutes));
    if (data.maxTradesPerDay) localStorage.setItem("tradeguard_maxtrades", String(data.maxTradesPerDay));
    if (data.tradeJournal) localStorage.setItem("tradeguard_journal", JSON.stringify(data.tradeJournal));
    if (callback) callback();
  }
}

// Initial load
loadData((data) => {
  if (guardEnabledEl) {
    guardEnabledEl.checked = data.enabled !== false;
    updateToggleLabelState(guardEnabledEl.checked);
  }
  renderRules(data.rules || DEFAULT_RULES);

  if (capitalInput) capitalInput.value = data.capital || 200000;
  if (maxRiskInput) maxRiskInput.value = data.maxRiskPercent || 1.0;
  if (cooldownSelect) cooldownSelect.value = String(data.cooldownMinutes !== undefined ? data.cooldownMinutes : 3);
  if (maxTradesInput) maxTradesInput.value = data.maxTradesPerDay || 5;

  renderJournal(data.tradeJournal || []);
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
  saveData({ cooldownMinutes: parseInt(cooldownSelect.value, 10) || 0 });
});

maxTradesInput.addEventListener("change", () => {
  saveData({ maxTradesPerDay: parseInt(maxTradesInput.value, 10) || 5 });
});

function handleAddRule() {
  const text = newRuleInput.value.trim();
  if (!text) return;

  loadData((data) => {
    const current = data.rules || [];
    if (current.length >= 5) {
      alert("MVP1 supports up to 5 active rules to keep pre-trade execution fast.");
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
      renderJournal([]);
    });
  }
});
