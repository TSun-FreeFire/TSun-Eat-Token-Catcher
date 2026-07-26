const TARGET_HOST = "discstore.recargajogo.com.br";
const CAPTURE_URL = "http://localhost:5000/capture";
const STORAGE_KEY = "latest_capture";
const HISTORY_KEY = "history";
const NOTIFICATION_ID = "eat_token_captured";
const GITHUB_REPO = "TSun-FreeFire/TSun-Eat-Token-Catcher";
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;
const LOCAL_VERSION = chrome.runtime.getManifest().version;

function isTargetUrl(url) {
  try {
    return new URL(url).hostname === TARGET_HOST;
  } catch (e) {
    return false;
  }
}

function parseParams(url) {
  try {
    const u = new URL(url);
    const eat = u.searchParams.get("eat");
    const region = u.searchParams.get("region");
    const account_id = u.searchParams.get("account_id");
    const nickname = u.searchParams.get("nickname");
    if (!eat && !account_id) return null;

    let decodedNick = "";
    if (nickname) {
      try { decodedNick = decodeURIComponent(nickname); }
      catch (e) { decodedNick = nickname; }
    }

    return {
      eat: eat || "",
      region: region || "",
      account_id: account_id || "",
      nickname: decodedNick,
      timestamp: Date.now()
    };
  } catch (e) {
    return null;
  }
}

function capture(url) {
  const data = parseParams(url);
  if (!data) return;

  chrome.storage.local.set({ [STORAGE_KEY]: data }, () => {
    if (chrome.runtime.lastError) {
      console.error("Storage error:", chrome.runtime.lastError);
    } else {
      console.log("EAT Token Catcher: saved to storage", data);
    }
  });

  // Update history (keep last 2)
  chrome.storage.local.get([HISTORY_KEY], (result) => {
    let history = result.history || [];
    history.push(data);
    if (history.length > 2) history = history.slice(-2);
    chrome.storage.local.set({ [HISTORY_KEY]: history });
  });

  fetch(CAPTURE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    keepalive: true,
  }).catch((err) => {
    console.warn("EAT Token Catcher: POST to server failed", err.message);
  });

  // Auto-copy if enabled
  chrome.storage.local.get(["auto_copy"], (result) => {
    if (result.auto_copy && data.eat) {
      copyToClipboard(data.eat);
    }
  });

  showNotification(data);
  chrome.runtime.sendMessage({ type: "CAPTURED", data }).catch(() => {});
}

function copyToClipboard(text) {
  // Use scripting to inject a function that writes to clipboard from a tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: (t) => navigator.clipboard.writeText(t).then(() => console.log('Auto-copied token')).catch(e => console.warn('Auto-copy failed:', e)),
      args: [text],
      world: 'MAIN'
    }).catch(() => {});
  });
}

function showNotification(data) {
  const truncatedEat = data.eat.length > 35 ? data.eat.substring(0, 35) + "..." : data.eat;
  chrome.notifications.create(NOTIFICATION_ID, {
    type: "basic",
    iconUrl: "icon128.png",
    title: "EAT Token Captured",
    message: `EAT: ${truncatedEat}\nRegion: ${data.region}\nAccount: ${data.account_id}`,
    priority: 2,
    requireInteraction: true
  });
}

chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId === NOTIFICATION_ID) {
    chrome.action.openPopup().catch(() => {
      chrome.action.setBadgeText({ text: "NEW" });
      chrome.action.setBadgeBackgroundColor({ color: "#4caf50" });
    });
    chrome.notifications.clear(NOTIFICATION_ID);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (!changeInfo.url || !tab.url) return;
  try {
    if (!isTargetUrl(tab.url)) return;
    console.log("EAT Token Catcher: tab updated", tab.url);
    capture(tab.url);
  } catch (e) {
    console.error("EAT Token Catcher: error in onUpdated", e);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "GET_CAPTURED") {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      sendResponse(result[STORAGE_KEY] || null);
    });
    return true;
  }
  if (msg.type === "COPY_TOKEN") {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const data = result[STORAGE_KEY];
      if (data && data.eat) {
        copyToClipboard(data.eat);
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false });
      }
    });
    return true;
  }
  if (msg.type === "CLEAR_TOKEN") {
    chrome.storage.local.remove(STORAGE_KEY, () => {
      sendResponse({ success: true });
    });
    return true;
  }
});

chrome.alarms.create("checkForUpdates", { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "checkForUpdates") {
    checkForUpdates();
  }
});

// Compare two semver strings. Returns 1 if a>b, -1 if a<b, 0 if equal.
function compareVersions(a, b) {
  const pa = String(a).replace(/^v/i, '').trim().split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b).replace(/^v/i, '').trim().split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = pa[i] || 0;
    const nb = pb[i] || 0;
    if (na > nb) return 1;
    if (na < nb) return -1;
  }
  return 0;
}

async function checkForUpdates() {
  try {
    const response = await fetch(GITHUB_API);
    if (!response.ok) return;
    const release = await response.json();
    const latestTag = release.tag_name || release.name || "";
    const latestVersion = latestTag.replace("v", "").trim();

    chrome.storage.local.get(["latest_remote_version", "latest_remote_url"], (result) => {
      chrome.storage.local.set({
        latest_remote_version: latestVersion,
        latest_remote_url: release.html_url
      });

      // Only notify when the remote version is genuinely newer than local.
      if (latestVersion && compareVersions(latestVersion, LOCAL_VERSION) > 0) {
        chrome.action.setBadgeText({ text: "UP" });
        chrome.action.setBadgeBackgroundColor({ color: "#ff9800" });
        chrome.notifications.create("update_available", {
          type: "basic",
          iconUrl: "icon128.png",
          title: "Update Available",
          message: `Version ${latestVersion} is available (you have ${LOCAL_VERSION}). Click to update.`,
          priority: 2,
          requireInteraction: true
        });
      } else {
        chrome.action.setBadgeText({ text: "" });
      }
    });
  } catch (e) {
    console.warn("Update check failed:", e);
  }
}

chrome.runtime.onInstalled.addListener(() => {
  console.log(`TSun-Eat-Token-Catcher v${LOCAL_VERSION} installed.`);
  chrome.notifications.clear(NOTIFICATION_ID);
  chrome.notifications.clear("update_available");
  chrome.action.setBadgeText({ text: "" });
  checkForUpdates();
});

chrome.commands.onCommand.addListener((command) => {
  if (command === "copy-token") {
    chrome.storage.local.get([STORAGE_KEY], (result) => {
      const data = result[STORAGE_KEY];
      if (data && data.eat) {
        copyToClipboard(data.eat);
        chrome.notifications.create("copy_notification", {
          type: "basic",
          iconUrl: "icon128.png",
          title: "Token Copied",
          message: "EAT token copied to clipboard.",
          priority: 1
        });
      }
    });
  } else if (command === "clear-token") {
    chrome.storage.local.remove(STORAGE_KEY, () => {
      chrome.notifications.create("clear_notification", {
        type: "basic",
        iconUrl: "icon128.png",
        title: "Token Cleared",
        message: "The captured token has been cleared.",
        priority: 1
      });
    });
  }
});
