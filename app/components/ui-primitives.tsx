'use client';
// app/components/ui-primitives.tsx
// v3.0 Design System shared primitives — all pages import these
// (replaces ad-hoc inline styles for consistency)

import Link from 'next/link';
import type { ReactNode, ButtonHTMLAttributes, ReactElement } from 'react';

/* ---------------- Icons (Lucide-style inline SVG) ---------------- */

const baseIconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true as const,
};

export function IconChevronRight(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
export function IconCheck(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
export function IconX(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}
export function IconArrowRight(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
export function IconTrash(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}
export function IconShield(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}
export function IconMic(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0M12 19v3" />
    </svg>
  );
}
export function IconBook(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
export function IconZap(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}
export function IconUsers(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
export function IconFileText(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}
export function IconSettings(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}
export function IconKey(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3" />
    </svg>
  );
}
export function IconHome(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}
export function IconTarget(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}
export function IconSparkle(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <path d="M12 3v18m-9-9h18M5.6 5.6l12.8 12.8M5.6 18.4 18.4 5.6" />
    </svg>
  );
}
export function IconDownload(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
export function IconClock(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
export function IconBuilding(props?: { size?: number; className?: string }) {
  return (
    <svg {...baseIconProps} width={props?.size ?? 18} height={props?.size ?? 18} className={props?.className}>
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="6" x2="9" y2="6" />
      <line x1="15" y1="6" x2="15" y2="6" />
      <line x1="9" y1="10" x2="9" y2="10" />
      <line x1="15" y1="10" x2="15" y2="10" />
      <line x1="9" y1="14" x2="9" y2="14" />
      <line x1="15" y1="14" x2="15" y2="14" />
      <path d="M10 22v-4h4v4" />
    </svg>
  );
}

/* ---------------- Layout primitives ---------------- */

export function Container({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`mx-auto w-full max-w-container px-4 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function PageShell({
  children,
  maxWidth = 'max-w-container',
}: {
  children: ReactNode;
  maxWidth?: string;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <main id="main-content" className={`flex-1 w-full ${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12`}>
        {children}
      </main>
    </div>
  );
}

/* ---------------- Navbar (shared across pages) ---------------- */

interface NavbarLink {
  href: string;
  label: string;
  icon?: ReactElement;
}

interface NavbarProps {
  active?: string;
  locale?: 'zh' | 'en';
}

const ZH_LINKS: NavbarLink[] = [
  { href: '/', label: '首頁' },
  { href: '/interview', label: '開始練習' },
  { href: '/pricing', label: '定價' },
];

const EN_LINKS: NavbarLink[] = [
  { href: '/', label: 'Home' },
  { href: '/interview', label: 'Practice' },
  { href: '/pricing', label: 'Pricing' },
];

const ZH_LANG_LABEL = { zh: '繁體中文', en: 'English' };
const EN_LANG_LABEL = { zh: '繁體中文', en: 'English' };

export function Navbar({ active, locale = 'zh' }: NavbarProps) {
  const links = locale === 'en' ? EN_LINKS : ZH_LINKS;
  const langLabel = (locale === 'en' ? EN_LANG_LABEL : ZH_LANG_LABEL)[locale === 'en' ? 'en' : 'zh'];
  const otherLocale = locale === 'en' ? 'zh' : 'en';
  const otherLabel = (locale === 'en' ? EN_LANG_LABEL : ZH_LANG_LABEL)[otherLocale];

  return (
    <nav aria-label="Primary" className="sticky top-0 z-40 backdrop-blur-md bg-bg/85 border-b border-border-subtle">
      <Container className="flex items-center justify-between h-16">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white font-bold text-sm">A</span>
          <span className="text-ink font-bold tracking-tight">AIIA</span>
          <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold bg-surface-elevated text-ink-muted border border-border">v3.0</span>
        </Link>

        <ul className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className={`nav-link ${active === l.href ? 'nav-link-active' : ''}`}
                aria-current={active === l.href ? 'page' : undefined}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <Link
            href={locale === 'en' ? `/?lang=zh` : `/?lang=en`}
            className="btn-icon"
            aria-label={`Switch language to ${otherLabel}`}
            title={`Switch to ${otherLabel}`}
          >
            <span className="text-xs font-semibold uppercase">{otherLocale}</span>
          </Link>
          <Link href="/settings" className="btn-icon" aria-label="Settings" title="Settings">
            <IconSettings />
          </Link>
          <Link href="/interview" className="btn-accent hidden sm:inline-flex">
            {locale === 'en' ? 'Start practice' : '開始練習'}
            <IconArrowRight size={16} />
          </Link>
        </div>
      </Container>
    </nav>
  );
}

/* ---------------- Footer ---------------- */

interface FooterProps {
  locale?: 'zh' | 'en';
}

const ZH_FOOTER = {
  tagline: '繁中、面試前演練 + 面試後證據化複盤',
  product: '產品',
  productLinks: [
    { href: '/interview', label: '開始練習' },
    { href: '/pricing', label: '定價' },
    { href: '/dashboard', label: '練習紀錄' },
  ],
  resources: '資源',
  resourceLinks: [
    { href: 'https://github.com/openclawsean024-create/ai-interview-assistant/blob/master/PRD/SPEC.md', label: 'SPEC v3.0', external: true },
    { href: 'https://github.com/openclawsean024-create/ai-interview-assistant/blob/master/PRD/CHANGELOG.md', label: 'CHANGELOG', external: true },
  ],
  legal: '© 2026 AIIA. 本機一人公司作品。',
};

const EN_FOOTER = {
  tagline: 'Mandarin interview rehearsal + evidence-based debrief',
  product: 'Product',
  productLinks: [
    { href: '/interview', label: 'Practice' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/dashboard', label: 'History' },
  ],
  resources: 'Resources',
  resourceLinks: [
    { href: 'https://github.com/openclawsean024-create/ai-interview-assistant/blob/master/PRD/SPEC.md', label: 'SPEC v3.0', external: true },
    { href: 'https://github.com/openclawsean024-create/ai-interview-assistant/blob/master/PRD/CHANGELOG.md', label: 'CHANGELOG', external: true },
  ],
  legal: '© 2026 AIIA. Built by a solo founder.',
};

export function Footer({ locale = 'zh' }: FooterProps) {
  const f = locale === 'en' ? EN_FOOTER : ZH_FOOTER;

  return (
    <footer className="border-t border-border-subtle mt-16">
      <Container className="py-10 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-white font-bold text-sm">A</span>
              <span className="text-ink font-bold tracking-tight">AIIA</span>
            </Link>
            <p className="text-sm text-ink-secondary mt-3 max-w-md leading-relaxed">{f.tagline}</p>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-ink-muted mb-3">{f.product}</h3>
            <ul className="space-y-2">
              {f.productLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-ink-secondary hover:text-ink transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-ink-muted mb-3">{f.resources}</h3>
            <ul className="space-y-2">
              {f.resourceLinks.map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-ink-secondary hover:text-ink transition-colors inline-flex items-center gap-1"
                  >
                    {l.label}
                    <IconArrowRight size={12} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border-subtle text-xs text-ink-muted">
          {f.legal}
        </div>
      </Container>
    </footer>
  );
}

/* ---------------- Page header (breadcrumb + title) ---------------- */

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-8 lg:mb-10">
      {eyebrow && (
        <p className="text-xs uppercase tracking-wider font-semibold text-primary mb-2">{eyebrow}</p>
      )}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h1 className="text-h2 sm:text-h1 text-ink tracking-tight">{title}</h1>
          {description && (
            <p className="mt-3 text-ink-secondary text-base max-w-prose leading-relaxed">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/* ---------------- Demo mode badge ---------------- */

import { useEffect, useState } from 'react';

const BYOK_KEY = 'aiia.byok.apiKey';

export function DemoModeBadge({ locale = 'zh' }: { locale?: 'zh' | 'en' }) {
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    try {
      setHasKey(!!window.localStorage.getItem(BYOK_KEY));
    } catch {
      /* ignore */
    }
    const onChange = () => {
      try { setHasKey(!!window.localStorage.getItem(BYOK_KEY)); } catch { /* ignore */ }
    };
    window.addEventListener('aiia:byok-changed', onChange);
    window.addEventListener('aiia:storage-changed', onChange);
    return () => {
      window.removeEventListener('aiia:byok-changed', onChange);
      window.removeEventListener('aiia:storage-changed', onChange);
    };
  }, []);

  if (hasKey) {
    return (
      <span
        data-testid="aiia-mode-badge"
        data-mode="byok"
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/30"
      >
        <span className="status-dot status-dot-success" />
        {locale === 'en' ? 'LLM Mode (BYOK)' : 'LLM 模式 (BYOK)'}
      </span>
    );
  }

  return (
    <span
      data-testid="aiia-mode-badge"
      data-mode="mock"
      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-warning/10 text-warning border border-warning/30"
    >
      <span className="status-dot status-dot-warning" />
      {locale === 'en' ? 'Demo Mode (Mock) — set API Key for real LLM' : 'Demo 模式 (Mock) — 設定 API Key 啟用真實 LLM'}
    </span>
  );
}

/* ---------------- Modal (a11y: focus trap, ESC to close, aria-modal) ---------------- */

import { useCallback, useRef } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
  closeOnBackdrop?: boolean;
}

export function Modal({ open, onClose, title, description, children, actions, closeOnBackdrop = true }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (closeOnBackdrop && e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-desc' : undefined}
        onKeyDown={handleKeyDown}
        className="bg-surface border border-border rounded-2xl p-6 max-w-md w-full shadow-card-hover animate-fade-in-up"
      >
        <h2 id="modal-title" className="text-xl font-semibold text-ink mb-2">{title}</h2>
        {description && <p id="modal-desc" className="text-sm text-ink-secondary mb-5 leading-relaxed">{description}</p>}
        <div className="mb-5">{children}</div>
        {actions && <div className="flex gap-3">{actions}</div>}
      </div>
    </div>
  );
}

/* ---------------- Button (typed wrapper for all variants) ---------------- */

type ButtonVariant = 'primary' | 'accent' | 'ghost' | 'danger';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant?: ButtonVariant;
  children: ReactNode;
  fullWidth?: boolean;
}

export function Button({ variant = 'primary', children, fullWidth, className = '', ...rest }: ButtonProps) {
  const cls =
    variant === 'accent' ? 'btn-accent'
    : variant === 'ghost' ? 'btn-ghost'
    : variant === 'danger' ? 'btn-danger'
    : 'btn-primary';
  return (
    <button {...rest} className={`${cls} ${fullWidth ? 'w-full' : ''} ${className}`.trim()}>
      {children}
    </button>
  );
}

interface LinkButtonProps {
  variant?: ButtonVariant;
  href: string;
  children: ReactNode;
  external?: boolean;
  fullWidth?: boolean;
  className?: string;
}

export function LinkButton({ variant = 'primary', href, children, external, fullWidth, className = '' }: LinkButtonProps) {
  const cls =
    variant === 'accent' ? 'btn-accent'
    : variant === 'ghost' ? 'btn-ghost'
    : variant === 'danger' ? 'btn-danger'
    : 'btn-primary';
  const widthCls = fullWidth ? 'w-full' : '';
  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={`${cls} ${widthCls} ${className}`.trim()}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={`${cls} ${widthCls} ${className}`.trim()}>
      {children}
    </Link>
  );
}

/* ---------------- Section heading ---------------- */

interface SectionHeadingProps {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: 'left' | 'center';
}

export function SectionHeading({ eyebrow, title, description, align = 'left' }: SectionHeadingProps) {
  const alignCls = align === 'center' ? 'text-center mx-auto' : 'text-left';
  return (
    <div className={`max-w-prose ${alignCls} mb-8 lg:mb-12`}>
      {eyebrow && <p className="text-xs uppercase tracking-wider font-semibold text-primary mb-2">{eyebrow}</p>}
      <h2 className="text-h2 sm:text-h1 text-ink tracking-tight">{title}</h2>
      {description && <p className="mt-3 text-base text-ink-secondary leading-relaxed">{description}</p>}
    </div>
  );
}

/* ---------------- Skip link (a11y) ---------------- */

export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-3 focus:py-2 focus:bg-primary focus:text-white focus:rounded-md focus:outline-none focus:ring-2 focus:ring-primary-ring"
    >
      跳至主要內容
    </a>
  );
}
