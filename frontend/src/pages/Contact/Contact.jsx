// Contact — a working feedback form posting to /feedback (auth-gated on the
// API, so guests get a friendly sign-in prompt instead of a failed submit).
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { m } from 'framer-motion';
import { FiStar, FiMail } from 'react-icons/fi';
import PageTransition from '../../components/PageTransition/PageTransition.jsx';
import GlassPanel from '../../components/GlassPanel/GlassPanel.jsx';
import Button from '../../components/Button/Button.jsx';
import { useAuth } from '../../hooks/useAuth.js';
import { sendFeedback } from '../../services/notificationService.js';
import { validateFeedback } from '../../utils/validators.js';
import { notifyError } from '../../components/Notification/Notification.jsx';
import { cn } from '../../utils/helpers.js';
import { SPRING } from '../../utils/motionPresets.js';

export default function Contact() {
  const { isAuthed } = useAuth();
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(0);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const fieldErrors = validateFeedback({ message });
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length) return;

    setLoading(true);
    try {
      await sendFeedback({ message: message.trim(), ...(rating ? { rating } : {}) });
      setSent(true);
    } catch (err) {
      notifyError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="mx-auto w-full max-w-2xl px-4 py-14 md:px-6">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Get in touch</h1>
        <p className="mt-3 text-[var(--text-sec)]">
          Found a rough edge, or loved the glide? Tell us — feedback goes straight to the team.
        </p>

        <GlassPanel className="mt-8 rounded-sheet p-7">
          {!isAuthed ? (
            <div className="py-6 text-center">
              <FiMail className="mx-auto h-8 w-8 text-accent" />
              <p className="mt-4 text-sm text-[var(--text-sec)]">
                Sign in so we can reply to your message.
              </p>
              <Link
                to="/login"
                className="mt-5 inline-block rounded-btn bg-accent px-6 py-3 text-sm font-semibold text-ink shadow-glow-accent"
              >
                Sign in to send feedback
              </Link>
            </div>
          ) : sent ? (
            <m.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1, transition: SPRING }}
              className="py-8 text-center"
            >
              <m.span
                initial={{ scale: 0 }}
                animate={{ scale: 1, transition: { ...SPRING, delay: 0.1 } }}
                className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-lime/15 text-3xl"
              >
                ✓
              </m.span>
              <h2 className="mt-4 text-xl font-bold">Message sent</h2>
              <p className="mt-2 text-sm text-[var(--text-sec)]">Thanks for helping ParkSmart get better.</p>
              <Button variant="glass" className="mt-6" onClick={() => { setSent(false); setMessage(''); setRating(0); }}>
                Send another
              </Button>
            </m.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              <div>
                <label htmlFor="message" className="mb-1.5 block text-xs font-medium text-[var(--text-sec)]">
                  Your message
                </label>
                <textarea
                  id="message"
                  rows={5}
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="What's on your mind?"
                  className={cn('input-glass resize-none', errors.message && 'input-error')}
                />
                {errors.message && <p className="mt-1 text-xs text-danger">{errors.message}</p>}
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-[var(--text-sec)]">Rate the experience (optional)</p>
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <m.button
                      key={value}
                      type="button"
                      whileTap={{ scale: 0.8 }}
                      whileHover={{ y: -2 }}
                      transition={SPRING}
                      onClick={() => setRating(value === rating ? 0 : value)}
                      aria-label={`${value} star${value > 1 ? 's' : ''}`}
                      className={cn(
                        'rounded-full p-2',
                        value <= rating ? 'text-warn' : 'text-[var(--text-mut)] hover:text-warn'
                      )}
                    >
                      <FiStar className={cn('h-6 w-6', value <= rating && 'fill-current')} />
                    </m.button>
                  ))}
                </div>
              </div>

              <Button type="submit" size="lg" loading={loading} className="w-full">
                Send feedback
              </Button>
            </form>
          )}
        </GlassPanel>
      </div>
    </PageTransition>
  );
}
