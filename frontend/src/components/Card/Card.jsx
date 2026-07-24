// Standard content card: glass surface + consistent padding and an optional
// title/action header row. Purely structural — motion comes from wrappers
// (TiltCard / MorphCard) when a use-case needs it.
import GlassPanel from '../GlassPanel/GlassPanel.jsx';
import { cn } from '../../utils/helpers.js';

export default function Card({ title, action, children, className = '', bodyClassName = '', ...rest }) {
  return (
    <GlassPanel className={cn('rounded-card p-5 md:p-6', className)} {...rest}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          {title && <h3 className="text-sm font-semibold tracking-wide text-[var(--text-sec)] uppercase">{title}</h3>}
          {action}
        </div>
      )}
      <div className={bodyClassName}>{children}</div>
    </GlassPanel>
  );
}
