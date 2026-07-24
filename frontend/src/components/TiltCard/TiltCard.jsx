// 3D tilt-on-hover wrapper. Cursor position relative to the card centre drives
// rotateX/rotateY through springs (useMotionValue + useSpring), giving the
// "flying widget" depth from the spec. Fully disabled for reduced-motion users.
import { m, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { cn } from '../../utils/helpers.js';
import { SPRING } from '../../utils/motionPresets.js';

export default function TiltCard({ children, className = '', max = 8, ...rest }) {
  const reduce = useReducedMotion();
  const rotateX = useMotionValue(0);
  const rotateY = useMotionValue(0);
  const springX = useSpring(rotateX, { stiffness: SPRING.stiffness, damping: SPRING.damping, mass: SPRING.mass });
  const springY = useSpring(rotateY, { stiffness: SPRING.stiffness, damping: SPRING.damping, mass: SPRING.mass });

  const handleMouseMove = (event) => {
    if (reduce) return;
    const rect = event.currentTarget.getBoundingClientRect();
    // -0.5 … 0.5 across the card, mapped to ±max degrees.
    const px = (event.clientX - rect.left) / rect.width - 0.5;
    const py = (event.clientY - rect.top) / rect.height - 0.5;
    rotateY.set(px * max * 2);
    rotateX.set(-py * max * 2);
  };

  const reset = () => {
    rotateX.set(0);
    rotateY.set(0);
  };

  return (
    <m.div
      onMouseMove={handleMouseMove}
      onMouseLeave={reset}
      style={reduce ? undefined : { rotateX: springX, rotateY: springY, transformPerspective: 900 }}
      className={cn('will-change-transform', className)}
      {...rest}
    >
      {children}
    </m.div>
  );
}
