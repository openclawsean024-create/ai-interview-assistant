'use client';

export const dynamic = 'force-dynamic';

import { useAuth } from '@/components/auth-provider';
import { useLocale } from '@/app/i18n/locale-context';
import { LanguageSwitcher } from '@/app/components/language-switcher';
import { deleteSession } from '@/app/lib/session/session';
import { FREE_TIER_LIMIT, readQuota } from '@/app/lib/session/quota';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Navbar,
  Footer,
  PageHeader,
  Container,
  SkipLink,
  Button,
  Modal,
  IconKey,
  IconMic,
  IconZap,
  IconShield,
  IconTrash,
  IconDownload,
  IconBook,
  IconCheck,
  IconSparkle,
  IconDownload as IconDownloadIcon,
} from '@/app/components/ui-primitives';
import SessionInit from '@/app/components/session-init';

export default function SettingsPage() {
  const { user, isSignedIn, isLoaded } = useAuth();
  const { t, locale } = useLocale();
  const isEnglish = locale === 'en';
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState('');
  const [testStatusType, setTestStatusType] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [history, setHistory] = useState<any[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [ttsSpeed, setTtsSpeed] = useState('1.0');
  const [recognitionLang, setRecognitionLang] = useState('zh-TW');
  const [micDevices, setMicDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMicId, setSelectedMicId] = useState('');
  const [sessionUsed, setSessionUsed] = useState(0);
  const [sessionDeleted, setSessionDeleted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Load settings from chrome.storage.sync (Chrome extension) or localStorage
  useEffect(() => {
    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage) {
      (window as any).chrome.storage.sync.get(['apiKey', 'answerHistory', 'ttsSpeed', 'recognitionLang', 'selectedMicId'], (data: any) => {
        if (data.apiKey) setApiKey(data.apiKey);
        if (data.answerHistory) { setHistory(data.answerHistory); setHistoryLoaded(true); }
        if (data.ttsSpeed) setTtsSpeed(data.ttsSpeed);
        if (data.recognitionLang) setRecognitionLang(data.recognitionLang);
        if (data.selectedMicId) setSelectedMicId(data.selectedMicId);
      });
    } else if (isSignedIn && user?.id) {
      const stored = localStorage.getItem(`apikey_${user.id}`);
      if (stored) setApiKey(stored);

      const hist = localStorage.getItem(`history_${user.id}`);
      if (hist) { setHistory(JSON.parse(hist)); setHistoryLoaded(true); }

      const speed = localStorage.getItem(`ttsSpeed_${user.id}`);
      if (speed) setTtsSpeed(speed);
      const lang = localStorage.getItem(`recognitionLang_${user.id}`);
      if (lang) setRecognitionLang(lang);
    }
  }, [isSignedIn, user?.id]);

  async function loadMicDevices() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      const devices = await navigator.mediaDevices.enumerateDevices();
      setMicDevices(devices.filter(d => d.kind === 'audioinput'));
    } catch (e) {
      // No mic permission
    }
  }

  async function saveApiKey() {
    if (!apiKey.trim()) {
      setTestStatus(isEnglish ? 'Please enter an API Key' : '請輸入 API Key');
      setTestStatusType('error');
      return;
    }
    const key = apiKey.trim();

    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage) {
      await new Promise<void>((resolve) => {
        (window as any).chrome.storage.sync.set({ apiKey: key }, () => resolve());
      });
    }

    if (isSignedIn && user?.id) {
      localStorage.setItem(`apikey_${user.id}`, key);
    }

    setSaved(true);
    setTestStatus('');
    setTestStatusType('idle');
    // 通知 DemoModeBadge 更新
    window.dispatchEvent(new CustomEvent('aiia:byok-changed'));
    setTimeout(() => setSaved(false), 3000);
  }

  async function testApiKey() {
    if (!apiKey.trim()) {
      setTestStatus(isEnglish ? 'Please enter an API Key first' : '請先輸入 API Key');
      setTestStatusType('error');
      return;
    }
    setTestStatus(isEnglish ? 'Testing...' : '測試中...');
    setTestStatusType('pending');
    try {
      const res = await fetch('/api/test-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestStatus(isEnglish ? 'API Key is valid' : 'API Key 有效');
        setTestStatusType('success');
      } else {
        setTestStatus(`${isEnglish ? 'Error' : '錯誤'}: ${data.error}`);
        setTestStatusType('error');
      }
    } catch (e: any) {
      setTestStatus(`${isEnglish ? 'Test failed' : '測試失敗'}: ${e.message}`);
      setTestStatusType('error');
    }
  }

  function exportHistoryMD() {
    if (!history.length) return;
    const md = history.map(h =>
      `## ${new Date(h.ts).toLocaleString('zh-TW')}\n\n**Q:** ${h.q}\n\n**A:** ${h.a}\n`
    ).join('\n---\n\n');
    const blob = new Blob([`# AI Interview History\n\n${md}`], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-interview-history-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // v3.0 SPEC §17.4 AC-018: 一鍵刪除所有 aiia.* localStorage keys
  function handleDeleteSession() {
    deleteSession();
    setSessionDeleted(true);
    setSessionUsed(0);
    setHistory([]);
    setHistoryLoaded(true);
    setApiKey('');
    setShowDeleteModal(false);
    // 通知 SessionInit 重新讀 quota + 刪除事件
    window.dispatchEvent(new CustomEvent('aiia:session-deleted'));
    window.dispatchEvent(new CustomEvent('aiia:byok-changed'));
  }

  // 監聽 quota change 與 delete event
  useEffect(() => {
    setSessionUsed(readQuota().used);
    const onQuota = () => setSessionUsed(readQuota().used);
    const onDeleted = () => {
      setSessionUsed(0);
      setSessionDeleted(true);
    };
    window.addEventListener('aiia:quota-changed', onQuota);
    window.addEventListener('aiia:session-deleted', onDeleted);
    return () => {
      window.removeEventListener('aiia:quota-changed', onQuota);
      window.removeEventListener('aiia:session-deleted', onDeleted);
    };
  }, []);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="flex items-center gap-3 text-primary">
          <span className="status-dot status-dot-info animate-pulse-glow" />
          <span className="text-sm font-medium">Loading…</span>
        </div>
      </div>
    );
  }

  // v4: settings page works WITHOUT login for Chrome extension users
  if (!isSignedIn) {
    const isChrome = typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage;
    if (!isChrome) {
      return (
        <div className="min-h-screen flex flex-col bg-bg">
          <SkipLink />
          <Navbar active="/settings" locale={isEnglish ? 'en' : 'zh'} />
          <Container className="py-12 max-w-2xl">
            <PageHeader
              title={isEnglish ? 'Settings' : '設定'}
              description={isEnglish
                ? 'Some settings require the Chrome extension or sign-in.'
                : '部分設定需要 Chrome 插件或登入。'}
            />
            <div className="card">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center flex-shrink-0">
                  <IconBook size={20} />
                </div>
                <div className="flex-1">
                  <h3 className="text-h4 text-ink mb-2">
                    {isEnglish ? 'Chrome Extension recommended' : '建議使用 Chrome 插件'}
                  </h3>
                  <p className="text-sm text-ink-secondary leading-relaxed mb-3">
                    {isEnglish
                      ? 'Install the Chrome Extension for the full experience. Alt+Shift+M to toggle listening. Settings auto-sync without sign-in.'
                      : '請透過 Chrome 插件使用完整功能。安裝後 Alt+Shift+M 快速開關聆聽,設定自動同步,無需登入。'}
                  </p>
                  <Link href="/interview" className="btn-primary">
                    {isEnglish ? 'Open Interview' : '開始面試演練'}
                  </Link>
                </div>
              </div>
            </div>
          </Container>
          <Footer locale={isEnglish ? 'en' : 'zh'} />
        </div>
      );
    }
  }

  const freeRemaining = Math.max(0, FREE_TIER_LIMIT - sessionUsed);

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <SkipLink />
      <SessionInit />
      <Navbar active="/settings" locale={isEnglish ? 'en' : 'zh'} />

      <main id="main-content">
        <Container className="py-8 lg:py-10 max-w-3xl">
          <PageHeader
            eyebrow="v3.0"
            title={isEnglish ? 'Settings' : '設定'}
            description={isEnglish
              ? 'API key, voice preferences, practice quota, and local session. All data stays in your browser.'
              : 'API Key、語音偏好、練習額度、本機 session。所有資料只存於你的瀏覽器。'}
            actions={
              <span
                data-testid="aiia-settings-mode"
                className={`tag ${apiKey ? '' : 'tag-muted'}`}
              >
                <span className={`status-dot ${apiKey ? 'status-dot-success' : 'status-dot-warning'}`} />
                {apiKey
                  ? (isEnglish ? 'LLM Mode' : 'LLM 模式')
                  : (isEnglish ? 'Demo Mode' : 'Demo 模式')}
              </span>
            }
          />

          {/* ===== API Key Section (BYOK) ===== */}
          <section aria-labelledby="api-key-heading" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <IconKey size={20} />
              </div>
              <div>
                <h2 id="api-key-heading" className="text-h3 text-ink">
                  {isEnglish ? 'OpenAI API Key (BYOK)' : 'OpenAI API Key (BYOK)'}
                </h2>
                <p className="text-sm text-ink-muted">
                  {isEnglish ? 'Bring your own key. Stored locally, never sent to our servers.' : '自帶 key,只存本機,不送伺服器。'}
                </p>
              </div>
            </div>

            <div className="card space-y-4">
              <div>
                <label htmlFor="api-key-input" className="block text-sm font-semibold text-ink mb-2">
                  {isEnglish ? 'API Key' : 'API Key'}
                </label>
                <input
                  id="api-key-input"
                  type="password"
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    if (testStatusType !== 'idle') {
                      setTestStatus('');
                      setTestStatusType('idle');
                    }
                  }}
                  placeholder="sk-…"
                  className="input-field"
                  autoComplete="off"
                />
                <p className="mt-2 text-xs text-ink-muted">
                  {isEnglish
                    ? 'Get a key from platform.openai.com/api-keys. Costs are your responsibility.'
                    : '從 platform.openai.com/api-keys 取得。費用由你完全自負。'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={saveApiKey}
                  disabled={!apiKey.trim()}
                  aria-label={isEnglish ? 'Save API Key' : '儲存 API Key'}
                >
                  {saved
                    ? <><IconCheck size={16} />{isEnglish ? 'Saved' : '已儲存'}</>
                    : <>{isEnglish ? 'Save Key' : '儲存'}</>}
                </Button>
                <Button
                  variant="ghost"
                  onClick={testApiKey}
                  disabled={!apiKey.trim()}
                  aria-label={isEnglish ? 'Test API Key' : '測試 API Key'}
                >
                  <IconZap size={16} />
                  {isEnglish ? 'Test Connection' : '測試連線'}
                </Button>
              </div>

              {testStatus && (
                <div
                  role="status"
                  aria-live="polite"
                  className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
                    testStatusType === 'success' ? 'bg-success/10 text-success border border-success/30' :
                    testStatusType === 'error'   ? 'bg-danger/10 text-danger border border-danger/30' :
                    testStatusType === 'pending' ? 'bg-info/10 text-info border border-info/30' :
                                                  'bg-surface-elevated text-ink-secondary border border-border-subtle'
                  }`}
                >
                  {testStatusType === 'success' && <IconCheck size={16} className="flex-shrink-0 mt-0.5" />}
                  {testStatusType === 'error' && <span className="flex-shrink-0 mt-0.5">⚠</span>}
                  {testStatusType === 'pending' && <span className="status-dot status-dot-info animate-pulse-glow flex-shrink-0 mt-1.5" />}
                  <span>{testStatus}</span>
                </div>
              )}
            </div>
          </section>

          {/* ===== Local Session Section (AC-016/017/018) ===== */}
          <section aria-labelledby="session-heading" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <IconShield size={20} />
              </div>
              <div>
                <h2 id="session-heading" className="text-h3 text-ink">
                  {isEnglish ? 'Local Session' : '本機 Session'}
                </h2>
                <p className="text-sm text-ink-muted">
                  {isEnglish ? 'Anonymous-first. Stored in your browser only.' : 'anonymous-first,只存於你的瀏覽器。'}
                </p>
              </div>
            </div>

            <div className="card space-y-4">
              {/* Free quota meter */}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-sm font-medium text-ink">
                    {isEnglish ? 'Free practice quota' : '免費練習額度'}
                  </span>
                  <span className="text-xs text-ink-muted">
                    {isEnglish ? 'Resets when you delete the session' : '刪除 session 後重置'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    data-testid="aiia-settings-quota"
                    data-free-left={freeRemaining}
                    className={`stat-number ${freeRemaining === 0 ? 'text-danger' : ''}`}
                  >
                    {freeRemaining}
                  </span>
                  <span className="text-sm text-ink-muted">/ {FREE_TIER_LIMIT}</span>
                </div>
                <div className="h-2 bg-surface-elevated rounded-full overflow-hidden" role="progressbar" aria-valuenow={freeRemaining} aria-valuemin={0} aria-valuemax={FREE_TIER_LIMIT}>
                  <div
                    className={`h-full transition-all ${freeRemaining === 0 ? 'bg-danger' : 'bg-primary'}`}
                    style={{ width: `${(freeRemaining / FREE_TIER_LIMIT) * 100}%` }}
                  />
                </div>
              </div>

              {sessionDeleted && (
                <div
                  role="status"
                  data-testid="session-deleted-toast"
                  className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success border border-success/30 text-sm"
                >
                  <IconCheck size={16} />
                  {isEnglish ? 'Session deleted. Quota reset.' : 'Session 已刪除,額度已重置。'}
                </div>
              )}

              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                aria-label={isEnglish ? 'Delete local session' : '刪除本機 session'}
              >
                <IconTrash size={16} />
                {isEnglish ? 'Delete local session' : '刪除本機 session'}
              </Button>

              <p className="text-xs text-ink-muted leading-relaxed">
                {isEnglish
                  ? 'Removes all aiia.* keys from this browser (session id, practice quota, events, BYOK API key). Cannot be undone.'
                  : '清除本瀏覽器所有 aiia.* 資料 (session id、配額、事件、BYOK API key)。無法復原。'}
              </p>
            </div>
          </section>

          {/* ===== Voice & TTS Section ===== */}
          <section aria-labelledby="voice-heading" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <IconMic size={20} />
              </div>
              <div>
                <h2 id="voice-heading" className="text-h3 text-ink">
                  {isEnglish ? 'Voice & Speech' : '語音與朗讀'}
                </h2>
                <p className="text-sm text-ink-muted">
                  {isEnglish ? 'Recognition language, TTS speed, microphone device.' : '語音辨識語言、TTS 朗讀速度、麥克風裝置。'}
                </p>
              </div>
            </div>

            <div className="card space-y-5">
              <div>
                <label htmlFor="recog-lang" className="block text-sm font-semibold text-ink mb-2">
                  {isEnglish ? 'Recognition language' : '語音辨識語言'}
                </label>
                <select
                  id="recog-lang"
                  value={recognitionLang}
                  onChange={(e) => {
                    setRecognitionLang(e.target.value);
                    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage) {
                      (window as any).chrome.storage.sync.set({ recognitionLang: e.target.value });
                    }
                    if (isSignedIn && user?.id) localStorage.setItem(`recognitionLang_${user.id}`, e.target.value);
                  }}
                  className="input-field"
                >
                  <option value="zh-TW">{isEnglish ? 'Chinese (Traditional)' : '中文 (繁體)'}</option>
                  <option value="zh-CN">{isEnglish ? 'Chinese (Simplified)' : '中文 (简体)'}</option>
                  <option value="en-US">English</option>
                  <option value="ja-JP">{isEnglish ? 'Japanese' : '日本語'}</option>
                  <option value="ko-KR">{isEnglish ? 'Korean' : '한국어'}</option>
                </select>
              </div>

              <div>
                <label htmlFor="tts-speed" className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-ink">{isEnglish ? 'TTS speed' : 'TTS 朗讀速度'}</span>
                  <span className="text-sm font-mono text-primary">{parseFloat(ttsSpeed).toFixed(1)}x</span>
                </label>
                <input
                  id="tts-speed"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={ttsSpeed}
                  onChange={(e) => {
                    setTtsSpeed(e.target.value);
                    if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage) {
                      (window as any).chrome.storage.sync.set({ ttsSpeed: e.target.value });
                    }
                    if (isSignedIn && user?.id) localStorage.setItem(`ttsSpeed_${user.id}`, e.target.value);
                  }}
                  className="w-full h-2 bg-surface-elevated rounded-full appearance-none cursor-pointer accent-primary"
                  aria-label={isEnglish ? 'TTS speed' : 'TTS 朗讀速度'}
                />
                <div className="flex justify-between mt-1 text-xs text-ink-muted font-mono">
                  <span>0.5x</span>
                  <span>1.0x</span>
                  <span>2.0x</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="mic-device" className="text-sm font-semibold text-ink">
                    {isEnglish ? 'Microphone device' : '麥克風裝置'}
                  </label>
                  <Button variant="ghost" onClick={loadMicDevices}>
                    {isEnglish ? 'Refresh' : '重新整理'}
                  </Button>
                </div>
                {micDevices.length === 0 ? (
                  <p className="text-xs text-ink-muted">
                    {isEnglish
                      ? 'Click Refresh to load devices (requires microphone permission).'
                      : '點擊重新整理以載入麥克風列表(需授權麥克風權限)。'}
                  </p>
                ) : (
                  <select
                    id="mic-device"
                    value={selectedMicId}
                    onChange={(e) => {
                      const micId = e.target.value;
                      setSelectedMicId(micId);
                      if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.storage) {
                        (window as any).chrome.storage.sync.set({ selectedMicId: micId });
                      }
                      if (isSignedIn && user?.id) localStorage.setItem(`selectedMicId_${user.id}`, micId);
                    }}
                    className="input-field"
                  >
                    {micDevices.map((mic, i) => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || `${isEnglish ? 'Microphone' : '麥克風'} ${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </section>

          {/* ===== Practice History Section ===== */}
          <section aria-labelledby="history-heading" className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/15 text-primary flex items-center justify-center">
                <IconBook size={20} />
              </div>
              <div>
                <h2 id="history-heading" className="text-h3 text-ink">
                  {isEnglish ? 'Practice History' : '練習歷史'}
                </h2>
                <p className="text-sm text-ink-muted">
                  {isEnglish ? 'Export your past sessions as Markdown.' : '將過去練習匯出為 Markdown。'}
                </p>
              </div>
            </div>

            <div className="card">
              {!historyLoaded ? (
                <div className="text-ink-muted text-sm">{isEnglish ? 'Loading history…' : '載入歷史記錄中…'}</div>
              ) : history.length === 0 ? (
                <div className="text-center py-8">
                  <IconBook size={32} className="mx-auto mb-3 text-ink-muted opacity-40" />
                  <p className="text-ink font-medium mb-1">
                    {isEnglish ? 'No practice history yet' : '尚無練習記錄'}
                  </p>
                  <p className="text-sm text-ink-muted mb-4">
                    {isEnglish
                      ? 'Start using the Chrome Extension to build your history.'
                      : '開始使用 Chrome 插件來建立你的歷史記錄吧。'}
                  </p>
                  <Link href="/interview" className="btn-primary">
                    {isEnglish ? 'Start practice' : '開始練習'}
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-ink-secondary">
                      {history.length} {isEnglish ? 'entries' : '筆'}
                    </span>
                    <Button variant="ghost" onClick={exportHistoryMD}>
                      <IconDownload size={14} />
                      {isEnglish ? 'Export MD' : '匯出 MD'}
                    </Button>
                  </div>
                  <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {history.slice(0, 20).map((entry, i) => (
                      <li key={i} className="p-3 bg-surface-elevated border border-border-subtle rounded-lg">
                        <div className="flex justify-between items-baseline mb-1.5">
                          <span className="text-xs font-semibold text-primary">Q</span>
                          <span className="text-xs text-ink-muted">
                            {new Date(entry.ts).toLocaleString(isEnglish ? 'en-US' : 'zh-TW')}
                          </span>
                        </div>
                        <p className="text-sm text-ink mb-2 leading-relaxed">{entry.q}</p>
                        {entry.cat && (
                          <span className="text-[10px] text-ink-muted bg-surface px-1.5 py-0.5 rounded mr-2">
                            {entry.cat === 'interview' ? (isEnglish ? 'Interview' : '面試模式') :
                             entry.cat === 'practice' ? (isEnglish ? 'Practice' : '練習模式') :
                             entry.cat}
                          </span>
                        )}
                        {entry.a && (
                          <p className="text-xs text-ink-secondary leading-relaxed line-clamp-3">
                            {entry.a.substring(0, 140)}{entry.a.length > 140 ? '…' : ''}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </Container>
      </main>

      <Footer locale={isEnglish ? 'en' : 'zh'} />

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={isEnglish ? 'Delete local session?' : '刪除本機 session?'}
        description={isEnglish
          ? 'This will permanently remove all aiia.* keys from this browser: session id, practice quota, events, and your BYOK API key. Cannot be undone.'
          : '將永久清除本瀏覽器所有 aiia.* 資料:session id、配額、事件、BYOK API key。無法復原。'}
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="flex-1">
              {isEnglish ? 'Cancel' : '取消'}
            </Button>
            <Button variant="danger" onClick={handleDeleteSession} className="flex-1">
              <IconTrash size={16} />
              {isEnglish ? 'Delete' : '刪除'}
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-ink-secondary">
          <p>{isEnglish ? 'The following will be removed:' : '將清除以下項目:'}</p>
          <ul className="space-y-1 pl-4 list-disc">
            <li><code className="font-mono text-primary">aiia.session.uid</code> — {isEnglish ? 'Your anonymous session id' : '你的匿名 session id'}</li>
            <li><code className="font-mono text-primary">aiia.session.quota</code> — {isEnglish ? 'Free practice count' : '免費練習計數'}</li>
            <li><code className="font-mono text-primary">aiia.session.events</code> — {isEnglish ? 'Practice events log' : '練習事件記錄'}</li>
            <li><code className="font-mono text-primary">aiia.byok.apiKey</code> — {isEnglish ? 'Your OpenAI API key' : '你的 OpenAI API key'}</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
}
