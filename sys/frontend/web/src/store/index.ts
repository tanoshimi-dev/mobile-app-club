/**
 * Redux Store Configuration
 */
import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';

import authReducer from './authSlice';
import articlesReducer from './articlesSlice';
import categoriesReducer from './categoriesSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    articles: articlesReducer,
    categories: categoriesReducer,
  },
});

// Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Typed hooks
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
