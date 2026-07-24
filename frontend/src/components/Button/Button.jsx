// Motion-native button. The label, loading spinner and success checkmark are
// one continuously-morphing element (AnimatePresence + layout), so an async
// action reads as CTA → spinner → ✓ without the button disappearing.
// Press compresses (whileTap) and releases with spring momentum.
import { m, AnimatePresence } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';
import { cn } from '../../utils/helpers.js';
import { SPRING, tapPress, DUR, EASE } from '../../utils/motionPresets.js';

const VARIANTS = {
  primary:
    'bg-accent text-ink font-semibold shadow-glow-accent hover:brightness-105',
  mint: 'bg-mint text-white font-semibold shadow-glow-mint hover:brightness-110',
  glass:
    'glass-panel text-[var(--text)] font-medium hover:bg-white/10',
  ghost: 'text-[var(--text-sec)] hover:text-[var(--text)] hover:bg-white/5 font-medium',
  danger: 'bg-danger/15 text-danger border border-danger/30 font-semibold hover:bg-danger/25',
};

const SIZES = {
  sm: 'px-3.5 py-2 text-xs rounded-input',
  md: 'px-5 py-2.5 text-sm rounded-btn',
  lg: 'px-7 py-3.5 text-base rounded-btn',
};

const swap = {
  initial: { opacity: 0, y: 6, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.micro, ease: EASE } },
  exit: { opacity: 0, y: -6, scale: 0.9, transition: { duration: DUR.micro, ease: EASE } },
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  success = false,
  disabled = false,
  className = '',
  children,
  type = 'button',
  ...rest
}) {
  const inert = disabled || loading;
  return (
    <m.button
      layout
      type={type}
      disabled={inert}
      whileTap={inert ? undefined : tapPress}
      whileHover={inert ? undefined : { y: -1.5 }}
      transition={SPRING}
      className={cn(
        'relative inline-flex items-center justify-center gap-2 select-none transition-colors',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        VARIANTS[variant],
        SIZES[size],
        className
      )}
      {...rest}
    >
      <AnimatePresence mode="wait" initial={false}>
        {loading ? (
          <m.span key="loading" {...swap} className="inline-flex items-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
            <span className="text-inherit">Working…</span>
          </m.span>
        ) : success ? (
          <m.span key="success" {...swap} className="inline-flex items-center gap-2">
            <m.span
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0, transition: SPRING }}
            >
              <FiCheck className="h-4 w-4" />
            </m.span>
            Done
          </m.span>
        ) : (
          <m.span key="label" {...swap} className="inline-flex items-center gap-2">
            {children}
          </m.span>
        )}
      </AnimatePresence>
    </m.button>
  );
}
