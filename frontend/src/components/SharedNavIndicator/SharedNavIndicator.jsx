// The shared "active pill" that slides between nav items. Rendered inside the
// ACTIVE item only; because every instance shares one layoutId (per nav
// group), Framer Motion animates it from the old item to the new one on route
// change instead of blinking.
import { m } from 'framer-motion';
import { cn } from '../../utils/helpers.js';
import { SPRING } from '../../utils/motionPresets.js';

export default function SharedNavIndicator({ id = 'nav-pill', className = '' }) {
  return (
    <m.span
      layoutId={id}
      transition={SPRING}
      className={cn(
        'absolute inset-0 -z-10 rounded-btn bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]',
        className
      )}
    />
  );
}
