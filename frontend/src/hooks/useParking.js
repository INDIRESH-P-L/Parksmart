// Parking hook — context consumer alias (see useAuth.js for the rationale).
import { useParkingContext } from '../context/ParkingContext.jsx';

export const useParking = () => useParkingContext();
export default useParking;
