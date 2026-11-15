'use client';

// app/settings/page.tsx
// 設定頁：自備 API key（選填）、免費額度、練習紀錄、一鍵刪除（AC-008）。不需登入。
// 所有設定只存在瀏覽器 localStorage 的 aiia.* key。

export const dynamic = 'force-dynamic';

import { useLocale } from '@/app/i18n/locale-context';
import { deleteSession } from '@/app/lib/session/session';
import { FREE_TIER_LIMIT, readQuota } from '@/app/lib/session/quota';
import { readApiKey, writeApiKey } from '@/app/lib/storage/local';
import { loadHistory, type PracticeHistoryEntry } from '@/app/lib/practice/store';
import { JOB_LEVEL_LABELS, JOB_TYPE_LABELS } from '@/app/lib/questions/bank';
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
  IconZap,
  IconShield,
  IconTrash,
  IconBook,
  IconCheck,
} from '@/app/components/ui-primitives';
import SessionInit from '@/app/components/session-init';

export default function SettingsPage() {
  const { locale } = useLocale();
  const isEnglish = locale === 'en';
  const lang = isEnglish ? 'en' : 'zh';
  const [apiKey, setApiKey] = useState('');
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState('');
  const [testStatusType, setTestStatusType] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [history, setHistory] = useState<PracticeHistoryEntry[]>([]);
  const [sessionUsed, setSessionUsed] = useState(0);
  const [sessionDeleted, setSessionDeleted] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const stored = readApiKey();
    setApiKey(stored);
    setHasSavedKey(!!stored);
    setHistory(loadHistory());
  }, []);

  function saveApiKey() {
    const key = apiKey.trim();
    if (!key) {
      setTestStatus(isEnglish ? 'Please enter an API Key' : '請輸入 API Key');
      setTestStatusType('error');
      return;
    }
    writeApiKey(key);
    setHasSavedKey(true);
    setSaved(true);
    setSessionDeleted(false);
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
      const res = await fetch('/api/test-key/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
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

  // AC-008：一鍵刪除本產品在這個瀏覽器的全部資料（API key、練習 session、報告、統計、歷史）。
  // 只保留介面語系偏好。
  function handleDeleteSession() {
    deleteSession();
    setSessionDeleted(true);
    setSessionUsed(0);
    setHistory([]);
    setApiKey('');
    setHasSavedKey(false);
    setSaved(false);
    setTestStatus('');
    setTestStatusType('idle');
    setShowDeleteModal(false);
    // 通知 SessionInit 與 DemoModeBadge 重新讀取狀態
    window.dispatchEvent(new CustomEvent('aiia:session-deleted'));
    window.dispatchEvent(new CustomEvent('aiia:byok-changed'));
  }

  // 監聽 quota change
  useEffect(() => {
    setSessionUsed(readQuota().used);
    const onQuota = () => setSessionUsed(readQuota().used);
    window.addEventListener('aiia:quota-changed', onQuota);
    return () => window.removeEventListener('aiia:quota-changed', onQuota);
  }, []);

  const freeRemaining = Math.max(0, FREE_TIER_LIMIT - sessionUsed);

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <SkipLink />
      <SessionInit />
      <Navbar active="/settings" locale={isEnglish ? 'en' : 'zh'} />

      <main id="main-content">
        <Container className="py-8 lg:py-10 max-w-3xl">
          <PageHeader
            eyebrow={isEnglish ? 'Settings' : '設定'}
            title={isEnglish ? 'Settings' : '設定'}
            description={isEnglish
              ? 'Optional API key, practice quota, practice history, and one-click data deletion. Settings are stored in this browser only.'
              : '選填的 API Key、練習額度、練習紀錄與一鍵刪除。設定只儲存在這個瀏覽器。'}
            actions={
              <span
                data-testid="aiia-settings-mode"
                data-mode={hasSavedKey ? 'byok' : 'mock'}
                className={`tag ${hasSavedKey ? '' : 'tag-muted'}`}
              >
                <span className={`status-dot ${hasSavedKey ? 'status-dot-success' : 'status-dot-warning'}`} />
                {hasSavedKey
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
                  {isEnglish
                    ? 'Optional. The key is stored in this browser. When you practise with it, your questions, answers and the key are relayed through this site\'s server to the AI provider.'
                    : '選填。Key 儲存在這個瀏覽器；使用它練習時，題目、回答與 key 會經本站伺服器轉送給 AI 供應商。'}
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
                  {isEnglish ? 'Local data' : '本機資料'}
                </h2>
                <p className="text-sm text-ink-muted">
                  {isEnglish ? 'No account needed. Practice data is stored in this browser only.' : '不需帳號。練習資料只儲存在這個瀏覽器。'}
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
                    {isEnglish ? 'Resets when you delete your data' : '刪除資料後重置'}
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
                  {isEnglish ? 'Deleted. All local data for this product has been removed.' : '已刪除。本產品在這個瀏覽器的資料已全部清除。'}
                </div>
              )}

              <Button
                variant="danger"
                onClick={() => setShowDeleteModal(true)}
                data-testid="open-delete-modal-btn"
                aria-label={isEnglish ? 'Delete all my data' : '刪除我的全部資料'}
              >
                <IconTrash size={16} />
                {isEnglish ? 'Delete all my data' : '刪除資料'}
              </Button>

              <p className="text-xs text-ink-muted leading-relaxed">
                {isEnglish
                  ? 'Removes everything this product stored in this browser: API key, practice sessions, reports, usage stats and history. Only the interface language preference is kept. Cannot be undone.'
                  : '清除本產品存在這個瀏覽器的全部資料：API key、練習 session、複盤報告、使用統計與歷史。只保留介面語系偏好。無法復原。'}
              </p>
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
                  {isEnglish ? 'Finished debrief reports stored in this browser.' : '儲存在這個瀏覽器的複盤報告。'}
                </p>
              </div>
            </div>

            <div className="card" data-testid="settings-history">
              {history.length === 0 ? (
                <div className="text-center py-8">
                  <IconBook size={32} className="mx-auto mb-3 text-ink-muted opacity-40" />
                  <p className="text-ink font-medium mb-1">
                    {isEnglish ? 'No practice history yet' : '尚無練習紀錄'}
                  </p>
                  <p className="text-sm text-ink-muted mb-4">
                    {isEnglish
                      ? 'Finish a mock interview to see your debrief reports here.'
                      : '完成一次模擬面試後，複盤報告會列在這裡。'}
                  </p>
                  <Link href="/interview" className="btn-primary">
                    {isEnglish ? 'Start practice' : '開始練習'}
                  </Link>
                </div>
              ) : (
                <ul className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {history.slice(0, 20).map((entry) => (
                    <li key={entry.reportId} className="p-3 bg-surface-elevated border border-border-subtle rounded-lg">
                      <Link href={`/report/${entry.reportId}`} className="flex items-baseline justify-between gap-3 hover:text-primary">
                        <span className="text-sm text-ink">
                          {JOB_TYPE_LABELS[entry.jobType as keyof typeof JOB_TYPE_LABELS]?.[lang] ?? entry.jobType}
                          {' · '}
                          {JOB_LEVEL_LABELS[entry.jobLevel as keyof typeof JOB_LEVEL_LABELS]?.[lang] ?? entry.jobLevel}
                          {' · '}
                          {entry.questionCount} {isEnglish ? 'questions' : '題'}
                        </span>
                        <span className="text-sm font-semibold text-primary tabular-nums">{entry.overallScore} / 100</span>
                      </Link>
                      <span className="text-xs text-ink-muted">
                        {new Date(entry.completedAt).toLocaleString(isEnglish ? 'en-US' : 'zh-TW')}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </Container>
      </main>

      <Footer locale={isEnglish ? 'en' : 'zh'} />

      <Modal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={isEnglish ? 'Delete all my data?' : '刪除全部資料？'}
        description={isEnglish
          ? 'This permanently removes everything this product stored in this browser. Cannot be undone.'
          : '將永久清除本產品存在這個瀏覽器的全部資料。無法復原。'}
        actions={
          <>
            <Button variant="ghost" onClick={() => setShowDeleteModal(false)} className="flex-1">
              {isEnglish ? 'Cancel' : '取消'}
            </Button>
            <Button variant="danger" onClick={handleDeleteSession} className="flex-1" data-testid="delete-session-btn">
              <IconTrash size={16} />
              {isEnglish ? 'Delete' : '確認刪除'}
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-ink-secondary">
          <p>{isEnglish ? 'The following will be removed:' : '將清除以下項目:'}</p>
          <ul className="space-y-1 pl-4 list-disc">
            <li>{isEnglish ? 'Your API key (if saved)' : '你儲存的 API key（如有）'}</li>
            <li>{isEnglish ? 'Practice sessions and debrief reports' : '練習 session 與複盤報告'}</li>
            <li>{isEnglish ? 'Usage stats, quota count and practice history' : '使用統計、額度計數與練習歷史'}</li>
            <li>{isEnglish ? 'Anonymous session id, consent choice and events' : '匿名 session id、同意紀錄與事件'}</li>
          </ul>
          <p className="text-xs text-ink-muted">
            {isEnglish ? 'Kept: interface language preference.' : '保留：介面語系偏好。'}
          </p>
        </div>
      </Modal>
    </div>
  );
}
