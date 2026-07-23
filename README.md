<h1 align="center">⚡ TSun Eat Token Catcher ⚡</h1>

<p align="center">
  <img src="https://img.shields.io/badge/Chrome_Extension-Manifest_V3-blue?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Chrome Extension Manifest V3" />
  <img src="https://img.shields.io/badge/Platform-Free_Fire-FFD166?style=for-the-badge&logo=garena&logoColor=black" alt="Platform Free Fire" />
  <img src="https://img.shields.io/badge/Release-v1.0.2-00F5D4?style=for-the-badge" alt="Release Version" />
  <img src="https://img.shields.io/badge/License-MIT-F15BB5?style=for-the-badge" alt="License MIT" />
</p>

---

<h2 align="center">📖 Overview</h2>

**TSun-Eat-Token-Catcher** is a lightweight, high-performance Chrome Extension built on **Manifest V3**. It is specifically designed to automatically intercept and capture Garena EAT authentication token parameters during redirect flows. 

When a user initiates authentication, the extension detects the final redirect to `discstore.recargajogo.com.br` instantly extracting critical data fields:
*   `eat` (Access Token)
*   `region`
*   `account_id`
*   `nickname`

The captured data is formatted beautifully and displayed immediately in the extension popup with one-click copy functionality.

---

<h2 align="center">✨ Features</h2>

🎨 **Elegant Popup UI**  
A modern user-friendly dashboard built with external scripting to guarantee fully CSP-compliant execution.

⚡ **Instant Interception**  
Uses robust `chrome.tabs.onUpdated` hooks for real-time capture of credentials before target pages load.

🔑 **Multi-Provider Support**  
Seamlessly works with all standard Garena auth options:
*   `Google` / `Facebook` / `Apple` / `X (Twitter)` / `VK`

🔔 **Desktop Notifications**  
Triggers native OS notifications upon capture; clicking the notification opens the extension popup instantly.

📋 **Quick Copy System**  
Dedicated copy buttons for all credentials to streamline configuration and pasting.

🔄 **Auto-Update System**  
Checks the GitHub Releases endpoint every 30 minutes, showing a `NEW` badge and a click-to-update download button when updates are released.

---

<h2 align="center">🛠️ Installation</h2>

<h3 align="center">🚀 Developer Mode (Unpacked)</h3>

1. **Download/Clone** the repository to your local system:
   ```bash
   git clone https://github.com/TSun-FreeFire/TSun-Eat-Token-Catcher.git
   ```
2. Open Google Chrome and navigate to: `chrome://extensions/`
3. Toggle the **Developer mode** switch in the top-right corner.
4. Click the **Load unpacked** button in the top-left.
5. Choose the folder containing `manifest.json`.
6. Pin **TSun-Eat-Token-Catcher** to your extension bar!

---

<h2 align="center">📖 How to Use</h2>

```mermaid
graph TD
    A[Open Extension Popup] --> B[Choose Auth Provider]
    B --> C[Complete Login in New Tab]
    C --> D{Intercepter Capture URL}
    D -->|Match: discstore.recargajogo.com.br| E[Show Captured Notification]
    E --> F[Click Popup to View & Copy Details]
```

1. **Select Provider**: Click the extension icon and select your preferred login platform (Google, Facebook, Apple, X, or VK).
2. **Authorize**: Authenticate on the official login page.
3. **Capture**: Once logged in, a notification appears confirming successful token catch.
4. **Copy**: Click the popup to access your data instantly.

---

<h2 align="center">📂 Project Structure</h2>

```bash
TSun-Eat-Token-Catcher/
├── background.js       # Background service worker (intercepts URLs & checks updates)
├── popup.html          # Clean & styled user interface
├── popup.js            # Safe popup interactivity logic
├── manifest.json       # Chrome Extension Manifest V3 configuration
├── convert.py          # Icon rasterization helper script
├── icon16.png          # App icon (16x16)
├── icon48.png          # App icon (48x48)
├── icon128.png         # App icon (128x128)
└── README.md           # Documentation
```

---

<h2 align="center">⚙️ Configuration Details</h2>

| Parameter | Value / Endpoint |
| :--- | :--- |
| **Target Host** | `discstore.recargajogo.com.br` |
| **Auth Base** | `https://auth.garena.com/universal/oauth` |
| **GitHub Updates** | `https://github.com/TSun-FreeFire/TSun-Eat-Token-Catcher` |

---

<h2 align="center">🔄 Auto-Update Protocol</h2>

Since unpacked developer extensions do not auto-update natively:
1. Every **30 minutes**, `chrome.alarms` triggers a check to GitHub Releases.
2. If a new version exists, the extension shows an orange **UP** badge and issues a notification.
3. Clicking **Update** downloads the new release `.zip` automatically.
4. **To apply**: Simply extract the ZIP, head to `chrome://extensions`, and click **Reload (🔄)** on the extension card.

---

<h2 align="center">💻 Development & Capture Server</h2>

<h3 align="center">Optional Local Webhook Server</h3>

If you're integrating the capture flow with custom automation scripts, you can run the optional Python listener:
```bash
python oauth_app.py
```
This runs a local Flask server listening on `http://localhost:5000` to receive and store token payloads.

<h3 align="center">Version Alignment Checklist</h3>

When bumping versions for release, ensure the version keys are synchronized:
- `manifest.json` ➔ `"version": "1.0.2"`
- `background.js` ➔ `LOCAL_VERSION = "1.0.2"`
- `popup.js` ➔ `LOCAL_VERSION = "1.0.2"`

---

<h2 align="center">🤝 Community & Support</h2>

*   🐛 **Report Issues:** Open a ticket on [GitHub Issues](https://github.com/TSun-FreeFire/TSun-Eat-Token-Catcher/issues).
*   ⭐ **Contributions:** Feel free to fork the repository and submit pull requests.

---

<p align="center">
  <sub>Built with ❤️ for the Free Fire community. Not affiliated with Garena or X Corp.</sub>
</p>
