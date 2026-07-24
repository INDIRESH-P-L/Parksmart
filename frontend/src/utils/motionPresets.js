// Central motion vocabulary — every animated component pulls timing/easing
// from here instead of inlining transition objects, so the whole app moves as
// one system (spec: "Figma Smart Animate" feel, nothing over 1s, never linear).

// Signature ease for tweens.
export const EASE = [0.22, 1, 0.36, 1];

// Spring for anything responding to a direct gesture (hover/tap/drag).
export const SPRING = { type: 'spring', stiffness: 320, damping: 30, mass: 0.8 };

// Duration scale (seconds) — from the spec's timing table.
export const DUR = {
  micro: 0.15, // button press, icon flip (120–180ms)
  shared: 0.35, // shared-element morphs (250–450ms)
  page: 0.6, // page transitions (500–700ms)
  large: 0.75, // list ↔ fullscreen morphs (600–900ms)
};

// Default transition installed app-wide via <MotionConfig>.
export const defaultTransition = { duration: DUR.shared, ease: EASE };

// ── page transitions ─────────────────────────────────────────────────────────
// Outgoing page gently scales down; incoming fades/slides up — never a hard cut.
export const pageVariants = {
  initial: { opacity: 0, y: 16, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.page, ease: EASE } },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.3, ease: EASE } },
};

// ── stagger system: primary object first, secondaries follow, text last ──────
export const staggerContainer = (stagger = 0.07, delay = 0) => ({
  initial: {},
  animate: { transition: { staggerChildren: stagger, delayChildren: delay } },
});

export const fadeUp = {
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.4, ease: EASE } },
};

// List items (My Bookings, Manage Slots, search results): insert/remove/sort
// animate via layout — cards reflow instead of the list re-rendering flat.
export const listItem = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: DUR.shared, ease: EASE } },
  exit: { opacity: 0, scale: 0.96, transition: { duration: 0.22, ease: EASE } },
};

// Micro-interactions for buttons/icons.
export const tapPress = { scale: 0.96 };
export const hoverLift = { y: -2, scale: 1.015 };

// Modal / bottom-sheet entrances (paired with a shared-layout morph when the
// trigger card has a matching layoutId).
export const overlayFade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25, ease: EASE } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: EASE } },
};
