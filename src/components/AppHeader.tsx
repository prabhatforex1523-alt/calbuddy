import { Moon, Settings as SettingsIcon, Sun, TrendingUp } from 'lucide-react';

type AppHeaderProps = {
  isDarkMode: boolean;
  isProfileActive: boolean;
  onOpenProfile: () => void;
  onToggleDarkMode: () => void;
  shouldUseLiteEffects: boolean;
  subtitle: string;
};

export function AppHeader({
  isDarkMode,
  isProfileActive,
  onOpenProfile,
  onToggleDarkMode,
  shouldUseLiteEffects,
  subtitle,
}: AppHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 px-4 pt-4 pb-2"
      style={
        shouldUseLiteEffects
          ? { background: 'rgba(248, 250, 252, 0.97)' }
          : { background: 'rgba(248, 250, 252, 0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }
      }
    >
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)' }}
          >
            <TrendingUp size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight tracking-[0.02em]">CALSNAP AI</h1>
            <p className="text-[10px] uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">{subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="neutral-icon-btn premium-header-icon-btn h-9 w-9 flex items-center justify-center text-gray-500 dark:text-slate-300"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            type="button"
            onClick={onOpenProfile}
            className={`neutral-icon-btn premium-header-icon-btn h-9 w-9 flex items-center justify-center ${
              isProfileActive ? 'premium-header-icon-btn-active' : 'text-gray-500 dark:text-slate-300'
            }`}
          >
            <SettingsIcon size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
