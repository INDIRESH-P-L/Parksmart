// Reservation hook — context consumer alias (matches useAuth/useParking pattern
// so pages stay decoupled from the context implementation).
import { useReservationContext } from '../context/ReservationContext.jsx';

export const useReservation = () => useReservationContext();
export default useReservation;
