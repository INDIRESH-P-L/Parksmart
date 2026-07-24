// My Bookings — Active / History tabs (shared tab pill), layout-animated list
// (cancellations reflow the list rather than snapping), and a confirm modal
// for cancels.
import { useEffect, useState, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import BookingCard from '../../components/BookingCard/BookingCard.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import Button from '../../components/Button/Button.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import SharedNavIndicator from '../../components/SharedNavIndicator/SharedNavIndicator.jsx';
import { useBooking } from '../../hooks/useBooking.js';
import { notifySuccess, notifyError } from '../../components/Notification/Notification.jsx';
import { cn } from '../../utils/helpers.js';
import { listItem } from '../../utils/motionPresets.js';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'history', label: 'History' },
];

const ACTIVE_STATUSES = ['pending', 'confirmed', 'active'];

export default function MyBookings() {
  const navigate = useNavigate();
  const { bookings, loading, fetchMyBookings, cancelBooking } = useBooking();
  const [tab, setTab] = useState('active');
  const [toCancel, setToCancel] = useState(null); // booking pending confirmation
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);

  const visible = useMemo(
    () =>
      bookings.filter((b) =>
        tab === 'active' ? ACTIVE_STATUSES.includes(b.status) : !ACTIVE_STATUSES.includes(b.status)
      ),
    [bookings, tab]
  );

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await cancelBooking(toCancel.id);
      notifySuccess(`Booking for ${toCancel.slot?.slot_number} cancelled`);
      setToCancel(null);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">My bookings</h1>

        {/* tab pill slides between Active and History */}
        <div className="glass-panel flex items-center gap-1 rounded-btn p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'relative z-0 rounded-input px-5 py-2 text-sm font-medium transition-colors',
                tab === t.key ? 'text-[var(--text)]' : 'text-[var(--text-mut)] hover:text-[var(--text-sec)]'
              )}
            >
              {tab === t.key && <SharedNavIndicator id="bookings-tab-pill" className="rounded-input" />}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <Loader variant="skeleton" lines={3} />
      ) : visible.length === 0 ? (
        <div className="glass-panel rounded-card p-12 text-center">
          <p className="text-sm text-[var(--text-mut)]">
            {tab === 'active' ? 'No active bookings right now.' : 'No past bookings yet.'}
          </p>
          {tab === 'active' && (
            <Button className="mt-5" onClick={() => navigate('/map')}>
              Find a spot
            </Button>
          )}
        </div>
      ) : (
        <m.div layout className="space-y-4">
          <AnimatePresence mode="popLayout">
            {visible.map((booking) => (
              <m.div key={booking.id} layout variants={listItem} initial="initial" animate="animate" exit="exit">
                <BookingCard booking={booking} onCancel={setToCancel} />
              </m.div>
            ))}
          </AnimatePresence>
        </m.div>
      )}

      {/* cancel confirmation */}
      <Modal open={Boolean(toCancel)} onClose={() => setToCancel(null)} title="Cancel booking?" className="max-w-md">
        <p className="text-sm text-[var(--text-sec)]">
          Your booking for <span className="font-semibold text-[var(--text)]">{toCancel?.slot?.slot_number}</span>{' '}
          will be released for other drivers. This can't be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setToCancel(null)}>
            Keep it
          </Button>
          <Button variant="danger" loading={cancelling} onClick={handleCancel}>
            Cancel booking
          </Button>
        </div>
      </Modal>
    </PageTransition>
  );
}
