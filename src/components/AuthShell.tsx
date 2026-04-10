import type { ReactNode } from 'react';
import { ArrowRight, Camera, CheckCircle2, ShieldCheck, Sparkles } from 'lucide-react';

type AuthShellProps = {
  badgeLabel: string;
  children: ReactNode;
  description: string;
  footerNote: string;
  secondaryLabel: string;
  secondaryText: string;
  onSecondaryAction: () => void;
  primaryLabel: string;
  title: string;
};

const heroHighlights = [
  {
    title: 'Fast daily logging',
    description: 'Search, scan, and quick re-add keep meal logging calm and low-friction.',
    icon: Sparkles,
  },
  {
    title: 'Review before save',
    description: 'Photo scans and lookups still open a review step so portions stay trustworthy.',
    icon: ShieldCheck,
  },
  {
    title: 'Useful from day one',
    description: 'Calories, protein, hydration, and food history stay easy to understand.',
    icon: CheckCircle2,
  },
] as const;

const heroSteps = [
  {
    title: 'Snap or search',
    detail: 'Start with a food search, a recent meal, or a quick photo.',
    icon: Camera,
  },
  {
    title: 'Review nutrition',
    detail: 'Check the source, portion, and macros before anything lands in your log.',
    icon: ShieldCheck,
  },
  {
    title: 'Keep the day clear',
    detail: 'Your dashboard stays honest, calm, and easy to trust.',
    icon: ArrowRight,
  },
] as const;

export default function AuthShell({
  badgeLabel,
  children,
  description,
  footerNote,
  secondaryLabel,
  secondaryText,
  onSecondaryAction,
  primaryLabel,
  title,
}: AuthShellProps) {
  return (
    <div className="premium-auth-shell px-4 py-6 sm:py-10">
      <div className="premium-auth-layout mx-auto max-w-5xl">
        <section className="premium-auth-hero premium-card p-6 sm:p-7">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.32em] text-brand-600 dark:text-brand-300">
                CALSNAP AI
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-[#111827] dark:text-[#f8fafc]">
                Snap a meal. Review it. Log it with confidence.
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                CALSNAP AI is a calmer nutrition assistant for people who want quick meal logging,
                clearer macro guidance, and less clutter.
              </p>
            </div>
            <div className="premium-auth-badge">
              <Sparkles size={22} className="text-white" />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="premium-chip premium-chip-green">Photo-first logging</span>
            <span className="premium-chip">Search and barcode backup</span>
            <span className="premium-chip">Daily progress that stays readable</span>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {heroHighlights.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="premium-auth-feature">
                  <div className="premium-icon-badge">
                    <Icon size={18} className="text-[#22c55e]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111827] dark:text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 rounded-[28px] border border-white/70 bg-white/70 p-5 shadow-[0_20px_50px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/[0.04]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-brand-600 dark:text-brand-300">
                  How It Works
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  The app stays focused on one loop: capture the meal, review the estimate, and
                  keep the day easy to understand.
                </p>
              </div>
              <span className="hidden rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-700 dark:inline-flex dark:text-emerald-300">
                Review-first
              </span>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {heroSteps.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.title}
                    className="rounded-[22px] border border-slate-200/80 bg-white/80 px-4 py-4 dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                        <Icon size={18} />
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                        Step {index + 1}
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-[#111827] dark:text-white">{item.title}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{item.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <div className="premium-auth-card w-full rounded-[30px] p-7 sm:p-8">
          <div className="mb-7">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-emerald-700 dark:text-emerald-300">
              <ShieldCheck size={14} />
              {badgeLabel}
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-[#111827] dark:text-[#f8fafc]">
              {title}
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              {description}
            </p>
          </div>

          {children}

          <div className="mt-4 rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-3 text-xs text-slate-600 shadow-[0_12px_32px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.03] dark:text-slate-300">
            {footerNote}
          </div>

          <button
            type="button"
            onClick={onSecondaryAction}
            className="premium-auth-link mt-5 w-full text-sm font-semibold"
          >
            {secondaryText}{' '}
            <span className="text-[#111827] dark:text-white">{secondaryLabel}</span>
          </button>

          <div className="mt-4 text-center text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
            {primaryLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
