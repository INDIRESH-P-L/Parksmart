// Modal built for shared-layout morphs: pass the layoutId of the triggering
// card and the card visually EXPANDS into this dialog (closing reverses the
// same morph). Without a layoutId it falls back to a scale/fade entrance.
// Esc and backdrop-click close; body scroll locks while open.
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { m, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import MorphCard from '../MorphCard/MorphCard.jsx';
import { overlayFade, DUR, EASE } from '../../utils/motionPresets.js';
import { cn } from '../../utils/helpers.js';

export default function Modal({ open, onClose, layoutId, title, children, className = '' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  const content = (
    <>
      {(title || onClose) && (
        <div className="mb-4 flex items-center justify-between gap-4">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {onClose && (
            <m.button
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              aria-label="Close dialog"
              className="rounded-full p-2 text-[var(--text-sec)] hover:bg-white/10 hover:text-[var(--text)]"
            >
              <FiX className="h-5 w-5" />
            </m.button>
          )}
        </div>
      )}
      {children}
    </>
  );

  return createPortal(
    <AnimatePresence>
      {open && (
        <m.div
          className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
          variants={overlayFade}
          initial="initial"
          animate="animate"
          exit="exit"
          onClick={onClose}
          role="dialog"
          aria-modal="true"
        >
          {layoutId ? (
            <MorphCard
              layoutId={layoutId}
              className={cn('w-full max-w-lg rounded-sheet p-6', className)}
              onClick={(event) => event.stopPropagation()}
            >
              {content}
            </MorphCard>
          ) : (
            <m.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: DUR.shared, ease: EASE } }}
              exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.2, ease: EASE } }}
              className={cn('glass-panel w-full max-w-lg rounded-sheet p-6', className)}
              onClick={(event) => event.stopPropagation()}
            >
              {content}
            </m.div>
          )}
        </m.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
