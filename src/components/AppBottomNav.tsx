import { Camera, History, Plus, Scale, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

type NavTab = 'today' | 'history' | 'scan' | 'habits' | 'activity' | 'weight' | 'profile';

type AppBottomNavProps = {
  activeTab: NavTab;
  onAddFood: () => void;
  onTabChange: (tab: Exclude<NavTab, 'profile'>) => void;
  shouldReduceMotion: boolean;
};

type NavItem = {
  icon: typeof TrendingUp;
  label: string;
  tab: Exclude<NavTab, 'profile'>;
};

const NAV_ITEMS: NavItem[] = [
  { icon: TrendingUp, label: 'Home', tab: 'today' },
  { icon: History, label: 'Log', tab: 'history' },
  { icon: Camera, label: 'Scan', tab: 'scan' },
  { icon: Scale, label: 'Progress', tab: 'weight' },
];

export function AppBottomNav({
  activeTab,
  onAddFood,
  onTabChange,
  shouldReduceMotion,
}: AppBottomNavProps) {
  const navItemMotionProps = shouldReduceMotion ? {} : { whileHover: { scale: 1.04 }, whileTap: { scale: 0.9 } };
  const navAddMotionProps = shouldReduceMotion ? {} : { whileHover: { scale: 1.04 }, whileTap: { scale: 0.92 } };

  return (
    <nav className="premium-bottom-nav">
      <div className={`premium-bottom-nav-inner ${activeTab === 'profile' ? 'premium-bottom-nav-inner-profile' : ''}`}>
        {NAV_ITEMS.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;

          return (
            <motion.button
              key={item.tab}
              {...navItemMotionProps}
              type="button"
              onClick={() => onTabChange(item.tab)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`premium-nav-item group relative ${isActive ? 'premium-nav-item-active' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
            >
              <span
                className={`premium-nav-item-icon transition-all ${
                  isActive
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                    : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}
              >
                <Icon size={20} />
              </span>
              <span
                className={`premium-nav-item-label transition-all ${
                  isActive ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-500 dark:bg-brand-400 rounded-full"
                />
              )}
            </motion.button>
          );
        })}

        <motion.button
          {...navAddMotionProps}
          type="button"
          onClick={onAddFood}
          className="premium-nav-add group"
          title="Add Food"
          aria-label="Add Food"
        >
          <span className="premium-nav-add-button group-hover:scale-105 group-active:scale-95 transition-transform">
            <Plus size={20} className="text-white" />
          </span>
          <span className="premium-nav-add-label text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300">Add</span>
        </motion.button>

        {NAV_ITEMS.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.tab;

          return (
            <motion.button
              key={item.tab}
              {...navItemMotionProps}
              type="button"
              onClick={() => onTabChange(item.tab)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`premium-nav-item group relative ${isActive ? 'premium-nav-item-active' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'}`}
            >
              <span
                className={`premium-nav-item-icon transition-all ${
                  isActive
                    ? 'bg-brand-100 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                    : 'text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
                }`}
              >
                <Icon size={20} />
              </span>
              <span
                className={`premium-nav-item-label transition-all ${
                  isActive ? 'text-brand-600 dark:text-brand-400 font-semibold' : 'text-slate-500'
                }`}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTabIndicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-brand-500 dark:bg-brand-400 rounded-full"
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
}
