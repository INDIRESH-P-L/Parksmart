// Manage Slots — the live Slot Manager grid. Each cell is a MorphCard with
// layoutId `slot-cell-{id}`; clicking it EXPANDS the cell in place into the
// edit modal (the flagship shared-layout morph from the spec). The "+" cell
// morphs the same way into the create form. Status toggle + delete included.
import { useEffect, useState, useCallback } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { FiPlus, FiTrash2, FiMapPin } from 'react-icons/fi';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import MorphCard from '../../components/MorphCard/MorphCard.jsx';
import Modal from '../../components/Modal/Modal.jsx';
import Button from '../../components/Button/Button.jsx';
import Loader from '../../components/Loader/Loader.jsx';
import * as parkingService from '../../services/parkingService.js';
import { notifySuccess, notifyError } from '../../components/Notification/Notification.jsx';
import { validateSlotForm } from '../../utils/validators.js';
import { SLOT_STATUS, SLOT_TYPES, CAMPUS_CENTER } from '../../utils/constants.js';
import { cn, formatCurrency } from '../../utils/helpers.js';
import { listItem } from '../../utils/motionPresets.js';

const EMPTY_FORM = {
  slot_number: '',
  zone_name: '',
  floor: '',
  latitude: CAMPUS_CENTER[0],
  longitude: CAMPUS_CENTER[1],
  type: 'open',
  slot_type: 'standard',
  status: 'available',
  hourly_rate: 20,
  is_active: true,
};

export default function ManageSlots() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  // editing: { mode: 'create' } | { mode: 'edit', slot } — drives the modal morph.
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    parkingService
      .listSlots({ include_inactive: true })
      .then(({ data }) => setSlots(data.slots))
      .catch((err) => notifyError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setErrors({});
    setConfirmDelete(false);
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
    setConfirmDelete(false);
    setEditing({ mode: 'edit', slot });
  };

  const close = () => setEditing(null);
  const set = (key) => (event) => {
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
      zone_name: form.zone_name.trim() || null,
      floor: form.floor.trim() || null,
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
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      const { message } = await parkingService.deleteSlot(editing.slot.id);
      notifySuccess(message);
      close();
      load();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // Quick status flip straight from the grid (no modal round-trip).
  const cycleStatus = async (slot, event) => {
    event.stopPropagation();
    const order = ['available', 'reserved', 'occupied'];
    const next = order[(order.indexOf(slot.status) + 1) % order.length];
    try {
      await parkingService.updateSlot(slot.id, { status: next });
      setSlots((current) => current.map((s) => (s.id === slot.id ? { ...s, status: next } : s)));
    } catch (err) {
      notifyError(err.message);
    }
  };

  const modalLayoutId = editing
    ? editing.mode === 'create'
      ? 'slot-cell-new'
      : `slot-cell-${editing.slot.id}`
    : undefined;

  return (
    <PageTransition>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Slot manager</h1>
          <p className="mt-1 text-sm text-[var(--text-sec)]">
            {slots.length} slots · tap a cell to edit, tap its dot to cycle status
          </p>
        </div>
      </div>

      {loading ? (
        <Loader variant="skeleton" lines={4} />
      ) : (
        <m.div layout className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {/* create cell — morphs into the create modal */}
          <MorphCard
            layoutId="slot-cell-new"
            onClick={openCreate}
            className="grid min-h-[128px] cursor-pointer place-items-center rounded-card border-dashed p-4 hover:bg-white/[0.06]"
          >
            <div className="text-center">
              <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-accent/10 text-accent">
                <FiPlus className="h-5 w-5" />
              </span>
              <p className="mt-2 text-xs font-medium text-[var(--text-sec)]">Add slot</p>
            </div>
          </MorphCard>

          <AnimatePresence mode="popLayout">
            {slots.map((slot) => {
              const status = SLOT_STATUS[slot.status] ?? SLOT_STATUS.available;
              return (
                <m.div key={slot.id} layout variants={listItem} initial="initial" animate="animate" exit="exit">
                  <MorphCard
                    layoutId={`slot-cell-${slot.id}`}
                    onClick={() => openEdit(slot)}
                    className={cn(
                      'min-h-[128px] cursor-pointer rounded-card p-4 transition-colors hover:bg-white/[0.06]',
                      !slot.is_active && 'opacity-50'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-lg font-bold">{slot.slot_number}</p>
                      <button
                        onClick={(event) => cycleStatus(slot, event)}
                        aria-label={`Status: ${status.label} — click to change`}
                        title={`${status.label} — click to cycle`}
                        className="mt-1 h-3.5 w-3.5 rounded-full ring-2 ring-white/10 transition-transform hover:scale-125"
                        style={{ background: status.color }}
                      />
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-[var(--text-sec)]">
                      <FiMapPin className="h-3 w-3" /> {slot.zone_name ?? '—'}
                      {slot.floor ? ` · ${slot.floor}` : ''}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[11px]">
                      <span className="rounded-full bg-white/5 px-2 py-0.5 capitalize text-[var(--text-sec)]">
                        {SLOT_TYPES[slot.slot_type]?.icon} {slot.type}
                      </span>
                      <span className="font-semibold text-accent">{formatCurrency(slot.hourly_rate)}/hr</span>
                    </div>
                    {!slot.is_active && (
                      <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-danger">Inactive</p>
                    )}
                  </MorphCard>
                </m.div>
              );
            })}
          </AnimatePresence>
        </m.div>
      )}

      {/* the cell expands into this editor */}
      <Modal
        open={Boolean(editing)}
        onClose={close}
        layoutId={modalLayoutId}
        title={editing?.mode === 'create' ? 'Add parking slot' : `Edit ${editing?.slot?.slot_number ?? ''}`}
        className="max-w-xl"
      >
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2" noValidate>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Slot number</label>
            <input value={form.slot_number} onChange={set('slot_number')} placeholder="NG-05" className={cn('input-glass', errors.slot_number && 'input-error')} />
            {errors.slot_number && <p className="mt-1 text-xs text-danger">{errors.slot_number}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Zone</label>
            <input value={form.zone_name} onChange={set('zone_name')} placeholder="North Gate" className="input-glass" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Floor</label>
            <input value={form.floor} onChange={set('floor')} placeholder="Ground / P1" className="input-glass" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Hourly rate (₹)</label>
            <input type="number" min="0" step="0.5" value={form.hourly_rate} onChange={set('hourly_rate')} className={cn('input-glass', errors.hourly_rate && 'input-error')} />
            {errors.hourly_rate && <p className="mt-1 text-xs text-danger">{errors.hourly_rate}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Latitude</label>
            <input type="number" step="any" value={form.latitude} onChange={set('latitude')} className={cn('input-glass', errors.latitude && 'input-error')} />
            {errors.latitude && <p className="mt-1 text-xs text-danger">{errors.latitude}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Longitude</label>
            <input type="number" step="any" value={form.longitude} onChange={set('longitude')} className={cn('input-glass', errors.longitude && 'input-error')} />
            {errors.longitude && <p className="mt-1 text-xs text-danger">{errors.longitude}</p>}
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Cover</label>
            <select value={form.type} onChange={set('type')} className="input-glass">
              <option value="open">Open</option>
              <option value="covered">Covered</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Category</label>
            <select value={form.slot_type} onChange={set('slot_type')} className="input-glass">
              {Object.entries(SLOT_TYPES).map(([value, meta]) => (
                <option key={value} value={value}>{meta.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">Status</label>
            <select value={form.status} onChange={set('status')} className="input-glass">
              {Object.entries(SLOT_STATUS).map(([value, meta]) => (
                <option key={value} value={value}>{meta.label}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2.5 self-end pb-2 text-sm text-[var(--text-sec)]">
            <input type="checkbox" checked={form.is_active} onChange={set('is_active')} className="h-4 w-4 accent-[#D7FF1F]" />
            Active (bookable)
          </label>

          <div className="mt-2 flex items-center justify-between gap-3 sm:col-span-2">
            {editing?.mode === 'edit' ? (
              confirmDelete ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-danger">Really delete?</span>
                  <Button variant="danger" size="sm" loading={saving} onClick={handleDelete}>
                    Yes, delete
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                    No
                  </Button>
                </div>
              ) : (
                <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
                  <FiTrash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              )
            ) : (
              <span />
            )}
            <div className="flex gap-3">
              <Button variant="ghost" onClick={close}>Cancel</Button>
              <Button type="submit" loading={saving}>
                {editing?.mode === 'create' ? 'Create slot' : 'Save changes'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </PageTransition>
  );
}
