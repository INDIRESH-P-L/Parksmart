// Register — same glass-card treatment as Login, with optional phone/vehicle
// fields (used later for the gate ticket + profile).
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { m } from 'framer-motion';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import GlassPanel from '../../components/GlassPanel/GlassPanel.jsx';
import Button from '../../components/Button/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { validateRegister } from '../../utils/validators.js';
import { notifySuccess } from '../../components/Notification/Notification.jsx';
import { cn } from '../../utils/helpers.js';

const FIELDS = [
  { key: 'name', label: 'Full name', type: 'text', placeholder: 'Asha Kumar', autoComplete: 'name' },
  { key: 'email', label: 'Email', type: 'email', placeholder: 'you@campus.edu', autoComplete: 'email' },
  { key: 'password', label: 'Password', type: 'password', placeholder: 'Min 8 characters', autoComplete: 'new-password' },
  { key: 'confirm', label: 'Confirm password', type: 'password', placeholder: 'Repeat password', autoComplete: 'new-password' },
  { key: 'phone_number', label: 'Phone (optional)', type: 'tel', placeholder: '+91 98765 43210', autoComplete: 'tel' },
  { key: 'vehicle_number', label: 'Vehicle number (optional)', type: 'text', placeholder: 'KA-01-AB-1234' },
];

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
    phone_number: '',
    vehicle_number: '',
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fieldErrors = validateRegister(form);
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setLoading(true);
    setServerError('');
    try {
      // Optional fields are omitted (not sent empty) so backend zod minimums pass.
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        ...(form.phone_number.trim() ? { phone_number: form.phone_number.trim() } : {}),
        ...(form.vehicle_number.trim() ? { vehicle_number: form.vehicle_number.trim() } : {}),
      };
      const user = await register(payload);
      notifySuccess(`Welcome to ParkSmart, ${user.name.split(' ')[0]}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setServerError(err.message);
      setShake((s) => s + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto flex min-h-[70vh] w-full max-w-lg items-center px-4 py-12">
        <m.div
          key={shake}
          animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          <GlassPanel className="rounded-sheet p-7 md:p-9">
            <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
            <p className="mt-1 text-sm text-[var(--text-sec)]">
              One minute now, zero circling later.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 grid gap-4 sm:grid-cols-2" noValidate>
              {FIELDS.map((field) => (
                <div key={field.key} className={cn(field.key === 'name' || field.key === 'email' ? 'sm:col-span-2' : '')}>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]" htmlFor={field.key}>
                    {field.label}
                  </label>
                  <input
                    id={field.key}
                    type={field.type}
                    autoComplete={field.autoComplete}
                    value={form[field.key]}
                    onChange={set(field.key)}
                    placeholder={field.placeholder}
                    className={cn('input-glass', errors[field.key] && 'input-error')}
                  />
                  {errors[field.key] && <p className="mt-1 text-xs text-danger">{errors[field.key]}</p>}
                </div>
              ))}

              {serverError && (
                <m.p
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-input bg-danger/10 px-4 py-2.5 text-sm text-danger sm:col-span-2"
                >
                  {serverError}
                </m.p>
              )}

              <Button type="submit" size="lg" loading={loading} className="w-full sm:col-span-2">
                Create account
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-[var(--text-sec)]">
              Already registered?{' '}
              <Link to="/login" className="font-semibold text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </GlassPanel>
        </m.div>
      </div>
    </PageTransition>
  );
}
