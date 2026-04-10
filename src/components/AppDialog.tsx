import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type AppDialogProps = {
  children: ReactNode;
  description?: string;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

export function AppDialog({
  children,
  description,
  isOpen,
  onClose,
  title,
}: AppDialogProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center p-4 sm:items-center">
          <motion.button
            type="button"
            aria-label="Close dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 neutral-overlay"
          />

          <motion.div
            initial={{ opacity: 0, y: 28, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="relative w-full max-w-md overflow-hidden rounded-t-3xl sm:rounded-3xl neutral-sheet premium-sheet-shell"
          >
            <div className="premium-sheet-handle" />
            <div className="premium-sheet-body neutral-modal-body p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-[#111827] dark:text-white">{title}</h2>
                  {description ? (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
                  ) : null}
                </div>
                <button type="button" onClick={onClose} className="neutral-icon-btn p-2">
                  <X size={18} />
                </button>
              </div>

              {children}
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  );
}
