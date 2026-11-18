# TradeKavach+ v1.3.0 — Pre-Trade Discipline & Behavioral Seatbelt

> **Zero-API, 100% Client-Side Pre-Trade Gatekeeper for Web Trading Terminals**  
> Strictly isolated to supported web trading & charting URLs — never runs on general websites or broker marketing pages.

---

## ⚡ What's New in TradeKavach+ v1.3.0

### 1. 🎓 First-Install Welcome Tour & Live Test (`welcome.html`)
- Opens automatically on first install (zero extra permissions).
- Step-by-step Chrome toolbar pinning guide, 60-second preset setup (**Nifty/BankNifty F&O**, **Intraday Equity**, **Swing Trader**), and an interactive **Simulated Buy Order** test right on the page.

### 2. 🛑 "Stop Myself" Panic Lockout & Session Commitment Lock
- **Panic Button**: Instantly lock out new entries for `15m`, `30m`, `1h`, or `Until 3:30 PM IST` directly from the popup.
- **Exits Always Stay Unlocked**: `SELL`, `EXIT`, and `SQUARE OFF` orders are never blocked during Panic Lockout or Daily Trade Cap so open positions can always be closed safely.
- **Session Commitment Lock**: Freeze rules, daily cap, and master toggle until **3:30 PM IST** in Settings so you cannot loosen rules mid-tilt.

### 3. ⚡ Indian Market Breakers & Strict 1% Risk Guard
- **9:15–9:30 AM IST Opening Volatility Guard**: Flags high-whipsaw NSE/BSE opening chop inside the Gatekeeper modal.
- **Live 1% Risk Calculator**: Computes `Risk (₹) = |Entry - StopLoss| × Quantity` and requires an explicit override confirmation if Stop-Loss risk exceeds your limit.
- **Anti-Tilt Mindset Check-In**: Select `Calm`, `Focused`, `Anxious`, `FOMO`, or `Revenge` — choosing `FOMO` or `Revenge` triggers a mandatory 5-second cooling pause before order execution.

### 4. 📊 Local Analytics Dashboard (`dashboard.html`) & Single-Screen Settings (`options.html`)
- **Dashboard**: Tracks **Total Trades**, **Today Used / Cap**, **Trades Skipped (`[Esc]`)**, **Win Rate %**, **Net Logged P&L (₹)**, **Mood vs Outcomes**, and **Setup Win Rates**, with inline `WIN / LOSS / BE` + `₹ P&L` editing and CSV/JSON export.
- **Clean Settings**: All risk limits, Indian market breakers, checklist presets, and JSON/CSV backups fit on one tidy page.

---

## ⌨️ Keyboard Shortcuts Cheat Sheet

| Key | Action |
| :--- | :--- |
| **`1` – `5`** | Toggle checklist items rapidly without touching your mouse |
| **`Enter`** | Confirm & place verified order (only when checklist & risk checks pass) |
| **`Esc`** | Abort order safely (₹0 capital risked, counts toward Skipped Trades) |

---

## 🛠️ Manual Chrome Installation

1. Open `chrome://extensions/` and turn **Developer mode** ON.
2. Click **Load unpacked** and select the `/extension/` folder.
3. Pin **TradeKavach+** from Chrome's puzzle icon for instant Mood Check-In, Panic Lockout, Dashboard, and Settings access.
