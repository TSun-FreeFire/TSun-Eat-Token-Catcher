Files saved:
- extension/manifest.json — v1.0.2, added notifications permission
- extension/background.js — captures tokens, shows notification, opens popup on notification click
- extension/popup.html — clean UI with Login With X button + captured data panel
- extension/popup.js — all popup logic (external file, fixes CSP error)
- oauth_app.py — stripped down to a minimal optional capture server only
CSP fix: All inline scripts removed from popup.html. Logic moved to external popup.js.
New features:
1. Login With X button — opens auth URL in a new tab
2. Notification — pops up the moment eat is captured
3. Click notification — auto-opens the extension popup
4. Copy buttons on all fields
5. Badge — shows NEW if popup fails to open from notification
6. Live updates — popup auto-refreshes if data changes while open