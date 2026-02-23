/**
 * Categories Redux Slice
 */
import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {apiService} from '../../services/api';
import {Category, CategoriesState, Source} from '../../types';

// Initial state
const initialState: CategoriesState = {
  categories: [],
  sources: [],
  selectedCategory: null,
  loading: false,
  error: null,
};

// Async thunks
export const fetchCategories = createAsyncThunk(
  'categories/fetchCategories',
  async (_, {rejectWithValue}) => {
    try {
      const categories = await apiService.getCategories();
      return categories;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch categories',
      );
    }
  },
);

export const fetchSources = createAsyncThunk(
  'categories/fetchSources',
  async (_, {rejectWithValue}) => {
    try {
      const sources = await apiService.getSources();
      return sources;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error?.message || 'Failed to fetch sources',
      );
    }
  },
);

// Slice
const categoriesSlice = createSlice({
  name: 'categories',
  initialState,
  reducers: {
    setSelectedCategory: (state, action: PayloadAction<Category | null>) => {
      state.selectedCategory = action.payload;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // Fetch categories
    builder
      .addCase(fetchCategories.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Fetch sources
    builder
      .addCase(fetchSources.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSources.fulfilled, (state, action) => {
        state.loading = false;
        state.sources = action.payload;
      })
      .addCase(fetchSources.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const {setSelectedCategory, clearError} = categoriesSlice.actions;

// Selectors
export const selectCategories = (state: {categories: CategoriesState}) =>
  state.categories.categories;
export const selectSources = (state: {categories: CategoriesState}) =>
  state.categories.sources;
export const selectSelectedCategory = (state: {categories: CategoriesState}) =>
  state.categories.selectedCategory;
export const selectCategoriesLoading = (state: {categories: CategoriesState}) =>
  state.categories.loading;
export const selectCategoriesError = (state: {categories: CategoriesState}) =>
  state.categories.error;

export default categoriesSlice.reducer;
