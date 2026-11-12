export const EXTENSION_FILES = {
  'manifest.json': `{
  "manifest_version": 3,
  "name": "TradeGuard — Pre-Trade Discipline Checklist",
  "version": "1.0.0",
  "description": "Zero-API pre-trade checklist gatekeeper that prevents emotional impulse orders.",
  "permissions": ["storage"],
  "action": {
    "default_popup": "popup.html",
    "default_title": "TradeGuard Rules"
  },
  "content_scripts": [
    {
      "matches": [
        "https://*.tradingview.com/*",
        "https://*.dhan.co/*",
        "https://kite.zerodha.com/*"
      ],
      "js": ["content.js"],
      "run_at": "document_start"
    }
  ],
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}`,

  'popup.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>TradeGuard Rules</title>
  <style>
    * { box-sizing: border-box; }
    body {
      width: 320px;
      margin: 0;
      padding: 14px;
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      font-size: 13px;
      user-select: none;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #1e293b;
      padding-bottom: 10px;
      margin-bottom: 12px;
    }
    .title-group {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .shield-icon {
      width: 16px;
      height: 16px;
      fill: #38bdf8;
    }
    h2 {
      margin: 0;
      font-size: 14px;
      font-weight: 700;
      color: #38bdf8;
      letter-spacing: -0.01em;
    }
    .toggle-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #94a3b8;
      cursor: pointer;
    }
    .toggle-label input[type="checkbox"] {
      accent-color: #38bdf8;
      cursor: pointer;
    }
    .toggle-label.active {
      color: #38bdf8;
    }
    .row {
      display: flex;
      gap: 6px;
      margin-bottom: 10px;
    }
    input[type="text"] {
      flex: 1;
      padding: 7px 9px;
      border-radius: 4px;
      border: 1px solid #334155;
      background: #1e293b;
      color: #f8fafc;
      font-size: 12px;
      outline: none;
      transition: border-color 0.15s ease;
    }
    input[type="text"]:focus {
      border-color: #38bdf8;
    }
    input[type="text"]::placeholder {
      color: #64748b;
    }
    button.add-btn {
      padding: 7px 12px;
      border: none;
      border-radius: 4px;
      background: #0284c7;
      color: #ffffff;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s ease;
      white-space: nowrap;
    }
    button.add-btn:hover {
      background: #0369a1;
    }
    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      max-height: 220px;
      overflow-y: auto;
    }
    li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #1e293b;
      padding: 8px 10px;
      border-radius: 4px;
      margin-bottom: 6px;
      border: 1px solid #334155;
      font-size: 12px;
      line-height: 1.35;
      gap: 8px;
    }
    .rule-text {
      flex: 1;
      word-break: break-word;
    }
    .del-btn {
      background: transparent;
      border: none;
      color: #f87171;
      padding: 2px 6px;
      font-size: 16px;
      cursor: pointer;
      line-height: 1;
      border-radius: 2px;
      opacity: 0.8;
      transition: opacity 0.15s ease, background 0.15s ease;
    }
    .del-btn:hover {
      opacity: 1;
      background: rgba(239, 68, 68, 0.15);
    }
    .status {
      font-size: 11px;
      color: #64748b;
      margin-top: 10px;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
    .empty-state {
      padding: 16px 8px;
      text-align: center;
      color: #64748b;
      font-size: 12px;
      background: rgba(30, 41, 59, 0.4);
      border-radius: 4px;
      border: 1px dashed #334155;
      margin-bottom: 8px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title-group">
      <svg class="shield-icon" viewBox="0 0 24 24">
        <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
      </svg>
      <h2>TradeGuard MVP1</h2>
    </div>
    <label class="toggle-label" id="toggleLabel">
      <input type="checkbox" id="guardEnabled" checked> Active
    </label>
  </div>

  <div class="row">
    <input type="text" id="newRuleInput" placeholder="Add pre-trade rule (max 5)..." maxlength="90">
    <button class="add-btn" id="addRuleBtn">Add</button>
  </div>

  <div id="emptyNotice" class="empty-state" style="display: none;">
    No checklist rules active. Add a rule above to protect your trades.
  </div>

  <ul id="rulesList"></ul>

  <div class="status">100% Local Storage • Zero API Keys Required</div>

  <script src="popup.js"></script>
</body>
</html>`,

  'popup.js': `const DEFAULT_RULES = [
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
    span.textContent = \`\${index + 1}. \${rule}\`;
    
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
});`,

  'content.js': `(function () {
  const DEFAULT_RULES = [
    "Is my Stop-Loss strictly defined and entered?",
    "Am I risking less than 1% of total capital?",
    "Is this setup aligned with the higher-timeframe trend (No FOMO)?"
  ];

  let isBypassing = false;
  let activeModalHost = null;
  let activeKeyDownHandler = null;

  function isOrderSubmitButton(el) {
    if (!el) return null;
    const btn = el.closest("button, [role='button'], input[type='submit']");
    if (!btn || btn.disabled) return null;

    const label = (
      btn.innerText ||
      btn.value ||
      btn.getAttribute("aria-label") ||
      btn.getAttribute("title") ||
      ""
    ).trim().toLowerCase();

    const orderKeywords = [
      "buy", "sell", "place order", "submit order",
      "buy market", "sell market", "buy limit", "sell limit",
      "buy order", "sell order", "execute trade"
    ];

    const matchesKeyword = orderKeywords.some(
      (kw) => label === kw || label.startsWith(kw + " ") || label.endsWith(" " + kw)
    );

    const matchesDataAttr = btn.matches(
      "[data-name='submit-order'], .order-buy-button, .order-sell-button, .place-order, .btn-blue, .btn-orange"
    );

    return matchesKeyword || matchesDataAttr ? btn : null;
  }

  function extractScreenContext(targetBtn) {
    const actionText = (targetBtn.innerText || targetBtn.value || "").trim().toUpperCase();
    let side = "ORDER";
    if (actionText.includes("SELL") || targetBtn.classList.contains("order-sell-button") || targetBtn.classList.contains("btn-orange")) {
      side = "SELL";
    } else if (actionText.includes("BUY") || targetBtn.classList.contains("order-buy-button") || targetBtn.classList.contains("btn-blue")) {
      side = "BUY";
    }

    let symbolGuess = "";
    const symbolEl = document.querySelector(".symbol-name, [data-name='legend-source-title'], .tradable-instrument, .order-window .instrument-title");
    if (symbolEl && symbolEl.textContent) {
      symbolGuess = symbolEl.textContent.trim().split(" ")[0];
    }

    if (!symbolGuess) {
      const titleParts = document.title.split(" ");
      if (titleParts[0]) {
        symbolGuess = titleParts[0].replace(/[^A-Za-z0-9:_-]/gi, "");
      }
    }

    return {
      side,
      symbol: symbolGuess || "ACTIVE INSTRUMENT"
    };
  }

  function openChecklistModal(targetBtn, rules) {
    closeChecklistModal();

    const context = extractScreenContext(targetBtn);
    const host = document.createElement("div");
    host.id = "tradeguard-shadow-host";
    const shadow = host.attachShadow({ mode: "open" });
    activeModalHost = host;

    const isSell = context.side === "SELL";
    const sideColor = isSell ? "#ef4444" : "#10b981";
    const sideBg = isSell ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)";
    const sideBorder = isSell ? "#ef4444" : "#10b981";

    shadow.innerHTML = \`
      <style>
        * { box-sizing: border-box; }
        .backdrop {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.82);
          backdrop-filter: blur(4px);
          z-index: 2147483647;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          animation: tgFadeIn 0.15s ease-out;
        }
        @keyframes tgFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes tgCardPop {
          from { opacity: 0; transform: scale(0.96) translateY(4px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        .card {
          width: 440px;
          max-width: 92vw;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 22px;
          color: #f8fafc;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05);
          animation: tgCardPop 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 12px;
        }
        .top-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .logo-icon {
          width: 18px;
          height: 18px;
          fill: #38bdf8;
        }
        h3 {
          margin: 0;
          font-size: 15px;
          font-weight: 700;
          color: #38bdf8;
          letter-spacing: -0.01em;
        }
        .side-badge {
          background: \${sideBg};
          border: 1px solid \${sideBorder};
          color: \${sideColor};
          font-weight: 800;
          font-size: 11px;
          padding: 3px 8px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }
        p.sub {
          margin: 0 0 14px 0;
          font-size: 12.5px;
          color: #94a3b8;
          line-height: 1.4;
        }
        .symbol-tag {
          font-weight: 700;
          color: #f1f5f9;
        }
        .checklist {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 18px;
        }
        .item {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          background: #1e293b;
          border: 1px solid #334155;
          padding: 10px 12px;
          border-radius: 6px;
          cursor: pointer;
          transition: border-color 0.15s ease, background 0.15s ease;
          user-select: none;
        }
        .item:hover {
          border-color: #475569;
          background: #243248;
        }
        .item.checked {
          border-color: #0284c7;
          background: rgba(2, 132, 199, 0.12);
        }
        .item input[type="checkbox"] {
          margin-top: 2px;
          accent-color: #38bdf8;
          cursor: pointer;
          width: 16px;
          height: 16px;
        }
        .item-text {
          flex: 1;
          font-size: 12.5px;
          line-height: 1.4;
          color: #e2e8f0;
        }
        .item.checked .item-text {
          color: #ffffff;
        }
        .key-hint {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 18px;
          height: 18px;
          background: #334155;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          border-radius: 3px;
          flex-shrink: 0;
        }
        .item.checked .key-hint {
          background: #0284c7;
          color: #ffffff;
        }
        .footer {
          display: flex;
          gap: 10px;
        }
        button {
          font-family: inherit;
          padding: 10px 14px;
          border-radius: 6px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-cancel {
          background: transparent;
          border: 1px solid #334155;
          color: #94a3b8;
        }
        .btn-cancel:hover {
          background: #1e293b;
          color: #f1f5f9;
        }
        .btn-confirm {
          flex: 1;
          background: #0284c7;
          border: none;
          color: #ffffff;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
        }
        .btn-confirm:hover:not(:disabled) {
          background: #0369a1;
        }
        .btn-confirm:disabled {
          background: #1e293b;
          color: #64748b;
          cursor: not-allowed;
          box-shadow: none;
        }
        .shortcuts-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          padding-top: 10px;
          border-top: 1px solid #1e293b;
          font-size: 11px;
          color: #64748b;
        }
        .kbd-pill {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 3px;
          padding: 1px 5px;
          color: #94a3b8;
          font-family: monospace;
          font-size: 10.5px;
        }
      </style>
      <div class="backdrop" id="tgBackdrop">
        <div class="card" role="dialog" aria-modal="true" aria-labelledby="tgTitle">
          <div class="top">
            <div class="top-left">
              <svg class="logo-icon" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
              </svg>
              <h3 id="tgTitle">TradeGuard Gatekeeper</h3>
            </div>
            <span class="side-badge">\${context.side}</span>
          </div>

          <p class="sub">
            Order intercepted for <span class="symbol-tag">\${context.symbol}</span>. Complete mandatory discipline verification before execution.
          </p>

          <div class="checklist" id="checklistContainer">
            \${rules
              .map(
                (rule, idx) => \`
              <div class="item" data-index="\${idx}">
                <span class="key-hint">\${idx + 1}</span>
                <input type="checkbox" id="rule-\${idx}">
                <span class="item-text">\${rule}</span>
              </div>
            \`
              )
              .join("")}
          </div>

          <div class="footer">
            <button type="button" class="btn-cancel" id="tgCancelBtn">Abort Order [Esc]</button>
            <button type="button" class="btn-confirm" id="tgConfirmBtn" disabled>
              Confirm & Place Order [Enter]
            </button>
          </div>

          <div class="shortcuts-bar">
            <span>Keys <span class="kbd-pill">1-\${rules.length}</span> toggle items</span>
            <span><span class="kbd-pill">Enter</span> submit &middot; <span class="kbd-pill">Esc</span> abort</span>
          </div>
        </div>
      </div>
    \`;

    document.documentElement.appendChild(host);

    const items = shadow.querySelectorAll(".item");
    const checkboxes = shadow.querySelectorAll("input[type='checkbox']");
    const confirmBtn = shadow.querySelector("#tgConfirmBtn");
    const cancelBtn = shadow.querySelector("#tgCancelBtn");
    const backdrop = shadow.querySelector("#tgBackdrop");

    function updateConfirmState() {
      const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
      confirmBtn.disabled = !allChecked;
    }

    items.forEach((item, idx) => {
      item.addEventListener("click", (e) => {
        if (e.target.tagName !== "INPUT") {
          checkboxes[idx].checked = !checkboxes[idx].checked;
        }
        if (checkboxes[idx].checked) {
          item.classList.add("checked");
        } else {
          item.classList.remove("checked");
        }
        updateConfirmState();
      });

      checkboxes[idx].addEventListener("change", () => {
        if (checkboxes[idx].checked) {
          item.classList.add("checked");
        } else {
          item.classList.remove("checked");
        }
        updateConfirmState();
      });
    });

    cancelBtn.addEventListener("click", () => {
      closeChecklistModal();
    });

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        closeChecklistModal();
      }
    });

    confirmBtn.addEventListener("click", () => {
      executePassThrough(targetBtn);
    });

    activeKeyDownHandler = function (e) {
      const keyNum = parseInt(e.key, 10);
      if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= rules.length) {
        e.preventDefault();
        e.stopPropagation();
        const targetCb = checkboxes[keyNum - 1];
        const targetItem = items[keyNum - 1];
        if (targetCb && targetItem) {
          targetCb.checked = !targetCb.checked;
          if (targetCb.checked) {
            targetItem.classList.add("checked");
          } else {
            targetItem.classList.remove("checked");
          }
          updateConfirmState();
        }
        return;
      }

      if (e.key === "Enter") {
        const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
        if (allChecked) {
          e.preventDefault();
          e.stopPropagation();
          executePassThrough(targetBtn);
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeChecklistModal();
      }
    };

    window.addEventListener("keydown", activeKeyDownHandler, true);
  }

  function closeChecklistModal() {
    if (activeKeyDownHandler) {
      window.removeEventListener("keydown", activeKeyDownHandler, true);
      activeKeyDownHandler = null;
    }
    if (activeModalHost) {
      activeModalHost.remove();
      activeModalHost = null;
    }
  }

  function executePassThrough(targetBtn) {
    isBypassing = true;
    closeChecklistModal();

    try {
      targetBtn.click();
    } catch (err) {
      console.error("[TradeGuard] Pass-through click error:", err);
    } finally {
      setTimeout(() => {
        isBypassing = false;
      }, 150);
    }
  }

  function handleCaptureClick(e) {
    if (isBypassing) {
      return;
    }

    const orderBtn = isOrderSubmitButton(e.target);
    if (!orderBtn) return;

    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ rules: DEFAULT_RULES, enabled: true }, (data) => {
        if (data.enabled === false) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        const activeRules = data.rules && data.rules.length > 0 ? data.rules : DEFAULT_RULES;
        openChecklistModal(orderBtn, activeRules);
      });
    } else {
      const isEnabled = localStorage.getItem("tradeguard_enabled") !== "false";
      if (!isEnabled) return;

      const localRules = JSON.parse(
        localStorage.getItem("tradeguard_rules") || JSON.stringify(DEFAULT_RULES)
      );

      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      openChecklistModal(orderBtn, localRules);
    }
  }

  document.addEventListener("click", handleCaptureClick, true);
})();`,

  'README.md': `# TradeGuard MVP 1.0 — Pre-Trade Checklist Chrome Extension

> **Zero-API, 100% Client-Side Pre-Trade Behavioral Seatbelt for Web Trading Terminals**
> Compatible with **TradingView**, **Zerodha Kite Web**, and **Dhan**.

---

## ⚡ The Psychological Thesis

Over 90% of retail trading losses stem not from chart ignorance, but emotional impulse:
- Revenge trading after an unaccepted loss
- Chasing runaway green candles out of FOMO
- Entering orders without a calculated Stop-Loss or position size

**TradeGuard** acts as an uncompromisable, real-time behavioral gatekeeper right inside your browser *before* any order packet reaches your broker.

---

## 🔒 100% Privacy & Zero API Requirement

- **Zero Broker API Keys**: No broker developer approvals, secret tokens, or API fees.
- **Zero Login Credentials**: Operates strictly through browser DOM reading in capture phase.
- **Zero Server Round-Trips**: Runs entirely client-side on your local machine with \`chrome.storage.local\`.

---

## 🛠️ Installation Guide (Google Chrome)

1. **Download or clone this folder**:
   Ensure you have the extension files in a local folder:
   - \`manifest.json\`
   - \`content.js\`
   - \`popup.html\`
   - \`popup.js\`
   - \`icons/\`

2. **Open Chrome Extension Settings**:
   Navigate to \`chrome://extensions/\` in your Chrome address bar.

3. **Enable Developer Mode**:
   Toggle the **Developer mode** switch in the top-right corner.

4. **Load Unpacked Extension**:
   Click the **Load unpacked** button in the top-left corner and select this folder.

5. **Pin TradeGuard**:
   Click the puzzle piece icon on your Chrome toolbar and pin **TradeGuard**.

---

## 🚀 How to Use & Keyboard Shortcuts

1. Open your trading terminal (**TradingView**, **Dhan**, or **Zerodha Kite**).
2. Configure your pre-trade checklist rules in the TradeGuard extension popup (up to 5 rules).
3. Click any **Buy** or **Sell** order button.
4. The TradeGuard dark-mode Gatekeeper modal will freeze execution and dim the screen.
5. Use keyboard rapid-check:
   - Press **\`1\`**, **\`2\`**, **\`3\`**, **\`4\`**, **\`5\`** to toggle checklist items.
   - Press **\`Enter\`** to unlock and execute ("Confirm & Place Order").
   - Press **\`Esc\`** to abort the trade without placing it.

---

## 💻 GitHub Repository Commands

To initialize a git repository and push TradeGuard to your GitHub account:

\`\`\`bash
cd tradeguard-mvp1
git init
git add .
git commit -m "feat: TradeGuard MVP1 pre-trade checklist Chrome extension"
# Using GitHub CLI:
gh repo create tradeguard-extension --public --source=. --push
# Or add your remote manually:
# git remote add origin https://github.com/<your-username>/tradeguard-extension.git
# git branch -M main
# git push -u origin main
\`\`\`
`
};
