# 🚀 Publishing TradeGuard to the Chrome Web Store & Automated Git CI/CD

Publishing TradeGuard to the Chrome Web Store enables:
- **1-Click Installation**: Install directly from the official Chrome Web Store.
- **Silent Background Updates**: Chrome automatically updates the extension for you and all users without needing Developer Mode.
- **Automated Git CI/CD**: Every time you push a tag (e.g. `v1.1.0`) to GitHub, GitHub Actions packages and publishes the update to the store.

---

## Step 1: Register as a Chrome Web Store Developer
1. Go to the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Sign in with your Google account.
3. Pay the **one-time $5 USD registration fee** directly to Google to activate your developer account.

---

## Step 2: First-Time Manual Upload to Get Your Extension ID
Google requires the first upload to be done manually via the web console to generate your unique **Extension ID**:

1. In your local repository or via the applet, create the extension zip:
   ```bash
   cd extension
   zip -r ../tradeguard-extension.zip .
   ```
2. In the [Developer Dashboard](https://chrome.google.com/webstore/devconsole), click **New Item**.
3. Drag and drop `tradeguard-extension.zip`.
4. Once uploaded, copy your **Item ID / Extension ID** from the URL (a 32-character string like `abcdefghijklmnopabcdefghijklmnop`).

---

## Step 3: Complete Store Listing Details
Fill in the basic store listing fields:
- **Title**: `TradeGuard — Pre-Trade Discipline Checklist`
- **Summary**: `Zero-API pre-trade checklist gatekeeper that prevents emotional impulse orders and unplanned position exits.`
- **Category**: `Productivity` or `Financial Tools`
- **Icons**: Pre-generated in `/extension/icons/` (`icon16.png`, `icon48.png`, `icon128.png`).
- **Privacy Practices**:
  - Check **Single Purpose**: "Behavioral pre-trade discipline checklist gatekeeper for web trading terminals."
  - Data collection: Check **No user data collected** (or declare local storage only: zero remote telemetry).
- Submit for initial review. Initial review typically takes 24–48 hours.

---

## Step 4: Enable Automated Updates from Git (GitHub Actions)

Once your initial version is published, you can automate all future updates directly through GitHub Actions:

### 1. Get Google Cloud API Credentials:
Follow the [Chrome Web Store API Quickstart](https://developer.chrome.com/docs/webstore/using_webstore_api/):
1. Open the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project and enable the **Chrome Web Store API**.
3. Create an **OAuth 2.0 Client ID** (Desktop Application). Note the `Client ID` and `Client Secret`.
4. Generate a `Refresh Token` using OAuth2 Playground or Google's CLI.

### 2. Add Secrets to your GitHub Repository:
In your GitHub repository (`raiaashish-code/tradeguard-extension`):
1. Go to **Settings** > **Secrets and variables** > **Actions** > **New repository secret**.
2. Add the following 4 secrets:
   - `CHROME_EXTENSION_ID`: Your 32-character extension ID from Step 2.
   - `CHROME_CLIENT_ID`: Your Google OAuth Client ID.
   - `CHROME_CLIENT_SECRET`: Your Google OAuth Client Secret.
   - `CHROME_REFRESH_TOKEN`: Your Google OAuth Refresh Token.

---

## Step 5: How Future Git Updates Work

Whenever you want to release an update:
1. Bump the version in `extension/manifest.json` (e.g. `1.1.0`).
2. Commit and push a Git tag:
   ```bash
   git add .
   git commit -m "release: v1.1.0"
   git tag v1.1.0
   git push origin main --tags
   ```
3. GitHub Actions will automatically:
   - Package the `extension/` directory into a `.zip`.
   - Call Google's Chrome Web Store API.
   - Upload and publish the new release.
   - Google Chrome on your browser will automatically fetch and apply the update in the background!
