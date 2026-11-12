/**
 * TradeGuard MVP 1.0.4 — Zero-API Pre-Trade & Open Position Exit Checklist Extension
 * 
 * Major Fixes for Dhan Web, Zerodha Kite, and TradingView:
 * - Uses e.composedPath() to pierce Web Components and Shadow DOM (essential for Dhan)
 * - Directly targets Dhan's .btn-submit, .btn-sell, .btn-buy, and "⚡ Instant Sell" / "Instant Buy"
 * - Multi-event capture: intercepts 'click', 'mousedown', and 'pointerdown' in capture phase
 * - Resets all styles on #tradeguard-shadow-host with all: initial and z-index: 2147483647
 * - Safe replay re-dispatches genuine MouseEvent to trigger React / Angular component handlers
 */

(function () {
  const DEFAULT_RULES = [
    "Is my Stop-Loss strictly defined and entered?",
    "Am I risking less than 1% of total capital?",
    "Is this setup aligned with the higher-timeframe trend (No FOMO)?"
  ];

  // Synchronously cached state
  let isEnabled = true;
  let currentRules = DEFAULT_RULES;
  let isBypassing = false;
  let activeModalHost = null;
  let activeKeyDownHandler = null;
  let lastModalOpenTime = 0;

  console.log(
    "%c[TradeGuard 🛡️ v1.0.4] LOADED ON THIS TAB",
    "background: #0284c7; color: white; font-weight: bold; padding: 4px 10px; border-radius: 4px;"
  );
  console.log("[TradeGuard] Host:", window.location.hostname, "| Top Frame:", window === window.top);

  // Sync settings from chrome.storage
  try {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ rules: DEFAULT_RULES, enabled: true }, (data) => {
        if (data) {
          if (Array.isArray(data.rules) && data.rules.length > 0) currentRules = data.rules;
          if (typeof data.enabled === "boolean") isEnabled = data.enabled;
          console.log("[TradeGuard 🛡️] Cached storage rules:", currentRules.length, "Active:", isEnabled);
        }
      });

      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local") {
          if (changes.rules && changes.rules.newValue) currentRules = changes.rules.newValue;
          if (changes.enabled && typeof changes.enabled.newValue === "boolean") isEnabled = changes.enabled.newValue;
          console.log("[TradeGuard 🛡️] Settings updated live. Active:", isEnabled);
        }
      });
    }
  } catch (err) {
    console.warn("[TradeGuard] Storage access notice:", err);
  }

  // Visual confirmation pill
  function injectStatusPill() {
    if (window !== window.top) return;
    if (document.getElementById("tradeguard-live-pill")) return;

    const pill = document.createElement("div");
    pill.id = "tradeguard-live-pill";
    pill.setAttribute("style", [
      "position: fixed",
      "bottom: 12px",
      "right: 12px",
      "z-index: 2147483640",
      "background: #0f172a",
      "color: #38bdf8",
      "border: 1px solid #334155",
      "border-radius: 20px",
      "padding: 5px 12px",
      "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      "font-size: 11px",
      "font-weight: 700",
      "display: flex",
      "align-items: center",
      "gap: 6px",
      "box-shadow: 0 4px 16px rgba(0,0,0,0.6)",
      "cursor: pointer",
      "user-select: none",
      "opacity: 0.9",
      "transition: opacity 0.2s, transform 0.2s"
    ].join(";"));

    pill.innerHTML = `
      <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10b981;"></span>
      <span>TradeGuard Active</span>
    `;

    pill.onclick = () => {
      alert("TradeGuard v1.0.4 is ACTIVE.\n\nGuarding all Buy, Sell, and Position Exit/Square-Off orders on this tab.");
    };

    (document.body || document.documentElement).appendChild(pill);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectStatusPill);
  } else {
    injectStatusPill();
  }

  /**
   * Resolves order submit button by piercing Web Components / Shadow DOM using e.composedPath().
   */
  function findOrderSubmitButton(e) {
    if (!e) return null;

    // Use composedPath() to pierce all Shadow DOM boundaries (essential for Dhan Web Components)
    const path = typeof e.composedPath === "function" ? e.composedPath() : [];
    const elementsToInspect = path.length > 0 ? path : [e.target];

    for (const node of elementsToInspect) {
      if (!node || node.nodeType !== 1) continue; // Only elements

      // Extract text content and attributes
      const rawText = (
        node.innerText ||
        node.textContent ||
        node.value ||
        node.getAttribute("aria-label") ||
        node.getAttribute("title") ||
        node.getAttribute("data-name") ||
        node.getAttribute("data-tooltip") ||
        ""
      );

      // Clean text: strip emojis (like ⚡), symbols, punctuation, and lowercase
      const cleanText = rawText
        .replace(/[^\w\s]/gi, " ")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();

      const className = typeof node.className === "string" ? node.className.toLowerCase() : "";
      const id = typeof node.id === "string" ? node.id.toLowerCase() : "";

      // 1. Dhan Web Components: .btn-submit, .btn-sell, .btn-buy, btnSubmit
      const isDhanSubmitBtn =
        id.includes("btnsubmit") ||
        className.includes("btn-submit") ||
        className.includes("btn-sell") ||
        className.includes("btn-buy") ||
        className.includes("btn-modify") ||
        className.includes("instant-sell") ||
        className.includes("btn-squareoff");

      // 2. Zerodha Kite Web: .btn-orange, .btn-blue, .actions .exit
      const isKiteSubmitBtn =
        className.includes("btn-orange") ||
        className.includes("btn-blue") ||
        (className.includes("actions") && className.includes("exit"));

      // 3. TradingView: submit-order, close-position, .order-buy-button, .order-sell-button, .button-close
      const isTradingViewBtn =
        node.getAttribute("data-name") === "submit-order" ||
        node.getAttribute("data-name") === "close-position" ||
        className.includes("order-buy-button") ||
        className.includes("order-sell-button") ||
        className.includes("button-close");

      // 4. Keyword matches for Sell, Buy, Exit, Square Off, Instant Sell, Instant Buy
      const hasOrderKeywords =
        /\b(instant\s*sell|instant\s*buy|sell\s*market|buy\s*market|sell\s*limit|buy\s*limit|place\s*order|submit\s*order|execute\s*order|confirm\s*order|square\s*off|squareoff|close\s*position|exit\s*position|close\s*trade)\b/i.test(
          cleanText
        ) ||
        /^(instant\s*sell|instant\s*buy|sell|buy|exit|square\s*off|submit|execute)(\s|$)/i.test(cleanText);

      // Cancel / Dismiss filters
      const isCancelAction = /^(cancel|dismiss|back|settings|close\s*dialog|help)\b/i.test(cleanText);

      // Check if inside an Order Window / Modal / Dialog
      const isInsideOrderWindow = Boolean(
        node.closest &&
        node.closest(
          ".order-window, .order-form, .dialog-box, .modal-content, [class*='order'], [class*='ticket'], [class*='modal'], [class*='dialog']"
        )
      );

      // Position table close icon
      const isPositionCloseIcon =
        (cleanText === "x" || rawText.includes("✕") || rawText.includes("×")) &&
        Boolean(node.closest && node.closest("tr, [role='row'], [class*='position']"));

      if (!isCancelAction) {
        if (
          isDhanSubmitBtn ||
          isKiteSubmitBtn ||
          isTradingViewBtn ||
          hasOrderKeywords ||
          isPositionCloseIcon ||
          (isInsideOrderWindow &&
            (node.tagName.toLowerCase() === "button" ||
              node.getAttribute("role") === "button" ||
              node.type === "submit"))
        ) {
          const clickable = node.closest
            ? node.closest("button, [role='button'], a, div[class*='btn'], div[id*='btn'], input[type='submit']") || node
            : node;

          console.log("%c[TradeGuard 🛡️] TARGET RESOLVED:", "background: #10b981; color: black; font-weight: bold; padding: 2px 6px;", {
            clickable,
            cleanText,
            isDhanSubmitBtn,
            isKiteSubmitBtn
          });
          return clickable;
        }
      }
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
    ).toUpperCase();

    let side = "ORDER";

    if (rawText.includes("SELL") || rawText.includes("EXIT") || rawText.includes("SQUARE") || rawText.includes("CLOSE")) {
      side = "SELL";
    } else if (rawText.includes("BUY")) {
      side = "BUY";
    }

    // Try to scrape symbol from modal or position row
    let symbolGuess = "";

    const modalContainer = targetBtn.closest
      ? targetBtn.closest("[class*='modal'], [class*='dialog'], .order-window, [class*='ticket']")
      : null;

    if (modalContainer) {
      const headerEl = modalContainer.querySelector("h1, h2, h3, h4, [class*='title'], [class*='header'], [class*='symbol']");
      if (headerEl && headerEl.textContent) {
        symbolGuess = headerEl.textContent.trim().replace(/\s+/g, " ");
      }
    }

    if (!symbolGuess && targetBtn.closest) {
      const row = targetBtn.closest("tr, [role='row'], [class*='position']");
      if (row) {
        const symEl = row.querySelector(".symbol, .instrument, [class*='symbol'], [class*='tradable'], td:first-child");
        if (symEl && symEl.textContent) {
          symbolGuess = symEl.textContent.trim().replace(/\s+/g, " ");
        }
      }
    }

    if (!symbolGuess) {
      const titleParts = document.title.split(" ");
      if (titleParts[0]) {
        symbolGuess = titleParts[0].replace(/[^A-Za-z0-9:_-]/gi, "");
      }
    }

    return {
      side,
      symbol: symbolGuess || "TATASTEEL / ACTIVE ORDER"
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
    host.style.all = "initial"; // Immunize against inherited broker styles
    host.style.position = "fixed";
    host.style.top = "0";
    host.style.left = "0";
    host.style.width = "100vw";
    host.style.height = "100vh";
    host.style.zIndex = "2147483647";
    host.style.display = "block";
    host.style.pointerEvents = "auto";

    const shadow = host.attachShadow({ mode: "open" });
    activeModalHost = host;

    const isSell = context.side === "SELL";
    const sideColor = isSell ? "#ef4444" : "#10b981";
    const sideBg = isSell ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)";
    const sideBorder = isSell ? "#ef4444" : "#10b981";

    shadow.innerHTML = `
      <style>
        * { box-sizing: border-box; }
        .backdrop {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          background: rgba(2, 6, 23, 0.92);
          backdrop-filter: blur(8px);
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
          width: 450px;
          max-width: 92vw;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 12px;
          padding: 22px;
          color: #f8fafc;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.08);
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

    (document.body || document.documentElement).appendChild(host);

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
   * Programmatically dispatches native MouseEvents to trigger React / Angular component handlers cleanly.
   */
  function executePassThrough(targetBtn) {
    isBypassing = true;
    closeChecklistModal();

    console.log("%c[TradeGuard 🛡️] VERIFIED: DISPATCHING PASSTHROUGH TO BROKER", "background: #10b981; color: white;", targetBtn);

    try {
      // 1. Native click()
      targetBtn.click();

      // 2. Synthetic MouseEvent for Angular / React Zone.js compatibility
      const clickEvt = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window
      });
      targetBtn.dispatchEvent(clickEvt);
    } catch (err) {
      console.error("[TradeGuard] Pass-through error:", err);
    } finally {
      setTimeout(() => {
        isBypassing = false;
      }, 400);
    }
  }

  /**
   * Synchronous capture-phase interceptor
   */
  function handleCaptureEvent(e) {
    if (isBypassing) {
      return; // Safe replay in progress
    }

    if (!isEnabled) {
      return; // Disabled by user
    }

    // Suppress multiple triggers for the same action within 150ms
    const now = Date.now();
    if (now - lastModalOpenTime < 150) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return;
    }

    const orderBtn = findOrderSubmitButton(e);
    if (!orderBtn) {
      return;
    }

    lastModalOpenTime = now;

    // IMMEDIATE SYNCHRONOUS DOM FREEZE
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    console.log(
      "%c[TradeGuard 🛡️] CLICK INTERCEPTED ON BROKER BUTTON!",
      "background: #ef4444; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
      orderBtn
    );

    // Display Gatekeeper checklist
    openChecklistModal(orderBtn, currentRules);
  }

  // Register in the CAPTURE phase at window level (highest possible DOM precedence)
  window.addEventListener("click", handleCaptureEvent, true);
  window.addEventListener("mousedown", handleCaptureEvent, true);
})();
