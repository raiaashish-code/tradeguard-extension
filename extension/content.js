/**
 * TradeGuard MVP 1.0.1 — Zero-API Pre-Trade & Open Position Exit Checklist Extension
 * Content Script: Capture-phase click interceptor, Screen context scraper,
 * isolated Shadow DOM Gatekeeper overlay, Keyboard Rapid-Check (1-9, Enter),
 * and Safe Replay mechanism.
 * 
 * Supports:
 * - New Order placement (Buy / Sell / Limit / Market / Stop)
 * - Open Position Exits (Exit Position / Square Off / Close Position / Sell to Close)
 * - TradingView, Zerodha Kite Web, Dhan Web, and generic trading platforms
 */

(function () {
  const DEFAULT_RULES = [
    "Is my Stop-Loss strictly defined and entered?",
    "Am I risking less than 1% of total capital?",
    "Is this setup aligned with the higher-timeframe trend (No FOMO)?"
  ];

  let isBypassing = false;
  let activeModalHost = null;
  let activeKeyDownHandler = null;

  console.log(
    "[TradeGuard 🛡️] Active on:",
    window.location.hostname,
    "| Frame:",
    window === window.top ? "top-level" : "iframe"
  );

  /**
   * Identifies if an element is an order submit button OR an open position exit button.
   */
  function isOrderSubmitButton(el) {
    if (!el) return null;

    // Search for closest interactive or button-like container
    const btn = el.closest(
      "button, [role='button'], input[type='submit'], a.btn, a[class*='btn'], a[class*='button'], div[class*='btn'], div[class*='button'], [data-name*='order'], [data-name*='close'], [data-name*='exit'], tr [class*='close'], tr [class*='exit']"
    );

    if (!btn || btn.disabled) return null;

    // Extract all text, values, titles, and aria attributes
    const rawText = (
      btn.innerText ||
      btn.textContent ||
      btn.value ||
      btn.getAttribute("aria-label") ||
      btn.getAttribute("title") ||
      btn.getAttribute("data-tooltip") ||
      ""
    );

    // Normalize whitespace (turn multiple newlines/spaces into single spaces)
    const label = rawText.replace(/\s+/g, " ").trim().toLowerCase();

    // 1. Position Exit & Square-Off keywords
    const isExitAction =
      /\b(exit|square\s*off|squareoff|close\s*position|close\s*trade|close\s*order|exit\s*position|exit\s*all|instant\s*exit|flatten|reverse)\b/i.test(
        label
      );

    // 2. Buy & Sell Order keywords
    const isOrderAction =
      /\b(buy\s*market|sell\s*market|buy\s*limit|sell\s*limit|place\s*order|submit\s*order|buy\s*order|sell\s*order|execute\s*trade|confirm\s*order)\b/i.test(
        label
      ) ||
      /^(buy|sell|exit|close|square\s*off|submit|confirm|execute)(\s|$)/i.test(label);

    // 3. Known Broker Data Attributes & Class Selectors
    const matchesBrokerSelector = btn.matches(
      [
        // Generic & TradingView
        "[data-name='submit-order']",
        "[data-name='close-position']",
        "[data-name='order-confirm-button']",
        "[data-name='place-order']",
        ".order-buy-button",
        ".order-sell-button",
        ".order-submit-button",
        ".button-close",
        // Zerodha Kite Web
        ".btn-blue",
        ".btn-orange",
        ".actions .exit",
        ".actions .close",
        // Dhan Web
        ".exit-position",
        ".btn-squareoff",
        ".place-order",
        ".buy-btn",
        ".sell-btn"
      ].join(", ")
    );

    // 4. Submit buttons inside an open order ticket or confirmation dialog
    const isInOrderWindow =
      (btn.type === "submit" || btn.getAttribute("role") === "button") &&
      Boolean(
        btn.closest(
          ".order-window, .order-form, .dialog-box, .modal-content, [class*='order'], [class*='ticket'], [class*='dialog']"
        )
      ) &&
      label.length > 0 &&
      !/cancel|abort|dismiss|settings|close\s*dialog/i.test(label);

    // 5. Close icon on position rows in TradingView or broker tables
    const isPositionRowClose =
      (btn.matches("[title*='close' i], [aria-label*='close' i], [data-name*='close' i]") ||
        btn.classList.contains("close") ||
        btn.classList.contains("button-close")) &&
      Boolean(btn.closest("tr, [role='row'], .position, .positions-table, [class*='position']"));

    if (isExitAction || isOrderAction || matchesBrokerSelector || isInOrderWindow || isPositionRowClose) {
      console.log("[TradeGuard 🛡️] Intercept target detected:", {
        element: btn,
        label,
        isExitAction,
        isOrderAction,
        matchesBrokerSelector,
        isInOrderWindow,
        isPositionRowClose
      });
      return btn;
    }

    return null;
  }

  /**
   * Scrapes order side, symbol, and context from the DOM without broker APIs.
   */
  function extractScreenContext(targetBtn) {
    const rawText = (
      targetBtn.innerText ||
      targetBtn.textContent ||
      targetBtn.value ||
      targetBtn.getAttribute("aria-label") ||
      targetBtn.getAttribute("title") ||
      ""
    ).replace(/\s+/g, " ").trim().toUpperCase();

    let side = "ORDER";

    if (
      rawText.includes("EXIT") ||
      rawText.includes("SQUARE") ||
      rawText.includes("CLOSE") ||
      targetBtn.matches("[data-name='close-position'], .button-close, .actions .exit")
    ) {
      // For open positions, check if position was Long or Short
      const row = targetBtn.closest("tr, [role='row'], .position, [class*='position']");
      if (row) {
        const rowText = row.textContent.toUpperCase();
        if (rowText.includes("SHORT") || rowText.includes("-") || rowText.includes("SELL")) {
          side = "BUY (CLOSE SHORT)";
        } else {
          side = "SELL (EXIT LONG)";
        }
      } else {
        side = "SELL (EXIT POSITION)";
      }
    } else if (
      rawText.includes("SELL") ||
      targetBtn.classList.contains("order-sell-button") ||
      targetBtn.classList.contains("btn-orange")
    ) {
      side = "SELL";
    } else if (
      rawText.includes("BUY") ||
      targetBtn.classList.contains("order-buy-button") ||
      targetBtn.classList.contains("btn-blue")
    ) {
      side = "BUY";
    }

    // Attempt to guess symbol from row, order ticket, or page title
    let symbolGuess = "";

    // Check position row first
    const row = targetBtn.closest("tr, [role='row'], .position, [class*='position']");
    if (row) {
      const symEl = row.querySelector(
        ".symbol, .instrument, [class*='symbol'], [class*='tradable'], td:first-child"
      );
      if (symEl && symEl.textContent) {
        symbolGuess = symEl.textContent.trim().split(" ")[0];
      }
    }

    // Check broker specific order ticket selectors
    if (!symbolGuess) {
      const symbolEl = document.querySelector(
        ".symbol-name, [data-name='legend-source-title'], .tradable-instrument, .order-window .instrument-title, [class*='instrument-title'], .stock-name"
      );
      if (symbolEl && symbolEl.textContent) {
        symbolGuess = symbolEl.textContent.trim().split(" ")[0];
      }
    }

    // Fallback to title
    if (!symbolGuess) {
      const titleParts = document.title.split(" ");
      if (titleParts[0]) {
        symbolGuess = titleParts[0].replace(/[^A-Za-z0-9:_-]/gi, "");
      }
    }

    return {
      side,
      symbol: symbolGuess || "OPEN POSITION / ACTIVE SYMBOL"
    };
  }

  /**
   * Displays the isolated Shadow DOM checklist modal overlay.
   */
  function openChecklistModal(targetBtn, rules) {
    closeChecklistModal();

    const context = extractScreenContext(targetBtn);
    const host = document.createElement("div");
    host.id = "tradeguard-shadow-host";
    const shadow = host.attachShadow({ mode: "open" });
    activeModalHost = host;

    const isExitOrSell = context.side.includes("SELL") || context.side.includes("EXIT") || context.side.includes("CLOSE");
    const sideColor = isExitOrSell ? "#ef4444" : "#10b981";
    const sideBg = isExitOrSell ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)";
    const sideBorder = isExitOrSell ? "#ef4444" : "#10b981";

    shadow.innerHTML = `
      <style>
        * { box-sizing: border-box; }
        .backdrop {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.85);
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
          background: ${sideBg};
          border: 1px solid ${sideBorder};
          color: ${sideColor};
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
            <span class="side-badge">${context.side}</span>
          </div>

          <p class="sub">
            Order intercepted for <span class="symbol-tag">${context.symbol}</span>. Complete mandatory discipline verification before execution.
          </p>

          <div class="checklist" id="checklistContainer">
            ${rules
              .map(
                (rule, idx) => `
              <div class="item" data-index="${idx}">
                <span class="key-hint">${idx + 1}</span>
                <input type="checkbox" id="rule-${idx}">
                <span class="item-text">${rule}</span>
              </div>
            `
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
            <span>Keys <span class="kbd-pill">1-${rules.length}</span> toggle items</span>
            <span><span class="kbd-pill">Enter</span> submit &middot; <span class="kbd-pill">Esc</span> abort</span>
          </div>
        </div>
      </div>
    `;

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

  /**
   * Safe Replay Mechanism (FR-06):
   * Temporarily bypasses the interceptor flag and re-dispatches the click cleanly.
   */
  function executePassThrough(targetBtn) {
    isBypassing = true;
    closeChecklistModal();

    try {
      console.log("[TradeGuard 🛡️] Executing pass-through click on:", targetBtn);
      targetBtn.click();
    } catch (err) {
      console.error("[TradeGuard] Pass-through click error:", err);
    } finally {
      setTimeout(() => {
        isBypassing = false;
      }, 150);
    }
  }

  /**
   * Capture-phase click interceptor (FR-01)
   */
  function handleCaptureClick(e) {
    if (isBypassing) {
      return;
    }

    const orderBtn = isOrderSubmitButton(e.target);
    if (!orderBtn) return;

    // Check if extension is enabled
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ rules: DEFAULT_RULES, enabled: true }, (data) => {
        if (data.enabled === false) {
          console.log("[TradeGuard 🛡️] Guard is disabled in settings. Passing through.");
          return;
        }

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

  // Register in the CAPTURE phase (useCapture = true)
  document.addEventListener("click", handleCaptureClick, true);
})();
