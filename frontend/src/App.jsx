// App root. MotionConfig installs the signature transition app-wide and
// honours OS-level reduced-motion; LazyMotion + domAnimation keeps the Framer
// Motion bundle slim (components use <m.*> rather than <motion.*>). The
// animated blob field sits behind every page — the background is never flat.
import { BrowserRouter } from 'react-router-dom';
import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ParkingProvider } from './context/ParkingContext.jsx';
import { ReservationProvider } from './context/ReservationContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import ToastHost from './components/Notification/Notification.jsx';
import { defaultTransition } from './utils/motionPresets.js';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ParkingProvider>
          <ReservationProvider>
            <BrowserRouter>
              <LazyMotion features={domAnimation}>
                <MotionConfig transition={defaultTransition} reducedMotion="user">
                  {/* drifting gradient mesh behind the glass */}
                  <div className="blob-field" aria-hidden="true">
                    <div className="blob blob--mint" />
                    <div className="blob blob--teal" />
                    <div className="blob blob--volt" />
                  </div>

                  <ToastHost />
                  <AppRoutes />
                </MotionConfig>
              </LazyMotion>
            </BrowserRouter>
          </ReservationProvider>
        </ParkingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
