// Thin alias hook — pages import useAuth() rather than reaching into context
// files directly (keeps the components/pages layer decoupled from context
// implementation).
import { useAuthContext } from '../context/AuthContext.jsx';

export const useAuth = () => useAuthContext();
export default useAuth;
