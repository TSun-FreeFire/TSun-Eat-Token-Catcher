const GITHUB_API = "https://api.github.com/repos/TSun-FreeFire/TSun-Eat-Token-Catcher/releases/latest";

document.addEventListener('DOMContentLoaded', () => {
  const providerButtons = document.querySelectorAll('.provider-btn');
  const updateBar = document.getElementById('updateBar');
  const updateInfo = document.getElementById('updateInfo');
  const updateBtn = document.getElementById('updateBtn');
  const updateStatus = document.getElementById('updateStatus');
  const howToUpdateBtn = document.getElementById('howToUpdateBtn');
  const backBtn = document.getElementById('backBtn');
  const mainContentView = document.getElementById('mainContentView');
  const helpView = document.getElementById('helpView');
  const clearBtn = document.getElementById('clearBtn');

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      chrome.storage.local.remove('latest_capture', () => {
        updateUI(null);
      });
    });
  }

  howToUpdateBtn.addEventListener('click', () => {
    mainContentView.style.display = 'none';
    helpView.style.display = 'block';
  });

  backBtn.addEventListener('click', () => {
    helpView.style.display = 'none';
    mainContentView.style.display = 'block';
  });

  providerButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const url = btn.getAttribute('data-url');
      if (url) {
        chrome.tabs.create({ url });
      }
    });
  });

  loadCapturedData();

  updateBtn.addEventListener('click', async () => {
    updateStatus.textContent = 'Preparing update...';
    updateBtn.disabled = true;

    try {
      const response = await fetch(GITHUB_API);
      if (!response.ok) throw new Error('Failed to fetch release info');
      const release = await response.json();

      const asset = release.assets.find(a => a.name.endsWith('.zip')) || release.assets[0];
      if (!asset) {
        updateStatus.textContent = 'No downloadable asset found.';
        updateBtn.disabled = false;
        return;
      }

      updateStatus.textContent = 'Downloading update package...';

      chrome.downloads.download({
        url: asset.browser_download_url,
        filename: `TSun-Eat-Token-Catcher.zip`,
        saveAs: false,
        conflictAction: 'uniquify'
      }, (downloadId) => {
        if (chrome.runtime.lastError) {
          updateStatus.textContent = 'Download failed: ' + chrome.runtime.lastError.message;
          updateBtn.disabled = false;
          return;
        }
        updateStatus.textContent = 'Downloaded! Extract ZIP and load unpacked in chrome://extensions.';
        updateBtn.disabled = false;
      });
    } catch (e) {
      updateStatus.textContent = 'Update failed: ' + e.message;
      updateBtn.disabled = false;
    }
  });

  checkRemoteVersion();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      if (changes.latest_capture) {
        updateUI(changes.latest_capture.newValue);
      }
      if (changes.latest_remote_version) {
        renderUpdateStatus(changes.latest_remote_version.newValue);
      }
    }
  });

  chrome.action.setBadgeText({ text: '' });

  document.querySelectorAll('.copy-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.id.replace('copy-', 'val-');
      const text = document.getElementById(targetId).textContent;
      if (!text || text === '-') return;
      navigator.clipboard.writeText(text).then(() => {
        const prev = btn.textContent;
        btn.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.textContent = prev;
          btn.classList.remove('copied');
        }, 1500);
      });
    });
  });
});

function loadCapturedData() {
  chrome.storage.local.get(['latest_capture', 'latest_remote_version'], (result) => {
    updateUI(result.latest_capture);
    if (result.latest_remote_version) {
      renderUpdateStatus(result.latest_remote_version);
    } else {
      checkRemoteVersion();
    }
  });
}

async function checkRemoteVersion() {
  try {
    const response = await fetch(GITHUB_API);
    if (!response.ok) return;
    const release = await response.json();
    const latestTag = release.tag_name || release.name || "";
    const latestVersion = latestTag.replace("v", "").trim();
    const downloadUrl = release.html_url;

    chrome.storage.local.set({
      latest_remote_version: latestVersion,
      latest_remote_url: downloadUrl
    });

    renderUpdateStatus(latestVersion);
  } catch (e) {
    console.warn('Remote version check failed:', e);
  }
}

function renderUpdateStatus(remoteVersion) {
  const updateBar = document.getElementById('updateBar');
  const updateInfo = document.getElementById('updateInfo');
  const updateStatus = document.getElementById('updateStatus');
  const LOCAL_VERSION = chrome.runtime.getManifest().version;

  if (!remoteVersion) return;

  if (remoteVersion !== LOCAL_VERSION) {
    updateBar.classList.remove('hidden');
    updateInfo.textContent = `New version ${remoteVersion} available`;
    updateStatus.textContent = '';
  } else {
    updateBar.classList.add('hidden');
    updateStatus.textContent = 'You are on the latest version.';
  }
}

function updateUI(data) {
  const noData = document.getElementById('noData');
  const dataPanel = document.getElementById('dataPanel');
  const capturedAt = document.getElementById('capturedAt');
  const clearBtn = document.getElementById('clearBtn');

  if (!data || !data.eat) {
    noData.style.display = 'block';
    dataPanel.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'none';
    return;
  }

  noData.style.display = 'none';
  dataPanel.style.display = 'block';
  if (clearBtn) clearBtn.style.display = 'inline-block';
  capturedAt.textContent = 'Captured at ' + new Date(data.timestamp).toLocaleTimeString();

  document.getElementById('val-eat').textContent = data.eat;
  document.getElementById('val-region').textContent = data.region || '-';
  document.getElementById('val-account').textContent = data.account_id || '-';
  document.getElementById('val-nickname').textContent = data.nickname || '-';

  chrome.action.setBadgeText({ text: '' });
}
