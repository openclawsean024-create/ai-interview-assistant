import { describe, expect, it } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { CONSENT_POINTS } from '@/app/components/session-init';

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full.replace(/\\/g, '/')];
  });
}

function git(args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
}

const EXTENSION_FILE_RE = /manifest\.json|sidePanel|content\.js|background\.js|popup/;
const uiSources = [...listFiles('app'), ...listFiles('components')].filter((f) => /\.(ts|tsx)$/.test(f));

describe('AC-007 Chrome 擴充功能不隨 web 部署', () => {
  it('AC-007: public/ 內沒有任何擴充功能檔案（工作目錄與 git 追蹤清單都檢查）', () => {
    expect(listFiles('public').filter((f) => EXTENSION_FILE_RE.test(f))).toEqual([]);
    const tracked = git(['ls-files', 'public']).split('\n').filter(Boolean);
    expect(tracked.filter((f) => EXTENSION_FILE_RE.test(f))).toEqual([]);
    expect(tracked.some((f) => f.endsWith('.zip'))).toBe(false);
  });

  // Sean 決定（2026-11-16）：擴充功能封存到獨立的 private archived repo，本 repo 不再保留任何擴充功能檔案。
  it('AC-007: 擴充功能已封存移出 — repo 內（含 git 追蹤清單）沒有任何擴充功能檔案', () => {
    const files = [
      'manifest.json', 'sidePanel.html', 'sidePanel.js', 'content.js', 'background.js', 'popup.html', 'popup.js',
      'ai-interview-assistant-chrome-extension.zip', 'icons/icon16.png', 'icons/icon48.png', 'icons/icon128.png',
      'public/icons/icon16.png', 'public/icons/icon48.png', 'public/icons/icon128.png',
    ];
    for (const file of files) expect(existsSync(file), `${file} 應已移出`).toBe(false);
    const tracked = git(['ls-files']).split('\n').filter(Boolean);
    expect(tracked.filter((f) => /(^|\/)(manifest\.json|sidePanel\.|content\.js|background\.js|popup\.(html|js))$|chrome-extension\.zip$/.test(f))).toEqual([]);
  });

  it('AC-007: README 與 STATUS 記錄擴充功能的封存位置', () => {
    for (const file of ['README.md', 'STATUS.md']) {
      expect(readFileSync(file, 'utf8'), file).toContain('openclawsean024-create/ai-interview-assistant-chrome-extension');
    }
  });

  it('AC-007: web 程式碼不連結、不引用擴充功能檔案', () => {
    for (const file of uiSources) {
      const src = readFileSync(file, 'utf8');
      expect(src, `${file} 引用擴充功能`).not.toMatch(/chrome-extension|sidePanel|chrome\.storage|\.zip['"`]/);
    }
  });
});

describe('AC-007 web 端沒有代答型流程', () => {
  it('AC-007: 前端沒有語音聆聽（SpeechRecognition）與朗讀（speechSynthesis）', () => {
    for (const file of uiSources) {
      const src = readFileSync(file, 'utf8');
      expect(src, `${file} 使用語音辨識`).not.toMatch(/SpeechRecognition|webkitSpeechRecognition/);
      expect(src, `${file} 使用語音朗讀`).not.toMatch(/speechSynthesis|SpeechSynthesisUtterance/);
    }
  });

  it('AC-007: 介面上沒有任何 /api/analyze 的入口', () => {
    const callers = uiSources.filter((f) => !f.startsWith('app/api/')).filter((f) => readFileSync(f, 'utf8').includes('api/analyze'));
    expect(callers).toEqual([]);
  });

  it('AC-007: 介面文案沒有「語音聆聽、朗讀答案、AI 答案建議、下一句可以怎麼接」', () => {
    const banned = ['語音聆聽', '朗讀答案', 'AI 答案建議', 'AI 建議答案', '下一句可以怎麼接', 'Follow-up 提示', 'Read Answer', 'Start Listening', 'Suggested Answer'];
    for (const file of uiSources.filter((f) => !f.startsWith('app/api/'))) {
      const src = readFileSync(file, 'utf8');
      for (const phrase of banned) expect(src, `${file} 含「${phrase}」`).not.toContain(phrase);
    }
  });

  it('AC-007: 沒有任何 prompt 要求 AI 產生「建議答案」或要求照抄', () => {
    for (const file of listFiles('app/lib/llm')) {
      const src = readFileSync(file, 'utf8');
      expect(src, `${file} 含代答 prompt`).not.toMatch(/答案建議|建議答案|下一句可以怎麼接/);
    }
  });
});

describe('AC-009 同意文案與實際資料流一致', () => {
  it('AC-009: 同意 modal 的三個要點（Mock 只存本機、BYOK 經本站伺服器轉送、伺服器不保存回答）', () => {
    const text = CONSENT_POINTS.zh.join('\n');
    expect(CONSENT_POINTS.zh).toHaveLength(3);
    expect(text).toContain('Mock 模式');
    expect(text).toContain('只存在本機瀏覽器');
    expect(text).toContain('若使用自備 API key');
    expect(text).toContain('題目、回答與 key 會經本站伺服器轉送給 AI 供應商');
    expect(text).toContain('不會在伺服器保存回答');
    // 伺服器記憶體暫存 key 雜湊指紋（限流／冷卻）必須揭露
    expect(text).toContain('雜湊指紋');
    expect(CONSENT_POINTS.en).toHaveLength(3);
    expect(CONSENT_POINTS.en.join('\n')).toContain('hashed fingerprint');
  });

  it('AC-009: README 與 session-init 不再宣稱「不上 server／不送伺服器」', () => {
    for (const file of ['README.md', 'app/components/session-init.tsx']) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toMatch(/不上 server|不送伺服器/);
    }
  });

  it('AC-009: 其他頁面也沒有「key 不會送到伺服器」這類不實說法', () => {
    const banned = [/不送伺服器/, /不上 server/, /never sent to our servers/i, /不會傳送到我們的伺服器/];
    for (const file of uiSources) {
      const src = readFileSync(file, 'utf8');
      for (const re of banned) expect(src, `${file} 符合 ${re}`).not.toMatch(re);
    }
  });

  it('AC-009: README 說明了資料流（Mock 只存本機、BYOK 經本站伺服器轉送、伺服器不保存回答）', () => {
    const readme = readFileSync('README.md', 'utf8');
    expect(readme).toContain('只存在本機瀏覽器');
    expect(readme).toContain('經本站伺服器轉送給 AI 供應商');
    expect(readme).toContain('不會在伺服器保存回答');
    expect(readme).toContain('雜湊指紋');
    expect(readme).toContain('限流');
  });

  it('AC-009: GitHub Pages 部署只能手動觸發（合併到 master 不會自動部署靜態匯出版本）', () => {
    const deploy = readFileSync('.github/workflows/deploy.yml', 'utf8');
    const on = deploy.slice(deploy.indexOf('\non:'), deploy.indexOf('\njobs:'));
    expect(on).toContain('workflow_dispatch');
    expect(on).not.toMatch(/\bpush:|pull_request/);
  });

  it('AC-009: 伺服器端 API route 不寫檔、不寫資料庫、不記錄回答', () => {
    for (const file of listFiles('app/api')) {
      const src = readFileSync(file, 'utf8');
      expect(src, file).not.toMatch(/from 'fs'|from "fs"|node:fs|writeFile|console\.(log|info|debug)\(/);
    }
  });
});

describe('AC-010 文件、證據與憑證衛生', () => {
  const trackedFiles = git(['ls-files']).split('\n').filter(Boolean);

  it('AC-010: repo 內沒有真實憑證樣式（sk-xxxx 類佔位字串除外）', () => {
    // 與 scripts/check-credentials.sh 相同的樣式；只排除 lockfile，逐一檢查每個命中的字串。
    const pattern = /sk-[A-Za-z0-9_-]{20,}|(sk|pk|rk)_live_[A-Za-z0-9]{10,}/g;
    const isPlaceholder = (hit: string) => /^sk-(x+|test-[x-]+|your[-_a-z]*|\.{3}|…)/i.test(hit) || /^sk-[x.-]+$/i.test(hit);
    const findings: string[] = [];
    for (const file of trackedFiles) {
      if (/lock/i.test(file)) continue;
      if (/\.(png|ico|zip|pptx|jpg|jpeg|gif|woff2?)$/i.test(file)) continue;
      if (!existsSync(file)) continue;
      const hits = readFileSync(file, 'utf8').match(pattern) ?? [];
      for (const hit of hits) if (!isPlaceholder(hit)) findings.push(`${file}: ${hit.slice(0, 12)}…`);
    }
    expect(findings).toEqual([]);
  });

  describe('AC-010: scripts/check-credentials.sh 無法用同一行的佔位字串繞過，也不把 key 印進 log', () => {
    // 假 key 在執行時才組出來，repo 內不會出現完整的 key 字串。
    const fakeRealKey = ['sk', 'proj', 'Ab3dEf6hIj9kLm2nOp5qRs8tUv1wXy4z'].join('-');
    const script = join(process.cwd(), 'scripts/check-credentials.sh');

    function scanRepo(content: string): { code: number; out: string } {
      const dir = mkdtempSync(join(tmpdir(), 'cred-scan-'));
      try {
        execFileSync('git', ['init', '-q'], { cwd: dir });
        writeFileSync(join(dir, 'config.ts'), content);
        execFileSync('git', ['add', '.'], { cwd: dir });
        try {
          const out = execFileSync('bash', [script], { cwd: dir, encoding: 'utf8' });
          return { code: 0, out };
        } catch (err: any) {
          return { code: err.status ?? 1, out: String(err.stdout ?? '') };
        }
      } finally {
        rmSync(dir, { recursive: true, force: true });
      }
    }

    it('AC-010: 同一行同時有佔位字串與真實樣式 → 失敗，且輸出只有遮罩後的前綴', () => {
      const r = scanRepo(`const KEY = 'sk-xxxx'; const real = '${fakeRealKey}';\n`);
      expect(r.code).toBe(1);
      expect(r.out).toContain('config.ts:1');
      expect(r.out).not.toContain(fakeRealKey);
      expect(r.out).not.toContain(fakeRealKey.slice(0, 12));
    });

    it('AC-010: 只有佔位字串 → 通過', () => {
      const r = scanRepo(`const KEY = 'sk-xxxx'; const other = 'sk-test-xxxxxxxxxxxxxxxxxxxxxxxx';\n`);
      expect(r.code).toBe(0);
    });

    it('AC-010: CI 以 --history 掃描所有 commit', () => {
      expect(readFileSync('.github/workflows/ci.yml', 'utf8')).toContain('bash scripts/check-credentials.sh --history');
    });
  });

  it('AC-010: 沒有提交 .env 檔（佔位用的 .env.local.example 除外）', () => {
    const envFiles = trackedFiles.filter((f) => /(^|\/)\.env/.test(f));
    expect(envFiles).toEqual(['.env.local.example']);
    const example = readFileSync('.env.local.example', 'utf8');
    expect(example).not.toMatch(/sk-[A-Za-z0-9]{20,}|sk_live_[A-Za-z0-9]{8,}|pk_live_[A-Za-z0-9]{8,}/);
  });

  it('AC-010: 測試 fixture 只用明顯虛構的資料', () => {
    const fixtureFiles = [...listFiles('tests/fixtures'), ...listFiles('tests/helpers'), ...listFiles('e2e')];
    expect(fixtureFiles.length).toBeGreaterThan(0);
    for (const file of fixtureFiles) {
      const src = readFileSync(file, 'utf8');
      // email 只能是 example.com；電話只能是 0900-000-000 這類佔位
      const emails = src.match(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g) ?? [];
      for (const email of emails) expect(email, `${file} 含非佔位 email`).toMatch(/@example\.(com|org|net)$/);
      const phones = src.match(/09\d{2}-?\d{3}-?\d{3}/g) ?? [];
      for (const phone of phones) expect(phone.replace(/-/g, ''), `${file} 含非佔位電話`).toBe('0900000000');
      // key 只能是 sk-test-xxxx 類佔位
      const keys = src.match(/sk-[A-Za-z0-9_-]+/g) ?? [];
      for (const key of keys) expect(key, `${file} 含非佔位 key`).toMatch(/^sk-test-[a-z-]*x*[a-z]*$/);
    }
    expect(readFileSync('tests/fixtures/answers.ts', 'utf8')).toContain('虛構');
  });

  it('AC-010: SOP.md 的 M1 驗證指令都對應到實際存在的 npm script', () => {
    const sop = readFileSync('SOP.md', 'utf8');
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    for (const command of ['npm ci', 'npm run lint', 'npm run typecheck', 'npm test', 'npm run build', 'npm run e2e', 'git diff --check']) {
      expect(sop, `SOP.md 缺少 ${command}`).toContain(command);
    }
    const scripts = Array.from(sop.matchAll(/npm run ([a-z0-9:-]+)/g)).map((m) => m[1]);
    for (const name of Array.from(new Set(scripts))) {
      expect(pkg.scripts[name], `SOP.md 提到的 npm run ${name} 不存在`).toBeTypeOf('string');
    }
    expect(sop).not.toContain('尚未配置');
  });

  it('AC-010: STATUS.md 記錄了每個 SOP 指令的 exit code 與 10 條 AC 的狀態', () => {
    const status = readFileSync('STATUS.md', 'utf8');
    for (const command of ['npm ci', 'npm run lint', 'npm run typecheck', 'npm test', 'npm run build', 'npm run e2e', 'git diff --check']) {
      expect(status, `STATUS.md 缺少 ${command} 的紀錄`).toContain(`\`${command}\``);
    }
    for (let i = 1; i <= 10; i++) {
      expect(status).toContain(`AC-${String(i).padStart(3, '0')}`);
    }
    // 擴充功能與 /api/analyze 的處置必須有紀錄
    expect(status).toContain('/api/analyze');
    expect(status).toContain('已整個移除');
    expect(status).toMatch(/擴充功能/);
  });
});
