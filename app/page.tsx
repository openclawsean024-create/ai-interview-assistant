'use client';
// app/page.tsx — Landing (v3.0 redesign via ui-ux-pro-max)
// Sections (per design system recommendation): Hero → Product mock → Features → Comparison → CTA → Footer
// A11y: skip link, aria-labels, focus rings, semantic landmarks, prefers-reduced-motion

import Link from 'next/link';
import {
  Container,
  Navbar,
  Footer,
  DemoModeBadge,
  LinkButton,
  SectionHeading,
  SkipLink,
  IconArrowRight,
  IconCheck,
  IconShield,
  IconMic,
  IconZap,
  IconBook,
  IconUsers,
  IconTarget,
  IconSparkle,
  IconFileText,
} from '@/app/components/ui-primitives';
import SessionInit from '@/app/components/session-init';

export default function LandingPage() {
  return (
    <>
      <SkipLink />
      <SessionInit />
      <Navbar active="/" />

      <main id="main-content">
        {/* ===== Hero ===== */}
        <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-32">
          {/* Background ambient gradients (decorative — aria-hidden) */}
          <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />
            <div className="absolute top-40 right-1/4 w-[400px] h-[400px] rounded-full bg-accent/8 blur-3xl" />
          </div>

          <Container>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left column — copy + CTAs */}
              <div className="lg:col-span-7 animate-fade-in-up stagger-1">
                <p className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-surface-elevated text-ink-secondary text-xs font-semibold tracking-wide mb-6">
                  <IconSparkle size={14} className="text-primary" />
                  v3.0 規格書已升級 — 預設 Mock 模式
                </p>

                <h1 className="text-display sm:text-h1 text-ink tracking-tight leading-[1.05]">
                  面試前的
                  <span className="gradient-text"> 演練</span>
                  <br />
                  + 面試後的
                  <span className="gradient-text-accent"> 證據化複盤</span>
                </h1>

                <p className="mt-6 text-lg text-ink-secondary leading-relaxed max-w-prose">
                  繁中、職缺客製化的 STAR 結構練習。即時作答只保留為 opt-in 的低風險教練 —
                  <strong className="text-ink"> 不做隱藏式代答</strong>。3 次免費、無需註冊、無需 API Key。
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <LinkButton href="/interview" variant="accent">
                    🎯 立即開始練習
                    <IconArrowRight size={18} />
                  </LinkButton>
                  <LinkButton href="/pricing" variant="ghost">
                    查看定價
                  </LinkButton>
                </div>

                <div className="mt-6">
                  <DemoModeBadge locale="zh" />
                </div>

                {/* Trust strip */}
                <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-muted">
                  {[
                    { icon: <IconShield size={14} />, label: '資料只存瀏覽器' },
                    { icon: <IconCheck size={14} />, label: '無需註冊' },
                    { icon: <IconZap size={14} />, label: 'Mock 模式免費' },
                    { icon: <IconBook size={14} />, label: 'SPEC v3.0 開源' },
                  ].map((t) => (
                    <li key={t.label} className="inline-flex items-center gap-1.5">
                      <span className="text-primary">{t.icon}</span>
                      {t.label}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Right column — mock product UI */}
              <div className="lg:col-span-5 animate-fade-in-up stagger-2">
                <div className="glass-card p-1 shadow-card-hover">
                  <div className="bg-bg rounded-xl p-5 lg:p-6 shadow-card">
                    <div className="flex items-center gap-1.5 mb-4" aria-hidden="true">
                      <span className="w-2.5 h-2.5 rounded-full bg-danger/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-warning/70" />
                      <span className="w-2.5 h-2.5 rounded-full bg-success/70" />
                    </div>

                    <div className="bg-surface-elevated rounded-lg p-4 lg:p-5 border border-border-subtle space-y-4">
                      <span className="tag tag-muted">
                        <IconMic size={11} />
                        面試官
                      </span>
                      <p className="text-ink leading-relaxed text-sm lg:text-base">
                        請用 STAR 法則描述一次你主導解決技術衝突的經驗？
                      </p>

                      <div className="border-t border-border-subtle pt-4">
                        <span className="tag mb-3">
                          <IconSparkle size={11} />
                          AI 教練回饋
                        </span>
                        <p className="answer-prose text-sm">
                          <span className="text-success">STAR 結構基本正確</span>
                          {' '}(score <span className="font-semibold text-ink">78</span>)。建議在 Result 量化具體數字（%、金額、時間）。深度略顯不足，可補充技術細節。
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <span className="tag">STAR</span>
                        <span className="tag">Leadership</span>
                        <span className="tag">Rehearsal</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* ===== Features ===== */}
        <section className="py-16 lg:py-24 border-t border-border-subtle" aria-labelledby="features-heading">
          <Container>
            <SectionHeading
              eyebrow="v3.0 差異化"
              title="三個差異,一次到位"
              description="對應 SPEC v3.0 §16 (Mock + BYOK)、§17 (anonymous-first)、§18 (可量測的 MVP 契約)。"
              align="center"
            />

            <h2 id="features-heading" className="sr-only">v3.0 差異化功能</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
                {
                  icon: <IconSparkle size={22} />,
                  title: 'Mock 模式預設',
                  desc: '無需 API Key 即可離線練習 3 次完整面試,結構化 STAR 題庫隨機抽 5 題。BYOK 在 Settings 切換。',
                  tag: 'SPEC §16',
                  tagClass: 'tag',
                },
                {
                  icon: <IconShield size={22} />,
                  title: 'anonymous-first',
                  desc: '進站即可使用,不要求註冊。localStorage cuid + 一鍵刪除,個資不送伺服器。',
                  tag: 'SPEC §17',
                  tagClass: 'tag',
                },
                {
                  icon: <IconZap size={22} />,
                  title: '降級不丟資料',
                  desc: 'LLM timeout 自動降級 Mock,草稿保留在 localStorage。SPEC §5.3 程式碼落地。',
                  tag: 'SPEC §5.3',
                  tagClass: 'tag-accent',
                },
                {
                  icon: <IconFileText size={22} />,
                  title: '可量測驗證',
                  desc: '20 條 Acceptance Criteria,scripts/verify-mvp.sh 一鍵跑完。Production 8/8 通過。',
                  tag: 'SPEC §18',
                  tagClass: 'tag',
                },
                {
                  icon: <IconTarget size={22} />,
                  title: 'STAR 結構評分',
                  desc: '5 維度雷達圖(Situation/Task/Action/Result 完整度)+ 量化成果偵測 + 改進建議。',
                  tag: 'SPEC §3.1',
                  tagClass: 'tag',
                },
                {
                  icon: <IconUsers size={22} />,
                  title: '雙部署目標',
                  desc: 'Vercel production + GitHub Pages 靜態鏡像,env vars 0 個即可上線。',
                  tag: 'SPEC §19',
                  tagClass: 'tag',
                },
              ].map((f, i) => (
                <article
                  key={f.title}
                  className="card card-hover animate-fade-in-up"
                  style={{ animationDelay: `${0.05 * i}s` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-lg bg-primary-soft text-primary flex items-center justify-center">
                      {f.icon}
                    </div>
                    <span className={f.tagClass}>{f.tag}</span>
                  </div>
                  <h3 className="text-h4 text-ink mb-2">{f.title}</h3>
                  <p className="text-sm text-ink-secondary leading-relaxed">{f.desc}</p>
                </article>
              ))}
            </div>
          </Container>
        </section>

        {/* ===== Comparison ===== */}
        <section className="py-16 lg:py-24 border-t border-border-subtle" aria-labelledby="comparison-heading">
          <Container>
            <SectionHeading
              eyebrow="市場定位"
              title="跟 Final Round AI / Interview Cake 不一樣在哪"
              description="他們做即時代答(有作弊風險且規模已達 ~10M users)。我們做面試前後的可信複盤。SPEC §1.1。"
              align="center"
            />

            <h2 id="comparison-heading" className="sr-only">跟競品的差異</h2>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-left p-4 text-sm font-semibold text-ink-muted uppercase tracking-wider border-b border-border">能力</th>
                    <th className="p-4 text-sm font-semibold text-ink-muted uppercase tracking-wider border-b border-border text-center">Final Round AI / Cake</th>
                    <th className="p-4 text-sm font-semibold text-primary uppercase tracking-wider border-b border-border text-center">AIIA v3.0</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {[
                    { cap: '即時作答(可能有作弊風險)', theirs: '✓', ours: 'opt-in 教練' },
                    { cap: '繁中職缺客製', theirs: '部分', ours: '✓' },
                    { cap: '面試前 5 題 STAR 演練', theirs: '✗', ours: '✓' },
                    { cap: '面試後證據化複盤', theirs: '✗', ours: '✓' },
                    { cap: '5 維度雷達圖報告', theirs: '✗', ours: '✓' },
                    { cap: '3 次免費 + 無需註冊', theirs: '需 email', ours: '✓' },
                    { cap: 'Mock 模式離線運作', theirs: '需 API key', ours: '✓' },
                    { cap: '個資存於瀏覽器', theirs: '伺服器端', ours: '✓' },
                  ].map((row) => (
                    <tr key={row.cap} className="hover:bg-surface-hover/40 transition-colors">
                      <th scope="row" className="text-left p-4 text-ink font-medium border-b border-border-subtle">{row.cap}</th>
                      <td className="p-4 text-center text-ink-muted border-b border-border-subtle">{row.theirs}</td>
                      <td className="p-4 text-center border-b border-border-subtle">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-success/15 text-success">
                          <IconCheck size={14} />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Container>
        </section>

        {/* ===== CTA ===== */}
        <section className="py-16 lg:py-24 border-t border-border-subtle" aria-labelledby="cta-heading">
          <Container>
            <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-surface to-bg-elevated p-8 lg:p-16 text-center">
              <div aria-hidden="true" className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-accent/15 blur-3xl" />
              <div aria-hidden="true" className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-primary/15 blur-3xl" />

              <div className="relative">
                <h2 id="cta-heading" className="text-h2 sm:text-h1 text-ink tracking-tight max-w-2xl mx-auto">
                  免費 3 次面試演練,現在就開始
                </h2>
                <p className="mt-4 text-base text-ink-secondary max-w-prose mx-auto leading-relaxed">
                  無需註冊、無需 API Key。Mock 模式完整體驗 5 題 STAR + 5 維度雷達圖報告。
                </p>
                <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                  <LinkButton href="/interview" variant="accent">
                    🎯 開始第一次練習
                    <IconArrowRight size={18} />
                  </LinkButton>
                  <LinkButton href="/pricing" variant="ghost">
                    或查看定價
                  </LinkButton>
                </div>
              </div>
            </div>
          </Container>
        </section>
      </main>

      <Footer locale="zh" />
    </>
  );
}
