// Loading states: 'spinner' (inline ring), 'page' (centred, labelled) and
// 'skeleton' (pulsing glass lines for list/detail placeholders).
import { cn } from '../../utils/helpers.js';

function Ring({ className = '' }) {
  return (
    <span
      className={cn(
        'inline-block h-6 w-6 rounded-full border-2 border-accent border-t-transparent animate-spin',
        className
      )}
      role="status"
      aria-label="Loading"
    />
  );
}

export default function Loader({ variant = 'spinner', lines = 3, label = 'Loading…', className = '' }) {
  if (variant === 'skeleton') {
    return (
      <div className={cn('space-y-3', className)} aria-busy="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="glass-panel h-14 animate-pulse rounded-card"
            style={{ opacity: 1 - i * 0.15 }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'page') {
    return (
      <div className={cn('flex min-h-[40vh] flex-col items-center justify-center gap-4', className)}>
        <Ring className="h-9 w-9" />
        <p className="text-sm text-[var(--text-sec)]">{label}</p>
      </div>
    );
  }

  return <Ring className={className} />;
}
