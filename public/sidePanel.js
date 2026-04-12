// AI Interview Assistant v4 — sidePanel.js
// Core: Web Speech API STT + OpenAI GPT-4 answer + Web Speech API TTS

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

// State
let isListening = false;
let recognition = null;
let lastTranscript = '';
let currentAnswer = '';
let currentAnswerAborted = false;
let ttsUtterance = null;
let ttsSpeed = 1.0;
let ttsSpeaking = false;
let silenceTimer = null;
let currentMode = 'interview';
let practiceCategory = 'javascript';
let practiceQuestion = '';
let timerInterval = null;
let timerSeconds = 120;
let selectedMicId = '';
let currentAudioStream = null;
let ttsChunkIndex = 0;

// Practice questions bank
const questions = {
  javascript: [
    '解釋 JavaScript 中的 event loop 是如何運作的？',
    '什麼是 Promise 和 async/await？它們有什麼區別？',
    'JavaScript 中 var、let、const 的差異是什麼？',
    '解釋閉包（closure）的概念以及實際應用場景。',
    '什麼是原型鏈（prototype chain）？',
    '如何避免 callback hell？你會採用什麼方法？',
    '解釋 ES6 的 destructuring assignment。',
    'JavaScript 中的 this 綁定規則有哪些？',
  ],
  react: [
    'React 的 virtual DOM 是什麼？它如何提升效能？',
    'useEffect 的依賴陣列該如何正確使用？',
    '解釋 React 的 reconciliation 過程。',
    '什麼是 React Server Components？與客戶端元件有何不同？',
    'useState 和 useRef 的使用時機有何不同？',
    'React 中如何做效能優化？',
    '解釋 Redux 的工作原理以及何時需要用它。',
    '什麼是 Suspense 和 lazy loading？',
  ],
  'system-design': [
    '如何設計一個短網址服務（如 bit.ly）？',
    '解釋分散式系統中的 CAP 定理。',
    '如何設計一個即時聊天系統？',
    '什麼是 eventual consistency 與 strong consistency？',
    '如何設計一個搜尋引擎的爬蟲系統？',
    '解釋負載均衡器的運作方式與常見策略。',
    '如何設計一個大流量 API 的 rate limiting 機制？',
    '什麼是 message queue？舉例說明其應用場景。',
  ],
  behavioral: [
    '請分享一個你解決困難技術問題的經驗。',
    '描述一次你需要在期限內同時處理多個專案的情況。',
    '你有過與團隊成員發生衝突的經驗嗎？如何解決？',
    '描述你如何保持技術成長與學習。',
    '請分享一個你失敗的專案經驗，以及你從中學到什麼。',
    '你為什麼想離開目前的公司？',
    '你對未來三年的職涯規劃是什麼？',
    '你認為自己最大的技術優勢和弱點是什麼？',
  ],
};

// ─── INIT ────────────────────────────────────────────────────────────────────
async function init() {
  loadSettings();
  setupMicSelector();
  setupRecognition();
  setupEventListeners();
  setupModeSwitcher();
  setupPracticeMode();
  loadAnswerHistory();
  checkApiKey();
}

// ─── SETTINGS ─────────────────────────────────────────────────────────────────
async function loadSettings() {
  const settings = await chrome.storage.sync.get([
    'apiKey', 'model', 'recognitionLang', 'ttsSpeed', 'selectedMicId', 'answerHistory'
  ]);
  if (settings.model) $('#modelSelect').value = settings.model;
  if (settings.recognitionLang) $('#langSelect').value = settings.recognitionLang;
  if (settings.ttsSpeed) {
    ttsSpeed = parseFloat(settings.ttsSpeed);
    $$('.speed-btn').forEach(b => b.classList.toggle('active', b.dataset.speed === ttsSpeed.toString()));
  }
  if (settings.selectedMicId !== undefined) {
    selectedMicId = settings.selectedMicId;
  }
}

async function checkApiKey() {
  const { apiKey } = await chrome.storage.sync.get(['apiKey']);
  $('#apiWarning').classList.toggle('show', !apiKey);
  return !!apiKey;
}

// ─── MICROPHONE SELECTOR ─────────────────────────────────────────────────────
async function setupMicSelector() {
  const micSelect = $('#micSelect');
  if (!micSelect) return;

  async function loadMics() {
    try {
      // Request permission first so we get device labels
      const tmpStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      tmpStream.getTracks().forEach(t => t.stop());

      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === 'audioinput');

      micSelect.innerHTML = '';
      if (mics.length === 0) {
        micSelect.innerHTML = '<option value="">🎤 未偵測到麥克風</option>';
        return;
      }

      mics.forEach((mic, i) => {
        const label = mic.label || `麥克風 ${i + 1}`;
        const opt = document.createElement('option');
        opt.value = mic.deviceId;
        opt.textContent = label;
        if (mic.deviceId === selectedMicId) opt.selected = true;
        micSelect.appendChild(opt);
      });

      // If no saved selection, default to first mic
      if (!selectedMicId && mics.length > 0) {
        selectedMicId = mics[0].deviceId;
      }
    } catch (e) {
      micSelect.innerHTML = '<option value="">🎤 請允許麥克風權限</option>';
    }
  }

  // Load mics on init
  await loadMics();

  // Re-enumerate when mic permission granted
  navigator.mediaDevices.addEventListener('devicechange', loadMics);

  // Save selection
  micSelect.addEventListener('change', async (e) => {
    selectedMicId = e.target.value;
    await chrome.storage.sync.set({ selectedMicId });
    // Restart listening with new mic if currently listening
    if (isListening) {
      stopListening();
      startListening();
    }
  });
}

// ─── SPEECH RECOGNITION ───────────────────────────────────────────────────────
function setupRecognition() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    setStatus('error', '此瀏覽器不支援 Web Speech API');
    return;
  }

  recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'zh-TW';

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        final += text;
      } else {
        interim += text;
      }
    }

    if (final) {
      lastTranscript = final.trim();
      renderTranscript(lastTranscript, false);
      resetSilenceTimer();
      if (lastTranscript.length > 5) {
        generateAnswer(lastTranscript);
      }
    } else if (interim) {
      renderTranscript(interim, true);
    }
  };

  recognition.onerror = (event) => {
    if (event.error === 'no-speech') return;
    if (event.error === 'not-allowed') {
      setStatus('error', '麥克風權限被拒絕');
      stopListening();
    }
    console.error('Speech recognition error:', event.error);
  };

  recognition.onend = () => {
    if (isListening) {
      try { recognition.start(); } catch (e) {}
    }
  };
}

async function startListening() {
  if (!recognition) return;

  // Stop any existing stream
  if (currentAudioStream) {
    currentAudioStream.getTracks().forEach(t => t.stop());
    currentAudioStream = null;
  }

  try {
    // Request microphone with selected device (or default)
    const audioConstraints = selectedMicId
      ? { deviceId: { exact: selectedMicId } }
      : true;
    currentAudioStream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints
    });

    // Use AudioContext to pipe mic into SpeechRecognition for mic selection support
    try {
      const audioCtx = new AudioContext();
      const source = audioCtx.createMediaStreamSource(currentAudioStream);
      // Note: Web Speech API doesn't directly accept AudioNode input.
      // The selected mic is used via getUserMedia constraints above.
      // Fallback: just start recognition (uses selected mic from constraints).
    } catch (ae) { /* AudioContext not critical */ }

    recognition.start();
    isListening = true;
    updateUI();
    setStatus('listening', '聆聽中...');
    resetSilenceTimer();
  } catch (e) {
    console.error('Failed to start recognition:', e);
    setStatus('error', '無法開啟麥克風');
  }
}

function stopListening() {
  if (!recognition) return;
  try { recognition.stop(); } catch (e) {}
  if (currentAudioStream) {
    currentAudioStream.getTracks().forEach(t => t.stop());
    currentAudioStream = null;
  }
  isListening = false;
  clearTimeout(silenceTimer);
  updateUI();
  setStatus('idle', '待機中');
  $('#visualizer').style.display = 'none';
  stopVisualizer();
}

function toggleListening() {
  if (isListening) {
    stopListening();
  } else {
    startListening();
  }
}

// ─── TRANSCRIPT RENDERING ──────────────────────────────────────────────────────
function renderTranscript(text, isInterim) {
  const box = $('#transcriptBox');
  if (!text) {
    box.innerHTML = '<div class="waiting-msg">等待面試官提問中...</div>';
    return;
  }
  if (isInterim) {
    box.innerHTML = `<div class="final">${escapeHtml(lastTranscript)}</div><div class="interim">${escapeHtml(text)}...</div>`;
  } else {
    box.innerHTML = `<div class="final">${escapeHtml(text)}</div>`;
  }
  box.classList.toggle('listening', isListening);
}

function resetSilenceTimer() {
  clearTimeout(silenceTimer);
  silenceTimer = setTimeout(() => {
    $('#transcriptBox').innerHTML = '<div class="waiting-msg">等待面試官提問中...</div>';
  }, 30000);
}

// ─── ANSWER GENERATION ────────────────────────────────────────────────────────
let abortController = null;

async function generateAnswer(question) {
  abortController = new AbortController();
  currentAnswerAborted = false;

  const { apiKey, model } = await chrome.storage.sync.get(['apiKey', 'model']);
  if (!apiKey) {
    showApiKeyError();
    return;
  }

  setStatus('processing', '分析中...');
  showAnswerLoading();

  const lang = $('#langSelect')?.value || 'zh-TW';
  const selectedModel = model || 'gpt-4o';

  const systemPrompt = lang.startsWith('zh')
    ? '你是一位專業的面試教練。根據面試官的問題，提供結構化、專業的答案建議。每個分點30-120字，語言使用與問題相同。'
    : 'You are a professional interview coach. Provide structured, professional answer suggestions based on the interviewer\'s question. Each point should be 30-120 characters.';

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: question },
        ],
        max_tokens: 600,
        temperature: 0.7,
      }),
      signal: abortController.signal,
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('API Key 無效');
      throw new Error(`API 錯誤: ${response.status}`);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) throw new Error('未收到有效回應');

    currentAnswer = answer;
    renderAnswer(answer);
    saveToHistory(question, answer);
    showTtsPrompt();
    setStatus('listening', '聆聽中');

  } catch (err) {
    if (err.name === 'AbortError' || currentAnswerAborted) {
      hideAnswerLoading();
      return;
    }
    renderAnswerError(err.message);
    setStatus('error', '生成失敗');
    setTimeout(() => setStatus('idle', '待機中'), 3000);
  }
}

function renderAnswer(answer) {
  const box = $('#answerBox');
  const points = parseAnswerPoints(answer);
  box.innerHTML = points.map(p =>
    `<div class="answer-point">${escapeHtml(p)}</div>`
  ).join('');
  $('#speedRow').style.display = 'flex';
  $('#cancelAnswerBtn').style.display = 'none';
  currentAnswer = answer;
}

function parseAnswerPoints(answer) {
  // Try to split by numbered points or bullet points
  const lines = answer.split('\n').filter(l => l.trim());
  const points = [];
  for (const line of lines) {
    const cleaned = line.replace(/^[①-⑨①②③④⑤⑥⑦⑧⑨\.\-\*\d\)]+\s*/, '').trim();
    if (cleaned.length > 5) points.push(cleaned);
  }
  // If no structured points, split by sentences
  if (points.length < 2) {
    const sentences = answer.split(/(?<=[。！？.!?])/).filter(s => s.trim().length > 10);
    return sentences.slice(0, 5);
  }
  return points;
}

function showAnswerLoading() {
  $('#answerBox').innerHTML = '<div class="answer-loading">⏳ AI 分析中，請稍候...</div>';
  $('#cancelAnswerBtn').style.display = 'flex';
}

function hideAnswerLoading() {
  $('#cancelAnswerBtn').style.display = 'none';
}

function renderAnswerError(msg) {
  $('#answerBox').innerHTML = `<div style="color:#fca5a5;font-size:12px">❌ ${escapeHtml(msg)}</div>`;
}

function showApiKeyError() {
  $('#answerBox').innerHTML = `<div style="color:#fca5a5;font-size:12px">❌ 請先至設定頁填寫 API Key</div>`;
  $('#apiWarning').classList.add('show');
}

function cancelAnswer() {
  if (abortController) {
    abortController.abort();
    currentAnswerAborted = true;
  }
  hideAnswerLoading();
  setStatus('listening', '聆聽中');
}

// ─── TTS ─────────────────────────────────────────────────────────────────────
function speak(text) {
  if (!('speechSynthesis' in window)) return;

  // If already speaking a different answer, stop first
  if (ttsSpeaking && currentAnswer && text !== currentAnswer) {
    stopTts();
  }

  window.speechSynthesis.cancel();
  ttsSpeaking = true;
  ttsChunkIndex = 0;
  $('#ttsBtn').classList.add('speaking');
  $('#stopTtsBtn').style.display = 'flex';

  const chunks = parseAnswerPoints(text);
  let index = 0;

  // Highlight current sentence
  function highlightChunk(idx) {
    $$('.answer-point').forEach((el, i) => {
      el.classList.toggle('speaking', i === idx);
    });
  }

  function speakNext() {
    if (index >= chunks.length) {
      // Done — clear highlights
      $$('.answer-point').forEach(el => el.classList.remove('speaking'));
      ttsSpeaking = false;
      $('#ttsBtn').classList.remove('speaking');
      $('#stopTtsBtn').style.display = 'none';
      return;
    }

    highlightChunk(index);

    const utt = new SpeechSynthesisUtterance(chunks[index]);
    utt.lang = $('#langSelect')?.value?.startsWith('en') ? 'en-US' : 'zh-TW';
    utt.rate = ttsSpeed;

    utt.onend = () => { index++; speakNext(); };
    utt.onerror = () => { index++; speakNext(); };

    ttsUtterance = utt;
    window.speechSynthesis.speak(utt);
  }

  speakNext();
}

function stopTts() {
  window.speechSynthesis?.cancel();
  ttsSpeaking = false;
  $$('.answer-point').forEach(el => el.classList.remove('speaking'));
  $('#ttsBtn').classList.remove('speaking');
  $('#stopTtsBtn').style.display = 'none';
}

function showTtsPrompt() {
  if (currentAnswer) {
    if (ttsSpeaking) {
      // TTS already running — stop it and show prompt for new answer
      stopTts();
    }
    $('#ttsPrompt').classList.add('show');
  }
}

function hideTtsPrompt() {
  $('#ttsPrompt').classList.remove('show');
}

// ─── VISUALIZER ──────────────────────────────────────────────────────────────
let vizInterval = null;
function startVisualizer() {
  $('#visualizer').style.display = 'flex';
  const bars = $$('.viz-bar');
  vizInterval = setInterval(() => {
    bars.forEach(bar => {
      const h = Math.random() * 20 + 4;
      bar.style.height = `${h}px`;
    });
  }, 100);
}
function stopVisualizer() {
  clearInterval(vizInterval);
  $$('.viz-bar').forEach(bar => bar.style.height = '4px');
}

// ─── HISTORY ─────────────────────────────────────────────────────────────────
async function saveToHistory(question, answer) {
  const { answerHistory = [] } = await chrome.storage.sync.get(['answerHistory']);
  answerHistory.unshift({
    q: question,
    a: answer,
    ts: Date.now(),
    cat: currentMode,
  });
  if (answerHistory.length > 50) answerHistory.pop();
  await chrome.storage.sync.set({ answerHistory });
}

async function loadAnswerHistory() {
  const { answerHistory = [] } = await chrome.storage.sync.get(['answerHistory']);
  return answerHistory;
}

// ─── UI HELPERS ──────────────────────────────────────────────────────────────
function setStatus(type, text) {
  const dot = $('#statusDot');
  const txt = $('#statusText');
  dot.className = 'status-dot ' + (type !== 'idle' && type !== 'listening' ? type : '');
  if (type === 'listening') dot.classList.add('listening');
  txt.textContent = text;
}

function updateUI() {
  const btn = $('#micToggle');
  btn.classList.toggle('active', isListening);
  if (isListening) {
    startVisualizer();
  } else {
    stopVisualizer();
    $('#visualizer').style.display = 'none';
  }
}

// ─── PRACTICE MODE ────────────────────────────────────────────────────────────
function setupPracticeMode() {
  $$('.category-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.category-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      practiceCategory = btn.dataset.cat;
    });
  });

  $('#randomQBtn').addEventListener('click', () => {
    const qs = questions[practiceCategory];
    practiceQuestion = qs[Math.floor(Math.random() * qs.length)];
    $('#practiceQuestion').innerHTML = `<div style="font-size:13px;color:var(--text)">${escapeHtml(practiceQuestion)}</div>`;
    $('#practiceAnswer').style.display = 'none';
  });

  $('#genAnswerBtn').addEventListener('click', async () => {
    if (!practiceQuestion) return;
    const { apiKey, model } = await chrome.storage.sync.get(['apiKey', 'model']);
    if (!apiKey) { showApiKeyError(); return; }

    $('#practiceAnswerBox').innerHTML = '<div class="answer-loading">⏳ 生成答案中...</div>';
    $('#practiceAnswer').style.display = 'block';

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model || 'gpt-4o',
          messages: [
            { role: 'system', content: '你是一位專業面試教練，請針對以下面試題目提供詳細的結構化答案。' },
            { role: 'user', content: practiceQuestion },
          ],
          max_tokens: 800,
          temperature: 0.7,
        }),
      });
      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content?.trim() || '生成失敗';
      const points = parseAnswerPoints(answer);
      $('#practiceAnswerBox').innerHTML = points.map(p => `<div class="answer-point">${escapeHtml(p)}</div>`).join('');
    } catch (e) {
      $('#practiceAnswerBox').innerHTML = `<div style="color:#fca5a5;font-size:12px">❌ ${e.message}</div>`;
    }
  });
}

function setupTimerControls() {
  function setTimer(seconds) {
    timerSeconds = seconds;
    updateTimerDisplay();
  }

  function updateTimerDisplay() {
    const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
    const s = String(timerSeconds % 60).padStart(2, '0');
    const el = $('#practiceTimer');
    el.textContent = `${m}:${s}`;
    el.classList.remove('warning', 'danger');
    if (timerSeconds <= 30 && timerSeconds > 0) el.classList.add('danger');
    else if (timerSeconds <= 60) el.classList.add('warning');
  }

  $('#startTimerBtn').addEventListener('click', () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
      $('#startTimerBtn').textContent = '▶ 開始';
    } else {
      timerInterval = setInterval(() => {
        timerSeconds--;
        updateTimerDisplay();
        if (timerSeconds <= 0) {
          clearInterval(timerInterval);
          timerInterval = null;
          playTimerEndSound();
          $('#startTimerBtn').textContent = '▶ 開始';
        }
      }, 1000);
      $('#startTimerBtn').textContent = '⏸ 暫停';
    }
  });

  $('#resetTimerBtn').addEventListener('click', () => {
    clearInterval(timerInterval);
    timerInterval = null;
    timerSeconds = 120;
    updateTimerDisplay();
    $('#startTimerBtn').textContent = '▶ 開始';
  });

  $('#set1Btn').addEventListener('click', () => { setTimer(60); clearInterval(timerInterval); timerInterval = null; $('#startTimerBtn').textContent = '▶ 開始'; });
  $('#set2Btn').addEventListener('click', () => { setTimer(120); clearInterval(timerInterval); timerInterval = null; $('#startTimerBtn').textContent = '▶ 開始'; });
  $('#set5Btn').addEventListener('click', () => { setTimer(300); clearInterval(timerInterval); timerInterval = null; $('#startTimerBtn').textContent = '▶ 開始'; });

  updateTimerDisplay();
}

function playTimerEndSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  } catch (e) {}
}

// ─── MODE SWITCHER ────────────────────────────────────────────────────────────
function setupModeSwitcher() {
  $$('.mode-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      $$('.mode-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentMode = tab.dataset.mode;
      $('#interviewPanel').style.display = currentMode === 'interview' ? 'flex' : 'none';
      $('#interviewPanel').className = currentMode === 'interview' ? '' : '';
      $('#practicePanel').classList.toggle('show', currentMode === 'practice');

      if (currentMode === 'practice') {
        stopListening();
        setupTimerControls();
      }
    });
  });
}

// ─── EVENT LISTENERS ──────────────────────────────────────────────────────────
function setupEventListeners() {
  // Mic toggle
  $('#micToggle').addEventListener('click', () => {
    if (currentMode !== 'interview') return;
    toggleListening();
  });

  // TTS buttons
  $('#ttsBtn').addEventListener('click', () => {
    if (ttsSpeaking) {
      stopTts();
    } else if (currentAnswer) {
      speak(currentAnswer);
    }
  });
  $('#stopTtsBtn').addEventListener('click', stopTts);

  // Cancel answer
  $('#cancelAnswerBtn').addEventListener('click', cancelAnswer);

  // Copy answer
  $('#copyAnswerBtn').addEventListener('click', () => {
    if (currentAnswer) {
      navigator.clipboard.writeText(currentAnswer).then(() => {
        $('#copyAnswerBtn').textContent = '✅';
        setTimeout(() => { $('#copyAnswerBtn').textContent = '📋'; }, 1500);
      });
    }
  });

  // TTS speed
  $$('.speed-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      ttsSpeed = parseFloat(btn.dataset.speed);
      $$('.speed-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      chrome.storage.sync.set({ ttsSpeed: ttsSpeed.toString() });
    });
  });

  // Model/language selects → save
  $('#modelSelect').addEventListener('change', (e) => {
    chrome.storage.sync.set({ model: e.target.value });
  });
  $('#langSelect').addEventListener('change', (e) => {
    const lang = e.target.value;
    chrome.storage.sync.set({ recognitionLang: lang });
    if (recognition) recognition.lang = lang;
  });

  // TTS prompt
  $('#ttsYesBtn').addEventListener('click', () => {
    hideTtsPrompt();
    speak(currentAnswer);
  });
  $('#ttsNoBtn').addEventListener('click', hideTtsPrompt);

  // Keyboard shortcut Alt+Shift+M (also handled by background.js → this file)
  document.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && e.key === 'M') {
      e.preventDefault();
      if (currentMode === 'interview') toggleListening();
    }
  });
}

// ─── UTILITIES ────────────────────────────────────────────────────────────────
function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── START ────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);

// Handle messages from background.js
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'toggle-listening' && currentMode === 'interview') {
    toggleListening();
  }
});
