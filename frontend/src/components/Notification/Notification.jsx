// Toast system. `notify(message, type)` can be called from anywhere (module
// event bus — no context threading); <ToastHost/> renders the stack with
// layout-animated insertion/removal. Auto-dismisses after 3.8s.
import { useEffect, useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';
import { SPRING } from '../../utils/motionPresets.js';

const listeners = new Set();
let counter = 0;

export const notify = (message, type = 'info') => {
  const toast = { id: `t${(counter += 1)}`, message, type };
  listeners.forEach((push) => push(toast));
};
export const notifySuccess = (message) => notify(message, 'success');
export const notifyError = (message) => notify(message, 'error');

const ICONS = {
  success: <FiCheckCircle className="h-5 w-5 text-lime" />,
  error: <FiAlertCircle className="h-5 w-5 text-danger" />,
  info: <FiInfo className="h-5 w-5 text-accent" />,
};

export default function ToastHost() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const push = (toast) => {
      setToasts((current) => [...current, toast]);
      setTimeout(() => setToasts((current) => current.filter((t) => t.id !== toast.id)), 3800);
    };
    listeners.add(push);
    return () => listeners.delete(push);
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(92vw,360px)] flex-col gap-2">
      <AnimatePresence>
        {toasts.map((toast) => (
          <m.div
            key={toast.id}
            layout
            initial={{ opacity: 0, x: 60, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1, transition: SPRING }}
            exit={{ opacity: 0, x: 40, scale: 0.95, transition: { duration: 0.2 } }}
            className="glass-panel pointer-events-auto flex items-start gap-3 rounded-card p-4"
            role="status"
          >
            {ICONS[toast.type] ?? ICONS.info}
            <p className="flex-1 text-sm leading-snug">{toast.message}</p>
            <button
              onClick={() => setToasts((current) => current.filter((t) => t.id !== toast.id))}
              className="text-[var(--text-mut)] hover:text-[var(--text)]"
              aria-label="Dismiss"
            >
              <FiX className="h-4 w-4" />
            </button>
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
