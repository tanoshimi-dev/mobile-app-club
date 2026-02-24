'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppSelector } from '../store';
import { selectIsAuthenticated, selectAuthLoading } from '../store/authSlice';
import LoadingSpinner from './LoadingSpinner';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const loading = useAppSelector(selectAuthLoading);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <LoadingSpinner size="large" />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
