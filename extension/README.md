# TradeGuard MVP 1.0 — Pre-Trade Checklist Chrome Extension

> **Zero-API, 100% Client-Side Pre-Trade Behavioral Seatbelt for Web Trading Terminals**
> Compatible with **TradingView**, **Zerodha Kite Web**, and **Dhan**.

---

## ⚡ The Psychological Thesis

Over 90% of retail trading losses are caused not by poor technical analysis, but by emotional and impulsive execution:
- Revenge trading immediately following a loss
- Chasing runaway green candles out of FOMO
- Entering orders without a strictly calculated Stop-Loss or position size

Traditional trading journals only examine errors *after* capital is lost. **TradeGuard** acts as an uncompromisable, real-time behavioral gatekeeper right inside your browser *before* any order packet reaches your broker.

---

## 🔒 100% Privacy & Zero API Requirement

- **Zero Broker API Keys**: No need for broker developer apps, secret tokens, or API subscriptions.
- **Zero Login Credentials**: Operates strictly through browser DOM reading in capture phase.
- **Zero Server Round-Trips**: Runs entirely client-side on your local machine with `chrome.storage.local`.

---

## 🛠️ Installation Guide (Google Chrome)

1. **Download or clone this folder**:
   Ensure you have the 4 extension files in a local folder:
   - `manifest.json`
   - `content.js`
   - `popup.html`
   - `popup.js`
   - `icons/`

2. **Open Chrome Extension Settings**:
   Navigate to `chrome://extensions/` in your Chrome address bar.

3. **Enable Developer Mode**:
   Toggle the **Developer mode** switch in the top-right corner.

4. **Load Unpacked Extension**:
   Click the **Load unpacked** button in the top-left corner and select the `tradeguard-mvp1` folder.

5. **Pin TradeGuard**:
   Click the puzzle piece icon on your Chrome toolbar and pin **TradeGuard**.

---

## 🚀 How to Use & Keyboard Shortcuts

1. Open your trading terminal (**TradingView**, **Dhan**, or **Zerodha Kite**).
2. Configure your pre-trade checklist rules in the TradeGuard extension popup (up to 5 rules).
3. Click any **Buy** or **Sell** order button.
4. The TradeGuard dark-mode Gatekeeper modal will freeze execution and dim the screen.
5. Use keyboard rapid-check:
   - Press **`1`**, **`2`**, **`3`**, **`4`**, **`5`** to toggle checklist items.
   - Press **`Enter`** to unlock and execute ("Confirm & Place Order").
   - Press **`Esc`** to abort the trade without placing it.

---

## 💻 GitHub Repository Commands

To initialize a git repository and push TradeGuard to your GitHub account:

```bash
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
```
