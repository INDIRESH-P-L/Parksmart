// Bus-Style Parking Slot Selection Page for Sri Eshwar College of Engineering
import { useEffect, useState, useCallback } from 'react';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import BusBookingSlotGrid from '../../components/BusBookingSlotGrid/BusBookingSlotGrid.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import Button from '../../components/Button/Button.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import * as parkingService from '../../services/parkingService.js';
import { notifySuccess, notifyError } from '../../components/Notification/Notification.jsx';
import { validateSlotForm } from '../../utils/validators.js';
import { SLOT_STATUS, SLOT_TYPES, CAMPUS_CENTER } from '../../utils/constants.js';
import { cn } from '../../utils/helpers.js';

const EMPTY_FORM = {
  slot_number: '',
  zone_name: 'Mechanical Block',
  floor: 'Ground',
  latitude: CAMPUS_CENTER[0],
  longitude: CAMPUS_CENTER[1],
  type: 'open',
  slot_type: 'standard',
  status: 'available',
  hourly_rate: 20,
  is_active: true,
};

export default function SlotSelectionPage() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const loadSlots = useCallback(() => {
    setLoading(true);
    parkingService
      .listSlots({ include_inactive: true })
      .then(({ data }) => setSlots(data.slots || []))
      .catch((err) => notifyError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadSlots();
  }, [loadSlots]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditing({ mode: 'create' });
  };

  const openEdit = (slot) => {
    setForm({
      slot_number: slot.slot_number,
      zone_name: slot.zone_name ?? '',
      floor: slot.floor ?? '',
      latitude: slot.latitude,
      longitude: slot.longitude,
      type: slot.type,
      slot_type: slot.slot_type ?? 'standard',
      status: slot.status,
      hourly_rate: slot.hourly_rate,
      is_active: slot.is_active,
    });
    setErrors({});
    setEditing({ mode: 'edit', slot });
  };

  const close = () => setEditing(null);

  const setField = (key) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const fieldErrors = validateSlotForm(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    const payload = {
      ...form,
      slot_number: form.slot_number.trim(),
      zone_name: form.zone_name.trim() || 'General Block',
      floor: form.floor.trim() || 'Ground',
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
      hourly_rate: Number(form.hourly_rate),
    };

    setSaving(true);
    try {
      if (editing.mode === 'create') {
        await parkingService.createSlot(payload);
        notifySuccess(`Slot ${payload.slot_number} created`);
      } else {
        await parkingService.updateSlot(editing.slot.id, payload);
        notifySuccess(`Slot ${payload.slot_number} updated`);
      }
      close();
      loadSlots();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-accent">
              Sri Eshwar College of Engineering, Coimbatore
            </span>
          </div>
          <h1 className="mt-1.5 text-2xl font-bold tracking-tight md:text-3xl">
            Parking Slot Selection (Bus Deck View)
          </h1>
          <p className="mt-1 text-sm text-[var(--text-sec)]">
            Select, view, and manage parking slots using the bus-style interactive deck layout.
          </p>
        </div>
      </div>

      {loading ? (
        <Loader variant="skeleton" lines={4} />
      ) : (
        <BusBookingSlotGrid
          slots={slots}
          onSlotUpdate={loadSlots}
          onOpenCreate={openCreate}
          onOpenEdit={openEdit}
        />
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={Boolean(editing)}
        onClose={close}
        title={editing?.mode === 'create' ? 'Add Parking Slot to SECE Deck' : `Edit ${editing?.slot?.slot_number ?? ''}`}
        className="max-w-xl"
      >
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">
              Slot number (e.g. SE-M05)
            </label>
            <input
              value={form.slot_number}
              onChange={setField('slot_number')}
              placeholder="SE-M05"
              className={cn('input-glass', errors.slot_number && 'input-error')}
            />
            {errors.slot_number && <p className="mt-1 text-xs text-danger">{errors.slot_number}</p>}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Zone / Block</label>
            <select value={form.zone_name} onChange={setField('zone_name')} className="input-glass">
              <option value="Mechanical Block">Mechanical Block</option>
              <option value="CSE & IT Block">CSE & IT Block</option>
              <option value="Admin & Library Block">Admin & Library Block</option>
              <option value="Auditorium Block">Auditorium Block</option>
              <option value="Sports Complex">Sports Complex</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Floor</label>
            <input
              value={form.floor}
              onChange={setField('floor')}
              placeholder="Ground / P1 / P2"
              className="input-glass"
            />
          </div>



          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Latitude</label>
            <input
              type="number"
              step="any"
              value={form.latitude}
              onChange={setField('latitude')}
              className={cn('input-glass', errors.latitude && 'input-error')}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Longitude</label>
            <input
              type="number"
              step="any"
              value={form.longitude}
              onChange={setField('longitude')}
              className={cn('input-glass', errors.longitude && 'input-error')}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Cover</label>
            <select value={form.type} onChange={setField('type')} className="input-glass">
              <option value="open">Open Air</option>
              <option value="covered">Covered</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Category</label>
            <select value={form.slot_type} onChange={setField('slot_type')} className="input-glass">
              {Object.entries(SLOT_TYPES).map(([val, meta]) => (
                <option key={val} value={val}>{meta.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Initial Status</label>
            <select value={form.status} onChange={setField('status')} className="input-glass">
              {Object.entries(SLOT_STATUS).map(([val, meta]) => (
                <option key={val} value={val}>{meta.label}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2.5 self-end pb-2 text-sm text-[var(--text-sec)]">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={setField('is_active')}
              className="h-4 w-4 accent-[#D7FF1F]"
            />
            Active Slot
          </label>

          <div className="mt-2 flex items-center justify-end gap-3 sm:col-span-2">
            <Button variant="ghost" onClick={close}>Cancel</Button>
            <Button type="submit" loading={saving}>
              {editing?.mode === 'create' ? 'Create Slot' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
}
