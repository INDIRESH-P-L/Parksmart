// Bus-Booking Style Interactive Parking Slot Selection Component
// Designed like RedBus / AbhiBus interactive seat layout with interactive deck,
// seat legend, zone/floor switching, and instant CRUD controls.
import { useState, useMemo } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import {
  FiMapPin,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiInfo,
  FiZap,
} from 'react-icons/fi';
import { SLOT_TYPES, SLOT_STATUS } from '../../utils/constants.js';
import { cn } from '../../utils/helpers.js';
import Button from '../Button/Button.jsx';
import Card from '../Card/Card.jsx';
import Modal from '../Modal/Modal.jsx';
import MorphCard from '../MorphCard/MorphCard.jsx';
import { notifySuccess, notifyError } from '../Notification/Notification.jsx';
import * as parkingService from '../../services/parkingService.js';
import { useAuth } from '../../hooks/useAuth.js';

export default function BusBookingSlotGrid({
  slots = [],
  onSlotUpdate,
  onOpenCreate,
  onOpenEdit,
  readOnly = false,
}) {
  const { user, isAdmin } = useAuth();
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [activeZone, setActiveZone] = useState('All');
  const [activeFloor, setActiveFloor] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmDeleteSlot, setConfirmDeleteSlot] = useState(null);

  // Extract unique zones and floors
  const zones = useMemo(() => {
    const set = new Set(slots.map((s) => s.zone_name).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [slots]);

  const floors = useMemo(() => {
    const set = new Set(slots.map((s) => s.floor).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [slots]);

  // Filter slots for current deck
  const filteredSlots = useMemo(() => {
    return slots.filter((s) => {
      const matchZone = activeZone === 'All' || s.zone_name === activeZone;
      const matchFloor = activeFloor === 'All' || s.floor === activeFloor;
      return matchZone && matchFloor;
    });
  }, [slots, activeZone, activeFloor]);

  // Currently selected slot details object
  const selectedSlot = useMemo(() => {
    return slots.find((s) => s.id === selectedSlotId) || null;
  }, [slots, selectedSlotId]);

  // Find slot currently checked in by logged-in user
  const userCheckedInSlot = useMemo(() => {
    if (!user) return null;
    return slots.find((s) => s.status === 'occupied' && s.occupied_by === user.id) || null;
  }, [slots, user]);

  // Check-in when parking in slot
  const handleCheckIn = async (slot) => {
    setUpdatingId(slot.id);
    try {
      await parkingService.checkIn(slot.id);
      notifySuccess(`Checked IN to slot ${slot.slot_number} successfully!`);
      onSlotUpdate?.();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Check-out when leaving slot
  const handleCheckOut = async (slot) => {
    setUpdatingId(slot.id);
    try {
      await parkingService.checkOut(slot.id);
      notifySuccess(`Checked OUT from slot ${slot.slot_number} successfully!`);
      onSlotUpdate?.();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Quick toggle status (Available ↔ Occupied)
  const handleToggleStatus = async (slot) => {
    const nextStatus = slot.status === 'occupied' ? 'available' : 'occupied';
    setUpdatingId(slot.id);
    try {
      await parkingService.updateSlot(slot.id, { status: nextStatus });
      notifySuccess(`Slot ${slot.slot_number} status set to ${nextStatus}`);
      onSlotUpdate?.();
    } catch (err) {
      notifyError(err.message);
    } finally {
      setUpdatingId(null);
    }
  };

  // Delete slot
  const handleDeleteSlot = async (slotId) => {
    try {
      await parkingService.deleteSlot(slotId);
      notifySuccess('Slot deleted successfully');
      setSelectedSlotId(null);
      setConfirmDeleteSlot(null);
      onSlotUpdate?.();
    } catch (err) {
      notifyError(err.message);
    }
  };

  // Divide slots into Left Column and Right Column to simulate bus seat columns
  const leftDeckSlots = filteredSlots.filter((_, idx) => idx % 2 === 0);
  const rightDeckSlots = filteredSlots.filter((_, idx) => idx % 2 !== 0);

  return (
    <div className="space-y-6">
      {/* Active User Check-In Status Banner */}
      {userCheckedInSlot && (
        <div className="glass-panel flex items-center justify-between rounded-card border-accent/40 bg-accent/10 px-4 py-3 text-xs font-semibold text-accent shadow-glow-mint">
          <div className="flex items-center gap-2">
            <span className="text-base">📍</span>
            <span>
              You are currently checked in at slot <strong>{userCheckedInSlot.slot_number}</strong> ({userCheckedInSlot.zone_name})
            </span>
          </div>
          <Button
            variant="danger"
            size="sm"
            loading={updatingId === userCheckedInSlot.id}
            onClick={() => handleCheckOut(userCheckedInSlot)}
          >
            Check Out Now
          </Button>
        </div>
      )}

      {/* Zone & Floor Selection Header */}
      <div className="glass-panel flex flex-wrap items-center justify-between gap-4 rounded-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-mut)]">
            Zone:
          </span>
          {zones.map((zone) => (
            <button
              key={zone}
              onClick={() => setActiveZone(zone)}
              className={cn(
                'rounded-btn px-3 py-1.5 text-xs font-semibold transition-all',
                activeZone === zone
                  ? 'bg-accent text-ink shadow-glow-accent'
                  : 'bg-white/5 text-[var(--text-sec)] hover:bg-white/10 hover:text-[var(--text)]'
              )}
            >
              {zone}
            </button>
          ))}
        </div>

        {floors.length > 2 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--text-mut)]">
              Floor:
            </span>
            {floors.map((floor) => (
              <button
                key={floor}
                onClick={() => setActiveFloor(floor)}
                className={cn(
                  'rounded-btn px-2.5 py-1 text-xs font-medium transition-all',
                  activeFloor === floor
                    ? 'bg-white/20 text-accent font-bold'
                    : 'text-[var(--text-sec)] hover:text-[var(--text)]'
                )}
              >
                {floor}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bus Seat Legend */}
      <div className="glass-panel flex flex-wrap items-center justify-around gap-4 rounded-card px-4 py-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-md border border-lime/50 bg-lime/20" />
          <span className="text-[var(--text-sec)]">Available</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-md border border-danger/50 bg-danger/20" />
          <span className="text-[var(--text-sec)]">Occupied</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-md border border-warn/50 bg-warn/20" />
          <span className="text-[var(--text-sec)]">Reserved</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-4 w-4 rounded-md border-2 border-accent bg-accent/20 ring-2 ring-accent" />
          <span className="font-bold text-accent">Selected Pick</span>
        </div>
        <div className="flex items-center gap-2 text-[var(--text-mut)]">
          <span>⚡ EV</span> · <span>♿ Accessible</span> · <span>⭐ VIP</span>
        </div>
      </div>

      {/* Main Bus Deck Layout Container */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Side: Bus Deck Grid */}
        <div className="lg:col-span-8">
          <div className="glass-panel relative rounded-[24px] p-6 shadow-lift border border-white/10">
            {/* Bus Entrance / Front Gate Header */}
            <div className="mb-6 flex items-center justify-between rounded-xl bg-white/[0.04] p-3.5 border border-white/5">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent/20 text-accent">
                  🚪
                </span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--text)]">
                    Main Campus Entrance Gate
                  </p>
                  <p className="text-[11px] text-[var(--text-sec)]">
                    Sri Eshwar College Parking Deck
                  </p>
                </div>
              </div>
              <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium text-[var(--text-sec)]">
                Front / Entry Direction ⬆️
              </div>
            </div>

            {/* Parking Deck Seat-Row Layout */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-8 md:gap-12">
                {/* Left Parking Seats Column */}
                {/* Lower Deck Column (Ground Bay) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1 text-[11px] font-bold uppercase tracking-widest text-[var(--text-mut)]">
                    <span>Lower Deck (Ground)</span>
                    <span className="text-base" title="Driver / Entry Side">☸️</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {leftDeckSlots.map((slot) => {
                      const isSelected = slot.id === selectedSlotId;
                      const statusMeta = SLOT_STATUS[slot.status] || SLOT_STATUS.available;
                      const typeIcon = SLOT_TYPES[slot.slot_type]?.icon || '🚗';

                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={cn(
                            'group relative flex flex-col items-center justify-between rounded-xl p-3 text-center transition-all duration-200 min-h-[96px]',
                            isSelected
                              ? 'bg-accent/25 border-2 border-accent text-accent ring-4 ring-accent/30 shadow-glow-accent scale-[1.03]'
                              : slot.status === 'occupied'
                              ? 'bg-danger/10 border border-danger/30 text-danger/80 hover:bg-danger/20'
                              : slot.status === 'reserved'
                              ? 'bg-warn/10 border border-warn/30 text-warn hover:bg-warn/20'
                              : 'bg-lime/10 border border-lime/30 text-lime hover:bg-lime/20'
                          )}
                        >
                          <div className="flex w-full items-center justify-between text-[11px]">
                            <span className="font-mono text-xs font-extrabold tracking-tight">
                              {slot.slot_number}
                            </span>
                            <span>{typeIcon}</span>
                          </div>

                          {/* Seat graphic icon representation */}
                          <div className="my-1 text-2xl group-hover:scale-110 transition-transform">
                            {slot.status === 'occupied' ? '🚘' : isSelected ? '🎯' : '🅿️'}
                          </div>

                          <div className="flex w-full items-center justify-between text-[10px]">
                            <span className="capitalize opacity-80">{slot.zone_name?.split(' ')[0]}</span>
                            <span className="font-bold capitalize">{slot.status}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Right Parking Seats Column */}
                {/* Upper Deck Column (Floor 1 / Bay B) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between px-1 text-[11px] font-bold uppercase tracking-widest text-[var(--text-mut)]">
                    <span>Upper Deck (Floor 1)</span>
                    <span className="text-base" title="Upper Deck Access">🅿️</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {rightDeckSlots.map((slot) => {
                      const isSelected = slot.id === selectedSlotId;
                      const typeIcon = SLOT_TYPES[slot.slot_type]?.icon || '🚗';

                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={cn(
                            'group relative flex flex-col items-center justify-between rounded-xl p-3 text-center transition-all duration-200 min-h-[96px]',
                            isSelected
                              ? 'bg-accent/25 border-2 border-accent text-accent ring-4 ring-accent/30 shadow-glow-accent scale-[1.03]'
                              : slot.status === 'occupied'
                              ? 'bg-danger/10 border border-danger/30 text-danger/80 hover:bg-danger/20'
                              : slot.status === 'reserved'
                              ? 'bg-warn/10 border border-warn/30 text-warn hover:bg-warn/20'
                              : 'bg-lime/10 border border-lime/30 text-lime hover:bg-lime/20'
                          )}
                        >
                          <div className="flex w-full items-center justify-between text-[11px]">
                            <span className="font-mono text-xs font-extrabold tracking-tight">
                              {slot.slot_number}
                            </span>
                            <span>{typeIcon}</span>
                          </div>

                          <div className="my-1 text-2xl group-hover:scale-110 transition-transform">
                            {slot.status === 'occupied' ? '🚘' : isSelected ? '🎯' : '🅿️'}
                          </div>

                          <div className="flex w-full items-center justify-between text-[10px]">
                            <span className="capitalize opacity-80">{slot.zone_name?.split(' ')[0]}</span>
                            <span className="font-bold capitalize">{slot.status}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Add New Slot Quick Action */}
            {!readOnly && isAdmin && onOpenCreate && (
              <div className="mt-6 flex justify-center border-t border-white/5 pt-4">
                <Button variant="glass" size="sm" onClick={onOpenCreate}>
                  <FiPlus className="h-4 w-4" /> Add Parking Slot to Deck
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Selected Slot Detail Card & CRUD Operations */}
        <div className="lg:col-span-4">
          <Card title="Slot Information & CRUD">
            {selectedSlot ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-mut)]">
                      Selected Slot
                    </span>
                    <h2 className="text-2xl font-black text-accent">
                      {selectedSlot.slot_number}
                    </h2>
                  </div>
                  <span className="text-3xl">
                    {SLOT_TYPES[selectedSlot.slot_type]?.icon || '🚗'}
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[var(--text-sec)]">Zone / Block:</span>
                    <span className="font-semibold">{selectedSlot.zone_name}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[var(--text-sec)]">Floor Level:</span>
                    <span className="font-semibold">{selectedSlot.floor || 'Ground'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[var(--text-sec)]">Cover Type:</span>
                    <span className="font-semibold capitalize">{selectedSlot.type}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[var(--text-sec)]">Category:</span>
                    <span className="font-semibold">
                      {SLOT_TYPES[selectedSlot.slot_type]?.label}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-[var(--text-sec)]">Status:</span>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 font-bold capitalize text-[10px]',
                        SLOT_STATUS[selectedSlot.status]?.badge
                      )}
                    >
                      {selectedSlot.status}
                    </span>
                  </div>

                  <div className="flex justify-between pb-1">
                    <span className="text-[var(--text-sec)]">Coordinates:</span>
                    <span className="font-mono text-[11px] text-[var(--text-mut)]">
                      {selectedSlot.latitude?.toFixed(4)}, {selectedSlot.longitude?.toFixed(4)}
                    </span>
                  </div>
                </div>

                {/* Check In / Check Out Live Action Bar */}
                <div className="space-y-2 pt-2 border-t border-white/10">
                  {selectedSlot.status !== 'occupied' ? (
                    <>
                      {userCheckedInSlot && userCheckedInSlot.id !== selectedSlot.id && (
                        <p className="text-[11px] text-warn font-medium px-1">
                          ⚠️ You are currently checked in at slot <strong>{userCheckedInSlot.slot_number}</strong>. Please check out from {userCheckedInSlot.slot_number} before parking here.
                        </p>
                      )}
                      <Button
                        variant="primary"
                        className="w-full justify-center text-sm font-bold bg-lime text-ink hover:bg-lime/90 shadow-glow-mint"
                        loading={updatingId === selectedSlot.id}
                        disabled={Boolean(userCheckedInSlot && userCheckedInSlot.id !== selectedSlot.id)}
                        onClick={() => handleCheckIn(selectedSlot)}
                      >
                        <FiCheckCircle className="h-4 w-4" /> Check In to {selectedSlot.slot_number}
                      </Button>
                    </>
                  ) : (
                    <>
                      {selectedSlot.occupied_by && selectedSlot.occupied_by !== user?.id ? (
                        <p className="text-[11px] text-danger font-medium px-1 text-center py-1 bg-danger/10 rounded-lg">
                          🔒 Occupied by another user. Only the driver who checked in can check out.
                        </p>
                      ) : (
                        <Button
                          variant="danger"
                          className="w-full justify-center text-sm font-bold shadow-glow-danger"
                          loading={updatingId === selectedSlot.id}
                          onClick={() => handleCheckOut(selectedSlot)}
                        >
                          <FiXCircle className="h-4 w-4" /> Check Out from {selectedSlot.slot_number}
                        </Button>
                      )}
                    </>
                  )}
                </div>

                {/* CRUD Actions Panel */}
                {!readOnly && isAdmin && (
                  <div className="space-y-2.5 pt-2 border-t border-white/10">
                    <div className="grid grid-cols-2 gap-2">
                      {onOpenEdit && (
                        <Button
                          variant="glass"
                          size="sm"
                          className="justify-center text-xs"
                          onClick={() => onOpenEdit(selectedSlot)}
                        >
                          <FiEdit2 className="h-3.5 w-3.5" /> Edit
                        </Button>
                      )}

                      <Button
                        variant="danger"
                        size="sm"
                        className="justify-center text-xs"
                        onClick={() => setConfirmDeleteSlot(selectedSlot)}
                      >
                        <FiTrash2 className="h-3.5 w-3.5" /> Delete
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-[var(--text-mut)]">
                <FiInfo className="mx-auto mb-2 h-8 w-8 opacity-40" />
                <p className="text-sm font-medium">No slot selected</p>
                <p className="mt-1 text-xs text-[var(--text-sec)]">
                  Click any slot on the bus parking deck layout to view details and perform CRUD actions.
                </p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(confirmDeleteSlot)}
        onClose={() => setConfirmDeleteSlot(null)}
        title="Confirm Slot Deletion"
      >
        <div className="space-y-4">
          <p className="text-sm text-[var(--text-sec)]">
            Are you sure you want to delete parking slot{' '}
            <strong className="text-white">{confirmDeleteSlot?.slot_number}</strong>? This action
            cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setConfirmDeleteSlot(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => handleDeleteSlot(confirmDeleteSlot.id)}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
