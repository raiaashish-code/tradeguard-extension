/**
 * TradeGuard MVP 1.0.6 — Zero-API Pre-Trade & Open Position Exit Checklist Extension
 * 
 * Bulletproof Stacking & Event Interception:
 * - Highest Stacking Level: z-index 2147483647 with !important attached to document.documentElement
 * - Suppresses background broker modals (Dhan, Zerodha, TradingView) from drawing in front
 * - Restores broker overlay styles seamlessly upon Confirm or Abort
 * - Pierces Web Components / Shadow DOM with composedPath()
 * - Strictly ignores clicks inside TradeGuard UI (#tradeguard-shadow-host)
 * - Keyboard rapid-check (1-9 toggle, Enter confirm, Esc abort)
 */

(function () {
  const DEFAULT_RULES = [
    "Is my Stop-Loss strictly defined and entered?",
    "Am I risking less than 1% of total capital?",
    "Is this setup aligned with the higher-timeframe trend (No FOMO)?"
  ];

  let isEnabled = true;
  let currentRules = DEFAULT_RULES;
  let isBypassing = false;
  let activeModalHost = null;
  let activeKeyDownHandler = null;
  let suppressedBrokerElements = [];

  console.log(
    "%c[TradeGuard 🛡️ v1.0.6] ACTIVE ON THIS TAB",
    "background: #0284c7; color: white; font-weight: bold; padding: 4px 10px; border-radius: 4px;"
  );

  // Sync settings from chrome.storage
  try {
    if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get({ rules: DEFAULT_RULES, enabled: true }, (data) => {
        if (data) {
          if (Array.isArray(data.rules) && data.rules.length > 0) currentRules = data.rules;
          if (typeof data.enabled === "boolean") isEnabled = data.enabled;
        }
      });

      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "local") {
          if (changes.rules && changes.rules.newValue) currentRules = changes.rules.newValue;
          if (changes.enabled && typeof changes.enabled.newValue === "boolean") isEnabled = changes.enabled.newValue;
        }
      });
    }
  } catch (err) {
    console.warn("[TradeGuard] Storage access notice:", err);
  }

  // Visual status pill
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
      alert("TradeGuard v1.0.6 is ACTIVE.\n\nGuarding all Buy, Sell, and Position Exit/Square-Off orders on this tab.");
    };

    (document.documentElement || document.body).appendChild(pill);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectStatusPill);
  } else {
    injectStatusPill();
  }

  /**
   * Identifies if a click is strictly targeted at an order submit or position exit button.
   * Pierces shadow roots and ignores clicks within TradeGuard's own UI.
   */
  function findOrderSubmitButton(e) {
    if (!e) return null;

    // RULE 1: NEVER intercept clicks inside TradeGuard's own modal or pill
    const path = typeof e.composedPath === "function" ? e.composedPath() : [];
    for (const n of path) {
      if (n.id === "tradeguard-shadow-host" || n.id === "tradeguard-live-pill") {
        return null;
      }
    }
    if (activeModalHost) {
      return null; // Modal is already open
    }

    // RULE 2: Locate the specific button node along the composed path
    let btnNode = null;
    for (const node of path) {
      if (!node || node.nodeType !== 1) continue;
      const tag = node.tagName ? node.tagName.toLowerCase() : "";
      const cls = typeof node.className === "string" ? node.className.toLowerCase() : "";
      const id = typeof node.id === "string" ? node.id.toLowerCase() : "";
      const role = (node.getAttribute && node.getAttribute("role") || "").toLowerCase();

      // Check if node is an actual button element
      if (
        tag === "button" ||
        role === "button" ||
        (tag === "input" && (node.type === "submit" || node.type === "button")) ||
        id === "btnsubmit" ||
        cls.includes("btn-submit") ||
        cls.includes("btn-sell") ||
        cls.includes("btn-buy") ||
        cls.includes("btn-orange") ||
        cls.includes("btn-blue") ||
        cls.includes("instant-sell") ||
        cls.includes("btn-squareoff") ||
        cls.includes("button-close") ||
        node.getAttribute("data-name") === "submit-order" ||
        node.getAttribute("data-name") === "close-position"
      ) {
        btnNode = node;
        break;
      }
    }

    if (!btnNode || btnNode.disabled) return null;

    // RULE 3: Inspect text ONLY on the identified button
    const rawText = (
      btnNode.innerText ||
      btnNode.textContent ||
      btnNode.value ||
      btnNode.getAttribute("aria-label") ||
      btnNode.getAttribute("title") ||
      btnNode.getAttribute("data-name") ||
      ""
    );

    const cleanText = rawText
      .replace(/[^\w\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    // Ignore navigation tabs and filters
    if (
      /^(open|closed|in loss|today|all|normal|trading|market|limit|super|trail|vwap|more options|set p l exit|analyse)$/i.test(
        cleanText
      )
    ) {
      return null;
    }

    // Ignore cancel / dismiss buttons
    if (/^(cancel|dismiss|back|settings|close dialog|help)$/i.test(cleanText)) {
      return null;
    }

    // Check for order keywords
    const isOrderAction =
      /\b(instant sell|instant buy|sell market|buy market|sell limit|buy limit|place order|submit order|square off|squareoff|close position|exit position|close trade)\b/i.test(
        cleanText
      ) ||
      /^(instant sell|instant buy|sell|buy|exit|square off|submit|execute)$/i.test(cleanText);

    // Check for known broker classes
    const cls = typeof btnNode.className === "string" ? btnNode.className.toLowerCase() : "";
    const id = typeof btnNode.id === "string" ? btnNode.id.toLowerCase() : "";

    const isBrokerOrderClass =
      id.includes("btnsubmit") ||
      cls.includes("btn-submit") ||
      cls.includes("btn-sell") ||
      cls.includes("btn-buy") ||
      cls.includes("btn-orange") ||
      cls.includes("btn-blue") ||
      cls.includes("instant-sell") ||
      btnNode.getAttribute("data-name") === "submit-order" ||
      btnNode.getAttribute("data-name") === "close-position";

    // Check for table row position close icon
    const isPositionCloseIcon =
      (cleanText === "x" || rawText.includes("✕") || rawText.includes("×")) &&
      Boolean(btnNode.closest && btnNode.closest("tr, [role='row'], [class*='position']"));

    if (isOrderAction || isBrokerOrderClass || isPositionCloseIcon) {
      console.log("%c[TradeGuard 🛡️] TARGET RESOLVED:", "background: #10b981; color: black; font-weight: bold; padding: 2px 6px;", {
        element: btnNode,
        cleanText,
        isBrokerOrderClass
      });
      return btnNode;
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

    let symbolGuess = "";

    // Check open modal title (like Dhan's modal header "TATASTEEL 23 NOV 195 CALL")
    const modalContainer = targetBtn.closest
      ? targetBtn.closest("[class*='modal'], [class*='dialog'], .order-window, [class*='ticket'], [class*='cdk-overlay']")
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
   * Temporarily suppresses broker overlay containers and dialogs so TradeGuard sits strictly on top.
   */
  function suppressBrokerOverlays(targetBtn) {
    suppressedBrokerElements = [];
    if (!targetBtn) return;

    // 1. Walk up targetBtn ancestors to find any positioned / dialog / modal elements
    let curr = targetBtn.parentElement;
    while (curr && curr !== document.body && curr !== document.documentElement) {
      try {
        const comp = window.getComputedStyle(curr);
        const z = parseInt(comp.zIndex, 10);
        const isPositioned = comp.position === "fixed" || comp.position === "absolute" || comp.position === "relative";
        const hasModalClass = /modal|dialog|ticket|order-window|overlay|drawer|cdk/i.test(
          (typeof curr.className === "string" ? curr.className : "") + " " + (curr.id || "")
        );

        if ((!isNaN(z) && z > 0) || isPositioned || hasModalClass) {
          suppressedBrokerElements.push({
            el: curr,
            zIndex: curr.style.getPropertyValue("z-index"),
            zIndexPriority: curr.style.getPropertyPriority("z-index"),
            pointerEvents: curr.style.getPropertyValue("pointer-events"),
            pointerEventsPriority: curr.style.getPropertyPriority("pointer-events")
          });
          curr.style.setProperty("z-index", "1", "important");
          curr.style.setProperty("pointer-events", "none", "important");
        }
      } catch (err) {
        // Ignore cross-origin / detached node errors
      }
      curr = curr.parentElement;
    }

    // 2. Also search for any active broker modal containers in document.body
    try {
      const candidates = document.querySelectorAll(
        "[class*='cdk-overlay'], [class*='modal-dialog'], [class*='order-window'], [class*='order-ticket'], [class*='dialog-container']"
      );
      for (const el of candidates) {
        if (el && el.id !== "tradeguard-shadow-host") {
          suppressedBrokerElements.push({
            el,
            zIndex: el.style.getPropertyValue("z-index"),
            zIndexPriority: el.style.getPropertyPriority("z-index"),
            pointerEvents: el.style.getPropertyValue("pointer-events"),
            pointerEventsPriority: el.style.getPropertyPriority("pointer-events")
          });
          el.style.setProperty("z-index", "1", "important");
          el.style.setProperty("pointer-events", "none", "important");
        }
      }
    } catch (_) {}
  }

  /**
   * Restores broker elements to their exact original inline styles and priorities.
   */
  function restoreBrokerOverlays() {
    if (Array.isArray(suppressedBrokerElements)) {
      for (const item of suppressedBrokerElements) {
        try {
          if (item && item.el && item.el.style) {
            if (item.zIndex) {
              item.el.style.setProperty("z-index", item.zIndex, item.zIndexPriority || "");
            } else {
              item.el.style.removeProperty("z-index");
            }
            if (item.pointerEvents) {
              item.el.style.setProperty("pointer-events", item.pointerEvents, item.pointerEventsPriority || "");
            } else {
              item.el.style.removeProperty("pointer-events");
            }
          }
        } catch (_) {}
      }
    }
    suppressedBrokerElements = [];
  }

  /**
   * Displays the isolated Shadow DOM checklist modal overlay with absolute top stacking context.
   */
  function openChecklistModal(targetBtn, rules) {
    closeChecklistModal();

    // Suppress broker modal ancestors from drawing over TradeGuard
    suppressBrokerOverlays(targetBtn);

    const context = extractScreenContext(targetBtn);
    const host = document.createElement("div");
    host.id = "tradeguard-shadow-host";
    
    // Explicit !important styles on host to ensure it sits above all page stacking contexts
    host.style.setProperty("all", "initial", "important");
    host.style.setProperty("position", "fixed", "important");
    host.style.setProperty("top", "0px", "important");
    host.style.setProperty("left", "0px", "important");
    host.style.setProperty("right", "0px", "important");
    host.style.setProperty("bottom", "0px", "important");
    host.style.setProperty("width", "100vw", "important");
    host.style.setProperty("height", "100vh", "important");
    host.style.setProperty("z-index", "2147483647", "important");
    host.style.setProperty("display", "block", "important");
    host.style.setProperty("pointer-events", "auto", "important");
    host.style.setProperty("isolation", "isolate", "important");

    const shadow = host.attachShadow({ mode: "open" });
    activeModalHost = host;

    const isSell = context.side === "SELL";
    const sideColor = isSell ? "#ef4444" : "#10b981";
    const sideBg = isSell ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)";
    const sideBorder = isSell ? "#ef4444" : "#10b981";

    shadow.innerHTML = `
      <style>
        :host {
          all: initial !important;
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          z-index: 2147483647 !important;
          display: block !important;
          pointer-events: auto !important;
          isolation: isolate !important;
        }
        * { box-sizing: border-box; }
        .backdrop {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          right: 0 !important;
          bottom: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          background: rgba(2, 6, 23, 0.95) !important;
          backdrop-filter: blur(12px) !important;
          -webkit-backdrop-filter: blur(12px) !important;
          z-index: 2147483647 !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          animation: tgFadeIn 0.15s ease-out !important;
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
          position: relative !important;
          z-index: 2147483647 !important;
          width: 480px !important;
          max-width: 92vw !important;
          background: #0f172a !important;
          border: 1px solid #334155 !important;
          border-radius: 12px !important;
          padding: 24px !important;
          color: #f8fafc !important;
          box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
          animation: tgCardPop 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 14px;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 14px;
        }
        .top-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .logo-icon {
          width: 20px;
          height: 20px;
          fill: #38bdf8;
        }
        h3 {
          margin: 0;
          font-size: 16px;
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
          margin: 0 0 16px 0;
          font-size: 13px;
          color: #94a3b8;
          line-height: 1.45;
        }
        .symbol-tag {
          font-weight: 700;
          color: #f1f5f9;
        }
        .checklist {
          display: flex;
          flex-direction: column;
          gap: 9px;
          margin-bottom: 20px;
        }
        .item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          background: #1e293b;
          border: 1px solid #334155;
          padding: 11px 14px;
          border-radius: 8px;
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
          background: rgba(2, 132, 199, 0.15);
        }
        .item input[type="checkbox"] {
          margin-top: 2px;
          accent-color: #38bdf8;
          cursor: pointer;
          width: 17px;
          height: 17px;
        }
        .item-text {
          flex: 1;
          font-size: 13px;
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
          width: 20px;
          height: 20px;
          background: #334155;
          color: #94a3b8;
          font-size: 11px;
          font-weight: 700;
          border-radius: 4px;
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
          padding: 11px 16px;
          border-radius: 8px;
          font-size: 13px;
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
          margin-top: 14px;
          padding-top: 12px;
          border-top: 1px solid #1e293b;
          font-size: 11px;
          color: #64748b;
        }
        .kbd-pill {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 4px;
          padding: 1px 6px;
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

    // Mount to document.documentElement (root) to supersede body stacking contexts
    const mountTarget = document.documentElement || document.body;
    mountTarget.appendChild(host);

    const items = shadow.querySelectorAll(".item");
    const checkboxes = shadow.querySelectorAll("input[type='checkbox']");
    const confirmBtn = shadow.querySelector("#tgConfirmBtn");
    const cancelBtn = shadow.querySelector("#tgCancelBtn");
    const backdrop = shadow.querySelector("#tgBackdrop");

    function updateConfirmState() {
      const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
      confirmBtn.disabled = !allChecked;
    }

    // Toggle items by row click
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

    // Abort button
    cancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      closeChecklistModal();
    });

    // Dismiss on backdrop click
    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        e.stopPropagation();
        closeChecklistModal();
      }
    });

    // Confirm button -> Safe Replay
    confirmBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      executePassThrough(targetBtn);
    });

    // Keyboard navigation (FR-04)
    activeKeyDownHandler = function (e) {
      // Keys 1-9 to toggle checklist items
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

      // Enter to confirm ONLY IF all checkboxes are checked
      if (e.key === "Enter") {
        const allChecked = Array.from(checkboxes).every((cb) => cb.checked);
        if (allChecked) {
          e.preventDefault();
          e.stopPropagation();
          executePassThrough(targetBtn);
        } else {
          console.log("[TradeGuard 🛡️] Cannot submit: Not all checklist items are verified.");
        }
        return;
      }

      // Escape to abort order
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        closeChecklistModal();
      }
    };

    window.addEventListener("keydown", activeKeyDownHandler, true);
  }

  function closeChecklistModal() {
    restoreBrokerOverlays();
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
      targetBtn.click();

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
      }, 500);
    }
  }

  /**
   * Synchronous capture-phase interceptor
   */
  function handleCaptureClick(e) {
    if (isBypassing) {
      return; // Safe replay in progress
    }

    if (!isEnabled) {
      return; // Disabled by user
    }

    const orderBtn = findOrderSubmitButton(e);
    if (!orderBtn) {
      return;
    }

    // IMMEDIATE SYNCHRONOUS DOM FREEZE
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    console.log(
      "%c[TradeGuard 🛡️] CLICK INTERCEPTED ON BROKER ORDER BUTTON!",
      "background: #ef4444; color: white; font-weight: bold; padding: 4px 8px; border-radius: 4px;",
      orderBtn
    );

    // Display Gatekeeper checklist
    openChecklistModal(orderBtn, currentRules);
  }

  // Register strictly in the CAPTURE phase on window
  window.addEventListener("click", handleCaptureClick, true);
})();
