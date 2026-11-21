import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { blockedAttempts, ExternalNetworkBlockedError, guardedFetch, isLocalUrl } from '../setup/network-guard';
import { createFakeFetch, jsonResponse } from '../setup/fake-fetch';

describe('AC-001 測試與型別檢查基礎建設', () => {
  const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

  it('AC-001: package.json 具備 lint／typecheck／test／e2e／build scripts', () => {
    for (const name of ['lint', 'typecheck', 'test', 'e2e', 'build']) {
      expect(pkg.scripts[name], `缺少 npm script: ${name}`).toBeTypeOf('string');
    }
    expect(pkg.scripts.typecheck).toContain('tsc');
    expect(pkg.scripts.test).toContain('vitest');
    expect(pkg.scripts.e2e).toContain('playwright');
  });

  it('AC-001: CI workflow 會依序執行 lint、typecheck、test、build、e2e，且沒有 continue-on-error', () => {
    const path = '.github/workflows/ci.yml';
    expect(existsSync(path)).toBe(true);
    const ci = readFileSync(path, 'utf8');
    const order = ['npm ci', 'npm run lint', 'npm run typecheck', 'npm test', 'npm run build', 'npm run e2e'];
    let cursor = -1;
    for (const command of order) {
      const index = ci.indexOf(`run: ${command}`);
      expect(index, `CI 缺少步驟: ${command}`).toBeGreaterThan(cursor);
      cursor = index;
    }
    expect(ci).not.toContain('continue-on-error');
    expect(ci).not.toMatch(/\|\|\s*true/);
    expect(ci).toContain('pull_request');
  });
});

describe('AC-003 測試網路阻擋機制（自我測試）', () => {
  it('AC-003: 預設的 globalThis.fetch 就是守門版本', () => {
    expect(globalThis.fetch).toBe(guardedFetch);
  });

  it('AC-003: 呼叫外部 URL 必定失敗，且不會發出請求', async () => {
    await expect(fetch('https://api.openai.com/v1/models')).rejects.toBeInstanceOf(ExternalNetworkBlockedError);
    await expect(fetch('https://example.com/')).rejects.toThrow(/EXTERNAL_NETWORK_BLOCKED/);
    await expect(fetch(new URL('http://93.184.216.34/'))).rejects.toThrow(/EXTERNAL_NETWORK_BLOCKED/);
    expect(blockedAttempts.external).toHaveLength(3);
  });

  it('AC-003: 連 localhost 也不會真的連線（單元測試零真實網路）', async () => {
    await expect(fetch('http://localhost:3000/api/interview/start')).rejects.toThrow(/LOCAL_NETWORK_BLOCKED/);
    expect(blockedAttempts.external).toHaveLength(0);
  });

  it('AC-003: isLocalUrl 只接受 localhost／127.0.0.1／[::1]', () => {
    expect(isLocalUrl('http://localhost:3100/x')).toBe(true);
    expect(isLocalUrl('http://127.0.0.1/x')).toBe(true);
    expect(isLocalUrl('http://[::1]:3000/x')).toBe(true);
    expect(isLocalUrl('https://api.openai.com/v1')).toBe(false);
    expect(isLocalUrl('https://localhost.example.com/')).toBe(false);
    expect(isLocalUrl('not a url')).toBe(false);
  });

  it('AC-003: 測試換上假 fetch 後，下一個測試會自動換回守門版本（前半）', async () => {
    const fake = createFakeFetch(() => jsonResponse(200, { ok: true }));
    globalThis.fetch = fake.fetch;
    const res = await fetch('https://api.openai.com/v1/models');
    expect(res.status).toBe(200);
    expect(fake.calls).toHaveLength(1);
  });

  it('AC-003: 測試換上假 fetch 後，下一個測試會自動換回守門版本（後半）', async () => {
    expect(globalThis.fetch).toBe(guardedFetch);
    await expect(fetch('https://api.openai.com/v1/models')).rejects.toBeInstanceOf(ExternalNetworkBlockedError);
  });
});
