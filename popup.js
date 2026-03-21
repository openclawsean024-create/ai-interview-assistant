// AI Interview Assistant - Popup Script
let isListening = false;
let currentPlatform = null;
let latestExchange = null;

const HISTORY_KEY = 'qaHistory';

const platforms = {
  'zoom.us': 'Zoom',
  'teams.microsoft.com': 'Teams',
  'meet.google.com': 'Meet',
  'webex.com': 'Webex',
  'slack.com': 'Slack'
};

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', async () => {
  const settings = await chrome.storage.local.get(['model', 'apiKey', 'isListening', 'recognitionLang', HISTORY_KEY]);

  if (settings.model) document.getElementById('modelSelect').value = settings.model;
  if (settings.recognitionLang) document.getElementById('languageSelect').value = settings.recognitionLang;

  if (settings.isListening) {
    isListening = true;
    updateUI();
  }

  renderHistory(settings[HISTORY_KEY] || []);

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.url) {
    const url = new URL(tab.url);
    for (const [domain, name] of Object.entries(platforms)) {
      if (url.hostname.includes(domain)) {
        currentPlatform = name;
        document.getElementById('platform').innerHTML = `📺 ${name}`;
        break;
      }
    }
  }
});

document.getElementById('startBtn').addEventListener('click', async () => {
  isListening = !isListening;

  if (isListening) {
    const settings = await chrome.storage.local.get(['apiKey', 'recognitionLang']);
    if (!settings.apiKey) {
      alert('請先設定 API Key！');
      isListening = false;
      return;
    }

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, {
      action: 'startListening',
      recognitionLang: settings.recognitionLang || 'en-US'
    });
  } else {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    chrome.tabs.sendMessage(tab.id, { action: 'stopListening' });
  }

  await chrome.storage.local.set({ isListening });
  updateUI();
});

document.getElementById('modelSelect').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ model: e.target.value });
});

document.getElementById('languageSelect').addEventListener('change', async (e) => {
  await chrome.storage.local.set({ recognitionLang: e.target.value });
});

document.getElementById('settingsBtn').addEventListener('click', async () => {
  const existing = await chrome.storage.local.get(['apiKey']);
  const apiKey = prompt('請輸入 API Key (OpenAI / Google / Anthropic):', existing.apiKey || '');
  if (apiKey) {
    chrome.storage.local.set({ apiKey });
    alert('API Key 已儲存！');
  }
});

document.getElementById('exportBtn').addEventListener('click', async () => {
  const data = await chrome.storage.local.get([HISTORY_KEY]);
  const history = data[HISTORY_KEY] || [];
  const lines = history.flatMap((item, idx) => [
    `#${idx + 1}`,
    `Time: ${item.createdAt}`,
    `Question: ${item.question}`,
    `Answer: ${item.answer}`,
    `Sources: ${(item.sources || []).map((s) => `${s.title} ${s.url}`).join(' | ')}`,
    ''
  ]);
  const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ai-interview-history.txt';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

function updateUI() {
  const btn = document.getElementById('startBtn');
  const statusDot = document.getElementById('statusDot');
  const statusText = document.getElementById('statusText');

  if (isListening) {
    btn.innerHTML = '<span>⏹️</span> 停止聆聽';
    btn.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    statusDot.className = 'status-dot listening';
    statusText.textContent = '正在聆聽問題...';
  } else {
    btn.innerHTML = '<span>🎤</span> 開始聆聽問題';
    btn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    statusDot.className = 'status-dot';
    statusText.textContent = '準備就緒';
  }
}

function renderLatest(message) {
  document.getElementById('aiResponse').innerHTML = `
      <div class="question">問題: ${escapeHtml(message.question)}</div>
      <div class="answer">${escapeHtml(message.answer || '正在分析...')}</div>
      ${message.sources?.length ? `
        <div class="sources">
          <div class="sources-title">📚 參考資料:</div>
          ${message.sources.map(s => `<a href="${s.url}" class="source-item" target="_blank">${escapeHtml(s.title)}</a>`).join('')}
        </div>
      ` : ''}
    `;
}

function renderHistory(history) {
  const el = document.getElementById('historyList');
  if (!history.length) {
    el.innerHTML = '<div class="history-empty">尚無歷史問答</div>';
    return;
  }
  el.innerHTML = history.slice(0, 8).map((item) => `
    <div class="history-item">
      <div class="history-q">Q: ${escapeHtml(item.question)}</div>
      <div class="history-a">A: ${escapeHtml(item.answer).slice(0, 120)}</div>
      <div class="history-time">${new Date(item.createdAt).toLocaleString('zh-TW')}</div>
    </div>
  `).join('');
}

async function appendHistory(message) {
  const data = await chrome.storage.local.get([HISTORY_KEY]);
  const history = data[HISTORY_KEY] || [];
  history.unshift({
    question: message.question,
    answer: message.answer,
    sources: message.sources || [],
    createdAt: new Date().toISOString(),
  });
  const trimmed = history.slice(0, 20);
  await chrome.storage.local.set({ [HISTORY_KEY]: trimmed });
  renderHistory(trimmed);
}

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'question') {
    latestExchange = message;
    renderLatest(message);
    appendHistory(message);
  }
});
