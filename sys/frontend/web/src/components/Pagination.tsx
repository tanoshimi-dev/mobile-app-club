'use client';

import { useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';
import styles from './Pagination.module.css';

interface PaginationProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

export default function Pagination({ hasMore, loading, onLoadMore }: PaginationProps) {
  const observerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 },
    );

    const el = observerRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasMore, loading, onLoadMore]);

  if (!hasMore && !loading) return null;

  return (
    <div className={styles.wrapper} ref={observerRef}>
      {loading && <LoadingSpinner size="small" />}
    </div>
  );
}
