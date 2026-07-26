const GITHUB_API = "https://api.github.com/repos/TSun-FreeFire/TSun-Eat-Token-Catcher/releases/latest";
const STORAGE_KEY = "latest_capture";

document.addEventListener('DOMContentLoaded', () => {
  const providerButtons = document.querySelectorAll('.provider-btn');
  const updateBtn = document.getElementById('updateBtn');
  const updateStatus = document.getElementById('updateStatus');
  const clearBtn = document.getElementById('clearBtn');

  // ===== Tab switching =====
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-tab');
      tabButtons.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));
      btn.classList.add('active');
      const content = document.getElementById('tab-' + target);
      if (content) content.classList.add('active');
    });
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      chrome.storage.local.remove(STORAGE_KEY, () => {
        updateUI(null);
      });
    });
  }

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
      if (changes.history) {
        loadHistory();
      }
      if (changes.profiles || changes.selected_profile) {
        loadProfiles();
      }
    }
  });

  // Listen for capture messages from background
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "CAPTURED") {
      updateUI(msg.data);
      loadHistory();
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

  // Auto-copy toggle
  const autoCopyToggle = document.getElementById('autoCopyToggle');
  if (autoCopyToggle) {
    chrome.storage.local.get(['auto_copy'], (result) => {
      autoCopyToggle.checked = !!result.auto_copy;
    });
    autoCopyToggle.addEventListener('change', () => {
      chrome.storage.local.set({ auto_copy: autoCopyToggle.checked });
    });
  }

  // History
  loadHistory();

  // Profiles
  loadProfiles();
  document.getElementById('saveProfileBtn').addEventListener('click', saveProfile);
  document.getElementById('saveProfileBtn2').addEventListener('click', saveProfile);

  // Export/Import
  document.getElementById('exportBtn').addEventListener('click', exportData);
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFileInput').click();
  });
  document.getElementById('importFileInput').addEventListener('change', importData);
});

function loadCapturedData() {
  chrome.storage.local.get([STORAGE_KEY, 'latest_remote_version'], (result) => {
    updateUI(result[STORAGE_KEY]);
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

function renderUpdateStatus(remoteVersion) {
  const updateBar = document.getElementById('updateBar');
  const updateInfo = document.getElementById('updateInfo');
  const updateStatus = document.getElementById('updateStatus');
  const settingsTabDot = document.getElementById('settingsTabDot');
  const LOCAL_VERSION = chrome.runtime.getManifest().version;

  if (!remoteVersion) return;

  // Only flag an update when the remote version is genuinely newer.
  if (compareVersions(remoteVersion, LOCAL_VERSION) > 0) {
    updateBar.classList.remove('hidden');
    updateInfo.textContent = `New version ${remoteVersion} available`;
    updateStatus.textContent = '';
    if (settingsTabDot) settingsTabDot.classList.add('show');
  } else {
    updateBar.classList.add('hidden');
    updateStatus.textContent = `You are on the latest version (v${LOCAL_VERSION}).`;
    if (settingsTabDot) settingsTabDot.classList.remove('show');
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

function loadHistory() {
  chrome.storage.local.get(['history'], (result) => {
    const history = result.history || [];
    const container = document.getElementById('historyList');
    if (history.length === 0) {
      container.innerHTML = '<div class="status-waiting" style="font-size: 12px; padding: 12px 0;">No history yet.</div>';
      return;
    }
    let html = '';
    history.slice().reverse().forEach((item) => {
      const time = new Date(item.timestamp).toLocaleTimeString();
      const tokenShort = item.eat.length > 30 ? item.eat.substring(0, 30) + '...' : item.eat;
      html += `<div class="history-item">
        <span class="h-time">${time} - ${item.nickname || 'Unknown'}</span>
        <span class="h-token">${tokenShort}</span>
      </div>`;
    });
    container.innerHTML = html;
  });
}

function loadProfiles() {
  chrome.storage.local.get(['profiles', 'selected_profile'], (result) => {
    const profiles = result.profiles || {};
    const selected = result.selected_profile || '';
    const container = document.getElementById('profileList');
    const names = Object.keys(profiles);
    if (names.length === 0) {
      container.innerHTML = '<div class="status-waiting" style="font-size: 12px; padding: 8px 0;">No profiles saved.</div>';
      return;
    }
    let html = '';
    names.forEach((name) => {
      const data = profiles[name];
      const isSelected = (name === selected);
      html += `<div class="profile-item" style="border-color: ${isSelected ? 'rgba(74,222,128,0.3)' : '#1e293b'};">
        <span class="p-name">${name} ${isSelected ? '⭐' : ''}</span>
        <div class="p-actions">
          <button class="load-btn" data-name="${name}">Load</button>
          <button class="del-btn" data-name="${name}">Delete</button>
        </div>
      </div>`;
    });
    container.innerHTML = html;
    // Add event listeners
    container.querySelectorAll('.load-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        loadProfile(name);
      });
    });
    container.querySelectorAll('.del-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const name = btn.getAttribute('data-name');
        deleteProfile(name);
      });
    });
  });
}

function saveProfile() {
  const nameInput = document.getElementById('profileNameInput');
  const name = nameInput.value.trim();
  if (!name) {
    alert('Please enter a profile name.');
    return;
  }
  chrome.storage.local.get([STORAGE_KEY], (result) => {
    const data = result[STORAGE_KEY];
    if (!data || !data.eat) {
      alert('No token data to save. Capture a token first.');
      return;
    }
    chrome.storage.local.get(['profiles'], (res) => {
      const profiles = res.profiles || {};
      profiles[name] = data;
      chrome.storage.local.set({ profiles }, () => {
        nameInput.value = '';
        loadProfiles();
      });
    });
  });
}

function loadProfile(name) {
  chrome.storage.local.get(['profiles'], (result) => {
    const profiles = result.profiles || {};
    const data = profiles[name];
    if (!data) return;
    // Save as current token and also set selected profile
    chrome.storage.local.set({ [STORAGE_KEY]: data, selected_profile: name }, () => {
      updateUI(data);
      loadProfiles();
    });
  });
}

function deleteProfile(name) {
  if (!confirm(`Delete profile "${name}"?`)) return;
  chrome.storage.local.get(['profiles', 'selected_profile'], (result) => {
    const profiles = result.profiles || {};
    delete profiles[name];
    const selected = result.selected_profile;
    const newSelected = (selected === name) ? '' : selected;
    chrome.storage.local.set({ profiles, selected_profile: newSelected }, () => {
      loadProfiles();
    });
  });
}

function exportData() {
  chrome.storage.local.get(['profiles', 'history', 'auto_copy', 'selected_profile'], (result) => {
    const exportObj = {
      profiles: result.profiles || {},
      history: result.history || [],
      auto_copy: result.auto_copy || false,
      selected_profile: result.selected_profile || ''
    };
    const json = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eat_catcher_backup_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
}

function importData(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      if (!data.profiles && !data.history && !data.auto_copy) {
        alert('Invalid backup file.');
        return;
      }
      chrome.storage.local.set({
        profiles: data.profiles || {},
        history: data.history || [],
        auto_copy: data.auto_copy || false,
        selected_profile: data.selected_profile || ''
      }, () => {
        // Also reload UI
        chrome.storage.local.get([STORAGE_KEY], (res) => {
          updateUI(res[STORAGE_KEY]);
        });
        loadHistory();
        loadProfiles();
        const toggle = document.getElementById('autoCopyToggle');
        if (toggle) toggle.checked = !!data.auto_copy;
        alert('Data imported successfully!');
      });
    } catch (err) {
      alert('Failed to import data: ' + err.message);
    }
  };
  reader.readAsText(file);
  event.target.value = '';
}
