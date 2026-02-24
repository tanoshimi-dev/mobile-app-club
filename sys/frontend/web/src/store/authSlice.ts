/**
 * Auth Redux Slice
 */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiService } from '../services/api';
import {
  AuthState,
  User,
  LoginRequest,
  RegisterRequest,
} from '../types';

/**
 * Extract a human-readable error message from a DRF error response.
 */
function extractErrorMessage(error: any, fallback: string): string {
  if (!error?.response) {
    if (error?.message === 'Network Error') {
      return 'Cannot connect to server. Please check your connection.';
    }
    return error?.message || fallback;
  }
  const data = error.response.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  if (typeof data.detail === 'string') return data.detail;
  if (typeof data === 'object') {
    const messages: string[] = [];
    for (const key of Object.keys(data)) {
      const val = data[key];
      const msg = Array.isArray(val) ? val[0] : val;
      if (typeof msg === 'string') {
        messages.push(key === 'non_field_errors' ? msg : `${key}: ${msg}`);
      }
    }
    if (messages.length) return messages.join('\n');
  }
  return fallback;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (data: RegisterRequest, { rejectWithValue }) => {
    try {
      await apiService.register(data);
      // Auto-login after successful registration
      const response = await apiService.login({
        email: data.email,
        password: data.password,
      });
      apiService.setAccessToken(response.access);
      apiService.setRefreshToken(response.refresh);
      apiService.setUser(response.user);
      return response;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error, 'Registration failed'));
    }
  },
);

export const login = createAsyncThunk(
  'auth/login',
  async (data: LoginRequest, { rejectWithValue }) => {
    try {
      const response = await apiService.login(data);
      apiService.setAccessToken(response.access);
      apiService.setRefreshToken(response.refresh);
      apiService.setUser(response.user);
      return response;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error, 'Login failed'));
    }
  },
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { auth: AuthState };
      const refreshToken = state.auth.refreshToken;

      if (refreshToken) {
        await apiService.logout(refreshToken);
      }

      apiService.clearTokens();
      return null;
    } catch (error: any) {
      // Clear tokens even if API call fails
      apiService.clearTokens();
      return rejectWithValue(extractErrorMessage(error, 'Logout failed'));
    }
  },
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async (_, { rejectWithValue }) => {
    try {
      const { accessToken, refreshToken } = apiService.getStoredTokens();
      const user = apiService.getStoredUser();

      if (accessToken && refreshToken && user) {
        return { accessToken, refreshToken, user };
      }

      return null;
    } catch (error) {
      return rejectWithValue('Failed to load stored auth');
    }
  },
);

export const fetchUserProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const user = await apiService.getMe();
      apiService.setUser(user);
      return user;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error, 'Failed to fetch profile'));
    }
  },
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: Partial<User>, { rejectWithValue }) => {
    try {
      const user = await apiService.updateMe(data);
      apiService.setUser(user);
      return user;
    } catch (error: any) {
      return rejectWithValue(extractErrorMessage(error, 'Failed to update profile'));
    }
  },
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setTokens: (
      state,
      action: PayloadAction<{ accessToken: string; refreshToken: string }>,
    ) => {
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = true;
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.loading = true;
      })
      .addCase(logout.fulfilled, () => {
        return initialState;
      })
      .addCase(logout.rejected, () => {
        return initialState;
      });

    // Load stored auth
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.user = action.payload.user;
          state.accessToken = action.payload.accessToken;
          state.refreshToken = action.payload.refreshToken;
          state.isAuthenticated = true;
        }
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.loading = false;
      });

    // Fetch user profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Update profile
    builder
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, setTokens } = authSlice.actions;

// Selectors
export const selectAuth = (state: { auth: AuthState }) => state.auth ?? initialState;
export const selectUser = (state: { auth: AuthState }) => state.auth?.user ?? null;
export const selectIsAuthenticated = (state: { auth: AuthState }) =>
  state.auth?.isAuthenticated ?? false;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth?.loading ?? false;
export const selectAuthError = (state: { auth: AuthState }) => state.auth?.error ?? null;
export const selectAccessToken = (state: { auth: AuthState }) =>
  state.auth?.accessToken ?? null;

export default authSlice.reducer;
