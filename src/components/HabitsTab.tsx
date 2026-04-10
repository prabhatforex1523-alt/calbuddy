import { CheckCircle2, Flame, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import { AnimatePresence, motion } from 'motion/react';
import type { CSSProperties } from 'react';

import { AnimatedNumber } from './AnimatedNumber';
import { HabitIcon } from './HabitIcon';

type ActionFeedback = {
  kind: 'food' | 'habit' | 'weight';
  message: string;
  token: number;
} | null;

type HabitCompletionItem = {
  color: string;
  completed: boolean;
  icon: string;
  id: string;
  name: string;
  streak: number;
};

type HabitsTabProps = {
  actionFeedback: ActionFeedback;
  actionLinkStyles: string;
  dailyHabitCompletion: HabitCompletionItem[];
  onOpenAddHabit: () => void;
  onToggleHabit: (habitId: string) => void;
  recentCompletedHabitId: string | null;
};

export function HabitsTab({
  actionFeedback,
  actionLinkStyles,
  dailyHabitCompletion,
  onOpenAddHabit,
  onToggleHabit,
  recentCompletedHabitId,
}: HabitsTabProps) {
  return (
    <section
      className="space-y-8 premium-tab-shell"
      style={{ '--card-bg': 'var(--card-bg-habits)', '--card-border': 'var(--card-border-habits)' } as CSSProperties}
    >
      <div className="glass-card premium-tab-hero p-7">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-[#111827] dark:text-white">Daily Habits</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">Track your consistency</p>
            <AnimatePresence initial={false}>
              {actionFeedback?.kind === 'habit' && (
                <motion.div
                  key={`habit-feedback-${actionFeedback.token}`}
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.98 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="premium-feedback-chip premium-feedback-chip-success mt-3"
                >
                  <CheckCircle2 size={12} />
                  {actionFeedback.message}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black text-[#111827] dark:text-white">
              <AnimatedNumber value={dailyHabitCompletion.filter((habit) => habit.completed).length} />
              /
              <AnimatedNumber value={dailyHabitCompletion.length} />
            </div>
            <div className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">
              Completed
            </div>
          </div>
        </div>

        <div className="premium-list-shell">
          {dailyHabitCompletion.map((habit) => (
            <button
              key={habit.id}
              type="button"
              onClick={() => onToggleHabit(habit.id)}
              className={clsx(
                'w-full neutral-row premium-habit-row premium-list-row flex items-center justify-between group transition-all duration-300',
                habit.completed && 'bg-slate-50 dark:bg-[#182131]',
                recentCompletedHabitId === habit.id && 'premium-habit-celebration'
              )}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  animate={
                    recentCompletedHabitId === habit.id
                      ? { scale: [1, 1.08, 1], rotate: [0, -4, 0] }
                      : { scale: 1, rotate: 0 }
                  }
                  transition={{ duration: 0.42, ease: 'easeOut' }}
                  className={clsx(
                    'w-12 h-12 rounded-2xl flex items-center justify-center transition-all border border-slate-200 dark:border-[#3d516d]',
                    habit.completed ? 'scale-95' : 'bg-white dark:bg-[#213149]'
                  )}
                >
                  <HabitIcon name={habit.icon} size={24} color={habit.color} />
                </motion.div>
                <div className="text-left">
                  <h4
                    className={clsx(
                      'font-bold text-sm transition-colors',
                      habit.completed ? 'text-slate-600 dark:text-slate-300 line-through' : 'text-[#111827] dark:text-white'
                    )}
                  >
                    {habit.name}
                  </h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Flame
                      size={12}
                      className={habit.streak > 0 ? 'text-slate-600 dark:text-slate-300' : 'text-slate-500 dark:text-slate-400'}
                    />
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {habit.streak} day streak
                    </span>
                  </div>
                </div>
              </div>
              <motion.div
                animate={recentCompletedHabitId === habit.id ? { scale: [1, 1.16, 1] } : { scale: 1 }}
                transition={{ duration: 0.42, ease: 'easeOut' }}
                className={clsx(
                  'w-8 h-8 rounded-full border flex items-center justify-center transition-all',
                  habit.completed
                    ? 'bg-slate-900 dark:bg-slate-100 border-slate-900 dark:border-slate-100 text-white dark:text-slate-900'
                    : 'border-slate-200 dark:border-[#3d516d] text-transparent'
                )}
              >
                {habit.completed && <CheckCircle2 size={18} />}
              </motion.div>
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card p-7">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-[#111827] dark:text-white">Manage Your Habits</h4>
          <button type="button" onClick={onOpenAddHabit} className={actionLinkStyles}>
            <Plus size={16} /> Add New
          </button>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-300 mb-4">
          Create habits you want to track daily. You can also manage them in your profile settings.
        </p>
      </div>
    </section>
  );
}
