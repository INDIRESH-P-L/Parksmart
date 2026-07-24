// Reserve — the campus slot-reservation flow (RedBus-style interaction, ParkSmart
// look). Vehicle type → zone → live slot layout → confirm dialog → a held
// reservation with an auto-cancelling countdown. No pricing anywhere: campus
// parking is free, this is purely an availability hold.
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { m, AnimatePresence } from 'framer-motion';
import {
  FiChevronLeft,
  FiArrowRight,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiCalendar,
} from 'react-icons/fi';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import GlassPanel from '../../components/GlassPanel/GlassPanel.jsx';
import TiltCard from '../../components/TiltCard/TiltCard.jsx';
import Button from '../../components/Button/Button.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import SlotGrid from '../../components/SlotGrid/SlotGrid.jsx';
import ReservationTimer from '../../components/ReservationTimer/ReservationTimer.jsx';
import SharedNavIndicator from '../../components/SharedNavIndicator/SharedNavIndicator.jsx';
import { useParking } from '../../hooks/useParking.js';
import { useReservation } from '../../hooks/useReservation.js';
import { notifyError } from '../../components/Notification/Notification.jsx';
import { VEHICLE_TYPES, getVehicleType, PURPOSES, zoneIcon, HOLD_MINUTES } from '../../utils/campus.js';
import { toLocalInputValue, formatDateTime } from '../../utils/formatDate.js';
import { staggerContainer, fadeUp, listItem, SPRING } from '../../utils/motionPresets.js';
import { cn } from '../../utils/helpers.js';

const STEPS = ['Vehicle', 'Zone', 'Slot'];

export default function Reserve() {
  const navigate = useNavigate();
  const { slots, availability, loading, fetchSlots, fetchAvailability } = useParking();
  const { hasReservation, reservation, startReservation, releaseReservation } = useReservation();

  const [step, setStep] = useState(1);
  const [vehicleKey, setVehicleKey] = useState(null);
  const [zone, setZone] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const [form, setForm] = useState({
    vehicleNumber: '',
    arrival: toLocalInputValue(new Date(Date.now() + 10 * 60 * 1000)),
    purpose: 'Student',
  });
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchSlots({});
    fetchAvailability();
  }, [fetchSlots, fetchAvailability]);

  const zones = availability?.zones ?? [];
  const recommendedType = vehicleKey ? getVehicleType(vehicleKey).slotType : null;

  const zoneSlots = useMemo(
    () =>
      slots
        .filter((s) => (s.zone_name ?? 'Campus') === zone)
        .sort((a, b) => a.slot_number.localeCompare(b.slot_number, undefined, { numeric: true })),
    [slots, zone]
  );

  const setField = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const handleConfirm = async () => {
    if (!form.vehicleNumber.trim() || form.vehicleNumber.trim().length < 3) {
      setFormError('Enter your vehicle number');
      return;
    }
    if (!form.arrival) {
      setFormError('Pick your estimated arrival time');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await startReservation({
        slot: selectedSlot,
        vehicleType: vehicleKey,
        vehicleNumber: form.vehicleNumber.trim().toUpperCase(),
        purpose: form.purpose,
        arrival: form.arrival,
      });
      setConfirmOpen(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRelease = async () => {
    setReleasing(true);
    try {
      await releaseReservation({});
      // reset the picker for a fresh reservation
      setStep(1);
      setVehicleKey(null);
      setZone(null);
      setSelectedSlot(null);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setReleasing(false);
    }
  };

  // ── active reservation view ─────────────────────────────────────────────────
  if (hasReservation && reservation) {
    const v = getVehicleType(reservation.vehicleType);
    return (
      <PageTransition>
        <ReservedView
          reservation={reservation}
          vehicle={v}
          releasing={releasing}
          onRelease={handleRelease}
          onBookings={() => navigate('/my-bookings')}
        />
      </PageTransition>
    );
  }

  // ── reservation flow ────────────────────────────────────────────────────────
  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Reserve a parking slot</h1>
        <p className="mt-1 text-sm text-[var(--text-sec)]">
          Hold a slot before you reach campus — free, and yours for {HOLD_MINUTES} minutes.
        </p>
      </div>

      {/* stepper */}
      <div className="mb-6 flex w-fit items-center gap-1 rounded-btn glass-panel p-1">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const reached = n <= step;
          const done =
            (n === 1 && vehicleKey) || (n === 2 && zone) || (n === 3 && selectedSlot);
          return (
            <button
              key={label}
              onClick={() => reached && setStep(n)}
              disabled={!reached}
              className={cn(
                'relative z-0 flex items-center gap-2 rounded-input px-3.5 py-1.5 text-xs font-medium transition-colors',
                step === n ? 'text-[var(--text)]' : 'text-[var(--text-mut)] hover:text-[var(--text-sec)]'
              )}
            >
              {step === n && <SharedNavIndicator id="reserve-step-pill" className="rounded-input" />}
              <span
                className={cn(
                  'grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold',
                  done ? 'bg-accent text-ink' : step === n ? 'bg-white/15' : 'bg-white/5'
                )}
              >
                {n}
              </span>
              {label}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1 — vehicle type */}
        {step === 1 && (
          <m.div key="step1" variants={fadeUp} initial="initial" animate="animate" exit={{ opacity: 0, y: -10 }}>
            <SectionTitle>What are you parking?</SectionTitle>
            <m.div
              variants={staggerContainer(0.06)}
              initial="initial"
              animate="animate"
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5"
            >
              {VEHICLE_TYPES.map((v) => (
                <m.button
                  key={v.key}
                  variants={listItem}
                  whileHover={{ y: -4 }}
                  whileTap={{ scale: 0.97 }}
                  transition={SPRING}
                  onClick={() => {
                    setVehicleKey(v.key);
                    setStep(2);
                  }}
                  className={cn(
                    'glass-panel ripple-hover flex flex-col items-center gap-2 rounded-card p-5 text-center',
                    vehicleKey === v.key && 'ring-2 ring-accent shadow-glow-accent'
                  )}
                >
                  <span className="text-3xl">{v.icon}</span>
                  <span className="text-sm font-semibold">{v.label}</span>
                </m.button>
              ))}
            </m.div>
          </m.div>
        )}

        {/* STEP 2 — zone */}
        {step === 2 && (
          <m.div key="step2" variants={fadeUp} initial="initial" animate="animate" exit={{ opacity: 0, y: -10 }}>
            <BackRow onBack={() => setStep(1)} label={`Vehicle: ${getVehicleType(vehicleKey).label}`} />
            <SectionTitle>Which zone?</SectionTitle>
            {loading && zones.length === 0 ? (
              <Loader variant="skeleton" lines={3} />
            ) : (
              <m.div
                variants={staggerContainer(0.06)}
                initial="initial"
                animate="animate"
                className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              >
                {zones.map((z) => (
                  <m.button
                    key={z.zone}
                    variants={listItem}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    transition={SPRING}
                    onClick={() => {
                      setZone(z.zone);
                      setSelectedSlot(null);
                      setStep(3);
                    }}
                    className={cn(
                      'glass-panel ripple-hover flex items-center justify-between gap-3 rounded-card p-5 text-left',
                      zone === z.zone && 'ring-2 ring-accent'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/5 text-2xl">
                        {zoneIcon(z.zone)}
                      </span>
                      <div>
                        <p className="font-semibold">{z.zone}</p>
                        <p className="text-xs text-[var(--text-sec)]">
                          <span className="font-semibold text-lime">{z.available}</span> of {z.total} free
                        </p>
                      </div>
                    </div>
                    <FiArrowRight className="h-4 w-4 text-[var(--text-mut)]" />
                  </m.button>
                ))}
              </m.div>
            )}
          </m.div>
        )}

        {/* STEP 3 — slot layout */}
        {step === 3 && (
          <m.div key="step3" variants={fadeUp} initial="initial" animate="animate" exit={{ opacity: 0, y: -10 }}>
            <BackRow onBack={() => setStep(2)} label={`${zoneIcon(zone)} ${zone}`} />
            <SectionTitle>Pick your slot</SectionTitle>

            <GlassPanel className="rounded-card p-5 md:p-6">
              {loading && zoneSlots.length === 0 ? (
                <Loader variant="page" label="Loading layout…" />
              ) : zoneSlots.length === 0 ? (
                <p className="py-10 text-center text-sm text-[var(--text-mut)]">
                  No slots in this zone yet.
                </p>
              ) : (
                <SlotGrid
                  slots={zoneSlots}
                  selectedId={selectedSlot?.id}
                  onSelect={setSelectedSlot}
                  recommendedType={recommendedType}
                />
              )}
            </GlassPanel>

            {/* action bar */}
            <AnimatePresence>
              {selectedSlot && (
                <m.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0, transition: SPRING }}
                  exit={{ opacity: 0, y: 16 }}
                  className="mt-4"
                >
                  <GlassPanel className="flex flex-wrap items-center justify-between gap-3 rounded-card p-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent/15 text-lg font-bold text-accent">
                        {selectedSlot.slot_number}
                      </span>
                      <div>
                        <p className="text-sm font-semibold">Slot {selectedSlot.slot_number}</p>
                        <p className="text-xs text-[var(--text-sec)]">
                          <FiMapPin className="mr-0.5 inline h-3 w-3" />
                          {zone}
                          {selectedSlot.floor ? ` · ${selectedSlot.floor}` : ''}
                        </p>
                      </div>
                    </div>
                    <Button onClick={() => setConfirmOpen(true)}>
                      Continue <FiArrowRight className="h-4 w-4" />
                    </Button>
                  </GlassPanel>
                </m.div>
              )}
            </AnimatePresence>
          </m.div>
        )}
      </AnimatePresence>

      {/* confirmation dialog */}
      <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title="Confirm reservation" className="max-w-md">
        {selectedSlot && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-card bg-white/5 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-accent/15 text-lg font-bold text-accent">
                {selectedSlot.slot_number}
              </span>
              <div>
                <p className="text-sm font-semibold">
                  {getVehicleType(vehicleKey).icon} {getVehicleType(vehicleKey).label}
                </p>
                <p className="text-xs text-[var(--text-sec)]">{zone}</p>
              </div>
            </div>

            <div>
              <label htmlFor="vehno" className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">
                Vehicle number
              </label>
              <input
                id="vehno"
                value={form.vehicleNumber}
                onChange={setField('vehicleNumber')}
                placeholder="KA-01-AB-1234"
                className={cn('input-glass uppercase', formError && !form.vehicleNumber && 'input-error')}
              />
            </div>

            <div>
              <label htmlFor="arrival" className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-sec)]">
                <FiCalendar className="h-3.5 w-3.5" /> Estimated arrival
              </label>
              <input
                id="arrival"
                type="datetime-local"
                value={form.arrival}
                onChange={setField('arrival')}
                className="input-glass"
              />
            </div>

            <div>
              <p className="mb-1.5 text-xs font-medium text-[var(--text-sec)]">Purpose</p>
              <div className="flex gap-2">
                {PURPOSES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, purpose: p }))}
                    className={cn(
                      'flex-1 rounded-input border px-3 py-2 text-sm transition-colors',
                      form.purpose === p
                        ? 'border-accent bg-accent/15 font-semibold text-accent'
                        : 'border-edge text-[var(--text-sec)] hover:text-[var(--text)]'
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {formError && (
              <p className="rounded-input bg-danger/10 px-4 py-2.5 text-sm text-danger">{formError}</p>
            )}

            <p className="flex items-center gap-1.5 text-[11px] text-[var(--text-mut)]">
              <FiClock className="h-3.5 w-3.5" />
              Held for {HOLD_MINUTES} minutes — it auto-cancels if you don't arrive in time.
            </p>

            <div className="flex justify-end gap-3 pt-1">
              <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
                Cancel
              </Button>
              <Button loading={submitting} onClick={handleConfirm}>
                Confirm reservation
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PageTransition>
  );
}

// ── small helpers ─────────────────────────────────────────────────────────────
function SectionTitle({ children }) {
  return (
    <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-[var(--text-sec)]">{children}</h2>
  );
}

function BackRow({ onBack, label }) {
  return (
    <button
      onClick={onBack}
      className="mb-4 flex items-center gap-1.5 text-sm text-[var(--text-sec)] hover:text-[var(--text)]"
    >
      <FiChevronLeft className="h-4 w-4" />
      <span className="rounded-full bg-white/5 px-3 py-1 text-xs">{label}</span>
      <span className="text-xs text-[var(--text-mut)]">· change</span>
    </button>
  );
}

function ReservedView({ reservation, vehicle, releasing, onRelease, onBookings }) {
  const slot = reservation.slot;
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-2 text-lime">
        <FiCheckCircle className="h-5 w-5" />
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] md:text-3xl">Slot reserved</h1>
      </div>

      <GlassPanel className="rounded-sheet p-6 md:p-8">
        <div className="grid gap-8 sm:grid-cols-[auto,1fr] sm:items-center">
          <div className="flex flex-col items-center gap-4">
            <ReservationTimer variant="ring" />
            {reservation.qrCodeUrl && (
              <div className="w-fit rounded-2xl bg-white p-2.5">
                <img src={reservation.qrCodeUrl} alt="Reservation QR ticket" className="h-32 w-32" />
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent/15 text-xl font-bold text-accent">
                {slot.slot_number}
              </span>
              <div>
                <p className="text-lg font-bold">Slot {slot.slot_number}</p>
                <p className="text-xs text-[var(--text-sec)]">
                  <FiMapPin className="mr-0.5 inline h-3 w-3" />
                  {slot.zone_name ?? 'Campus'}
                  {slot.floor ? ` · ${slot.floor}` : ''}
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-2 text-sm">
              <Row label="Vehicle" value={`${vehicle.icon} ${vehicle.label}`} />
              <Row label="Vehicle no." value={reservation.vehicleNumber} />
              <Row label="Purpose" value={reservation.purpose} />
              <Row label="Arrival by" value={formatDateTime(reservation.arrival)} />
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="glass" onClick={onBookings}>
                My reservations
              </Button>
              <Button variant="danger" loading={releasing} onClick={onRelease}>
                <FiXCircle className="h-4 w-4" /> Release slot
              </Button>
            </div>
          </div>
        </div>
      </GlassPanel>

      <p className="mt-4 text-center text-xs text-[var(--text-mut)]">
        Show the QR at the gate to check in. If the timer runs out, the slot is released automatically.
      </p>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between gap-4 rounded-input bg-white/5 px-4 py-2.5">
      <dt className="text-[var(--text-mut)]">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
