'use client';
// app/pricing/page.tsx — Pricing (v3.0 redesign via ui-ux-pro-max)

import Link from 'next/link';
import {
  Container,
  Navbar,
  Footer,
  SectionHeading,
  LinkButton,
  SkipLink,
  IconCheck,
  IconArrowRight,
  IconSparkle,
  IconUsers,
  IconBuilding,
  IconKey,
  IconShield,
  IconX,
} from '@/app/components/ui-primitives';
import { useLocale } from '@/app/i18n/locale-context';

interface Tier {
  id: string;
  badge?: string;
  badgeVariant?: 'default' | 'accent';
  name: string;
  tagline: { zh: string; en: string };
  priceUsd: number;
  priceNtd: number;
  per: { zh: string; en: string };
  description: { zh: string; en: string };
  cta: { label: { zh: string; en: string }; href: string };
  ctaVariant: 'ghost' | 'accent' | 'primary';
  features: Array<{ zh: string; en: string; highlight?: boolean }>;
  highlighted?: boolean;
}

const TIERS: Tier[] = [
  {
    id: 'free',
    name: 'Free',
    tagline: { zh: '初次體驗', en: 'Try it out' },
    priceUsd: 0,
    priceNtd: 0,
    per: { zh: '/月', en: '/mo' },
    description: {
      zh: 'SPEC v3.0 §17 anonymous-first。Mock 模式完整體驗。',
      en: 'SPEC v3.0 §17 anonymous-first. Full Mock mode.',
    },
    cta: { label: { zh: '開始免費使用', en: 'Start free' }, href: '/interview' },
    ctaVariant: 'ghost',
    features: [
      { zh: '3 次完整面試演練', en: '3 full interview practices' },
      { zh: 'Mock 模式免費用', en: 'Mock mode — completely free' },
      { zh: '5 維度 STAR 雷達圖報告', en: '5-dimension STAR radar report' },
      { zh: '繁中題庫(職缺客製)', en: 'Mandarin question bank' },
      { zh: '資料存於瀏覽器,可一鍵刪除', en: 'Local-only data, one-click delete' },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: '最受歡迎',
    badgeVariant: 'accent',
    tagline: { zh: '專業面試者推薦', en: 'Recommended for serious candidates' },
    priceUsd: 9,
    priceNtd: 199,
    per: { zh: '/月', en: '/mo' },
    description: {
      zh: 'SPEC §9:NT$199/月。解鎖 BYOK 與無限制練習。',
      en: 'SPEC §9: NT$199/mo. Unlock BYOK + unlimited practice.',
    },
    cta: { label: { zh: '升級 Pro', en: 'Upgrade to Pro' }, href: '/settings' },
    ctaVariant: 'accent',
    highlighted: true,
    features: [
      { zh: '包含 Free 全部功能', en: 'Everything in Free' },
      { zh: '自帶 OpenAI API Key (BYOK)', en: 'Bring Your Own OpenAI API Key' },
      { zh: '無限制面試練習', en: 'Unlimited interview practice' },
      { zh: '20 次/語音複盤', en: '20 voice replays / session' },
      { zh: '多語言支援 (EN/ZH/JP/KR)', en: 'Multi-language (EN/ZH/JP/KR)' },
      { zh: '匯出 Markdown 報告', en: 'Markdown report export' },
      { zh: '優先 AI 回應速度', en: 'Priority AI response speed' },
    ],
  },
  {
    id: 'campus',
    name: 'Campus',
    badge: '校園方案',
    tagline: { zh: '校園職涯中心', en: 'For career centers' },
    priceUsd: 50,
    priceNtd: 3000,
    per: { zh: '/月', en: '/mo' },
    description: {
      zh: 'SPEC §9:NT$3,000/月,100 名學生聚合報告。',
      en: 'SPEC §9: NT$3,000/mo for 100 students.',
    },
    cta: { label: { zh: '聯絡校園方案', en: 'Contact us' }, href: '/settings' },
    ctaVariant: 'ghost',
    features: [
      { zh: '包含 Pro 全部功能', en: 'Everything in Pro' },
      { zh: '100 名學生聚合報告', en: '100-student aggregate report' },
      { zh: '團隊練習資料儀表板', en: 'Team practice dashboard' },
      { zh: '隱私優先:不記錄個資', en: 'Privacy-first: no PII collected' },
      { zh: '教育訓練工作坊(每年 2 次)', en: 'Onboarding workshops (2x/yr)' },
    ],
  },
];

const FAQ = [
  {
    q: { zh: 'BYOK 是什麼?為什麼不用訂閱制就好?', en: 'What is BYOK? Why not just a subscription?' },
    a: {
      zh: 'BYOK = Bring Your Own Key。自帶 OpenAI API Key,所有成本直接從你的 OpenAI 帳戶出。我們不墊付,也不抽成 — 這讓 3 次免費額度可以永遠存在。',
      en: 'BYOK = Bring Your Own Key. Use your own OpenAI API Key, costs go straight from your OpenAI account. We never subsidize or markup — which is why the 3-practice free tier can stay free forever.',
    },
  },
  {
    q: { zh: 'Mock 模式跟 BYOK 差在哪?', en: 'What is the difference between Mock mode and BYOK?' },
    a: {
      zh: 'Mock 模式用預設結構化模板,離線可用,免費 3 次。BYOK 用真實 LLM 生成個人化答案,需要你貼 API key。SPEC §16.3。',
      en: 'Mock mode uses structured templates, runs offline, free for 3 practices. BYOK uses real LLM for personalized answers, requires your API key. See SPEC §16.3.',
    },
  },
  {
    q: { zh: '資料會送到你們的伺服器嗎?', en: 'Do you send my data to your servers?' },
    a: {
      zh: '不會。所有 session 與練習事件都存於 localStorage(`aiia.*` keys)。SPEC §17。BYOK API key 也只存瀏覽器,我們的 API route 只做 proxy 轉發。',
      en: 'No. All sessions and practice events are stored in localStorage (aiia.* keys). SPEC §17. Your BYOK API key also stays in your browser — our API routes only proxy the request.',
    },
  },
  {
    q: { zh: '可以退款嗎?', en: 'Can I get a refund?' },
    a: {
      zh: '由於成本直接從你的 OpenAI 帳戶出(我們不經手),退款不適用於已使用的練習。Pro 訂閱 7 天內未使用可全額退。',
      en: 'Since costs come directly from your OpenAI account (we never handle them), refunds don\'t apply to used practices. Pro subscriptions are fully refundable within 7 days if unused.',
    },
  },
];

export default function PricingPage() {
  const { locale } = useLocale();
  const isEnglish = locale === 'en';
  const lang = isEnglish ? 'en' : 'zh';

  return (
    <div className="min-h-screen flex flex-col">
      <SkipLink />
      <Navbar active="/pricing" locale={lang} />

      <main id="main-content">
        {/* ===== Pricing header + tiers ===== */}
        <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24" aria-labelledby="pricing-heading">
          <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full bg-primary/8 blur-3xl" />
            <div className="absolute top-40 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/6 blur-3xl" />
          </div>

          <Container>
            <SectionHeading
              eyebrow={isEnglish ? 'SPEC §9 Pricing' : 'SPEC §9 變現路徑'}
              title={
                <>
                  {isEnglish ? 'Simple' : '簡單'}{' '}
                  <span className="gradient-text">{isEnglish ? 'pricing' : '定價'}</span>
                </>
              }
              description={
                isEnglish
                  ? 'Use your own OpenAI API Key — we never subsidize any costs. All plans include a free trial.'
                  : '使用你自己的 OpenAI API Key,我們不墊付任何費用。所有方案皆可免費試用。'
              }
              align="center"
            />

            <h1 id="pricing-heading" className="sr-only">{isEnglish ? 'Pricing' : '定價'}</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-6">
              {TIERS.map((tier, i) => (
                <article
                  key={tier.id}
                  className={`relative card flex flex-col ${
                    tier.highlighted
                      ? '!border-accent/50 ring-2 ring-accent/30 shadow-glow-accent bg-gradient-to-b from-surface to-surface-elevated'
                      : ''
                  } animate-fade-in-up`}
                  style={{ animationDelay: `${0.05 * i}s` }}
                  aria-labelledby={`tier-${tier.id}`}
                >
                  {tier.badge && (
                    <span
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 tag ${
                        tier.badgeVariant === 'accent' ? 'tag-accent' : ''
                      } shadow-card`}
                    >
                      <IconSparkle size={11} />
                      {tier.badge}
                    </span>
                  )}

                  <div className="mb-5">
                    <span
                      className={`inline-block text-xs uppercase tracking-wider font-bold mb-2 ${
                        tier.highlighted ? 'text-accent' : 'text-ink-muted'
                      }`}
                    >
                      {tier.name}
                    </span>
                    <p className="text-sm text-ink-secondary mb-4">{tier.tagline[lang]}</p>
                    <div className="flex items-baseline gap-1.5">
                      <span className={`text-h1 ${tier.highlighted ? 'gradient-text-accent' : 'text-ink'} font-bold`}>
                        ${tier.priceUsd}
                      </span>
                      <span className="text-sm text-ink-muted">{tier.per[lang]}</span>
                    </div>
                    <p className="text-xs text-ink-muted mt-1 font-mono">
                      ≈ NT${tier.priceNtd.toLocaleString()} {tier.per[lang]}
                    </p>
                    <p className="text-xs text-ink-muted mt-3 leading-relaxed">{tier.description[lang]}</p>
                  </div>

                  <LinkButton
                    href={tier.cta.href}
                    variant={tier.ctaVariant}
                    fullWidth
                    aria-label={`${tier.cta.label[lang]} - ${tier.name}`}
                  >
                    {tier.cta.label[lang]}
                    <IconArrowRight size={16} />
                  </LinkButton>

                  <ul className="mt-6 space-y-3 flex-1">
                    {tier.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2.5 text-sm">
                        <span className="flex-shrink-0 mt-0.5 w-5 h-5 rounded-full bg-success/15 text-success flex items-center justify-center">
                          <IconCheck size={12} />
                        </span>
                        <span className="text-ink-secondary leading-relaxed">{f[lang]}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <p className="mt-10 text-center text-sm text-ink-muted">
              <IconKey size={14} className="inline-block align-middle mr-1.5" />
              {isEnglish ? 'All paid plans require your own OpenAI API Key. We do not subsidize any costs. ' : '所有付費方案均需用戶自備 OpenAI API Key。我們不墊付任何 API 費用。'}
              <Link href="/settings" className="text-primary hover:underline ml-1">
                {isEnglish ? 'Set up your API Key →' : '設定 API Key →'}
              </Link>
            </p>
          </Container>
        </section>

        {/* ===== Comparison table ===== */}
        <section className="py-12 lg:py-16 border-t border-border-subtle" aria-labelledby="compare-heading">
          <Container>
            <SectionHeading
              eyebrow={isEnglish ? 'Comparison' : '方案對比'}
              title={isEnglish ? 'What is in each plan' : '各方案內容'}
              align="center"
            />
            <h2 id="compare-heading" className="sr-only">{isEnglish ? 'Plan comparison' : '方案對比'}</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th scope="col" className="text-left p-4 font-semibold text-ink-muted border-b border-border-subtle">
                      {isEnglish ? 'Feature' : '功能'}
                    </th>
                    {TIERS.map((tier) => (
                      <th key={tier.id} scope="col" className="p-4 font-semibold text-center border-b border-border-subtle">
                        <span className={tier.highlighted ? 'text-accent' : 'text-ink'}>{tier.name}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: { zh: '面試練習次數', en: 'Practice count' },     values: ['3 / month', 'Unlimited', 'Unlimited'] },
                    { feature: { zh: 'Mock 模式', en: 'Mock mode' },                  values: [true, true, true] },
                    { feature: { zh: 'BYOK (自帶 API Key)', en: 'BYOK' },          values: [false, true, true] },
                    { feature: { zh: '5 維度雷達圖報告', en: '5-dim radar report' }, values: [true, true, true] },
                    { feature: { zh: '多語言 (EN/ZH/JP/KR)', en: 'Multi-language' }, values: [false, true, true] },
                    { feature: { zh: 'Markdown 匯出', en: 'Markdown export' },          values: [false, true, true] },
                    { feature: { zh: '聚合報表', en: 'Aggregate dashboard' },         values: [false, false, true] },
                    { feature: { zh: '校園隱私優先', en: 'Campus privacy-first' },      values: [false, false, true] },
                  ].map((row) => (
                    <tr key={row.feature.zh} className="hover:bg-surface-hover/40 transition-colors">
                      <th scope="row" className="text-left p-4 font-medium text-ink border-b border-border-subtle">
                        {row.feature[lang]}
                      </th>
                      {row.values.map((v, i) => (
                        <td key={i} className="p-4 text-center border-b border-border-subtle">
                          {typeof v === 'boolean' ? (
                            v ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-success/15 text-success" aria-label={isEnglish ? 'Included' : '包含'}>
                                <IconCheck size={14} />
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-surface-elevated text-ink-muted" aria-label={isEnglish ? 'Not included' : '未包含'}>
                                <IconX size={14} />
                              </span>
                            )
                          ) : (
                            <span className="text-ink-secondary font-mono text-xs">{v}</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Container>
        </section>

        {/* ===== FAQ ===== */}
        <section className="py-12 lg:py-16 border-t border-border-subtle" aria-labelledby="faq-heading">
          <Container>
            <SectionHeading
              eyebrow="FAQ"
              title={isEnglish ? 'Common questions' : '常見問題'}
              align="center"
            />
            <h2 id="faq-heading" className="sr-only">FAQ</h2>

            <div className="max-w-3xl mx-auto space-y-4">
              {FAQ.map((item, i) => (
                <details
                  key={i}
                  className="card group"
                  {...(i === 0 ? { open: true } : {})}
                >
                  <summary className="cursor-pointer flex items-center justify-between gap-3 list-none [&::-webkit-details-marker]:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
                    <h3 className="text-h4 text-ink">{item.q[lang]}</h3>
                    <span aria-hidden="true" className="text-ink-muted group-open:rotate-45 transition-transform">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm text-ink-secondary leading-relaxed">
                    {item.a[lang]}
                  </p>
                </details>
              ))}
            </div>
          </Container>
        </section>

        {/* ===== Final CTA ===== */}
        <section className="py-16 lg:py-20 border-t border-border-subtle">
          <Container>
            <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-bg-elevated p-8 lg:p-12 text-center">
              <div aria-hidden="true" className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-primary/15 blur-3xl" />
              <h2 className="text-h2 sm:text-h1 text-ink tracking-tight max-w-2xl mx-auto">
                {isEnglish ? 'Start free, upgrade when ready' : '免費開始,需要時再升級'}
              </h2>
              <p className="mt-3 text-base text-ink-secondary max-w-prose mx-auto leading-relaxed">
                {isEnglish
                  ? 'No credit card. 3 free Mock-mode practices. Upgrade only if you need BYOK or unlimited.'
                  : '無需信用卡。3 次免費 Mock 練習。需要 BYOK 或無限制再升級。'}
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <LinkButton href="/interview" variant="accent">
                  {isEnglish ? 'Start 3 free practices' : '開始 3 次免費練習'}
                  <IconArrowRight size={16} />
                </LinkButton>
                <LinkButton href="/" variant="ghost">
                  {isEnglish ? 'Back to home' : '回首頁'}
                </LinkButton>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer locale={lang} />
    </div>
  );
}
