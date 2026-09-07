import { useEffect, useRef, useState } from 'react';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { ApiError } from '../api/client';
import styles from './Autocomplete.module.css';

const DEBOUNCE_MS = 200;
const MIN_CHARS = 2;

interface AutocompleteProps<T> {
  label: string;
  placeholder?: string;
  value: string;
  onInputChange: (text: string) => void;
  onSelect: (item: T) => void;
  fetchOptions: (query: string) => Promise<T[] | null>;
  getKey: (item: T) => string;
  getLabel: (item: T) => string;
  disabled?: boolean;
  disabledHint?: string;
}

export function Autocomplete<T>({
  label,
  placeholder,
  value,
  onInputChange,
  onSelect,
  fetchOptions,
  getKey,
  getLabel,
  disabled,
  disabledHint,
}: AutocompleteProps<T>) {
  const [options, setOptions] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debouncedValue = useDebouncedValue(value, DEBOUNCE_MS);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const fetchOptionsRef = useRef(fetchOptions);
  fetchOptionsRef.current = fetchOptions;

  useEffect(() => {
    if (disabled || debouncedValue.trim().length < MIN_CHARS) {
      setOptions([]);
      setLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setLoading(true);
    fetchOptionsRef.current(debouncedValue.trim())
      .then((results) => {
        if (requestIdRef.current !== requestId) return;
        setOptions(results ?? []);
      })
      .catch((err) => {
        if (requestIdRef.current !== requestId) return;
        if (!(err instanceof ApiError)) throw err;
        setOptions([]);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) setLoading(false);
      });
  }, [debouncedValue, disabled]);

  useEffect(() => {
    function onClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const showDropdown = open && !disabled && value.trim().length >= MIN_CHARS && (loading || options.length > 0);

  return (
    <div className={styles.field} ref={containerRef}>
      <label className={styles.label}>{label}</label>
      <input
        className={styles.input}
        type="text"
        value={value}
        placeholder={disabled ? disabledHint : placeholder}
        disabled={disabled}
        onChange={(e) => {
          onInputChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
      />
      {showDropdown && (
        <ul className={styles.dropdown} role="listbox">
          {loading && <li className={styles.status}>Buscando…</li>}
          {!loading &&
            options.map((item) => (
              <li key={getKey(item)}>
                <button
                  type="button"
                  className={styles.option}
                  onClick={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                >
                  {getLabel(item)}
                </button>
              </li>
            ))}
          {!loading && options.length === 0 && <li className={styles.status}>Nenhum resultado</li>}
        </ul>
      )}
    </div>
  );
}
