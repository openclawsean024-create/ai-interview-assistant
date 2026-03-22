// AI Interview Assistant - Content Script
let isListening = false;
let audioContext = null;

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'startListening') {
    startListening(message.recognitionLang || 'en-US');
  } else if (message.action === 'stopListening') {
    stopListening();
  }
});

async function startListening(recognitionLang = 'en-US') {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.createMediaStreamSource(stream);

    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = recognitionLang;

      recognition.onresult = async (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0].transcript)
          .join('');

        if (event.results[event.results.length - 1].isFinal && transcript.length > 10) {
          await analyzeQuestion(transcript);
        }
      };

      recognition.onerror = (error) => {
        console.error('Speech recognition error:', error);
      };

      recognition.start();
      isListening = true;
      window.__aiAssistantRecognition = recognition;
    }

    console.log('AI Interview Assistant: Started listening');
  } catch (error) {
    console.error('Failed to start listening:', error);
    alert('無法取得麥克風權限，請檢查瀏覽器設定。');
  }
}

function stopListening() {
  if (window.__aiAssistantRecognition) {
    window.__aiAssistantRecognition.stop();
    window.__aiAssistantRecognition = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  isListening = false;
  console.log('AI Interview Assistant: Stopped listening');
}

async function analyzeQuestion(question) {
  const settings = await chrome.storage.local.get(['model', 'apiKey']);
  if (!settings.apiKey) return;

  try {
    const prompt = `你是專業的面試助手。請根據以下面試問題，提供：
1. 一個專業的答案建議（2-3句話）
2. 3個相關的參考資料連結（真實的技術文檔或文章）
3. 一個簡短 follow-up 提醒（告訴面試者下一句可以怎麼接）

面試問題: ${question}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify({
        model: settings.model || 'gpt-4o',
        messages: [
          { role: 'system', content: '你是專業的面試助手，擅长技术面试。' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content || '分析中...';
    const sources = parseSources(answer);

    chrome.runtime.sendMessage({
      type: 'question',
      question,
      answer,
      sources
    });

    showOverlay(question, answer, sources);
  } catch (error) {
    console.error('AI analysis error:', error);
  }
}

function parseSources(text) {
  const sources = [];
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const lines = text.split('\n');
  for (const line of lines) {
    const url = line.match(urlRegex)?.[0];
    if (url && sources.length < 3) {
      sources.push({
        title: line.replace(url, '').replace(/^\d+\.\s*/, '').trim() || '參考資料',
        url
      });
    }
  }
  return sources;
}

function showOverlay(question, answer, sources) {
  const existing = document.getElementById('ai-interview-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'ai-interview-overlay';
  overlay.innerHTML = `
    <style>
      #ai-interview-overlay { position: fixed; bottom: 20px; right: 20px; width: 380px; max-height: 420px; background: rgba(26, 26, 46, 0.98); border: 1px solid rgba(102, 126, 234, 0.3); border-radius: 16px; padding: 20px; z-index: 999999; box-shadow: 0 10px 40px rgba(0,0,0,0.5); font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif; overflow-y: auto; cursor: move; user-select: none; }
      #ai-interview-overlay::-webkit-scrollbar { width: 6px; }
      #ai-interview-overlay::-webkit-scrollbar-track { background: rgba(255,255,255,0.05); border-radius: 3px; }
      #ai-interview-overlay::-webkit-scrollbar-thumb { background: rgba(102,126,234,0.4); border-radius: 3px; }
      #ai-interview-overlay .question { color: #667eea; font-weight: 600; font-size: 14px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px solid rgba(255,255,255,0.1); cursor: default; }
      #ai-interview-overlay .answer { color: #fff; font-size: 14px; line-height: 1.6; margin-bottom: 12px; white-space: pre-wrap; cursor: default; }
      #ai-interview-overlay .sources { padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); }
      #ai-interview-overlay .sources-title { font-size: 11px; color: #666; margin-bottom: 8px; }
      #ai-interview-overlay a { display: block; font-size: 12px; color: #4a9eff; text-decoration: none; margin: 4px 0; cursor: pointer; }
      #ai-interview-overlay a:hover { text-decoration: underline; }
      #ai-interview-overlay .close-btn { position: absolute; top: 8px; right: 8px; background: rgba(255,255,255,0.1); border: none; color: #888; cursor: pointer; font-size: 16px; width: 24px; height: 24px; border-radius: 50%; transition: background 0.2s; }
      #ai-interview-overlay .close-btn:hover { background: rgba(239,68,68,0.5); color: #fff; }
      #ai-interview-overlay .drag-hint { font-size: 10px; color: #555; text-align: center; margin-bottom: 8px; }
    </style>
    <div class="drag-hint">⋮⋮ 拖曳移動</div>
    <button class="close-btn" onclick="this.parentElement.remove()" aria-label="關閉">×</button>
    <div class="question">問題: ${question}</div>
    <div class="answer">${answer.replace(/答案:|參考資料:/g, '').split('參考資料')[0]}</div>
    ${sources?.length ? `<div class="sources"><div class="sources-title">📚 參考資料:</div>${sources.map(s => `<a href="${s.url}" target="_blank" rel="noopener noreferrer">${s.title}</a>`).join('')}</div>` : ''}
  `;

  // Drag functionality
  let isDragging = false, startX, startY, startLeft, startBottom;
  overlay.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('close-btn') || e.target.tagName === 'A') return;
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = overlay.getBoundingClientRect();
    startLeft = rect.left;
    startBottom = window.innerHeight - rect.top;
    overlay.style.right = 'auto';
    overlay.style.bottom = 'auto';
    overlay.style.left = startLeft + 'px';
    overlay.style.top = startBottom + 'px';
  });
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const dx = e.clientX - startX;
    const dy = startY - e.clientY;
    overlay.style.left = (startLeft + dx) + 'px';
    overlay.style.top = (startBottom + dy) + 'px';
  });
  document.addEventListener('mouseup', () => { isDragging = false; });

  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 60000);
}
