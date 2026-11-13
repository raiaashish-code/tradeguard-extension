# TradeGuard v1.2.3 — Pre-Trade Discipline & Behavioral Seatbelt

> **Zero-API, 100% Client-Side Pre-Trade Gatekeeper for Web Trading Terminals (All Features Unlocked Free)**  
> Strictly active ONLY on supported trading terminal URLs: **TradingView (`/chart`)**, **Dhan / ScanX**, **Zerodha Kite**, **ICICI Direct**, **SBI Securities / SBI Smart**, **Groww (`/stocks`, `/futures-and-options`)**, **Sahi**, **Fyers**, **Upstox**, **Angel One**, **Kotak Neo**, **HDFC Sky / HDFC Sec**, **Motilal Oswal**, **5paisa**, **Sharekhan**, **Axis Direct**, **AliceBlue**, **Paytm Money**, **Sensibull**, **Shoonya**, **Flattrade**, **m.Stock**, **Samco**, **Definedge**, **Delta Exchange**, and **CoinDCX** — never runs on general websites or broker marketing homepages.

---

## ⚡ Key Features at a Glance

### 1. 🛡️ Pre-Trade Checklist Gatekeeper (DOM Interception)
- Intercepts order buttons (**Buy**, **Instant Sell**, **Place Order**, **Square Off**, **Close Position**) using browser event capture (`useCapture: true`).
- Pauses order execution at the browser level *before* any broker payload is dispatched.
- Supports up to **20 custom pre-trade rules** completely free.

### 2. 🧮 Live 1% Risk Sizing Calculator
- Automatically scrapes current order price and lot quantity from the terminal ticket without broker APIs.
- Adjust your intended **Stop-Loss** directly inside the TradeGuard modal.
- Computes actual capital at risk: `Risk (₹) = |Entry - StopLoss| × Quantity`.
- Displays real-time **Safe (`< 1.0%`)** or **Danger (`> 1.0%`)** validation against your configured trading capital.

### 3. 🧘 Anti-Revenge Cooling-Off Breaker
- Triggered automatically whenever you exit or square-off an open position.
- Enforces a configurable cooling-off breathing period (`1m`, `3m`, or `5m`) with a visual breathing circle — free for all users.
- Blocks immediate emotional tilt or impulse re-entries. Press `Esc` or click *"I'm Calm, Dismiss"* when ready.

### 4. 🏷️ 1-Click Strategy & Mindset Tagging
- Tag your execution setup in one click: `Breakout`, `Pullback`, `VWAP`, `Scalp`, or `Mean Reversion`.
- Record your emotional state: `Calm 🧘`, `FOMO 🚀`.

### 5. 📓 Local Trade Journal & 1-Click CSV Export
- Automatically logs all verified executions to local storage (`chrome.storage.local`).
- View trade history anytime in the **Extension Popup → Journal** tab.
- Click **"⬇ Export CSV"** to download a structured spreadsheet (`TradeGuard_Journal_YYYY-MM-DD.csv`) for Google Sheets or Excel.

### 6. ℹ️ In-Extension Feature Guide & Help
- **From Toolbar Popup**: Click the **Guide ℹ️** tab in the extension popup to view feature explanations and keyboard cheat sheets.
- **Directly on Trading Charts**: Click the floating **TradeGuard v1.2.3** status pill at the bottom-right of your trading terminal to view the full interactive feature guide without leaving your chart!

### 7. 🚀 60 FPS Performance & Trading-Only Isolation
- **Trading-Sites Only**: Restricted via Chrome Manifest V3 `matches` and runtime hostname/path checks so it never runs on Gmail, Google, YouTube, general browsing, or broker marketing homepages.
- **Sub-Microsecond Canvas Bypass**: Single-line check (`if (e.target.tagName === 'CANVAS') return;`) keeps chart panning and zooming at 60 FPS with zero lag (<0.002ms).
- **Zero API Keys & Zero External Telemetry**: 100% local client-side storage. Your trading data never leaves your computer.

---

## ⌨️ Keyboard Shortcuts Cheat Sheet

| Key | Action |
| :--- | :--- |
| **`1` – `5`** | Toggle checklist items rapidly without touching your mouse |
| **`Enter`** | Confirm & place verified order (only when checklist is satisfied) |
| **`Esc`** | Abort order safely (0 capital risked) or dismiss cooling-off / guide |

---

## 🛠️ Installation Guide (Google Chrome)

1. **Clone or Download the Repository**:
   ```bash
   git clone https://github.com/raiaashish-code/tradeguard-extension.git
   ```

2. **Open Chrome Extensions**:
   Navigate to `chrome://extensions/` in your Chrome address bar.

3. **Enable Developer Mode**:
   Toggle the **Developer mode** switch in the top-right corner.

4. **Load Unpacked Extension**:
   Click **Load unpacked** in the top-left corner and select the `/extension/` folder.

5. **Pin TradeGuard**:
   Click the puzzle piece icon on your Chrome toolbar and pin **TradeGuard**.

---

## 🔄 Updating to the Latest Version

When new updates are pushed to GitHub:
```bash
git pull origin main
```
Then visit `chrome://extensions/` and click the **↻ (Reload)** icon on the TradeGuard card.
