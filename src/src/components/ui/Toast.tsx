/**
 * Toast.tsx — Toast Notification System + Confirm Dialog
 *
 * Replaces window.alert and window.confirm throughout the app.
 *
 * ToastProvider: wraps the app, maintains a queue of up to 5 toasts.
 *   Renders toasts in a fixed bottom-right container.
 *
 * useToast() hook: returns { toast, success, error, warn, info }
 *   Example: const { success, error } = useToast();
 *            success('Project created');
 *            error('Failed to delete');
 *
 * ToastItem: individual toast with:
 *   - Slide-in animation from bottom
 *   - Animated progress bar that depletes over 3.8 seconds
 *   - Auto-dismisses after 3.8s or manual close (X button)
 *   - Icon and colour matches the type (green/red/amber/blue)
 *
 * ConfirmDialog: replaces window.confirm.
 *   - Animated centred modal with Cancel + Confirm buttons
 *   - danger prop makes the confirm button red
 *   - Used for: trash project, delete task, permanent delete
 */
import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastCtx {
  toast: (type: ToastType, message: string) => void;
  success: (msg: string) => void;
  error:   (msg: string) => void;
  warn:    (msg: string) => void;
  info:    (msg: string) => void;
}

const ToastContext = createContext<ToastCtx | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}

const icons = {
  success: <CheckCircle2 className="w-4 h-4 text-[#3EBD8A] flex-shrink-0" />,
  error:   <XCircle      className="w-4 h-4 text-brand-danger flex-shrink-0" />,
  warning: <AlertTriangle className="w-4 h-4 text-brand-warning flex-shrink-0" />,
  info:    <Info          className="w-4 h-4 text-sky-400 flex-shrink-0" />,
};

const bars = {
  success: 'bg-[#3EBD8A]',
  error:   'bg-brand-danger',
  warning: 'bg-brand-warning',
  info:    'bg-sky-400',
};

const DURATION = 3800;

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onRemove(toast.id), DURATION);
    return () => clearTimeout(t);
  }, [toast.id, onRemove]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
      className="relative glass-panel rounded-xl px-4 py-3 pr-10 shadow-2xl border border-brand-border/60 flex items-start gap-3 min-w-[280px] max-w-[380px] overflow-hidden"
    >
      {/* Animated progress bar at bottom */}
      <motion.div
        className={`absolute bottom-0 left-0 h-0.5 ${bars[toast.type]}`}
        initial={{ width: '100%' }}
        animate={{ width: '0%' }}
        transition={{ duration: DURATION / 1000, ease: 'linear' }}
      />

      {icons[toast.type]}
      <p className="text-sm text-brand-text leading-snug pt-px">{toast.message}</p>

      <button
        onClick={() => onRemove(toast.id)}
        className="absolute top-2.5 right-2.5 p-0.5 rounded text-brand-muted hover:text-white transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev.slice(-4), { id, type, message }]); // max 5
  }, []);

  const ctx: ToastCtx = {
    toast,
    success: (m) => toast('success', m),
    error:   (m) => toast('error', m),
    warn:    (m) => toast('warning', m),
    info:    (m) => toast('info', m),
  };

  return (
    <ToastContext.Provider value={ctx}>
      {children}
      {/* Portal-like fixed container */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 items-end pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onRemove={remove} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/** Simple confirm dialog (replaces window.confirm) */
export function ConfirmDialog({
  isOpen, title, message, confirmLabel = 'Confirm', danger = true,
  onConfirm, onCancel,
}: {
  isOpen: boolean; title: string; message: string;
  confirmLabel?: string; danger?: boolean;
  onConfirm: () => void; onCancel: () => void;
}) {
  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] bg-brand-dark/70 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onCancel}>
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="glass-panel rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-brand-border"
          onClick={e => e.stopPropagation()}>
          <h3 className="text-base font-bold text-white mb-2">{title}</h3>
          <p className="text-sm text-brand-muted mb-6 leading-relaxed">{message}</p>
          <div className="flex justify-end gap-3">
            <button onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-brand-muted hover:text-white rounded-lg hover:bg-brand-surface transition-colors">
              Cancel
            </button>
            <button onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors
                ${danger ? 'bg-brand-danger hover:bg-red-600' : 'bg-brand-accent hover:bg-brand-secondary'}`}>
              {confirmLabel}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
