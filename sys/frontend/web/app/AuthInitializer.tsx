'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/store';
import { loadStoredAuth } from '@/store/authSlice';
import Header from '@/components/Header';

export default function AuthInitializer() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(loadStoredAuth());
  }, [dispatch]);

  return <Header />;
}
