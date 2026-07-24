// Slot card for grids/lists. Wrapped in TiltCard (3D hover) around a MorphCard
// whose layoutId (`slot-{id}`) is shared with the Slot Details hero — clicking
// through, the card EXPANDS into the detail panel instead of crossfading.
import { useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { FiStar, FiMapPin, FiArrowRight } from 'react-icons/fi';
import TiltCard from '../TiltCard/TiltCard.jsx';
import MorphCard from '../MorphCard/MorphCard.jsx';
import Button from '../Button/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useParking } from '../../hooks/useParking.js';
import { notifyError, notifySuccess } from '../Notification/Notification.jsx';
import { SLOT_STATUS, SLOT_TYPES } from '../../utils/constants.js';
import { cn } from '../../utils/helpers.js';
import { SPRING } from '../../utils/motionPresets.js';

export default function ParkingCard({ slot, layoutIdPrefix = 'slot', compact = false }) {
  const navigate = useNavigate();
  const { isAuthed } = useAuth();
  const { toggleFavorite, isFavorite } = useParking();

  const status = SLOT_STATUS[slot.status] ?? SLOT_STATUS.available;
  const slotType = SLOT_TYPES[slot.slot_type] ?? SLOT_TYPES.standard;
  const starred = isAuthed && isFavorite(slot.id);

  const handleStar = async (event) => {
    event.stopPropagation();
    try {
      const nowFav = await toggleFavorite(slot.id);
      notifySuccess(nowFav ? `${slot.slot_number} starred` : `${slot.slot_number} removed from favorites`);
    } catch (err) {
      notifyError(err.message);
    }
  };

  return (
    <TiltCard max={6}>
      <MorphCard
        layoutId={`${layoutIdPrefix}-${slot.id}`}
        className={cn('cursor-pointer rounded-card', compact ? 'p-4' : 'p-5')}
        onClick={() => navigate(`/slots/${slot.id}`)}
        whileHover={{ y: -3 }}
        transition={SPRING}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              {/* status dot + slot number are the "primary object" of the morph */}
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: status.color }} />
              <h3 className="text-lg font-bold tracking-tight">{slot.slot_number}</h3>
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-[var(--text-sec)]">
              <FiMapPin className="h-3.5 w-3.5" />
              {slot.zone_name ?? 'Campus'}
              {slot.floor ? ` · ${slot.floor}` : ''}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            {isAuthed && (
              <m.button
                whileTap={{ scale: 0.8 }}
                onClick={handleStar}
                aria-label={starred ? 'Remove from favorites' : 'Add to favorites'}
                className={cn(
                  'rounded-full p-2 transition-colors',
                  starred ? 'text-warn' : 'text-[var(--text-mut)] hover:text-warn'
                )}
              >
                <FiStar className={cn('h-4 w-4', starred && 'fill-current')} />
              </m.button>
            )}
            <span className={cn('rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide', status.badge)}>
              {status.label}
            </span>
          </div>
        </div>

        {!compact && (
          <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-sec)]">
            <span className="rounded-full bg-white/5 px-2.5 py-1">
              {slotType.icon} {slotType.label}
            </span>
            <span className="rounded-full bg-white/5 px-2.5 py-1 capitalize">{slot.type}</span>
          </div>
        )}

        {!compact && (
          <div className="mt-4 flex gap-2">
            <Button
              variant="glass"
              size="sm"
              className="flex-1"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/slots/${slot.id}`);
              }}
            >
              Details <FiArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              className="flex-1"
              disabled={slot.status !== 'available'}
              onClick={(event) => {
                event.stopPropagation();
                navigate('/reserve');
              }}
            >
              Reserve
            </Button>
          </div>
        )}
      </MorphCard>
    </TiltCard>
  );
}
