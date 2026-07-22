# TSun-Eat-Token-Catcher

**TSun-Eat-Token-Catcher** is a Chrome Extension (Manifest V3) that automatically captures EAT token parameters from the Garena auth redirect flow. It detects the redirect to `discstore.recargajogo.com.br`, extracts `eat`, `region`, `account_id`, and `nickname`, and displays them instantly in the extension popup.

## Features

*   **Multiple Provider Login** — Supports Google, Facebook, Apple, X (Twitter), and VK login flows via the Garena OAuth universal endpoint.
*   **Instant Capture** — Uses `chrome.tabs.onUpdated` for bulletproof detection of the final redirect URL containing the tokens.
*   **Chrome Notification** — Pops up a desktop notification the moment the EAT token is captured.
*   **Click-to-Open Popup** — Clicking the notification automatically opens the extension popup.
*   **Copy Buttons** — One-click copy for EAT, Region, Account ID, and Nickname.
*   **Auto-Update Checker** — Checks GitHub Releases every 30 minutes and notifies you when a new version is available.
*   **No Inline Scripts** — Fully CSP-compliant with external JS (`popup.js`) and clean HTML/CSS.
*   **Local Capture Server (Optional)** — Includes `oauth_app.py` / `updater.py` for automation and update flows.

## Installation

### Developer Mode (Unpacked)

1.  Clone or download this repository.
2.  Open Chrome and go to `chrome://extensions`.
3.  Enable **Developer mode** (top right toggle).
4.  Click **Load unpacked**.
5.  Select the folder containing `manifest.json` (e.g., `TSun_Eat_Token_Catcher_1.0.2` or `extension`).
6.  Pin the extension to your toolbar for easy access.

### How to Use

1.  Click the **TSun-Eat-Token-Catcher** icon in your Chrome toolbar.
2.  Select a provider (Google, Facebook, Apple, X, or VK) under **"Select Provider & Login"**.
3.  Complete the login in the new tab.
4.  The extension detects the redirect instantly, captures the tokens, and shows a Chrome notification.
5.  Click the notification or the extension icon to view `eat`, `region`, `account_id`, and `nickname`.

## Project Structure

```
TSun_Eat_Token_Catcher_1.0.2/
├── background.js       # Service worker: capture logic, notification, update checker
├── popup.html          # Extension popup UI
├── popup.js            # Popup logic (external JS, CSP-safe)
├── manifest.json       # Manifest V3 configuration
├── icon16.png          # Extension icon (16x16)
├── icon48.png          # Extension icon (48x48)
├── icon128.png         # Extension icon (128x128)
└── readme.txt          # Original changelog
```

## Configuration

*   **Target Host:** `discstore.recargajogo.com.br`
*   **Auth Base:** `https://auth.garena.com/universal/oauth`
*   **GitHub Releases:** `https://github.com/TSun-FreeFire/TSun-Eat-Token-Catcher/releases`

## Auto-Update

Unpacked Chrome extensions cannot auto-update silently. This extension:

1.  Polls the GitHub Releases API every 30 minutes via `chrome.alarms`.
2.  Shows an orange **UP** badge and a Chrome notification when a new version is detected.
3.  Displays an **Update** button in the popup that downloads the latest release ZIP via `chrome.downloads.download()`.

**To actually apply the update:**
1.  Extract the downloaded ZIP.
2.  Go to `chrome://extensions`.
3.  Click **Reload** (🔄) on **TSun-Eat-Token-Catcher**.

For fully automatic updates, publish the extension to the **Chrome Web Store**.

## Development

### Prerequisites

*   Google Chrome (latest)
*   Python 3.8+ (optional, for local capture server)

### Local Capture Server (Optional)

```powershell
python oauth_app.py
```

Serves a local frontend at `http://localhost:5000` that can receive POST captures from the extension.

### Versioning

*   `manifest.json` — `"version": "1.0.2"`
*   `background.js` — `const LOCAL_VERSION = "1.0.2"`
*   `popup.js` — `const LOCAL_VERSION = "1.0.2"`

Keep these in sync when releasing new versions.

## Changelog

### v1.0.2
*   Fixed CSP violation errors by removing inline scripts from `popup.html` and moving all logic to external `popup.js`.
*   Added **Login With X** button in the popup UI.
*   Added Chrome notification when EAT token is captured.
*   Clicking the notification auto-opens the extension popup.
*   Added copy buttons for all token fields.
*   Added badge indicator (`NEW`) if popup fails to open from notification.
*   Popup auto-refreshes when data changes while open.

### v1.0.0
*   Initial release.
*   Captures EAT token from `discstore.recargajogo.com.br` redirects.
*   Supports Google, Facebook, Apple, X, and VK auth providers.
*   Displays EAT, Region, Account ID, and Nickname in the popup.

## License

MIT License — feel free to use, modify, and distribute.

## Support

*   **GitHub Issues:** [https://github.com/TSun-FreeFire/TSun-Eat-Token-Catcher/issues](https://github.com/TSun-FreeFire/TSun-Eat-Token-Catcher/issues)
*   **Repository:** [https://github.com/TSun-FreeFire/TSun-Eat-Token-Catcher](https://github.com/TSun-FreeFire/TSun-Eat-Token-Catcher)

---

*Built for the Free Fire community. Not affiliated with Garena or X Corp.*
