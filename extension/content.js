/**
 * TradeKavach+ v1.3.0 — Pre-Trade Discipline Gatekeeper Chrome Extension
 *
 * Features:
 * - Zero-API capture-phase DOM freeze & safe replay
 * - Strictly isolated to supported web trading & charting terminals
 * - Live 1% Stop-Loss Risk & Position Sizing Check + Strict Excess-Risk Guard
 * - Indian Market 9:15–9:30 AM IST Opening Volatility Guard
 * - Hard Daily Trade Cap & Manual "Stop Myself" Panic Lockout (never blocks Exits/Square-Off)
 * - Pre-Trade Mood Check-In + 5-second anti-tilt pause for FOMO / Revenge
 * - Revenge-Trade Cooling-Off Timer + Calm-You Reminder
 * - Tracks Trades Skipped [Esc] & Logs Executions locally for Dashboard & CSV Export
 */

(function () {
  const ALLOWED_TRADING_DOMAINS = [
    "tradingview.com",
    "dhan.co",
    "scanx.trade",
    "kite.zerodha.com",
    "upstox.com",
    "fyers.in",
    "groww.in",
    "sahi.com",
    "icicidirect.com",
    "sbisecurities.in",
    "sbismart.com",
    "angelone.in",
    "kotaksecurities.com",
    "hdfcsky.com",
    "hdfcsec.com",
    "motilaloswal.com",
    "5paisa.com",
    "aliceblueonline.com",
    "paytmmoney.com",
    "sensibull.com",
    "shoonya.com",
    "flattrade.in",
    "mstock.com",
    "sharekhan.com",
    "samco.in",
    "axisdirect.in",
    "definedge.com",
    "delta.exchange",
    "coindcx.com"
  ];

  const NON_TRADING_PATH_REGEX = /^\/(blog|blogs|learn|academy|calculators?|mutual-funds?|sip|loans?|insurance|credit-cards?|careers|about|contact|pricing|help|support|faq|news|ideas|scripts|markets|screener)(\/|$)/i;
  const ROOT_TRADING_PATH_REGEX = /^\/(chart|charts|trade|terminal|stocks|futures-and-options|indices|commodities|orders|positions|portfolio|watchlist|option-chain|options|futures|fno|equity|commodity|app)(\/|$)/i;

  function isTradingTerminalSite() {
    try {
      const host = (window.location && window.location.hostname ? window.location.hostname : "").toLowerCase();
      const pathname = (window.location && window.location.pathname ? window.location.pathname : "/").toLowerCase();
      if (!host) return false;

      const isAllowedHost = ALLOWED_TRADING_DOMAINS.some(
        (domain) => host === domain || host.endsWith("." + domain)
      );
      if (!isAllowedHost) return false;

      if (NON_TRADING_PATH_REGEX.test(pathname)) {
        return false;
      }

      if (host.endsWith("tradingview.com") && !host.startsWith("tv.")) {
        return /^\/(chart|trading)(\/|$)/i.test(pathname);
      }

      const isDedicatedTerminalSubdomain = /^(web|trade|pro|tv|kite|ant|neo|nt|secure|ttweb|india|online|app|newtrade|opstra|terminal|charts|desk|plus|live|my)\./i.test(host);
      if (isDedicatedTerminalSubdomain) return true;

      return ROOT_TRADING_PATH_REGEX.test(pathname);
    } catch (_) {
      return false;
    }
  }

  if (!isTradingTerminalSite()) {
    return;
  }

  const DEFAULT_RULES = [
    "Is my Stop-Loss strictly defined and entered?",
    "Am I risking less than 1% of total capital?",
    "Is this setup aligned with the higher-timeframe trend (No FOMO)?"
  ];

  let isEnabled = true;
  let currentRules = DEFAULT_RULES;
  let capital = 200000;
  let maxRiskPercent = 1.0;
  let cooldownMinutes = 3;
  let maxTradesPerDay = 5;
  let cooldownUntil = 0;
  let panicLockUntil = 0;
  let openingGuardEnabled = true;
  let strictRiskConfirm = true;
  let currentMood = "Calm";
  let calmNote = "Protect capital first. Missing a trade costs ₹0; a revenge trade ruins the whole week.";
  let tradesSkipped = 0;
  let rulesTriggered = 0;
  let tradeJournal = [];

  let isBypassing = false;
  let activeModalHost = null;
  let activeKeyDownHandler = null;
  let activeCooldownTimer = null;
  let activeTiltTimer = null;
  let suppressedBrokerElements = [];

  console.log(
    "%c[TradeKavach+ 🛡️ v1.3.0] ACTIVE ON TRADING TERMINAL",
    "background: #0284c7; color: white; font-weight: bold; padding: 4px 10px; border-radius: 4px;"
  );

  function syncSettings() {
    try {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(
          {
            rules: DEFAULT_RULES,
            enabled: true,
            capital: 200000,
            maxRiskPercent: 1.0,
            cooldownMinutes: 3,
            maxTradesPerDay: 5,
            cooldownUntil: 0,
            panicLockUntil: 0,
            openingGuardEnabled: true,
            strictRiskConfirm: true,
            currentMood: "Calm",
            calmNote: "Protect capital first. Missing a trade costs ₹0; a revenge trade ruins the whole week.",
            tradesSkipped: 0,
            rulesTriggered: 0,
            tradeJournal: []
          },
          (data) => {
            if (!data) return;
            if (Array.isArray(data.rules) && data.rules.length > 0) currentRules = data.rules;
            if (typeof data.enabled === "boolean") isEnabled = data.enabled;
            if (typeof data.capital === "number") capital = data.capital;
            if (typeof data.maxRiskPercent === "number") maxRiskPercent = data.maxRiskPercent;
            if (typeof data.cooldownMinutes === "number") cooldownMinutes = data.cooldownMinutes;
            if (typeof data.maxTradesPerDay === "number") maxTradesPerDay = data.maxTradesPerDay;
            if (typeof data.cooldownUntil === "number") cooldownUntil = data.cooldownUntil;
            if (typeof data.panicLockUntil === "number") panicLockUntil = data.panicLockUntil;
            if (typeof data.openingGuardEnabled === "boolean") openingGuardEnabled = data.openingGuardEnabled;
            if (typeof data.strictRiskConfirm === "boolean") strictRiskConfirm = data.strictRiskConfirm;
            if (data.currentMood) currentMood = data.currentMood;
            if (typeof data.calmNote === "string") calmNote = data.calmNote;
            if (typeof data.tradesSkipped === "number") tradesSkipped = data.tradesSkipped;
            if (typeof data.rulesTriggered === "number") rulesTriggered = data.rulesTriggered;
            if (Array.isArray(data.tradeJournal)) tradeJournal = data.tradeJournal;
          }
        );

        chrome.storage.onChanged.addListener((changes, area) => {
          if (area !== "local") return;
          if (changes.rules && changes.rules.newValue) currentRules = changes.rules.newValue;
          if (changes.enabled && typeof changes.enabled.newValue === "boolean") isEnabled = changes.enabled.newValue;
          if (changes.capital && typeof changes.capital.newValue === "number") capital = changes.capital.newValue;
          if (changes.maxRiskPercent && typeof changes.maxRiskPercent.newValue === "number") maxRiskPercent = changes.maxRiskPercent.newValue;
          if (changes.cooldownMinutes && typeof changes.cooldownMinutes.newValue === "number") cooldownMinutes = changes.cooldownMinutes.newValue;
          if (changes.maxTradesPerDay && typeof changes.maxTradesPerDay.newValue === "number") maxTradesPerDay = changes.maxTradesPerDay.newValue;
          if (changes.cooldownUntil && typeof changes.cooldownUntil.newValue === "number") cooldownUntil = changes.cooldownUntil.newValue;
          if (changes.panicLockUntil && typeof changes.panicLockUntil.newValue === "number") panicLockUntil = changes.panicLockUntil.newValue;
          if (changes.openingGuardEnabled && typeof changes.openingGuardEnabled.newValue === "boolean") openingGuardEnabled = changes.openingGuardEnabled.newValue;
          if (changes.strictRiskConfirm && typeof changes.strictRiskConfirm.newValue === "boolean") strictRiskConfirm = changes.strictRiskConfirm.newValue;
          if (changes.currentMood && changes.currentMood.newValue) currentMood = changes.currentMood.newValue;
          if (changes.calmNote && typeof changes.calmNote.newValue === "string") calmNote = changes.calmNote.newValue;
          if (changes.tradesSkipped && typeof changes.tradesSkipped.newValue === "number") tradesSkipped = changes.tradesSkipped.newValue;
          if (changes.rulesTriggered && typeof changes.rulesTriggered.newValue === "number") rulesTriggered = changes.rulesTriggered.newValue;
          if (changes.tradeJournal && Array.isArray(changes.tradeJournal.newValue)) tradeJournal = changes.tradeJournal.newValue;
        });
      }
    } catch (err) {
      console.warn("[TradeKavach+] Storage access notice:", err);
    }
  }
  syncSettings();

  function getTodayTradesCount() {
    const todayStr = new Date().toDateString();
    return tradeJournal.filter((t) => {
      try {
        return new Date(t.timestamp).toDateString() === todayStr;
      } catch (_) {
        return false;
      }
    }).length;
  }

  function isOpeningChaosWindowIST() {
    try {
      const now = new Date();
      const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
      const istDate = new Date(utcMs + 330 * 60000);
      const day = istDate.getDay();
      if (day === 0 || day === 6) return false;
      const minutes = istDate.getHours() * 60 + istDate.getMinutes();
      return minutes >= 9 * 60 + 15 && minutes <= 9 * 60 + 30;
    } catch (_) {
      return false;
    }
  }

  function incrementCounter(key) {
    try {
      if (key === "tradesSkipped") {
        tradesSkipped += 1;
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ tradesSkipped });
        }
      } else if (key === "rulesTriggered") {
        rulesTriggered += 1;
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
          chrome.storage.local.set({ rulesTriggered });
        }
      }
    } catch (_) {}
  }

  function injectStatusPill() {
    if (window !== window.top) return;
    if (document.getElementById("tradeguard-live-pill")) return;

    const pill = document.createElement("div");
    pill.id = "tradeguard-live-pill";
    pill.setAttribute(
      "style",
      [
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
        "opacity: 0.92",
        "transition: opacity 0.2s, transform 0.2s"
      ].join(";")
    );

    pill.innerHTML = `
      <span style="display:inline-block; width:7px; height:7px; border-radius:50%; background:#10b981;"></span>
      <span>TradeKavach+</span>
    `;

    pill.title = "Click to view TradeKavach+ Guide & Shortcuts";
    pill.onclick = () => {
      openGuideModal();
    };

    (document.body || document.documentElement).appendChild(pill);
  }

  function openGuideModal() {
    closeChecklistModal();

    const host = document.createElement("div");
    host.id = "tradeguard-shadow-host";
    host.style.setProperty("all", "initial", "important");
    host.style.setProperty("position", "fixed", "important");
    host.style.setProperty("top", "0px", "important");
    host.style.setProperty("left", "0px", "important");
    host.style.setProperty("width", "100vw", "important");
    host.style.setProperty("height", "100vh", "important");
    host.style.setProperty("z-index", "2147483647", "important");
    host.style.setProperty("display", "block", "important");

    const shadow = host.attachShadow({ mode: "open" });
    activeModalHost = host;

    shadow.innerHTML = `
      <style>
        :host { all: initial !important; position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 2147483647 !important; }
        * { box-sizing: border-box; }
        .backdrop {
          position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important;
          background: rgba(2, 6, 23, 0.95) !important; backdrop-filter: blur(12px) !important;
          display: flex !important; align-items: center !important; justify-content: center !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          color: #f8fafc !important;
        }
        .card {
          width: 520px !important; max-width: 94vw !important; max-height: 90vh !important; overflow-y: auto !important;
          background: #0f172a !important; border: 1px solid #38bdf8 !important; border-radius: 14px !important;
          padding: 24px !important; box-shadow: 0 25px 60px -10px rgba(0,0,0,0.95), 0 0 25px rgba(56, 189, 248, 0.2) !important;
        }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; padding-bottom: 12px; margin-bottom: 16px; }
        .title { font-size: 16px; font-weight: 700; color: #38bdf8; display: flex; align-items: center; gap: 8px; }
        .close-btn { background: transparent; border: none; color: #94a3b8; font-size: 22px; cursor: pointer; padding: 2px 8px; border-radius: 4px; line-height: 1; }
        .close-btn:hover { color: #f8fafc; background: #1e293b; }
        .section { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 12px; margin-bottom: 10px; }
        .sec-title { font-size: 12.5px; font-weight: 700; color: #38bdf8; margin-bottom: 5px; }
        .sec-desc { font-size: 11.5px; color: #cbd5e1; line-height: 1.5; }
        .kbd { background: #0f172a; border: 1px solid #475569; color: #f8fafc; font-family: monospace; font-size: 11px; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
        .rules-preview { margin: 8px 0 0 0; padding-left: 18px; font-size: 11.5px; color: #94a3b8; }
        .rules-preview li { margin-bottom: 4px; }
        .btn-done { width: 100%; margin-top: 14px; padding: 11px; border-radius: 8px; font-weight: 700; font-size: 12px; background: #0284c7; color: white; border: none; cursor: pointer; }
        .btn-done:hover { background: #0369a1; }
      </style>
      <div class="backdrop">
        <div class="card">
          <div class="header">
            <div class="title">
              <span>🛡️ TradeKavach+ Guide</span>
            </div>
            <button type="button" class="close-btn" id="tgCloseGuide" title="Close [Esc]">×</button>
          </div>

          <div class="section">
            <div class="sec-title">🎯 Pre-Trade Discipline Gatekeeper</div>
            <div class="sec-desc">
              Pauses <strong>Buy</strong>, <strong>Sell</strong>, <strong>Place Order</strong>, and <strong>Square Off</strong> clicks cleanly before broker dispatch.
              <ul class="rules-preview">
                ${currentRules.map((r, i) => `<li><strong>${i + 1}.</strong> ${r}</li>`).join("")}
              </ul>
            </div>
          </div>

          <div class="section">
            <div class="sec-title">🛑 Panic Lockout &amp; Daily Trade Cap</div>
            <div class="sec-desc">
              Today's trades: <strong>${getTodayTradesCount()} / ${maxTradesPerDay}</strong>. Panic Lockout &amp; Daily Cap block new entries while <strong>always letting you Exit / Square Off</strong> open positions safely.
            </div>
          </div>

          <div class="section">
            <div class="sec-title">🧮 Live 1% Risk &amp; 9:15 AM IST Guard</div>
            <div class="sec-desc">
              Calculates <span class="kbd">Risk = |Price - SL| × Qty</span> against Capital (<strong>₹${capital.toLocaleString()}</strong>) and warns during high-whipsaw NSE opening hours (9:15–9:30 AM IST).
            </div>
          </div>

          <div class="section">
            <div class="sec-title">⌨️ Keyboard Shortcuts</div>
            <div class="sec-desc">
              • <span class="kbd">1</span> – <span class="kbd">5</span>: Rapid toggle checklist items<br>
              • <span class="kbd">Enter</span>: Submit verified order<br>
              • <span class="kbd">Esc</span>: Skip/Abort order cleanly (counts toward Skipped Trades)
            </div>
          </div>

          <button type="button" class="btn-done" id="tgDoneBtn">Back to Terminal [Esc]</button>
        </div>
      </div>
    `;

    document.body.appendChild(host);

    const closeBtn = shadow.querySelector("#tgCloseGuide");
    const doneBtn = shadow.querySelector("#tgDoneBtn");
    if (closeBtn) closeBtn.onclick = () => closeChecklistModal();
    if (doneBtn) doneBtn.onclick = () => closeChecklistModal();

    activeKeyDownHandler = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeChecklistModal();
      }
    };
    window.addEventListener("keydown", activeKeyDownHandler, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectStatusPill);
  } else {
    injectStatusPill();
  }

  function findOrderSubmitButton(e) {
    if (!e) return null;

    const path = typeof e.composedPath === "function" ? e.composedPath() : [];
    for (const n of path) {
      if (n.id === "tradeguard-shadow-host" || n.id === "tradeguard-live-pill") {
        return null;
      }
    }
    if (activeModalHost) {
      return null;
    }

    let btnNode = null;
    for (const node of path) {
      if (!node || node.nodeType !== 1) continue;
      const tag = node.tagName ? node.tagName.toLowerCase() : "";
      const cls = typeof node.className === "string" ? node.className.toLowerCase() : "";
      const id = typeof node.id === "string" ? node.id.toLowerCase() : "";
      const role = ((node.getAttribute && node.getAttribute("role")) || "").toLowerCase();

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

    const rawText =
      btnNode.innerText ||
      btnNode.textContent ||
      btnNode.value ||
      btnNode.getAttribute("aria-label") ||
      btnNode.getAttribute("title") ||
      btnNode.getAttribute("data-name") ||
      "";

    const cleanText = rawText
      .replace(/[^\w\s]/gi, " ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    if (
      /^(open|closed|in loss|today|all|normal|trading|market|limit|super|trail|vwap|more options|set p l exit|analyse)$/i.test(
        cleanText
      )
    ) {
      return null;
    }

    if (/^(cancel|dismiss|back|settings|close dialog|help|logout|sign out|buy pro|buy plan|subscribe)$/i.test(cleanText)) {
      return null;
    }

    const isOrderAction =
      /\b(instant sell|instant buy|sell now|buy now|sell market|buy market|sell limit|buy limit|place order|place buy|place sell|submit order|confirm order|confirm buy|confirm sell|execute order|square off|squareoff|sq off|close position|exit position|exit all|close trade)\b/i.test(
        cleanText
      ) ||
      /^(instant sell|instant buy|sell|buy|exit|square off|sq off|submit|execute)$/i.test(cleanText);

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

    const isPositionCloseIcon =
      (cleanText === "x" || rawText.includes("✕") || rawText.includes("×")) &&
      Boolean(btnNode.closest && btnNode.closest("tr, [role='row'], [class*='position']"));

    if (isOrderAction || isBrokerOrderClass || isPositionCloseIcon) {
      return btnNode;
    }

    return null;
  }

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
    let priceGuess = 100;
    let qtyGuess = 1;

    const root = typeof targetBtn.getRootNode === "function" ? targetBtn.getRootNode() : null;
    if (root && root.querySelector) {
      const headerEl = root.querySelector("h1, h2, h3, h4, [class*='title'], [class*='header'], [class*='symbol'], [class*='instrument']");
      if (headerEl && headerEl.textContent) {
        symbolGuess = headerEl.textContent.trim().replace(/\s+/g, " ");
      }
      const priceInput = root.querySelector("input[name*='price'], .input-price, input[step*='0.05'], input[type='number']");
      if (priceInput && parseFloat(priceInput.value)) {
        priceGuess = parseFloat(priceInput.value);
      }
      const qtyInput = root.querySelector("input[name*='qty'], .input-qty, .input-quantity");
      if (qtyInput && parseInt(qtyInput.value, 10)) {
        qtyGuess = parseInt(qtyInput.value, 10);
      }
    }

    if (!symbolGuess) {
      const modalContainer = targetBtn.closest
        ? targetBtn.closest("[class*='modal'], [class*='dialog'], .order-window, [class*='ticket'], [class*='cdk-overlay'], ofl-mini-order")
        : null;

      if (modalContainer) {
        const headerEl = modalContainer.querySelector("h1, h2, h3, h4, [class*='title'], [class*='header'], [class*='symbol']");
        if (headerEl && headerEl.textContent) {
          symbolGuess = headerEl.textContent.trim().replace(/\s+/g, " ");
        }
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
      symbol: symbolGuess || "ACTIVE TERMINAL ORDER",
      price: priceGuess,
      quantity: qtyGuess
    };
  }

  function suppressBrokerOverlays(targetBtn) {
    suppressedBrokerElements = [];
    if (!targetBtn) return;

    function suppressEl(el) {
      if (!el || el.id === "tradeguard-shadow-host" || el.id === "tradeguard-live-pill") return;
      try {
        suppressedBrokerElements.push({
          el,
          zIndex: el.style.getPropertyValue("z-index"),
          zIndexPriority: el.style.getPropertyPriority("z-index"),
          pointerEvents: el.style.getPropertyValue("pointer-events"),
          pointerEventsPriority: el.style.getPropertyPriority("pointer-events"),
          visibility: el.style.getPropertyValue("visibility"),
          visibilityPriority: el.style.getPropertyPriority("visibility")
        });
        el.style.setProperty("z-index", "0", "important");
        el.style.setProperty("pointer-events", "none", "important");
        el.style.setProperty("visibility", "hidden", "important");
      } catch (_) {}
    }

    try {
      const dhanMiniOrders = document.querySelectorAll("ofl-mini-order, [class*='mini-order']");
      for (const el of dhanMiniOrders) {
        suppressEl(el);
      }
    } catch (_) {}

    let curr = targetBtn;
    while (curr && curr !== document.body && curr !== document.documentElement) {
      suppressEl(curr);
      if (curr.getRootNode && curr.getRootNode() instanceof ShadowRoot) {
        curr = curr.getRootNode().host;
      } else if (curr.parentElement) {
        curr = curr.parentElement;
      } else {
        break;
      }
    }

    try {
      const candidates = document.querySelectorAll(
        "[class*='cdk-overlay'], [class*='modal-dialog'], [class*='order-window'], [class*='order-ticket'], [class*='dialog-container'], .modal, .dialog"
      );
      for (const el of candidates) {
        suppressEl(el);
      }
    } catch (_) {}
  }

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
            if (item.visibility) {
              item.el.style.setProperty("visibility", item.visibility, item.visibilityPriority || "");
            } else {
              item.el.style.removeProperty("visibility");
            }
          }
        } catch (_) {}
      }
    }
    suppressedBrokerElements = [];
  }

  /**
   * Displays either a Panic Lockout / Daily Trade Cap / Cooldown Breaker screen.
   */
  function openLockoutModal({ mode, untilTimestamp, todayCount }) {
    closeChecklistModal();
    incrementCounter("rulesTriggered");

    const host = document.createElement("div");
    host.id = "tradeguard-shadow-host";
    host.style.setProperty("all", "initial", "important");
    host.style.setProperty("position", "fixed", "important");
    host.style.setProperty("top", "0px", "important");
    host.style.setProperty("left", "0px", "important");
    host.style.setProperty("width", "100vw", "important");
    host.style.setProperty("height", "100vh", "important");
    host.style.setProperty("z-index", "2147483647", "important");
    host.style.setProperty("display", "block", "important");

    const shadow = host.attachShadow({ mode: "open" });
    activeModalHost = host;

    const isPanic = mode === "panic";
    const isDailyCap = mode === "dailyCap";
    const accent = isPanic ? "#f43f5e" : isDailyCap ? "#f59e0b" : "#38bdf8";
    const title = isPanic
      ? "🛑 Self-Lockout Active"
      : isDailyCap
      ? `🚫 Daily Limit Reached (${todayCount}/${maxTradesPerDay})`
      : "🧘 Revenge-Trade Cooling-Off";
    const subtitle = isPanic
      ? "You locked new entries to protect your capital. Open positions can still be exited anytime."
      : isDailyCap
      ? "You reached your maximum trades for today. Step back to protect today's capital from chop."
      : "Discipline gatekeeper active after position exit. Take 3 slow deep breaths.";

    shadow.innerHTML = `
      <style>
        :host { all: initial !important; position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important; z-index: 2147483647 !important; }
        * { box-sizing: border-box; }
        .backdrop {
          position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important;
          background: rgba(2, 6, 23, 0.95) !important; backdrop-filter: blur(14px) !important;
          display: flex !important; align-items: center !important; justify-content: center !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          color: #f8fafc !important;
        }
        .card {
          width: 460px !important; max-width: 92vw !important;
          background: #0f172a !important; border: 1px solid ${accent} !important; border-radius: 14px !important;
          padding: 26px !important; text-align: center !important;
          box-shadow: 0 25px 60px -10px rgba(0,0,0,0.9) !important;
        }
        .breathe-circle {
          width: 78px; height: 78px; border-radius: 50%;
          background: rgba(56, 189, 248, 0.12); border: 2px solid ${accent};
          margin: 10px auto 16px; display: flex; align-items: center; justify-content: center;
          font-size: 28px; animation: tgBreathe 6s ease-in-out infinite;
        }
        @keyframes tgBreathe {
          0%, 100% { transform: scale(0.92); opacity: 0.7; }
          50% { transform: scale(1.12); opacity: 1; }
        }
        h3 { margin: 0 0 8px 0; font-size: 18px; color: ${accent}; }
        p { margin: 0 0 14px 0; font-size: 13px; color: #94a3b8; line-height: 1.5; }
        .timer-box { font-size: 30px; font-weight: 800; color: #f8fafc; font-family: monospace; margin-bottom: 14px; }
        .calm-note {
          background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px;
          font-size: 12px; color: #cbd5e1; margin-bottom: 16px; text-align: left; line-height: 1.45;
        }
        .calm-note strong { color: #38bdf8; display: block; font-size: 10.5px; text-transform: uppercase; margin-bottom: 3px; }
        .btn-dismiss {
          width: 100%; padding: 11px; border-radius: 8px; font-weight: 600; font-size: 12.5px;
          background: #1e293b; color: #cbd5e1; border: 1px solid #334155; cursor: pointer;
        }
        .btn-dismiss:hover { background: #334155; color: #ffffff; }
      </style>
      <div class="backdrop">
        <div class="card">
          <div class="breathe-circle">${isPanic ? "🛡️" : isDailyCap ? "✋" : "🧘"}</div>
          <h3>${title}</h3>
          <p>${subtitle}</p>
          ${untilTimestamp ? '<div class="timer-box" id="tgCooldownTimer">--:--</div>' : ""}
          ${
            calmNote
              ? `<div class="calm-note"><strong>Note from Calm You:</strong>${calmNote}</div>`
              : ""
          }
          <button type="button" class="btn-dismiss" id="tgDismissCooldown">${
            isPanic || isDailyCap ? "Close & Respect Limit [Esc]" : "I'm Calm, Dismiss [Esc]"
          }</button>
        </div>
      </div>
    `;

    document.body.appendChild(host);

    const timerBox = shadow.querySelector("#tgCooldownTimer");
    const dismissBtn = shadow.querySelector("#tgDismissCooldown");

    if (untilTimestamp && timerBox) {
      function updateTimer() {
        const remainingSec = Math.max(0, Math.ceil((untilTimestamp - Date.now()) / 1000));
        const h = Math.floor(remainingSec / 3600);
        const m = Math.floor((remainingSec % 3600) / 60);
        const s = remainingSec % 60;
        timerBox.textContent =
          h > 0
            ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
            : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
        if (remainingSec <= 0) {
          clearInterval(activeCooldownTimer);
          closeChecklistModal();
        }
      }
      updateTimer();
      activeCooldownTimer = setInterval(updateTimer, 1000);
    }

    dismissBtn.addEventListener("click", () => {
      incrementCounter("tradesSkipped");
      closeChecklistModal();
    });

    activeKeyDownHandler = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        incrementCounter("tradesSkipped");
        closeChecklistModal();
      }
    };
    window.addEventListener("keydown", activeKeyDownHandler, true);
  }

  function openChecklistModal(targetBtn, rules) {
    closeChecklistModal();
    suppressBrokerOverlays(targetBtn);

    const context = extractScreenContext(targetBtn);
    const host = document.createElement("div");
    host.id = "tradeguard-shadow-host";

    host.style.setProperty("all", "initial", "important");
    host.style.setProperty("position", "fixed", "important");
    host.style.setProperty("top", "0px", "important");
    host.style.setProperty("left", "0px", "important");
    host.style.setProperty("width", "100vw", "important");
    host.style.setProperty("height", "100vh", "important");
    host.style.setProperty("z-index", "2147483647", "important");
    host.style.setProperty("display", "block", "important");
    host.style.setProperty("pointer-events", "auto", "important");

    const shadow = host.attachShadow({ mode: "open" });
    activeModalHost = host;

    const isSell = context.side === "SELL";
    const sideColor = isSell ? "#ef4444" : "#10b981";
    const sideBg = isSell ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)";
    const sideBorder = isSell ? "#ef4444" : "#10b981";

    let selectedStrategy = "Breakout";
    let selectedMindset = currentMood || "Calm";
    let tiltDelayRemaining = selectedMindset === "FOMO" || selectedMindset === "Revenge" ? 5 : 0;
    const isOpeningWindow = openingGuardEnabled && isOpeningChaosWindowIST();

    if (isOpeningWindow) incrementCounter("rulesTriggered");

    let entryPrice = context.price || 100;
    let defaultSl = isSell ? (entryPrice * 1.02).toFixed(2) : (entryPrice * 0.98).toFixed(2);

    const moodOptions = [
      { val: "Calm", label: "Calm 🧘" },
      { val: "Focused", label: "Focused 🎯" },
      { val: "Anxious", label: "Anxious 😰" },
      { val: "FOMO", label: "FOMO 🚀" },
      { val: "Revenge", label: "Revenge 😡" }
    ];

    shadow.innerHTML = `
      <style>
        :host {
          all: initial !important; position: fixed !important; top: 0 !important; left: 0 !important;
          width: 100vw !important; height: 100vh !important; z-index: 2147483647 !important; display: block !important;
        }
        * { box-sizing: border-box; }
        .backdrop {
          position: fixed !important; inset: 0 !important; width: 100vw !important; height: 100vh !important;
          background: rgba(2, 6, 23, 0.95) !important; backdrop-filter: blur(12px) !important;
          z-index: 2147483647 !important; display: flex !important; align-items: center !important; justify-content: center !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          animation: tgFadeIn 0.15s ease-out !important;
        }
        @keyframes tgFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes tgCardPop { from { opacity: 0; transform: scale(0.96) translateY(4px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .card {
          position: relative !important; z-index: 2147483647 !important;
          width: 520px !important; max-width: 94vw !important; max-height: 94vh !important; overflow-y: auto !important;
          background: #0f172a !important; border: 1px solid #334155 !important; border-radius: 12px !important;
          padding: 20px !important; color: #f8fafc !important;
          box-shadow: 0 25px 60px -12px rgba(0, 0, 0, 0.95), 0 0 0 1px rgba(255, 255, 255, 0.1) !important;
          animation: tgCardPop 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .top {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 10px; border-bottom: 1px solid #1e293b; padding-bottom: 10px;
        }
        .top-left { display: flex; align-items: center; gap: 9px; }
        .logo-icon { width: 20px; height: 20px; fill: #38bdf8; }
        h3 { margin: 0; font-size: 15px; font-weight: 700; color: #38bdf8; }
        .top-meta { font-size: 10.5px; color: #94a3b8; font-family: monospace; }
        .side-badge {
          background: ${sideBg}; border: 1px solid ${sideBorder}; color: ${sideColor};
          font-weight: 800; font-size: 11px; padding: 3px 8px; border-radius: 4px; letter-spacing: 0.05em;
        }
        .warn-banner {
          background: rgba(245, 158, 11, 0.14); border: 1px solid rgba(245, 158, 11, 0.45);
          color: #fbbf24; border-radius: 7px; padding: 8px 10px; font-size: 11.5px; margin-bottom: 10px;
          line-height: 1.4;
        }
        .risk-box {
          background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 10px 12px; margin-bottom: 12px;
        }
        .risk-row { display: flex; justify-content: space-between; align-items: center; font-size: 12px; margin-bottom: 6px; }
        .risk-row:last-child { margin-bottom: 0; }
        .risk-sl-input {
          width: 82px; padding: 3px 6px; background: #0f172a; border: 1px solid #475569;
          border-radius: 4px; color: #f8fafc; font-family: monospace; font-size: 12px; font-weight: bold; text-align: right;
        }
        .risk-badge {
          padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;
        }
        .risk-badge.safe { background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #10b981; }
        .risk-badge.danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #ef4444; }
        .risk-override-row {
          margin-top: 8px; padding: 7px 9px; border-radius: 6px;
          background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.45);
          font-size: 11px; color: #fca5a5; display: none; align-items: center; gap: 7px; cursor: pointer;
        }
        .risk-override-row.visible { display: flex; }

        .tags-section { margin-bottom: 10px; }
        .tags-label { font-size: 10.5px; font-weight: 600; color: #94a3b8; margin-bottom: 5px; }
        .tags-pills { display: flex; flex-wrap: wrap; gap: 5px; }
        .pill-btn {
          background: #1e293b; border: 1px solid #334155; color: #94a3b8;
          padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.15s ease;
        }
        .pill-btn:hover { border-color: #475569; color: #f8fafc; }
        .pill-btn.active { background: #0284c7; border-color: #38bdf8; color: #ffffff; }
        .pill-btn.mood-warn.active { background: #dc2626; border-color: #f87171; color: #ffffff; }

        .checklist { display: flex; flex-direction: column; gap: 7px; margin-bottom: 14px; }
        .item {
          display: flex; align-items: flex-start; gap: 10px; background: #1e293b; border: 1px solid #334155;
          padding: 9px 11px; border-radius: 6px; cursor: pointer; transition: all 0.15s ease; user-select: none;
        }
        .item:hover { border-color: #475569; background: #243248; }
        .item.checked { border-color: #0284c7; background: rgba(2, 132, 199, 0.15); }
        .item input[type="checkbox"] { margin-top: 2px; accent-color: #38bdf8; width: 15px; height: 15px; }
        .item-text { flex: 1; font-size: 12.5px; line-height: 1.4; color: #e2e8f0; }
        .item.checked .item-text { color: #ffffff; }
        .key-hint {
          display: inline-flex; align-items: center; justify-content: center;
          width: 18px; height: 18px; background: #334155; color: #94a3b8; font-size: 11px; font-weight: 700; border-radius: 3px;
        }
        .item.checked .key-hint { background: #0284c7; color: #ffffff; }

        .footer { display: flex; gap: 10px; }
        button.action-btn {
          font-family: inherit; padding: 10px 14px; border-radius: 6px; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all 0.15s ease;
        }
        .btn-cancel { background: transparent; border: 1px solid #334155; color: #94a3b8; }
        .btn-cancel:hover { background: #1e293b; color: #f1f5f9; }
        .btn-confirm { flex: 1; background: #0284c7; border: none; color: #ffffff; }
        .btn-confirm:hover:not(:disabled) { background: #0369a1; }
        .btn-confirm:disabled { background: #1e293b; color: #64748b; cursor: not-allowed; }
      </style>
      <div class="backdrop" id="tgBackdrop">
        <div class="card" role="dialog" aria-modal="true">
          <div class="top">
            <div class="top-left">
              <svg class="logo-icon" viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z"/>
              </svg>
              <div>
                <h3>TradeKavach+ Gatekeeper</h3>
                <div class="top-meta">Trade #${getTodayTradesCount() + 1} of ${maxTradesPerDay} today</div>
              </div>
            </div>
            <span class="side-badge">${context.side}</span>
          </div>

          ${
            isOpeningWindow
              ? `<div class="warn-banner">⚡ <strong>9:15–9:30 AM IST Opening Volatility Guard:</strong> Spreads &amp; fake breakouts peak right after NSE/BSE open. Double-check your SL before confirming.</div>`
              : ""
          }

          <div class="risk-box">
            <div class="risk-row">
              <span>Target: <strong>${context.symbol}</strong></span>
              <span>Qty: <strong>${context.quantity}</strong> &middot; Price: <strong>₹${context.price}</strong></span>
            </div>
            <div class="risk-row">
              <label>Stop-Loss Price: <input type="number" step="0.05" class="risk-sl-input" id="tgSlInput" value="${defaultSl}"></label>
              <div id="tgRiskBadge" class="risk-badge safe">Calculating...</div>
            </div>
            <label class="risk-override-row" id="tgRiskOverrideRow">
              <input type="checkbox" id="tgRiskOverrideCb">
              <span>Risk exceeds ${maxRiskPercent}% limit. I confirm I want to take this oversized risk.</span>
            </label>
          </div>

          <div class="tags-section">
            <div class="tags-label">Mindset Right Now (FOMO / Revenge adds 5s cool-off):</div>
            <div class="tags-pills" id="mindsetPills">
              ${moodOptions
                .map(
                  (m) =>
                    `<button type="button" class="pill-btn ${
                      m.val === "FOMO" || m.val === "Revenge" ? "mood-warn" : ""
                    } ${selectedMindset === m.val ? "active" : ""}" data-val="${m.val}">${m.label}</button>`
                )
                .join("")}
            </div>
          </div>

          <div class="tags-section">
            <div class="tags-label">Playbook Setup Tag:</div>
            <div class="tags-pills" id="strategyPills">
              <button type="button" class="pill-btn active" data-val="Breakout">Breakout</button>
              <button type="button" class="pill-btn" data-val="Pullback">Pullback</button>
              <button type="button" class="pill-btn" data-val="VWAP">VWAP</button>
              <button type="button" class="pill-btn" data-val="Scalp">Scalp</button>
              <button type="button" class="pill-btn" data-val="Mean Reversion">Mean Reversion</button>
            </div>
          </div>

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
            <button type="button" class="action-btn btn-cancel" id="tgCancelBtn">Skip / Abort [Esc]</button>
            <button type="button" class="action-btn btn-confirm" id="tgConfirmBtn" disabled>
              Confirm & Place Order [Enter]
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(host);

    const items = shadow.querySelectorAll(".item");
    const checkboxes = shadow.querySelectorAll("input[type='checkbox'][id^='rule-']");
    const confirmBtn = shadow.querySelector("#tgConfirmBtn");
    const cancelBtn = shadow.querySelector("#tgCancelBtn");
    const backdrop = shadow.querySelector("#tgBackdrop");
    const slInput = shadow.querySelector("#tgSlInput");
    const riskBadge = shadow.querySelector("#tgRiskBadge");
    const riskOverrideRow = shadow.querySelector("#tgRiskOverrideRow");
    const riskOverrideCb = shadow.querySelector("#tgRiskOverrideCb");

    let currentRiskExceeded = false;

    function updateRiskCalculation() {
      const sl = parseFloat(slInput.value) || entryPrice;
      const riskPerShare = Math.abs(entryPrice - sl);
      const totalRisk = Math.round(riskPerShare * context.quantity);
      const pctVal = capital > 0 ? parseFloat(((totalRisk / capital) * 100).toFixed(2)) : 0;

      currentRiskExceeded = pctVal > maxRiskPercent;
      if (!currentRiskExceeded) {
        riskBadge.className = "risk-badge safe";
        riskBadge.textContent = `✓ ₹${totalRisk} Risk (${pctVal}%)`;
        if (riskOverrideRow) riskOverrideRow.classList.remove("visible");
      } else {
        riskBadge.className = "risk-badge danger";
        riskBadge.textContent = `⚠️ ₹${totalRisk} Risk (${pctVal}% > ${maxRiskPercent}%)`;
        if (strictRiskConfirm && riskOverrideRow) {
          riskOverrideRow.classList.add("visible");
        }
      }
      return { sl, totalRisk, pctOfCapital: pctVal };
    }

    function updateConfirmState() {
      const allRulesChecked = Array.from(checkboxes).every((cb) => cb.checked);
      const riskAccepted = !strictRiskConfirm || !currentRiskExceeded || (riskOverrideCb && riskOverrideCb.checked);
      const tiltReady = tiltDelayRemaining <= 0;
      confirmBtn.disabled = !(allRulesChecked && riskAccepted && tiltReady);

      if (tiltDelayRemaining > 0) {
        confirmBtn.textContent = `Anti-Tilt Pause (${tiltDelayRemaining}s)...`;
      } else if (strictRiskConfirm && currentRiskExceeded && !(riskOverrideCb && riskOverrideCb.checked)) {
        confirmBtn.textContent = "Confirm Oversized Risk Above";
      } else {
        confirmBtn.textContent = "Confirm & Place Order [Enter]";
      }
    }

    function startTiltCountdown(seconds) {
      if (activeTiltTimer) clearInterval(activeTiltTimer);
      tiltDelayRemaining = seconds;
      updateConfirmState();
      if (seconds > 0) {
        incrementCounter("rulesTriggered");
        activeTiltTimer = setInterval(() => {
          tiltDelayRemaining = Math.max(0, tiltDelayRemaining - 1);
          updateConfirmState();
          if (tiltDelayRemaining <= 0) {
            clearInterval(activeTiltTimer);
            activeTiltTimer = null;
          }
        }, 1000);
      }
    }

    updateRiskCalculation();
    if (tiltDelayRemaining > 0) {
      startTiltCountdown(5);
    } else {
      updateConfirmState();
    }

    slInput.addEventListener("input", () => {
      updateRiskCalculation();
      updateConfirmState();
    });
    if (riskOverrideCb) {
      riskOverrideCb.addEventListener("change", updateConfirmState);
    }

    shadow.querySelectorAll("#mindsetPills .pill-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        shadow.querySelectorAll("#mindsetPills .pill-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedMindset = btn.dataset.val;
        try {
          if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ currentMood: selectedMindset });
          }
        } catch (_) {}
        if (selectedMindset === "FOMO" || selectedMindset === "Revenge") {
          startTiltCountdown(5);
        } else {
          startTiltCountdown(0);
        }
      });
    });

    shadow.querySelectorAll("#strategyPills .pill-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        shadow.querySelectorAll("#strategyPills .pill-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        selectedStrategy = btn.dataset.val;
      });
    });

    items.forEach((item, idx) => {
      item.addEventListener("click", (e) => {
        if (e.target.tagName !== "INPUT") checkboxes[idx].checked = !checkboxes[idx].checked;
        item.classList.toggle("checked", checkboxes[idx].checked);
        updateConfirmState();
      });
      checkboxes[idx].addEventListener("change", () => {
        item.classList.toggle("checked", checkboxes[idx].checked);
        updateConfirmState();
      });
    });

    cancelBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      incrementCounter("tradesSkipped");
      closeChecklistModal();
    });

    backdrop.addEventListener("click", (e) => {
      if (e.target === backdrop) {
        e.stopPropagation();
        incrementCounter("tradesSkipped");
        closeChecklistModal();
      }
    });

    confirmBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const riskInfo = updateRiskCalculation();
      const wasOverridden = Boolean(strictRiskConfirm && currentRiskExceeded);
      if (wasOverridden) incrementCounter("rulesTriggered");
      recordTradeExecution(context, riskInfo, selectedStrategy, selectedMindset, wasOverridden);
      executePassThrough(targetBtn, context.side);
    });

    activeKeyDownHandler = function (e) {
      if (e.target === slInput) return;

      const keyNum = parseInt(e.key, 10);
      if (!isNaN(keyNum) && keyNum >= 1 && keyNum <= rules.length) {
        e.preventDefault();
        e.stopPropagation();
        const targetCb = checkboxes[keyNum - 1];
        const targetItem = items[keyNum - 1];
        if (targetCb && targetItem) {
          targetCb.checked = !targetCb.checked;
          targetItem.classList.toggle("checked", targetItem.checked);
          updateConfirmState();
        }
        return;
      }

      if (e.key === "Enter") {
        if (!confirmBtn.disabled) {
          e.preventDefault();
          e.stopPropagation();
          const riskInfo = updateRiskCalculation();
          const wasOverridden = Boolean(strictRiskConfirm && currentRiskExceeded);
          recordTradeExecution(context, riskInfo, selectedStrategy, selectedMindset, wasOverridden);
          executePassThrough(targetBtn, context.side);
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        incrementCounter("tradesSkipped");
        closeChecklistModal();
      }
    };

    window.addEventListener("keydown", activeKeyDownHandler, true);
  }

  function recordTradeExecution(context, riskInfo, strategy, mindset, wasOverridden) {
    const entry = {
      id: "tk_" + Date.now().toString(36),
      timestamp: Date.now(),
      timeString: new Date().toLocaleTimeString(),
      symbol: context.symbol,
      side: context.side,
      price: context.price,
      quantity: context.quantity,
      stopLoss: riskInfo.sl,
      riskAmount: riskInfo.totalRisk,
      riskPercent: riskInfo.pctOfCapital,
      strategyTag: strategy,
      mindsetTag: mindset,
      overridden: Boolean(wasOverridden),
      outcome: "OPEN",
      pnl: 0,
      broker: window.location.hostname
    };

    tradeJournal.push(entry);
    if (tradeJournal.length > 250) tradeJournal.shift();

    if (context.side === "SELL" && cooldownMinutes > 0) {
      cooldownUntil = Date.now() + cooldownMinutes * 60 * 1000;
    }

    try {
      if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
        chrome.storage.local.set({ tradeJournal, cooldownUntil });
      }
    } catch (_) {}
  }

  function closeChecklistModal() {
    restoreBrokerOverlays();
    if (activeCooldownTimer) {
      clearInterval(activeCooldownTimer);
      activeCooldownTimer = null;
    }
    if (activeTiltTimer) {
      clearInterval(activeTiltTimer);
      activeTiltTimer = null;
    }
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
      const clickEvt = new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        composed: true,
        view: window
      });
      targetBtn.dispatchEvent(clickEvt);
    } catch (err) {
      console.error("[TradeKavach+] Pass-through error:", err);
    } finally {
      setTimeout(() => {
        isBypassing = false;
      }, 500);
    }
  }

  function handleCaptureClick(e) {
    if (isBypassing || !isEnabled || !e) return;

    const targetTag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : "";
    if (targetTag === "canvas") return;

    const orderBtn = findOrderSubmitButton(e);
    if (!orderBtn) return;

    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const ctx = extractScreenContext(orderBtn);
    const isExitOrder = ctx.side === "SELL";

    // Never trap open positions: SELL / EXIT / SQUARE OFF always stay accessible
    if (!isExitOrder) {
      if (panicLockUntil > Date.now()) {
        openLockoutModal({ mode: "panic", untilTimestamp: panicLockUntil });
        return;
      }

      const todayCount = getTodayTradesCount();
      if (maxTradesPerDay > 0 && todayCount >= maxTradesPerDay) {
        openLockoutModal({ mode: "dailyCap", todayCount });
        return;
      }

      if (cooldownMinutes > 0 && cooldownUntil > Date.now()) {
        openLockoutModal({ mode: "cooldown", untilTimestamp: cooldownUntil });
        return;
      }
    }

    const effectiveRules = currentRules.slice(0, 20);
    openChecklistModal(orderBtn, effectiveRules);
  }

  window.addEventListener("click", handleCaptureClick, true);
})();
