const PRESETS = {
  fno: {
    rules: [
      "Is my Stop-Loss strictly defined and entered?",
      "Am I risking less than 1% of total capital?",
      "Is NIFTY / BANKNIFTY spot structure supporting this option side (no fighting momentum)?"
    ],
    capital: 200000,
    maxRiskPercent: 1.0,
    maxTradesPerDay: 4
  },
  equity: {
    rules: [
      "Is this stock showing clean relative volume & sector alignment?",
      "Is my Stop-Loss placed below/above structure (not a random mental SL)?",
      "Is Risk per trade within my 1% capital limit?"
    ],
    capital: 200000,
    maxRiskPercent: 1.0,
    maxTradesPerDay: 5
  },
  swing: {
    rules: [
      "Is the daily/weekly higher-timeframe trend aligned with this entry?",
      "Are upcoming earnings or major RBI/Fed events accounted for?",
      "Have I sized quantity strictly for my 1% swing Stop-Loss?"
    ],
    capital: 500000,
    maxRiskPercent: 1.0,
    maxTradesPerDay: 3
  }
};

const setupCapital = document.getElementById("setupCapital");
const setupRisk = document.getElementById("setupRisk");
const setupDailyCap = document.getElementById("setupDailyCap");
const setupOpeningGuard = document.getElementById("setupOpeningGuard");
const setupSaveStatus = document.getElementById("setupSaveStatus");
const presetButtons = document.querySelectorAll(".preset-btn");

const demoBuyBtn = document.getElementById("demoBuyBtn");
const demoModal = document.getElementById("demoModal");
const demoRulesContainer = document.getElementById("demoRulesContainer");
const demoSlInput = document.getElementById("demoSlInput");
const demoRiskBadge = document.getElementById("demoRiskBadge");
const demoAbortBtn = document.getElementById("demoAbortBtn");
const demoConfirmBtn = document.getElementById("demoConfirmBtn");
const demoResult = document.getElementById("demoResult");

let activeRules = PRESETS.fno.rules;
let currentCapital = 200000;
let currentMaxRisk = 1.0;

function loadState(cb) {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get(
      {
        rules: PRESETS.fno.rules,
        capital: 200000,
        maxRiskPercent: 1.0,
        maxTradesPerDay: 5,
        openingGuardEnabled: true
      },
      cb
    );
  } else {
    cb({
      rules: JSON.parse(localStorage.getItem("tradeguard_rules") || JSON.stringify(PRESETS.fno.rules)),
      capital: Number(localStorage.getItem("tradeguard_capital") || "200000"),
      maxRiskPercent: Number(localStorage.getItem("tradeguard_maxrisk") || "1.0"),
      maxTradesPerDay: Number(localStorage.getItem("tradeguard_maxtrades") || "5"),
      openingGuardEnabled: localStorage.getItem("tradekavach_opening_guard") !== "false"
    });
  }
}

function saveState(patch, msg) {
  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.set(patch);
  } else {
    if (patch.rules) localStorage.setItem("tradeguard_rules", JSON.stringify(patch.rules));
    if (patch.capital !== undefined) localStorage.setItem("tradeguard_capital", String(patch.capital));
    if (patch.maxRiskPercent !== undefined) localStorage.setItem("tradeguard_maxrisk", String(patch.maxRiskPercent));
    if (patch.maxTradesPerDay !== undefined) localStorage.setItem("tradeguard_maxtrades", String(patch.maxTradesPerDay));
    if (patch.openingGuardEnabled !== undefined) {
      localStorage.setItem("tradekavach_opening_guard", patch.openingGuardEnabled ? "true" : "false");
    }
  }
  if (setupSaveStatus) {
    setupSaveStatus.textContent = "✓ " + (msg || "Saved locally to Chrome storage.");
  }
}

loadState((data) => {
  activeRules = Array.isArray(data.rules) && data.rules.length > 0 ? data.rules : PRESETS.fno.rules;
  currentCapital = data.capital || 200000;
  currentMaxRisk = data.maxRiskPercent || 1.0;

  if (setupCapital) setupCapital.value = currentCapital;
  if (setupRisk) setupRisk.value = currentMaxRisk;
  if (setupDailyCap) setupDailyCap.value = data.maxTradesPerDay || 5;
  if (setupOpeningGuard) setupOpeningGuard.checked = data.openingGuardEnabled !== false;
});

presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    presetButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const preset = PRESETS[btn.dataset.preset];
    if (!preset) return;
    activeRules = preset.rules;
    currentCapital = preset.capital;
    currentMaxRisk = preset.maxRiskPercent;
    if (setupCapital) setupCapital.value = preset.capital;
    if (setupRisk) setupRisk.value = preset.maxRiskPercent;
    if (setupDailyCap) setupDailyCap.value = preset.maxTradesPerDay;
    saveState(
      {
        rules: preset.rules,
        capital: preset.capital,
        maxRiskPercent: preset.maxRiskPercent,
        maxTradesPerDay: preset.maxTradesPerDay
      },
      `Applied "${btn.textContent.trim()}" preset.`
    );
  });
});

setupCapital.addEventListener("change", () => {
  currentCapital = parseFloat(setupCapital.value) || 200000;
  saveState({ capital: currentCapital }, "Updated trading capital.");
});
setupRisk.addEventListener("change", () => {
  currentMaxRisk = parseFloat(setupRisk.value) || 1.0;
  saveState({ maxRiskPercent: currentMaxRisk }, "Updated max risk %.");
});
setupDailyCap.addEventListener("change", () => {
  saveState({ maxTradesPerDay: Math.max(1, parseInt(setupDailyCap.value, 10) || 5) }, "Updated daily trade cap.");
});
setupOpeningGuard.addEventListener("change", () => {
  saveState({ openingGuardEnabled: setupOpeningGuard.checked }, "Updated 9:15–9:30 AM IST Opening Guard.");
});

// Interactive Demo Modal
function updateDemoRisk() {
  const sl = parseFloat(demoSlInput.value) || 142.5;
  const totalRisk = Math.round(Math.abs(142.5 - sl) * 75);
  const pct = currentCapital > 0 ? ((totalRisk / currentCapital) * 100).toFixed(2) : "0.00";
  const over = parseFloat(pct) > currentMaxRisk;
  demoRiskBadge.style.color = over ? "#fb7185" : "#34d399";
  demoRiskBadge.textContent = over
    ? `⚠️ ₹${totalRisk.toLocaleString("en-IN")} (${pct}% > ${currentMaxRisk}%)`
    : `✓ ₹${totalRisk.toLocaleString("en-IN")} (${pct}%)`;
}

function updateDemoConfirmBtn() {
  const cbs = demoRulesContainer.querySelectorAll("input[type='checkbox']");
  demoConfirmBtn.disabled = !Array.from(cbs).every((c) => c.checked);
}

function openDemoModal() {
  demoRulesContainer.innerHTML = "";
  activeRules.slice(0, 5).forEach((rule, idx) => {
    const label = document.createElement("label");
    label.className = "modal-rule";
    label.innerHTML = `
      <span style="background:#334155; color:#cbd5e1; width:18px; height:18px; border-radius:3px; display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; flex-shrink:0;">${idx + 1}</span>
      <input type="checkbox" style="margin-top:2px; accent-color:#38bdf8;">
      <span>${rule}</span>
    `;
    const cb = label.querySelector("input");
    cb.addEventListener("change", () => {
      label.classList.toggle("checked", cb.checked);
      updateDemoConfirmBtn();
    });
    demoRulesContainer.appendChild(label);
  });

  updateDemoRisk();
  updateDemoConfirmBtn();
  demoModal.classList.add("open");
}

function closeDemoModal(outcomeMsg, isOk) {
  demoModal.classList.remove("open");
  if (outcomeMsg && demoResult) {
    demoResult.textContent = outcomeMsg;
    demoResult.className = "demo-result show " + (isOk ? "ok" : "abort");
  }
}

demoBuyBtn.addEventListener("click", openDemoModal);
demoSlInput.addEventListener("input", updateDemoRisk);
demoAbortBtn.addEventListener("click", () => {
  closeDemoModal("Order aborted via [Esc] — ₹0 risked. Impulse filtered!", false);
});
demoConfirmBtn.addEventListener("click", () => {
  closeDemoModal("Checklist verified & Order replayed cleanly to broker!", true);
});

window.addEventListener("keydown", (e) => {
  if (!demoModal.classList.contains("open")) return;
  if (e.target === demoSlInput) return;

  const num = parseInt(e.key, 10);
  const cbs = demoRulesContainer.querySelectorAll("input[type='checkbox']");
  const rows = demoRulesContainer.querySelectorAll(".modal-rule");
  if (!isNaN(num) && num >= 1 && num <= cbs.length) {
    e.preventDefault();
    cbs[num - 1].checked = !cbs[num - 1].checked;
    rows[num - 1].classList.toggle("checked", cbs[num - 1].checked);
    updateDemoConfirmBtn();
  } else if (e.key === "Escape") {
    e.preventDefault();
    closeDemoModal("Order aborted via [Esc] — ₹0 risked. Impulse filtered!", false);
  } else if (e.key === "Enter" && !demoConfirmBtn.disabled) {
    e.preventDefault();
    closeDemoModal("Checklist verified & Order replayed cleanly to broker!", true);
  }
});
