// Slot Details — the ParkingCard's MorphCard (`slot-{id}`) expands into this
// hero panel (shared-layout, not a crossfade). Includes live status, walking
// distance from the user's geolocation (haversine — no paid API), a mini map,
// and — when the user already holds a booking here — the QR ticket rendered
// inside a MorphCard glass panel.
import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import { FiMapPin, FiStar, FiNavigation, FiClock, FiArrowLeft } from 'react-icons/fi';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import MorphCard from '../../components/MorphCard/MorphCard.jsx';
import ParkingMap from '../../components/ParkingMap/ParkingMap.jsx';
import Button from '../../components/Button/Button.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import GlassPanel from '../../components/GlassPanel/GlassPanel.jsx';
import { useParking } from '../../hooks/useParking.js';
import { useAuth } from '../../hooks/useAuth.js';
import * as parkingService from '../../services/parkingService.js';
import * as bookingService from '../../services/bookingService.js';
import { notifyError, notifySuccess } from '../../components/Notification/Notification.jsx';
import { SLOT_STATUS, SLOT_TYPES } from '../../utils/constants.js';
import { cn, walkingEstimate } from '../../utils/helpers.js';
import { formatDateTime } from '../../utils/formatDate.js';

export default function SlotDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthed } = useAuth();
  const { toggleFavorite, isFavorite } = useParking();

  const [slot, setSlot] = useState(null);
  const [error, setError] = useState('');
  const [walk, setWalk] = useState(null); // { distance, minutes }
  const [locating, setLocating] = useState(false);
  const [myBooking, setMyBooking] = useState(null); // user's open booking on this slot

  useEffect(() => {
    parkingService
      .getSlot(id)
      .then(({ data }) => setSlot(data.slot))
      .catch((err) => setError(err.message));

    // Does the user already hold a ticket for this slot?
    bookingService
      .myBookings()
      .then(({ data }) => {
        const open = data.bookings.find(
          (b) => b.slot_id === id && ['confirmed', 'active'].includes(b.status)
        );
        setMyBooking(open ?? null);
      })
      .catch(() => {}); // ticket panel is optional decoration on this page
  }, [id]);

  const locate = useCallback(() => {
    if (!navigator.geolocation || !slot) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setWalk(
          walkingEstimate(
            position.coords.latitude,
            position.coords.longitude,
            slot.latitude,
            slot.longitude
          )
        );
        setLocating(false);
      },
      () => {
        notifyError('Could not read your location — check browser permissions.');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, [slot]);

  const handleStar = async () => {
    try {
      const nowFav = await toggleFavorite(slot.id);
      notifySuccess(nowFav ? 'Added to favorites' : 'Removed from favorites');
    } catch (err) {
      notifyError(err.message);
    }
  };

  if (error) {
    return (
      <PageTransition>
        <GlassPanel className="rounded-card p-10 text-center">
          <p className="text-sm text-danger">{error}</p>
          <Button variant="glass" className="mt-5" onClick={() => navigate('/map')}>
            Back to map
          </Button>
        </GlassPanel>
      </PageTransition>
    );
  }

  if (!slot) return <Loader variant="page" label="Loading slot…" />;

  const status = SLOT_STATUS[slot.status] ?? SLOT_STATUS.available;
  const slotType = SLOT_TYPES[slot.slot_type] ?? SLOT_TYPES.standard;
  const starred = isAuthed && isFavorite(slot.id);

  return (
    <PageTransition>
      <button
        onClick={() => navigate(-1)}
        className="mb-4 flex items-center gap-1.5 text-sm text-[var(--text-sec)] hover:text-[var(--text)]"
      >
        <FiArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* hero — the same layout object as the grid card */}
        <MorphCard layoutId={`slot-${slot.id}`} className="rounded-sheet p-6 md:p-8 lg:col-span-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ background: status.color }} />
                <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{slot.slot_number}</h1>
                <span className={cn('rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide', status.badge)}>
                  {status.label}
                </span>
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--text-sec)]">
                <FiMapPin className="h-4 w-4" />
                {slot.zone_name ?? 'Campus'}
                {slot.floor ? ` · Floor ${slot.floor}` : ''}
              </p>
            </div>
            {isAuthed && (
              <m.button
                whileTap={{ scale: 0.8 }}
                onClick={handleStar}
                aria-label={starred ? 'Remove favorite' : 'Add favorite'}
                className={cn('rounded-full p-2.5', starred ? 'bg-warn/15 text-warn' : 'bg-white/5 text-[var(--text-mut)] hover:text-warn')}
              >
                <FiStar className={cn('h-5 w-5', starred && 'fill-current')} />
              </m.button>
            )}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-card bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-mut)]">Status</p>
              <p className="mt-1 text-xl font-bold" style={{ color: status.color }}>
                {status.label}
              </p>
            </div>
            <div className="rounded-card bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-mut)]">Type</p>
              <p className="mt-1 text-xl font-bold capitalize">{slot.type}</p>
            </div>
            <div className="rounded-card bg-white/5 p-4">
              <p className="text-[11px] uppercase tracking-wide text-[var(--text-mut)]">Category</p>
              <p className="mt-1 text-xl font-bold">{slotType.icon} {slotType.label}</p>
            </div>
          </div>

          {/* walking distance */}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Button variant="glass" size="sm" onClick={locate} loading={locating}>
              <FiNavigation className="h-3.5 w-3.5" /> Walking distance from me
            </Button>
            {walk && (
              <m.p
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-[var(--text-sec)]"
              >
                <span className="font-semibold text-mint-soft">{walk.distance}</span> away ·{' '}
                <FiClock className="mb-0.5 inline h-3.5 w-3.5" /> ~{walk.minutes} min walk
              </m.p>
            )}
          </div>

          <Button
            size="lg"
            className="mt-7 w-full"
            disabled={slot.status !== 'available'}
            onClick={() => navigate('/reserve')}
          >
            {slot.status === 'available' ? 'Reserve this slot' : `Currently ${status.label.toLowerCase()}`}
          </Button>
        </MorphCard>

        <div className="space-y-6 lg:col-span-2">
          {/* the user's live ticket for this slot, if any */}
          {myBooking && (
            <MorphCard layoutId={`ticket-${myBooking.id}`} className="rounded-card p-5 text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-mut)]">
                Your ticket
              </p>
              <div className="mx-auto mt-3 w-fit rounded-2xl bg-white p-2.5">
                <img src={myBooking.qr_code_url} alt="Your QR ticket" className="h-40 w-40" />
              </div>
              <p className="mt-3 text-xs text-[var(--text-sec)]">
                {formatDateTime(myBooking.start_time)} → {formatDateTime(myBooking.end_time)}
              </p>
              <p className="mt-1 text-[11px] text-[var(--text-mut)]">Scan at the gate to check in/out.</p>
            </MorphCard>
          )}

          <ParkingMap
            slots={[slot]}
            center={[slot.latitude, slot.longitude]}
            zoom={18}
            className="h-72"
          />
        </div>
      </div>
    </PageTransition>
  );
}
