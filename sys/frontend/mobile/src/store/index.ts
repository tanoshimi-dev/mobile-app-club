/**
 * Redux Store Configuration
 */
import {configureStore} from '@reduxjs/toolkit';

import authReducer from './slices/authSlice';
import articlesReducer from './slices/articlesSlice';
import categoriesReducer from './slices/categoriesSlice';

// Configure store
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
