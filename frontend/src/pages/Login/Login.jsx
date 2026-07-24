// Login — centred glass card over the blob field. Inline field validation,
// an error shake on rejected credentials, and role-aware redirect (admins land
// on the console, everyone else on the dashboard — unless they were heading
// somewhere specific before being bounced to login).
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { m } from 'framer-motion';
import { FiMail, FiLock } from 'react-icons/fi';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import GlassPanel from '../../components/GlassPanel/GlassPanel.jsx';
import Button from '../../components/Button/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { validateLogin } from '../../utils/validators.js';
import { notifySuccess } from '../../components/Notification/Notification.jsx';
import { cn } from '../../utils/helpers.js';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0); // keyed to retrigger the shake animation

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fieldErrors = validateLogin(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setLoading(true);
    setServerError('');
    try {
      const user = await login(form);
      notifySuccess(`Welcome back, ${user.name.split(' ')[0]}!`);
      const from = location.state?.from;
      navigate(from || (user.role === 'admin' ? '/admin' : '/dashboard'), { replace: true });
    } catch (err) {
      setServerError(err.message);
      setShake((s) => s + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto flex min-h-[70vh] w-full max-w-md items-center px-4 py-12">
        <m.div
          key={shake}
          animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          <GlassPanel className="rounded-sheet p-7 md:p-9">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-[var(--text-sec)]">Sign in to find your next spot.</p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-medium text-[var(--text-sec)]" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="you@campus.edu"
                  className={cn('input-glass w-full', errors.email && 'input-error')}
                />
                {errors.email && <p className="text-xs text-danger">{errors.email}</p>}
              </div>

              <div className="flex flex-col gap-2">
                <label className="block text-xs font-medium text-[var(--text-sec)]" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={form.password}
                  onChange={set('password')}
                  placeholder="••••••••"
                  className={cn('input-glass w-full', errors.password && 'input-error')}
                />
                {errors.password && <p className="text-xs text-danger">{errors.password}</p>}
              </div>

              {serverError && (
                <m.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-input bg-danger/10 px-4 py-2.5 text-sm text-danger"
                >
                  {serverError}
                </m.p>
              )}

              <Button type="submit" size="lg" loading={loading} className="w-full">
                Sign in
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--text-sec)]">
              New here?{' '}
              <Link to="/register" className="font-semibold text-accent hover:underline">
                Create an account
              </Link>
            </p>
          </GlassPanel>
        </m.div>
      </div>
    </PageTransition>
  );
}
