import authReducer, {
  clearError,
  setTokens,
  login,
  register,
  logout,
  loadStoredAuth,
  fetchUserProfile,
  updateProfile,
} from '../authSlice';
import {AuthState} from '../../../types';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

const mockUser = {
  id: 1,
  email: 'test@example.com',
  username: 'testuser',
  created_at: '2026-01-01T00:00:00Z',
};

describe('authSlice', () => {
  describe('reducers', () => {
    it('should return initial state', () => {
      expect(authReducer(undefined, {type: 'unknown'})).toEqual(initialState);
    });

    it('should handle clearError', () => {
      const state = {...initialState, error: 'some error'};
      expect(authReducer(state, clearError()).error).toBeNull();
    });

    it('should handle setTokens', () => {
      const tokens = {accessToken: 'access123', refreshToken: 'refresh123'};
      const state = authReducer(initialState, setTokens(tokens));
      expect(state.accessToken).toBe('access123');
      expect(state.refreshToken).toBe('refresh123');
      expect(state.isAuthenticated).toBe(true);
    });
  });

  describe('login', () => {
    it('should set loading on pending', () => {
      const action = {type: login.pending.type};
      const state = authReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set user and tokens on fulfilled', () => {
      const payload = {access: 'a', refresh: 'r', user: mockUser};
      const action = {type: login.fulfilled.type, payload};
      const state = authReducer(initialState, action);
      expect(state.user).toEqual(mockUser);
      expect(state.accessToken).toBe('a');
      expect(state.refreshToken).toBe('r');
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
    });

    it('should set error on rejected', () => {
      const action = {type: login.rejected.type, payload: 'Login failed'};
      const state = authReducer(initialState, action);
      expect(state.error).toBe('Login failed');
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('register', () => {
    it('should set loading on pending', () => {
      const action = {type: register.pending.type};
      const state = authReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set user and tokens on fulfilled', () => {
      const payload = {access: 'a', refresh: 'r', user: mockUser};
      const action = {type: register.fulfilled.type, payload};
      const state = authReducer(initialState, action);
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should set error on rejected', () => {
      const action = {type: register.rejected.type, payload: 'Registration failed'};
      const state = authReducer(initialState, action);
      expect(state.error).toBe('Registration failed');
    });
  });

  describe('logout', () => {
    it('should set loading on pending', () => {
      const authed = {
        ...initialState,
        user: mockUser,
        isAuthenticated: true,
        accessToken: 'a',
        refreshToken: 'r',
      };
      const action = {type: logout.pending.type};
      const state = authReducer(authed, action);
      expect(state.loading).toBe(true);
    });

    it('should reset to initial state on fulfilled', () => {
      const authed = {
        ...initialState,
        user: mockUser,
        isAuthenticated: true,
        accessToken: 'a',
        refreshToken: 'r',
      };
      const action = {type: logout.fulfilled.type};
      const state = authReducer(authed, action);
      expect(state).toEqual(initialState);
    });

    it('should reset to initial state on rejected', () => {
      const authed = {
        ...initialState,
        user: mockUser,
        isAuthenticated: true,
      };
      const action = {type: logout.rejected.type, payload: 'Logout failed'};
      const state = authReducer(authed, action);
      expect(state).toEqual(initialState);
    });
  });

  describe('loadStoredAuth', () => {
    it('should set loading on pending', () => {
      const action = {type: loadStoredAuth.pending.type};
      const state = authReducer(initialState, action);
      expect(state.loading).toBe(true);
    });

    it('should restore auth on fulfilled with data', () => {
      const payload = {user: mockUser, accessToken: 'a', refreshToken: 'r'};
      const action = {type: loadStoredAuth.fulfilled.type, payload};
      const state = authReducer(initialState, action);
      expect(state.user).toEqual(mockUser);
      expect(state.isAuthenticated).toBe(true);
      expect(state.loading).toBe(false);
    });

    it('should not change auth on fulfilled with null', () => {
      const action = {type: loadStoredAuth.fulfilled.type, payload: null};
      const state = authReducer(initialState, action);
      expect(state.isAuthenticated).toBe(false);
      expect(state.user).toBeNull();
      expect(state.loading).toBe(false);
    });

    it('should stop loading on rejected', () => {
      const action = {type: loadStoredAuth.rejected.type, payload: 'Failed'};
      const state = authReducer({...initialState, loading: true}, action);
      expect(state.loading).toBe(false);
    });
  });

  describe('fetchUserProfile', () => {
    it('should set loading on pending', () => {
      const action = {type: fetchUserProfile.pending.type};
      const state = authReducer(initialState, action);
      expect(state.loading).toBe(true);
    });

    it('should set user on fulfilled', () => {
      const action = {type: fetchUserProfile.fulfilled.type, payload: mockUser};
      const state = authReducer(initialState, action);
      expect(state.user).toEqual(mockUser);
      expect(state.loading).toBe(false);
    });

    it('should set error on rejected', () => {
      const action = {type: fetchUserProfile.rejected.type, payload: 'Failed'};
      const state = authReducer(initialState, action);
      expect(state.error).toBe('Failed');
    });
  });

  describe('updateProfile', () => {
    it('should set loading on pending', () => {
      const action = {type: updateProfile.pending.type};
      const state = authReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should update user on fulfilled', () => {
      const updatedUser = {...mockUser, username: 'newname'};
      const action = {type: updateProfile.fulfilled.type, payload: updatedUser};
      const state = authReducer({...initialState, user: mockUser}, action);
      expect(state.user?.username).toBe('newname');
      expect(state.loading).toBe(false);
    });

    it('should set error on rejected', () => {
      const action = {type: updateProfile.rejected.type, payload: 'Failed'};
      const state = authReducer(initialState, action);
      expect(state.error).toBe('Failed');
      expect(state.loading).toBe(false);
    });
  });
});
