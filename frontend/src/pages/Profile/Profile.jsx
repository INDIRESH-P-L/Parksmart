// Profile — identity card, edit form (name/phone/vehicle/password), booking
// history summary, and the Favorites section with quick-book.
import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiZap, FiTrash2 } from 'react-icons/fi';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import ProfileCard from '../../components/ProfileCard/ProfileCard.jsx';
import Card from '../../components/Card/Card.jsx';
import Button from '../../components/Button/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { useParking } from '../../hooks/useParking.js';
import { useBooking } from '../../hooks/useBooking.js';
import { validateProfile } from '../../utils/validators.js';
import { notifySuccess, notifyError } from '../../components/Notification/Notification.jsx';
import { cn } from '../../utils/helpers.js';

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const { favorites, toggleFavorite } = useParking();
  const { bookings, fetchMyBookings } = useBooking();

  const [form, setForm] = useState({
    name: user?.name ?? '',
    phone_number: user?.phone_number ?? '',
    vehicle_number: user?.vehicle_number ?? '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);

  const history = useMemo(() => {
    const completed = bookings.filter((b) => b.status === 'completed');
    const active = bookings.filter((b) => ['pending', 'confirmed', 'active'].includes(b.status));
    return { total: bookings.length, completed: completed.length, active: active.length };
  }, [bookings]);

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const handleSave = async (event) => {
    event.preventDefault();
    const fieldErrors = validateProfile(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setSaving(true);
    try {
      // Send only what changed / was filled — empty password means "keep it".
      const payload = {
        name: form.name.trim(),
        phone_number: form.phone_number.trim() || null,
        vehicle_number: form.vehicle_number.trim() || null,
        ...(form.password ? { password: form.password } : {}),
      };
      await updateProfile(payload);
      setForm((f) => ({ ...f, password: '' }));
      setSaved(true);
      setTimeout(() => setSaved(false), 1800); // let the ✓ morph play, then reset
      notifySuccess('Profile updated');
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUnstar = async (slotId) => {
    try {
      await toggleFavorite(slotId);
    } catch (err) {
      notifyError(err.message);
    }
  };

  return (
    <PageTransition>
      <h1 className="mb-6 text-2xl font-bold tracking-tight md:text-3xl">Profile</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <ProfileCard user={user} />

          <Card title="Reservation history">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-card bg-white/5 p-3">
                <p className="text-2xl font-bold">{history.total}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-mut)]">Total</p>
              </div>
              <div className="rounded-card bg-white/5 p-3">
                <p className="text-2xl font-bold text-mint-soft">{history.completed}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-mut)]">Completed</p>
              </div>
              <div className="rounded-card bg-white/5 p-3">
                <p className="text-2xl font-bold text-accent">{history.active}</p>
                <p className="text-[10px] uppercase tracking-wide text-[var(--text-mut)]">Active</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          {/* edit form */}
          <Card title="Edit profile">
            <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2" noValidate>
              <div className="sm:col-span-2">
                <label htmlFor="name" className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Full name</label>
                <input id="name" value={form.name} onChange={set('name')} className={cn('input-glass', errors.name && 'input-error')} />
                {errors.name && <p className="mt-1 text-xs text-danger">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Phone</label>
                <input id="phone" value={form.phone_number} onChange={set('phone_number')} placeholder="+91 …" className={cn('input-glass', errors.phone_number && 'input-error')} />
                {errors.phone_number && <p className="mt-1 text-xs text-danger">{errors.phone_number}</p>}
              </div>
              <div>
                <label htmlFor="vehicle" className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Vehicle number</label>
                <input id="vehicle" value={form.vehicle_number} onChange={set('vehicle_number')} placeholder="KA-01-AB-1234" className={cn('input-glass', errors.vehicle_number && 'input-error')} />
                {errors.vehicle_number && <p className="mt-1 text-xs text-danger">{errors.vehicle_number}</p>}
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="password" className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">
                  New password <span className="text-[var(--text-mut)]">(leave blank to keep current)</span>
                </label>
                <input id="password" type="password" autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="••••••••" className={cn('input-glass', errors.password && 'input-error')} />
                {errors.password && <p className="mt-1 text-xs text-danger">{errors.password}</p>}
              </div>
              <Button type="submit" loading={saving} success={saved} className="sm:col-span-2 sm:justify-self-end">
                Save changes
              </Button>
            </form>
          </Card>

          {/* favorites */}
          <Card title="Favorite slots">
            {favorites.length === 0 ? (
              <p className="py-6 text-center text-sm text-[var(--text-mut)]">
                Star slots on the map to quick-book them from here.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {favorites.map(({ id, slot }) =>
                  slot ? (
                    <div key={id} className="glass-panel flex items-center justify-between rounded-card p-4">
                      <div>
                        <p className="font-bold">{slot.slot_number}</p>
                        <p className="text-xs text-[var(--text-sec)]">
                          {slot.zone_name}
                          {slot.floor ? ` · ${slot.floor}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          size="sm"
                          disabled={slot.status !== 'available'}
                          onClick={() => navigate('/reserve')}
                        >
                          <FiZap className="h-3.5 w-3.5" /> Reserve
                        </Button>
                        <button
                          onClick={() => handleUnstar(slot.id)}
                          aria-label="Remove favorite"
                          className="rounded-full p-2 text-[var(--text-mut)] hover:bg-danger/10 hover:text-danger"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ) : null
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
