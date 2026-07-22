const TARGET_HOST = "discstore.recargajogo.com.br";
const CAPTURE_URL = "http://localhost:5000/capture";
const STORAGE_KEY = "latest_capture";
const NOTIFICATION_ID = "eat_token_captured";

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

  fetch(CAPTURE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    keepalive: true,
  }).catch((err) => {
    console.warn("EAT Token Catcher: POST to server failed", err.message);
  });

  showNotification(data);
  chrome.runtime.sendMessage({ type: "CAPTURED", data }).catch(() => {});
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
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("EAT Token Catcher v1.0.3 installed.");
  chrome.notifications.clear(NOTIFICATION_ID);
  chrome.action.setBadgeText({ text: "" });
});
