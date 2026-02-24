'use client';

import { useState, useEffect, useRef } from 'react';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search articles...',
  debounceMs = 400,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(query.trim());
    }, debounceMs);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, debounceMs, onSearch]);

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <div className={styles.wrapper}>
      <span className={styles.icon}>&#x1F50D;</span>
      <input
        type="text"
        className={styles.input}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
      />
      {query && (
        <button className={styles.clear} onClick={handleClear} aria-label="Clear search">
          &times;
        </button>
      )}
    </div>
  );
}
