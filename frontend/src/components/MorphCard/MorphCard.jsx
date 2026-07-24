// Shared-layout morph surface — THE core primitive of the "Smart Animate"
// system. Give two MorphCards (mounted at different times) the same layoutId
// and Framer Motion treats them as one continuous object: position, size,
// radius, shadow and clipping all interpolate. Used for card→detail,
// card→modal, thumbnail→hero and the Manage Slots grid→editor morphs.
import { m } from 'framer-motion';
import { cn } from '../../utils/helpers.js';
import { DUR, EASE } from '../../utils/motionPresets.js';

export default function MorphCard({
  layoutId,
  children,
  className = '',
  glass = true,
  ...rest
}) {
  return (
    <m.div
      layoutId={layoutId}
      // layout crossfades read best with a tween in the shared-element band.
      transition={{ duration: DUR.shared, ease: EASE }}
      className={cn(glass && 'glass-panel', 'overflow-hidden', className)}
      {...rest}
    >
      {children}
    </m.div>
  );
}
