const kpiTotalTrades = document.getElementById("kpiTotalTrades");
const kpiClosedSub = document.getElementById("kpiClosedSub");
const kpiTodayCap = document.getElementById("kpiTodayCap");
const kpiRemainingSub = document.getElementById("kpiRemainingSub");
const kpiSkipped = document.getElementById("kpiSkipped");
const kpiWinRate = document.getElementById("kpiWinRate");
const kpiWinSub = document.getElementById("kpiWinSub");
const kpiNetPnl = document.getElementById("kpiNetPnl");
const kpiTriggeredSub = document.getElementById("kpiTriggeredSub");

const insightsList = document.getElementById("insightsList");
const moodTableBody = document.getElementById("moodTableBody");
const setupTableBody = document.getElementById("setupTableBody");
const tradeLogBody = document.getElementById("tradeLogBody");
const filterButtons = document.querySelectorAll(".filter-btn");

const dashExportCsvBtn = document.getElementById("dashExportCsvBtn");
const dashExportJsonBtn = document.getElementById("dashExportJsonBtn");
const dashClearBtn = document.getElementById("dashClearBtn");
const dashToast = document.getElementById("dashToast");

let currentFilter = "all";
let currentData = {};
let toastTimer = null;
let confirmClearPending = false;

function showToast(msg) {
  if (!dashToast) return;
  dashToast.textContent = msg;
  dashToast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => dashToast.classList.remove("show"), 3000);
}

function formatInr(amount) {
  const n = Math.round(Number(amount) || 0);
  if (n > 0) return "+₹" + n.toLocaleString("en-IN");
  if (n < 0) return "-₹" + Math.abs(n).toLocaleString("en-IN");
  return "₹0";
}

function loadState(cb) {
  const defaults = {
    maxTradesPerDay: 5,
    tradesSkipped: 0,
    rulesTriggered: 0,
    tradeJournal: []
  };
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(defaults, cb);
  } else {
    cb({
      maxTradesPerDay: Number(localStorage.getItem("tradeguard_maxtrades") || "5"),
      tradesSkipped: Number(localStorage.getItem("tradekavach_skipped") || "0"),
      rulesTriggered: Number(localStorage.getItem("tradekavach_triggered") || "0"),
      tradeJournal: JSON.parse(localStorage.getItem("tradeguard_journal") || "[]")
    });
  }
}

function saveJournal(journal, cb) {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set({ tradeJournal: journal }, cb);
  } else {
    localStorage.setItem("tradeguard_journal", JSON.stringify(journal));
    if (cb) cb();
  }
}

function computeGroupStats(trades, keyFn, categories) {
  const map = new Map();
  categories.forEach((cat) => map.set(cat, { total: 0, closed: 0, wins: 0, pnl: 0 }));

  trades.forEach((t) => {
    const key = keyFn(t);
    if (!map.has(key)) map.set(key, { total: 0, closed: 0, wins: 0, pnl: 0 });
    const row = map.get(key);
    row.total += 1;
    if (t.outcome === "WIN" || t.outcome === "LOSS" || t.outcome === "BE") {
      row.closed += 1;
      if (t.outcome === "WIN") row.wins += 1;
    }
    row.pnl += Number(t.pnl) || 0;
  });

  return map;
}

function renderStatsAndTables(data) {
  const trades = Array.isArray(data.tradeJournal) ? data.tradeJournal : [];
  const cap = data.maxTradesPerDay || 5;
  const todayStr = new Date().toDateString();
  const todayCount = trades.filter((t) => {
    try {
      return new Date(t.timestamp).toDateString() === todayStr;
    } catch (_) {
      return false;
    }
  }).length;

  const closedTrades = trades.filter((t) => t.outcome === "WIN" || t.outcome === "LOSS" || t.outcome === "BE");
  const wins = closedTrades.filter((t) => t.outcome === "WIN").length;
  const netPnl = trades.reduce((acc, t) => acc + (Number(t.pnl) || 0), 0);

  kpiTotalTrades.textContent = String(trades.length);
  kpiClosedSub.textContent = `${closedTrades.length} with outcome logged`;

  kpiTodayCap.textContent = `${todayCount} / ${cap}`;
  const remaining = Math.max(0, cap - todayCount);
  kpiRemainingSub.textContent =
    remaining > 0 ? `${remaining} entries left today` : "Daily cap reached — new entries blocked";

  kpiSkipped.textContent = String(data.tradesSkipped || 0);

  if (closedTrades.length > 0) {
    const wr = Math.round((wins / closedTrades.length) * 100);
    kpiWinRate.textContent = `${wr}%`;
    kpiWinSub.textContent = `${wins}W / ${closedTrades.length - wins} non-wins`;
  } else {
    kpiWinRate.textContent = "—";
    kpiWinSub.textContent = "Log WIN/LOSS outcomes below";
  }

  kpiNetPnl.textContent = formatInr(netPnl);
  kpiNetPnl.className = "kpi-val" + (netPnl > 0 ? " pos" : netPnl < 0 ? " neg" : "");
  kpiTriggeredSub.textContent = `Breakers / alerts fired: ${data.rulesTriggered || 0}`;

  // Behavioral Insights
  const insights = [];
  if (closedTrades.length < 3) {
    insights.push(`Log outcomes on ${3 - closedTrades.length} more trade(s) below to unlock mindset & setup pattern analysis.`);
  } else {
    const calmSet = closedTrades.filter((t) => t.mindsetTag === "Calm" || t.mindsetTag === "Focused");
    const tiltSet = closedTrades.filter((t) => t.mindsetTag === "FOMO" || t.mindsetTag === "Revenge" || t.mindsetTag === "Anxious");
    if (calmSet.length > 0) {
      const calmWr = Math.round((calmSet.filter((t) => t.outcome === "WIN").length / calmSet.length) * 100);
      const calmPnl = calmSet.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
      insights.push(`Calm/Focused entries: ${calmWr}% win rate (${formatInr(calmPnl)}) across ${calmSet.length} trade(s).`);
    }
    if (tiltSet.length > 0) {
      const tiltWr = Math.round((tiltSet.filter((t) => t.outcome === "WIN").length / tiltSet.length) * 100);
      const tiltPnl = tiltSet.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
      insights.push(`Anxious/FOMO/Revenge entries: ${tiltWr}% win rate (${formatInr(tiltPnl)}) across ${tiltSet.length} trade(s).`);
    }
    const overriddenTrades = closedTrades.filter((t) => t.overridden);
    if (overriddenTrades.length > 0) {
      const ovPnl = overriddenTrades.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
      insights.push(`Risk-overridden orders: ${overriddenTrades.length} trade(s) totaling ${formatInr(ovPnl)}.`);
    }
  }
  if ((data.tradesSkipped || 0) > 0) {
    insights.push(`You backed out cleanly using [Esc] or Cool-Off ${data.tradesSkipped} time(s) — zero capital risked on skipped impulses.`);
  }
  insightsList.innerHTML = insights.map((txt) => `<li>${txt}</li>`).join("");

  // Mood Breakdown
  const moods = ["Calm", "Focused", "Anxious", "FOMO", "Revenge"];
  const moodMap = computeGroupStats(trades, (t) => t.mindsetTag || "Calm", moods);
  moodTableBody.innerHTML = "";
  moodMap.forEach((stats, mood) => {
    const tr = document.createElement("tr");
    const wr = stats.closed > 0 ? `${Math.round((stats.wins / stats.closed) * 100)}%` : "—";
    const pnlCls = stats.pnl > 0 ? "pos" : stats.pnl < 0 ? "neg" : "";
    tr.innerHTML = `
      <td><strong>${mood}</strong></td>
      <td class="mono">${stats.total}</td>
      <td class="mono">${wr}</td>
      <td class="mono ${pnlCls}">${formatInr(stats.pnl)}</td>
    `;
    moodTableBody.appendChild(tr);
  });

  // Setup Breakdown
  const setups = ["Breakout", "Pullback", "VWAP", "Scalp", "Mean Reversion"];
  const setupMap = computeGroupStats(trades, (t) => t.strategyTag || "Breakout", setups);
  setupTableBody.innerHTML = "";
  setupMap.forEach((stats, setup) => {
    const tr = document.createElement("tr");
    const wr = stats.closed > 0 ? `${Math.round((stats.wins / stats.closed) * 100)}%` : "—";
    const pnlCls = stats.pnl > 0 ? "pos" : stats.pnl < 0 ? "neg" : "";
    tr.innerHTML = `
      <td><strong>${setup}</strong></td>
      <td class="mono">${stats.total}</td>
      <td class="mono">${wr}</td>
      <td class="mono ${pnlCls}">${formatInr(stats.pnl)}</td>
    `;
    setupTableBody.appendChild(tr);
  });

  renderTradeLog(trades);
}

function renderTradeLog(allTrades) {
  const todayStr = new Date().toDateString();
  const filtered = allTrades.filter((t) => {
    if (currentFilter === "today") {
      try {
        return new Date(t.timestamp).toDateString() === todayStr;
      } catch (_) {
        return false;
      }
    }
    if (currentFilter === "open") {
      return !t.outcome || t.outcome === "OPEN";
    }
    return true;
  });

  tradeLogBody.innerHTML = "";
  if (filtered.length === 0) {
    const emptyTr = document.createElement("tr");
    emptyTr.innerHTML = `<td colspan="8" style="text-align:center; color:#64748b; padding:24px 8px;">No matching trades logged yet. Place a trade in your terminal to populate your journal.</td>`;
    tradeLogBody.appendChild(emptyTr);
    return;
  }

  filtered.slice().reverse().forEach((trade) => {
    const tr = document.createElement("tr");
    const timeTxt = trade.timeString || new Date(trade.timestamp).toLocaleTimeString();

    const tdTime = document.createElement("td");
    tdTime.className = "mono";
    tdTime.textContent = timeTxt;

    const tdSide = document.createElement("td");
    const sideSpan = document.createElement("span");
    sideSpan.className = "badge " + (trade.side === "BUY" ? "badge-buy" : "badge-sell");
    sideSpan.textContent = trade.side || "ORDER";
    tdSide.appendChild(sideSpan);

    const tdSym = document.createElement("td");
    tdSym.innerHTML = `<strong></strong><div style="font-size:10.5px; color:#64748b;"></div>`;
    tdSym.querySelector("strong").textContent = trade.symbol || "TERMINAL ORDER";
    tdSym.querySelector("div").textContent = trade.broker || "terminal";

    const tdQtyPrice = document.createElement("td");
    tdQtyPrice.className = "mono";
    tdQtyPrice.textContent = `${trade.quantity || 1} @ ₹${trade.price || 0}`;

    const tdRisk = document.createElement("td");
    tdRisk.className = "mono";
    tdRisk.textContent = trade.riskAmount
      ? `₹${trade.riskAmount}${trade.riskPercent ? ` (${trade.riskPercent}%)` : ""}`
      : "—";

    const tdTags = document.createElement("td");
    const sTag = document.createElement("span");
    sTag.className = "tag";
    sTag.textContent = trade.strategyTag || "Breakout";
    const mTag = document.createElement("span");
    mTag.className = "tag";
    mTag.style.marginLeft = "4px";
    mTag.textContent = trade.mindsetTag || "Calm";
    tdTags.append(sTag, mTag);

    const tdOutcome = document.createElement("td");
    const sel = document.createElement("select");
    sel.className = "outcome-select";
    ["OPEN", "WIN", "LOSS", "BE"].forEach((optVal) => {
      const opt = document.createElement("option");
      opt.value = optVal;
      opt.textContent = optVal;
      if ((trade.outcome || "OPEN") === optVal) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener("change", () => {
      updateTradeEntry(trade.id, { outcome: sel.value });
    });
    tdOutcome.appendChild(sel);

    const tdPnl = document.createElement("td");
    const pnlIn = document.createElement("input");
    pnlIn.type = "number";
    pnlIn.step = "10";
    pnlIn.className = "pnl-input";
    pnlIn.value = String(trade.pnl || 0);
    pnlIn.addEventListener("change", () => {
      updateTradeEntry(trade.id, { pnl: parseFloat(pnlIn.value) || 0 });
    });
    tdPnl.appendChild(pnlIn);

    tr.append(tdTime, tdSide, tdSym, tdQtyPrice, tdRisk, tdTags, tdOutcome, tdPnl);
    tradeLogBody.appendChild(tr);
  });
}

function updateTradeEntry(id, patch) {
  const updated = (currentData.tradeJournal || []).map((t) =>
    t.id === id ? { ...t, ...patch } : t
  );
  currentData.tradeJournal = updated;
  saveJournal(updated, () => {
    renderStatsAndTables(currentData);
    showToast("Trade outcome saved.");
  });
}

function refreshDashboard() {
  loadState((data) => {
    currentData = data;
    renderStatsAndTables(data);
  });
}

refreshDashboard();

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter || "all";
    renderTradeLog(currentData.tradeJournal || []);
  });
});

dashExportCsvBtn.addEventListener("click", () => {
  const trades = currentData.tradeJournal || [];
  if (trades.length === 0) return showToast("No trades logged yet.");
  const headers = [
    "ID", "Timestamp", "DateTime", "Broker", "Side", "Symbol", "Qty",
    "Price", "StopLoss", "RiskAmount", "RiskPercent", "StrategyTag", "MindsetTag", "Outcome", "PnL_INR"
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
    t.riskPercent || "",
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
  showToast("CSV Journal exported.");
});

dashExportJsonBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TradeKavachPlus_Analytics_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  showToast("Analytics JSON exported.");
});

dashClearBtn.addEventListener("click", () => {
  if (!confirmClearPending) {
    confirmClearPending = true;
    dashClearBtn.textContent = "Confirm Clear?";
    setTimeout(() => {
      confirmClearPending = false;
      dashClearBtn.textContent = "Clear Log";
    }, 3000);
    return;
  }
  confirmClearPending = false;
  dashClearBtn.textContent = "Clear Log";
  currentData.tradeJournal = [];
  saveJournal([], () => {
    renderStatsAndTables(currentData);
    showToast("Trade log cleared.");
  });
});

if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") refreshDashboard();
  });
}
