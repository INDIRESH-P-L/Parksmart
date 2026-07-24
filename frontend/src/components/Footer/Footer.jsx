// Site footer for the landing/static pages.
import { Link } from 'react-router-dom';
import { FiGithub, FiMail } from 'react-icons/fi';

export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-4 pb-8 pt-16">
      <div className="glass-panel flex flex-col items-center gap-5 rounded-card px-6 py-8 md:flex-row md:justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="" className="h-8 w-8 rounded-xl" />
          <div>
            <p className="text-sm font-bold">
              Park<span className="text-accent">Smart</span>
            </p>
            <p className="text-xs text-[var(--text-mut)]">Park smarter, not longer.</p>
          </div>
        </div>

        <nav className="flex items-center gap-6 text-sm text-[var(--text-sec)]">
          <Link to="/about" className="hover:text-[var(--text)]">About</Link>
          <Link to="/contact" className="hover:text-[var(--text)]">Contact</Link>
          <Link to="/map" className="hover:text-[var(--text)]">Live Map</Link>
        </nav>

        <div className="flex items-center gap-3 text-[var(--text-mut)]">
          <a href="mailto:hello@parksmart.dev" aria-label="Email" className="hover:text-[var(--text)]">
            <FiMail className="h-[18px] w-[18px]" />
          </a>
          <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub" className="hover:text-[var(--text)]">
            <FiGithub className="h-[18px] w-[18px]" />
          </a>
          <span className="text-xs">© {new Date().getFullYear()} ParkSmart</span>
        </div>
      </div>
    </footer>
  );
}
