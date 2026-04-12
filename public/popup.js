// AI Interview Assistant v4 — popup.js

let isListening = false;
let currentPlatform = null;

const platforms = {
  'zoom.us': 'Zoom',
  'teams.microsoft.com': 'Teams',
  'meet.google.com': 'Meet',
  'webex.com': 'Webex',
  'slack.com': 'Slack',
};

// ─── INIT ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  // Load settings
  const settings = await chrome.storage.sync.get(['model', 'apiKey', 'isListening', 'recognitionLang', 'answerHistory']);
  if (settings.model) document.getElementById('modelSelect').value = settings.model;
  if (settings.recognitionLang) document.getElementById('langSelect').value = settings.recognitionLang;

  // Check API key
  if (!settings.apiKey) {
    document.getElementById('apiWarning').classList.add('show');
  }

  // Load history
  renderHistory(settings.answerHistory || []);

  // Detect current platform
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    try {
      const url = new URL(tab.url);
      for (const [domain, name] of Object.entries(platforms)) {
        if (url.hostname.includes(domain)) {
          currentPlatform = name;
          const tag = document.getElementById('platformTag');
          tag.textContent = `📺 ${name}`;
          tag.style.display = 'inline';
          break;
        }
      }
    } catch (e) {}
  }

  // SidePanel button click
  document.getElementById('openSidePanelBtn').addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      await chrome.sidePanel.open({ tabId: tab.id }).catch(() => {
        // Fallback: open with no tabId
        chrome.sidePanel.open({}).catch(() => {});
      });
    }
  });

  // Toggle listening
  document.getElementById('toggleListeningBtn').addEventListener('click', async () => {
    isListening = !isListening;
    updateListeningUI();

    if (isListening) {
      const { apiKey } = await chrome.storage.sync.get(['apiKey']);
      if (!apiKey) {
        alert('請先至設定頁填寫 API Key！');
        isListening = false;
        updateListeningUI();
        return;
      }
      setStatus('listening', '聆聽中...');
      // Notify sidePanel if open, otherwise open it
      try {
        await chrome.sidePanel.open({ tabId: tab?.id });
      } catch (e) {}
      chrome.runtime.sendMessage({ action: 'toggle-listening' });
    } else {
      setStatus('idle', '待機中');
      chrome.runtime.sendMessage({ action: 'toggle-listening' });
    }
    await chrome.storage.sync.set({ isListening });
  });

  // Model / language selects
  document.getElementById('modelSelect').addEventListener('change', async (e) => {
    await chrome.storage.sync.set({ model: e.target.value });
  });
  document.getElementById('langSelect').addEventListener('change', async (e) => {
    await chrome.storage.sync.set({ recognitionLang: e.target.value });
  });

  // Listen for listening state updates from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'listening-state') {
      isListening = msg.isListening;
      updateListeningUI();
      setStatus(isListening ? 'listening' : 'idle', isListening ? '聆聽中' : '待機中');
    }
  });
});

// ─── UI ───────────────────────────────────────────────────────────────────────
function updateListeningUI() {
  const btn = document.getElementById('toggleListeningBtn');
  const icon = document.getElementById('toggleIcon');
  const text = document.getElementById('toggleText');
  const sideBtn = document.getElementById('openSidePanelBtn');
  const sideBtnIcon = document.getElementById('sidePanelBtnIcon');

  if (isListening) {
    btn.classList.add('listening', 'btn-primary');
    btn.classList.remove('btn-secondary');
    btn.style.background = 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)';
    icon.textContent = '⏹';
    text.textContent = '停止聆聽';
    sideBtnIcon.textContent = '🔴';
    sideBtn.style.display = 'none'; // hide when listening
  } else {
    btn.classList.remove('listening', 'btn-primary');
    btn.classList.add('btn-secondary');
    btn.style.background = '';
    icon.textContent = '🎤';
    text.textContent = '開始聆聽';
    sideBtnIcon.textContent = '🔍';
    sideBtn.style.display = '';
  }
}

function setStatus(type, text) {
  const dot = document.getElementById('statusDot');
  dot.className = 'status-dot';
  if (type === 'listening') dot.classList.add('listening');
  else if (type === 'error') dot.classList.add('error');
  else if (type === 'processing') dot.classList.add('processing');
  document.getElementById('statusText').textContent = text;
}

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function renderHistory(history) {
  const panel = document.getElementById('historyPanel');
  if (!history || history.length === 0) {
    panel.innerHTML = '<div class="history-empty">尚無歷史記錄</div>';
    return;
  }
  panel.innerHTML = history.slice(0, 5).map(entry => {
    const time = new Date(entry.ts).toLocaleString('zh-TW', {
      month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const aShort = (entry.a || '').substring(0, 60).replace(/\n/g, ' ');
    return `
      <div class="history-item">
        <div class="history-q">${escapeHtml(entry.q || '')}</div>
        <div class="history-a">${escapeHtml(aShort)}${entry.a && entry.a.length > 60 ? '...' : ''}</div>
        <div class="history-time">${time}</div>
      </div>
    `;
  }).join('');
}
