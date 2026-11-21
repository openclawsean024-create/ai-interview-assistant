import { afterEach, describe, expect, it } from 'vitest';
import { createHttpProvider } from '@/app/lib/llm/byok-provider';
import {
  buildCtx,
  COOLDOWN_FAILURE_THRESHOLD,
  COOLDOWN_MS,
  createCooldownStore,
  fingerprintKey,
  safeCall,
  type RouterDeps,
} from '@/app/lib/llm/router';
import { AUTH_FAILED_CODE, LlmAuthError } from '@/app/lib/llm/errors';
import { scoreAnswer } from '@/app/lib/scoring/rubric';
import { blockedAttempts } from '../setup/network-guard';
import { createFakeFetch, hangUntilAborted, jsonResponse, type FakeFetch } from '../setup/fake-fetch';
import { createStatusFetch, FAKE_API_KEY, successResponder } from '../helpers/openai-fake';
import { FIXTURES, FIXTURE_QUESTION } from '../fixtures/answers';

const params = { answer: FIXTURES.noQuantification, questionText: FIXTURE_QUESTION };
const mockExpected = scoreAnswer(params);

function setup(fake: FakeFetch, opts: { timeoutMs?: number } = {}) {
  const deps: RouterDeps = {
    byok: createHttpProvider({ fetchImpl: fake.fetch, timeoutMs: opts.timeoutMs ?? 1_000 }),
    cooldown: createCooldownStore(),
    now: () => 1_000_000,
  };
  const ctx = buildCtx({ apiKey: FAKE_API_KEY });
  // 每次呼叫模擬一個獨立的 HTTP 請求（ctx 以請求為單位）。
  const evaluate = () => {
    const requestCtx = buildCtx({ apiKey: FAKE_API_KEY });
    return safeCall(requestCtx, (p) => p.evaluate(requestCtx, params), deps);
  };
  return { deps, ctx, evaluate };
}

// 每個測試結束時確認：沒有任何請求漏到守門 fetch（＝零真實網路嘗試）。
afterEach(() => {
  expect(blockedAttempts.external).toHaveLength(0);
  expect(blockedAttempts.local).toHaveLength(0);
});

describe('AC-003 降級：可重試錯誤重試至多 1 次後降級 Mock', () => {

  it.each([429, 500, 502, 503, 504])('AC-003: HTTP %i → 共呼叫 2 次後降級，回應含 degraded 與 degradedReason', async (status) => {
    const fake = createStatusFetch(status);
    const { evaluate } = setup(fake);
    const r = await evaluate();

    expect(fake.calls).toHaveLength(2); // 原始 1 次 + 重試 1 次
    expect(r.mode).toBe('mock');
    expect(r.degraded).toBe(true);
    expect(r.degradedReason).toBe(`openai_${status}`);
    expect(r.fallbackMode).toBe('mock');
    // 降級後的內容就是 Mock rubric 的結果
    expect(r.score).toBe(mockExpected.score);
    expect(r.dimensions).toEqual(mockExpected.dimensions);
    expect(r.evidence).toEqual(mockExpected.evidence);
  });

  it('AC-003: timeout → 重試 1 次後降級，degradedReason 為 openai_timeout', async () => {
    const fake = createFakeFetch((_call, signal) => hangUntilAborted(signal));
    const { evaluate } = setup(fake, { timeoutMs: 20 });
    const r = await evaluate();

    expect(fake.calls).toHaveLength(2);
    expect(r.mode).toBe('mock');
    expect(r.degraded).toBe(true);
    expect(r.degradedReason).toBe('openai_timeout');
    expect(r.score).toBe(mockExpected.score);
  });

  it('AC-003: 第一次 503、重試成功 → 不降級，回傳 BYOK 結果', async () => {
    let n = 0;
    const fake = createFakeFetch((call) => (++n === 1 ? jsonResponse(503, {}) : successResponder(call)));
    const { evaluate } = setup(fake);
    const r = await evaluate();

    expect(fake.calls).toHaveLength(2);
    expect(r.mode).toBe('byok');
    expect(r.degraded).toBeUndefined();
    expect(r.score).toBe(72);
  });

  it('AC-003: 上游回傳無法解析的內容 → 不重試、直接降級 openai_invalid_response', async () => {
    const fake = createFakeFetch(() =>
      jsonResponse(200, { choices: [{ message: { role: 'assistant', content: '這不是 JSON' } }] }),
    );
    const { evaluate } = setup(fake);
    const r = await evaluate();

    expect(fake.calls).toHaveLength(1);
    expect(r.degraded).toBe(true);
    expect(r.degradedReason).toBe('openai_invalid_response');
  });

  it('AC-003: 不可重試的 4xx（例如 400）→ 不重試、直接降級', async () => {
    const fake = createStatusFetch(400);
    const { evaluate } = setup(fake);
    const r = await evaluate();
    expect(fake.calls).toHaveLength(1);
    expect(r.degraded).toBe(true);
    expect(r.degradedReason).toBe('openai_400');
  });
});

describe('AC-003 授權失敗不降級', () => {
  it.each([401, 403])('AC-003: HTTP %i → 拋 OPENAI_AUTH_FAILED，不重試、不降級', async (status) => {
    const fake = createStatusFetch(status);
    const { evaluate } = setup(fake);

    const error = await evaluate().then(
      () => null,
      (e) => e,
    );
    expect(error).toBeInstanceOf(LlmAuthError);
    expect(error.message).toBe(AUTH_FAILED_CODE);
    expect(error.status).toBe(status);
    expect(fake.calls).toHaveLength(1);
  });

  it('AC-003: 錯誤訊息不含 API key', async () => {
    const fake = createStatusFetch(401);
    const { evaluate } = setup(fake);
    const error = await evaluate().catch((e) => e);
    expect(String(error.message)).not.toContain(FAKE_API_KEY);
    expect(JSON.stringify(error)).not.toContain(FAKE_API_KEY);
  });
});

describe('AC-003 Mock 模式不碰外部', () => {
  it('AC-003: 沒有 key 時不呼叫任何 fetch，回傳 mode: mock 且未降級', async () => {
    const fake = createStatusFetch(500);
    const deps: RouterDeps = { byok: createHttpProvider({ fetchImpl: fake.fetch }), cooldown: createCooldownStore() };
    const ctx = buildCtx({});
    const r = await safeCall(ctx, (p) => p.evaluate(ctx, params), deps);
    expect(fake.calls).toHaveLength(0);
    expect(r.mode).toBe('mock');
    expect(r.degraded).toBeUndefined();
    expect(blockedAttempts.external).toHaveLength(0);
  });
});

describe('AC-003 連續失敗冷卻（伺服器端記憶體）', () => {
  it(`AC-003: 連續 ${COOLDOWN_FAILURE_THRESHOLD} 次失敗後進入冷卻，期間不再呼叫外部並標示 cooldown_active`, async () => {
    const fake = createStatusFetch(503);
    let now = 1_000_000;
    const deps: RouterDeps = {
      byok: createHttpProvider({ fetchImpl: fake.fetch, timeoutMs: 1_000 }),
      cooldown: createCooldownStore(),
      now: () => now,
    };
    // 每次呼叫模擬一個獨立的 HTTP 請求（ctx 以請求為單位）。
    const evaluate = () => {
      const ctx = buildCtx({ apiKey: FAKE_API_KEY });
      return safeCall(ctx, (p) => p.evaluate(ctx, params), deps);
    };

    for (let i = 0; i < COOLDOWN_FAILURE_THRESHOLD; i++) {
      const r = await evaluate();
      expect(r.degradedReason).toBe('openai_503');
    }
    expect(fake.calls).toHaveLength(COOLDOWN_FAILURE_THRESHOLD * 2);

    // 冷卻中：直接走 Mock，fetch 次數不再增加
    const cooled = await evaluate();
    expect(cooled.mode).toBe('mock');
    expect(cooled.degraded).toBe(true);
    expect(cooled.degradedReason).toBe('cooldown_active');
    expect(fake.calls).toHaveLength(COOLDOWN_FAILURE_THRESHOLD * 2);

    // 冷卻期滿：重新嘗試外部
    now += COOLDOWN_MS + 1;
    const after = await evaluate();
    expect(after.degradedReason).toBe('openai_503');
    expect(fake.calls).toHaveLength(COOLDOWN_FAILURE_THRESHOLD * 2 + 2);
  });

  it('AC-003: 中途成功一次會把連續失敗次數歸零', async () => {
    let failing = true;
    const fake = createFakeFetch((call) => (failing ? jsonResponse(500, {}) : successResponder(call)));
    const deps: RouterDeps = {
      byok: createHttpProvider({ fetchImpl: fake.fetch, timeoutMs: 1_000 }),
      cooldown: createCooldownStore(),
      now: () => 5_000,
    };
    // 每次呼叫模擬一個獨立的 HTTP 請求（ctx 以請求為單位）。
    const evaluate = () => {
      const ctx = buildCtx({ apiKey: FAKE_API_KEY });
      return safeCall(ctx, (p) => p.evaluate(ctx, params), deps);
    };

    await evaluate();
    await evaluate(); // 連續失敗 2 次
    failing = false;
    expect((await evaluate()).mode).toBe('byok'); // 成功 → 歸零
    failing = true;
    await evaluate();
    await evaluate(); // 又連續失敗 2 次，仍未達門檻
    const r = await evaluate(); // 第 3 次失敗才進入冷卻
    expect(r.degradedReason).toBe('openai_500');
    expect((await evaluate()).degradedReason).toBe('cooldown_active');
  });

  it('AC-003: 冷卻以 key 指紋為索引，不保存 key 本身，且不同 key 互不影響', () => {
    const store = createCooldownStore(2, 1_000);
    const a = fingerprintKey('sk-test-aaaa');
    const b = fingerprintKey('sk-test-bbbb');
    expect(a).toMatch(/^[0-9a-f]{16}$/);
    expect(a).not.toContain('sk-test');
    expect(a).not.toBe(b);

    store.recordFailure(a, 0);
    expect(store.isActive(a, 0)).toBe(false);
    store.recordFailure(a, 0);
    expect(store.isActive(a, 500)).toBe(true);
    expect(store.isActive(b, 500)).toBe(false);
    expect(store.isActive(a, 1_001)).toBe(false);
  });

  it('AC-003: 401／403 不計入冷卻', async () => {
    const fake = createStatusFetch(401);
    const cooldown = createCooldownStore();
    const deps: RouterDeps = { byok: createHttpProvider({ fetchImpl: fake.fetch }), cooldown, now: () => 0 };
    const ctx = buildCtx({ apiKey: FAKE_API_KEY });
    for (let i = 0; i < COOLDOWN_FAILURE_THRESHOLD + 1; i++) {
      await expect(safeCall(ctx, (p) => p.evaluate(ctx, params), deps)).rejects.toBeInstanceOf(LlmAuthError);
    }
    expect(cooldown.isActive(fingerprintKey(FAKE_API_KEY), 0)).toBe(false);
  });
});
