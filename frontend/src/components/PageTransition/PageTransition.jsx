// Route-level motion. Two exports:
//  - <PageTransition> — wraps a page's content in the standard enter/exit
//    variants (incoming fades/slides up, outgoing gently scales down).
//  - <AnimatedOutlet> — used by layouts: keys the current nested route into
//    AnimatePresence WITHOUT remounting the layout chrome, so the Sidebar's
//    shared nav pill keeps animating across navigations.
import { cloneElement } from 'react';
import { useLocation, useOutlet } from 'react-router-dom';
import { m, AnimatePresence, useReducedMotion } from 'framer-motion';
import { pageVariants } from '../../utils/motionPresets.js';
import { cn } from '../../utils/helpers.js';

export default function PageTransition({ children, className = '' }) {
  const reduce = useReducedMotion();
  return (
    <m.div
      variants={
        reduce
          ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } } // opacity-only for reduced motion
          : pageVariants
      }
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn('min-h-full', className)}
    >
      {children}
    </m.div>
  );
}

export function AnimatedOutlet() {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <AnimatePresence mode="wait" initial={false}>
      {outlet && cloneElement(outlet, { key: location.pathname })}
    </AnimatePresence>
  );
}
