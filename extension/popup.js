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
      chrome.storage.local.set({ rules: updated }, () => renderRules(updated));
    };

    li.append(span, delBtn);
    rulesList.appendChild(li);
  });
}

// Initial load from storage
if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
  chrome.storage.local.get({ rules: DEFAULT_RULES, enabled: true }, (data) => {
    if (guardEnabledEl) {
      guardEnabledEl.checked = data.enabled !== false;
      updateToggleLabelState(guardEnabledEl.checked);
    }
    renderRules(data.rules || DEFAULT_RULES);
  });

  guardEnabledEl.addEventListener("change", () => {
    chrome.storage.local.set({ enabled: guardEnabledEl.checked });
    updateToggleLabelState(guardEnabledEl.checked);
  });
} else {
  // Fallback for non-extension preview context
  const localRules = JSON.parse(localStorage.getItem("tradeguard_rules") || JSON.stringify(DEFAULT_RULES));
  const isEnabled = localStorage.getItem("tradeguard_enabled") !== "false";
  if (guardEnabledEl) {
    guardEnabledEl.checked = isEnabled;
    updateToggleLabelState(isEnabled);
    guardEnabledEl.addEventListener("change", () => {
      localStorage.setItem("tradeguard_enabled", guardEnabledEl.checked ? "true" : "false");
      updateToggleLabelState(guardEnabledEl.checked);
    });
  }
  renderRules(localRules);
}

function handleAddRule() {
  const text = newRuleInput.value.trim();
  if (!text) return;

  if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
    chrome.storage.local.get({ rules: DEFAULT_RULES }, (data) => {
      const current = data.rules || [];
      if (current.length >= 5) {
        alert("MVP1 supports up to 5 active rules to keep pre-trade execution fast.");
        return;
      }
      const updated = [...current, text];
      chrome.storage.local.set({ rules: updated }, () => {
        newRuleInput.value = "";
        renderRules(updated);
      });
    });
  } else {
    const current = JSON.parse(localStorage.getItem("tradeguard_rules") || JSON.stringify(DEFAULT_RULES));
    if (current.length >= 5) {
      alert("MVP1 supports up to 5 active rules to keep pre-trade execution fast.");
      return;
    }
    const updated = [...current, text];
    localStorage.setItem("tradeguard_rules", JSON.stringify(updated));
    newRuleInput.value = "";
    renderRules(updated);
  }
}

addRuleBtn.addEventListener("click", handleAddRule);
newRuleInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    handleAddRule();
  }
});
