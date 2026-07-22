const AUTH_URL = "https://auth.garena.com/universal/oauth?platform=11&response_type=code&locale=en-SG&client_id=100067&redirect_uri=https://api.ff.garena.co.id/auth/auth/callback_n?site=https://api-discountstore.gid.recargajogo.com.br/oauth/callback_redirect/";

document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('loginBtn');
  const noData = document.getElementById('noData');
  const dataPanel = document.getElementById('dataPanel');
  const capturedAt = document.getElementById('capturedAt');

  loginBtn.addEventListener('click', () => {
    chrome.tabs.create({ url: AUTH_URL });
  });

  loadData();

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.latest_capture) {
      updateUI(changes.latest_capture.newValue);
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

function loadData() {
  chrome.storage.local.get(['latest_capture'], (result) => {
    updateUI(result.latest_capture);
  });
}

function updateUI(data) {
  const noData = document.getElementById('noData');
  const dataPanel = document.getElementById('dataPanel');
  const capturedAt = document.getElementById('capturedAt');

  if (!data || !data.eat) {
    noData.style.display = 'block';
    dataPanel.style.display = 'none';
    return;
  }

  noData.style.display = 'none';
  dataPanel.style.display = 'block';
  capturedAt.textContent = 'Captured at ' + new Date(data.timestamp).toLocaleTimeString();

  document.getElementById('val-eat').textContent = data.eat;
  document.getElementById('val-region').textContent = data.region || '-';
  document.getElementById('val-account').textContent = data.account_id || '-';
  document.getElementById('val-nickname').textContent = data.nickname || '-';

  chrome.action.setBadgeText({ text: '' });
}
