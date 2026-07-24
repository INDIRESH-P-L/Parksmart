// Parking state shared across Dashboard / Map / Slot pages: the slot list
// (with filters), zone availability, and the user's favorites.
import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import * as parkingService from '../services/parkingService.js';
import { useAuthContext } from './AuthContext.jsx';

const ParkingContext = createContext(null);

export function ParkingProvider({ children }) {
  const { isAuthed } = useAuthContext();
  const [slots, setSlots] = useState([]);
  const [availabilityData, setAvailabilityData] = useState(null); // { totals, zones }
  const [favorites, setFavorites] = useState([]);
  const [filters, setFilters] = useState({ status: '', type: '', zone: '', search: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchSlots = useCallback(async (activeFilters = {}) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await parkingService.listSlots(activeFilters);
      setSlots(data.slots);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAvailability = useCallback(async () => {
    try {
      const { data } = await parkingService.availability();
      setAvailabilityData(data);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const fetchFavorites = useCallback(async () => {
    if (!isAuthed) return;
    try {
      const { data } = await parkingService.listFavorites();
      setFavorites(data.favorites);
    } catch {
      /* favorites are decorative — never block a page on them */
    }
  }, [isAuthed]);

  // Star/unstar with optimistic-feeling refresh.
  const toggleFavorite = useCallback(
    async (slotId) => {
      const isFav = favorites.some((f) => f.slot?.id === slotId);
      if (isFav) await parkingService.removeFavorite(slotId);
      else await parkingService.addFavorite(slotId);
      await fetchFavorites();
      return !isFav;
    },
    [favorites, fetchFavorites]
  );

  const isFavorite = useCallback(
    (slotId) => favorites.some((f) => f.slot?.id === slotId),
    [favorites]
  );

  // Applying filters re-queries the server (filters are API-side).
  const applyFilters = useCallback(
    (next) => {
      const merged = { ...filters, ...next };
      setFilters(merged);
      fetchSlots(merged);
    },
    [filters, fetchSlots]
  );

  const refresh = useCallback(() => {
    fetchSlots(filters);
    fetchAvailability();
  }, [fetchSlots, fetchAvailability, filters]);

  // Favorites follow the session.
  useEffect(() => {
    if (isAuthed) fetchFavorites();
    else setFavorites([]);
  }, [isAuthed, fetchFavorites]);

  const value = useMemo(
    () => ({
      slots,
      availability: availabilityData,
      favorites,
      filters,
      loading,
      error,
      fetchSlots,
      fetchAvailability,
      fetchFavorites,
      toggleFavorite,
      isFavorite,
      applyFilters,
      refresh,
    }),
    [slots, availabilityData, favorites, filters, loading, error, fetchSlots, fetchAvailability, fetchFavorites, toggleFavorite, isFavorite, applyFilters, refresh]
  );

  return <ParkingContext.Provider value={value}>{children}</ParkingContext.Provider>;
}

export const useParkingContext = () => {
  const ctx = useContext(ParkingContext);
  if (!ctx) throw new Error('useParkingContext must be used inside <ParkingProvider>');
  return ctx;
};
