// Live map page — full React-Leaflet map (green pulse = available, red =
// occupied, yellow = reserved), morphing search bar, status/type filter chips,
// and a Slot Details panel that FLIES IN from the clicked marker's screen
// position (transform-origin trick) rather than just appearing.
import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import { FiX, FiArrowRight, FiMapPin } from 'react-icons/fi';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import ParkingMap from '../../components/ParkingMap/ParkingMap.jsx';
import ParkingCard from '../../components/ParkingCard/ParkingCard.jsx';
import SearchBar from '../../components/SearchBar/SearchBar.jsx';
import Button from '../../components/Button/Button.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import { useParking } from '../../hooks/useParking.js';
import { SLOT_STATUS, SLOT_TYPES, CAMPUS_CENTER } from '../../utils/constants.js';
import { cn, centerOfSlots } from '../../utils/helpers.js';
import { SPRING, listItem } from '../../utils/motionPresets.js';
import SharedNavIndicator from '../../components/SharedNavIndicator/SharedNavIndicator.jsx';

const STATUS_FILTERS = [
  { value: '', label: 'All' },
  { value: 'available', label: 'Available' },
  { value: 'occupied', label: 'Occupied' },
  { value: 'reserved', label: 'Reserved' },
];

const TYPE_FILTERS = [
  { value: '', label: 'Any type' },
  { value: 'covered', label: 'Covered' },
  { value: 'open', label: 'Open' },
];

function FilterChips({ options, active, onPick, pillId }) {
  return (
    <div className="glass-panel flex w-fit items-center gap-1 rounded-btn p-1">
      {options.map((option) => {
        const isActive = active === option.value;
        return (
          <button
            key={option.value || 'all'}
            onClick={() => onPick(option.value)}
            className={cn(
              'relative z-0 rounded-input px-3.5 py-1.5 text-xs font-medium transition-colors',
              isActive ? 'text-[var(--text)]' : 'text-[var(--text-mut)] hover:text-[var(--text-sec)]'
            )}
          >
            {isActive && <SharedNavIndicator id={pillId} className="rounded-input" />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ParkingMapPage() {
  const navigate = useNavigate();
  const { slots, filters, loading, applyFilters, fetchSlots } = useParking();
  // selected = { slot, origin: {x,y} } — origin drives the panel's fly-in point.
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    fetchSlots(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- initial load only
  }, []);

  const handleMarkerClick = useCallback((slot, origin) => {
    setSelected({ slot, origin });
  }, []);

  const panelStyle = selected?.origin
    ? { transformOrigin: `${selected.origin.x}px ${selected.origin.y}px` }
    : undefined;

  return (
    <PageTransition>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-accent">
              Sri Eshwar College of Engineering, Coimbatore
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight md:text-3xl">
            Live Campus GIS Map
          </h1>
          <p className="mt-1 text-xs text-[var(--text-sec)]">
            Centered at Sri Eshwar College of Engineering (10.8267° N, 76.9942° E). Real-time slot occupancy & walking distance.
          </p>
        </div>
        <SearchBar onSearch={(term) => applyFilters({ search: term })} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <FilterChips
          options={STATUS_FILTERS}
          active={filters.status}
          onPick={(value) => applyFilters({ status: value })}
          pillId="map-status-pill"
        />
        <FilterChips
          options={TYPE_FILTERS}
          active={filters.type}
          onPick={(value) => applyFilters({ type: value })}
          pillId="map-type-pill"
        />
      </div>

      <div className="relative">
        <ParkingMap
          slots={slots}
          center={centerOfSlots(slots, CAMPUS_CENTER)}
          onMarkerClick={handleMarkerClick}
          className="h-[52vh] min-h-[380px]"
        />

        {/* slot panel flying in from the tapped marker */}
        <AnimatePresence>
          {selected && (
            <m.div
              key={selected.slot.id}
              initial={{ opacity: 0, scale: 0.25 }}
              animate={{ opacity: 1, scale: 1, transition: SPRING }}
              exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.2 } }}
              style={panelStyle}
              className="fixed inset-x-4 bottom-24 z-40 md:absolute md:inset-auto md:right-4 md:top-4 md:w-80"
            >
              <div className="glass-panel rounded-card p-5 shadow-lift">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: SLOT_STATUS[selected.slot.status]?.color }}
                      />
                      <h2 className="text-lg font-bold">{selected.slot.slot_number}</h2>
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[var(--text-sec)]">
                      <FiMapPin className="h-3 w-3" />
                      {selected.slot.zone_name}
                      {selected.slot.floor ? ` · ${selected.slot.floor}` : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelected(null)}
                    aria-label="Close"
                    className="rounded-full p-1.5 text-[var(--text-mut)] hover:bg-white/10 hover:text-[var(--text)]"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>

                <p className="mt-3 text-sm text-[var(--text-sec)]">
                  <span className={cn('mr-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase', SLOT_STATUS[selected.slot.status]?.badge)}>
                    {SLOT_STATUS[selected.slot.status]?.label}
                  </span>
                  <span className="capitalize">{selected.slot.type}</span> ·{' '}
                  <span className="text-[var(--text-sec)]">
                    {SLOT_TYPES[selected.slot.slot_type]?.icon} {SLOT_TYPES[selected.slot.slot_type]?.label ?? 'Standard'}
                  </span>
                </p>

                <div className="mt-4 flex gap-2">
                  <Button variant="glass" size="sm" className="flex-1" onClick={() => navigate(`/slots/${selected.slot.id}`)}>
                    Details <FiArrowRight className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1"
                    disabled={selected.slot.status !== 'available'}
                    onClick={() => navigate('/reserve')}
                  >
                    Reserve
                  </Button>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>

      {/* list under the map — filtered results reflow via layout animation */}
      <div className="mt-8">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--text-sec)]">
          {loading ? 'Loading slots…' : `${slots.length} slot${slots.length === 1 ? '' : 's'} shown`}
        </h2>
        {loading ? (
          <Loader variant="skeleton" lines={3} />
        ) : (
          <m.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {slots.map((slot) => (
                <m.div key={slot.id} layout variants={listItem} initial="initial" animate="animate" exit="exit">
                  <ParkingCard slot={slot} />
                </m.div>
              ))}
            </AnimatePresence>
          </m.div>
        )}
        {!loading && slots.length === 0 && (
          <p className="py-10 text-center text-sm text-[var(--text-mut)]">
            No slots match those filters — try widening them.
          </p>
        )}
      </div>
    </PageTransition>
  );
}
