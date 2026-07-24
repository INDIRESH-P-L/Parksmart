// Dark/light switch — the sun/moon icon morphs (rotate + scale) rather than
// swapping instantly. Dark is the primary theme; light is the optional glass
// variant.
import { m, AnimatePresence } from 'framer-motion';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTheme } from '../../context/ThemeContext.jsx';
import { SPRING } from '../../utils/motionPresets.js';

export default function ThemeToggle({ className = '' }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <m.button
      whileTap={{ scale: 0.88 }}
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`rounded-full p-2.5 text-[var(--text-sec)] hover:bg-white/10 hover:text-[var(--text)] ${className}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <m.span
          key={isDark ? 'moon' : 'sun'}
          initial={{ rotate: -90, scale: 0, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1, transition: SPRING }}
          exit={{ rotate: 90, scale: 0, opacity: 0, transition: { duration: 0.15 } }}
          className="block"
        >
          {isDark ? <FiMoon className="h-[18px] w-[18px]" /> : <FiSun className="h-[18px] w-[18px]" />}
        </m.span>
      </AnimatePresence>
    </m.button>
  );
}
