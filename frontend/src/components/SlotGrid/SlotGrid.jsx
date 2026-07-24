// Parking-layout grid — the RedBus-style seat picker, campus edition.
// Each slot is a box coloured by state (available/occupied/reserved/selected/
// disabled); only available slots are clickable and exactly one can be picked.
// Hover/tap use the app's spring vocabulary; every cell is keyboard-operable
// (Enter/Space) with an aria-label describing the slot and its state.
import { m } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';
import { cn } from '../../utils/helpers.js';
import { SPRING, tapPress, listItem } from '../../utils/motionPresets.js';
import { SLOT_CELL, cellStateOf } from '../../utils/campus.js';

function SlotCell({ slot, state, recommended, onSelect }) {
  const meta = SLOT_CELL[state];
  const clickable = meta.selectable;

  return (
    <m.button
      type="button"
      variants={listItem}
      whileHover={clickable ? { y: -2, scale: 1.05 } : undefined}
      whileTap={clickable ? tapPress : undefined}
      transition={SPRING}
      disabled={!clickable}
      aria-pressed={state === 'selected'}
      aria-label={`Slot ${slot.slot_number}, ${meta.label}${recommended ? ', recommended for your vehicle' : ''}`}
      onClick={() => clickable && onSelect(slot)}
      className={cn(
        'relative flex aspect-square min-h-[52px] flex-col items-center justify-center rounded-input border text-sm font-bold transition-colors',
        meta.cell,
        clickable ? 'cursor-pointer' : ''
      )}
    >
      {state === 'selected' && (
        <span className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-accent text-ink">
          <FiCheck className="h-3 w-3" />
        </span>
      )}
      {recommended && state === 'available' && (
        <span className="absolute -right-1 -top-1 text-[10px]" aria-hidden="true">
          ★
        </span>
      )}
      <span>{slot.slot_number}</span>
    </m.button>
  );
}

export default function SlotGrid({ slots = [], selectedId, onSelect, recommendedType }) {
  return (
    <div>
      {/* entrance marker — a subtle cue this layout faces a driveway (RedBus screen vibe) */}
      <div className="mb-4 flex items-center justify-center">
        <span className="rounded-full bg-white/5 px-4 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-mut)]">
          ⟵ Driveway / Entry
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2.5 sm:grid-cols-6 lg:grid-cols-8">
        {slots.map((slot) => (
          <SlotCell
            key={slot.id}
            slot={slot}
            state={cellStateOf(slot, selectedId)}
            recommended={recommendedType && slot.slot_type === recommendedType}
            onSelect={onSelect}
          />
        ))}
      </div>

      {/* legend */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
        {['available', 'reserved', 'occupied', 'selected', 'disabled'].map((key) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-[var(--text-sec)]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: SLOT_CELL[key].dot }} />
            {SLOT_CELL[key].label}
          </span>
        ))}
      </div>
    </div>
  );
}
