// The base liquid-glass surface: blur, translucent tint, gradient hairline
// border and inner highlight (all in globals.css) + a cursor-tracked radial
// ripple. Mouse position is written to CSS vars (--mx/--my) that drive the
// ::after radial-gradient — no re-render per mousemove.
import { useRef, useCallback } from 'react';
import { cn } from '../../utils/helpers.js';

export default function GlassPanel({ children, className = '', ripple = true, ...rest }) {
  const ref = useRef(null);

  const handleMouseMove = useCallback((event) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    el.style.setProperty('--my', `${event.clientY - rect.top}px`);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={ripple ? handleMouseMove : undefined}
      className={cn('glass-panel', ripple && 'ripple-hover', className)}
      {...rest}
    >
      {children}
    </div>
  );
}
