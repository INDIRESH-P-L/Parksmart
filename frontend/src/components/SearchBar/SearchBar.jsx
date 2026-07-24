// Morphing search: a collapsed round icon button that EXPANDS into the full
// input as one continuous element (layout animation — not a fade swap).
// Results filtering is debounced and pushed up via onSearch.
import { useState, useMemo, useRef, useEffect } from 'react';
import { m } from 'framer-motion';
import { FiSearch, FiX } from 'react-icons/fi';
import { debounce, cn } from '../../utils/helpers.js';
import { SPRING } from '../../utils/motionPresets.js';

export default function SearchBar({
  onSearch,
  placeholder = 'Search slot number or zone…',
  autoExpand = false,
  className = '',
}) {
  const [open, setOpen] = useState(autoExpand);
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  const emit = useMemo(() => debounce((term) => onSearch?.(term), 350), [onSearch]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  const handleChange = (event) => {
    setValue(event.target.value);
    emit(event.target.value.trim());
  };

  const clear = () => {
    setValue('');
    onSearch?.('');
    if (!autoExpand) setOpen(false);
  };

  return (
    <m.div
      layout
      transition={SPRING}
      className={cn(
        'glass-panel flex items-center overflow-hidden',
        open ? 'w-full gap-2 rounded-btn px-3.5 py-2.5 md:max-w-sm' : 'w-fit cursor-pointer rounded-full p-3',
        className
      )}
      onClick={() => !open && setOpen(true)}
    >
      <m.span layout="position">
        <FiSearch className={cn('h-[18px] w-[18px]', open ? 'text-[var(--text-mut)]' : 'text-accent')} />
      </m.span>
      {open && (
        <>
          <input
            ref={inputRef}
            value={value}
            onChange={handleChange}
            onKeyDown={(event) => event.key === 'Escape' && clear()}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-mut)]"
            aria-label="Search parking slots"
          />
          {value && (
            <m.button
              initial={{ scale: 0 }}
              animate={{ scale: 1, transition: SPRING }}
              whileTap={{ scale: 0.85 }}
              onClick={clear}
              aria-label="Clear search"
              className="text-[var(--text-mut)] hover:text-[var(--text)]"
            >
              <FiX className="h-4 w-4" />
            </m.button>
          )}
        </>
      )}
    </m.div>
  );
}
