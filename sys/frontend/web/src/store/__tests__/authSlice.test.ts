import authReducer, {
  clearError,
  setTokens,
  login,
  register,
  logout,
  loadStoredAuth,
} from '../authSlice';
import { AuthState } from '../../types';

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

describe('authSlice', () => {
  describe('reducers', () => {
    it('should return the initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
    });

    it('should handle clearError', () => {
      const state = { ...initialState, error: 'some error' };
      expect(authReducer(state, clearError()).error).toBeNull();
    });

    it('should handle setTokens', () => {
      const result = authReducer(
        initialState,
        setTokens({ accessToken: 'access123', refreshToken: 'refresh123' }),
      );
      expect(result.accessToken).toBe('access123');
      expect(result.refreshToken).toBe('refresh123');
      expect(result.isAuthenticated).toBe(true);
    });
  });

  describe('login thunk', () => {
    it('should set loading on pending', () => {
      const action = { type: login.pending.type };
      const state = authReducer(initialState, action);
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set user and tokens on fulfilled', () => {
      const action = {
        type: login.fulfilled.type,
        payload: {
          access: 'token123',
          refresh: 'refresh123',
          user: { id: 1, email: 'test@test.com', username: 'test', created_at: '' },
        },
      };
      const state = authReducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('test@test.com');
      expect(state.accessToken).toBe('token123');
    });

    it('should set error on rejected', () => {
      const action = {
        type: login.rejected.type,
        payload: 'Invalid credentials',
      };
      const state = authReducer(initialState, action);
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Invalid credentials');
      expect(state.isAuthenticated).toBe(false);
    });
  });

  describe('register thunk', () => {
    it('should set loading on pending', () => {
      const action = { type: register.pending.type };
      const state = authReducer(initialState, action);
      expect(state.loading).toBe(true);
    });

    it('should set user on fulfilled', () => {
      const action = {
        type: register.fulfilled.type,
        payload: {
          access: 'a',
          refresh: 'r',
          user: { id: 1, email: 'new@test.com', username: 'new', created_at: '' },
        },
      };
      const state = authReducer(initialState, action);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.username).toBe('new');
    });
  });

  describe('logout thunk', () => {
    it('should reset to initial state on fulfilled', () => {
      const loggedIn: AuthState = {
        ...initialState,
        user: { id: 1, email: 't@t.com', username: 't', created_at: '' },
        isAuthenticated: true,
        accessToken: 'a',
        refreshToken: 'r',
      };
      const action = { type: logout.fulfilled.type };
      const state = authReducer(loggedIn, action);
      expect(state).toEqual(initialState);
    });

    it('should reset to initial state even on rejected', () => {
      const action = { type: logout.rejected.type };
      const state = authReducer(initialState, action);
      expect(state).toEqual(initialState);
    });
  });

  describe('loadStoredAuth thunk', () => {
    it('should set loading on pending', () => {
      const action = { type: loadStoredAuth.pending.type };
      const state = authReducer(initialState, action);
      expect(state.loading).toBe(true);
    });

    it('should restore auth on fulfilled with data', () => {
      const action = {
        type: loadStoredAuth.fulfilled.type,
        payload: {
          accessToken: 'a',
          refreshToken: 'r',
          user: { id: 1, email: 'stored@test.com', username: 'stored', created_at: '' },
        },
      };
      const state = authReducer(initialState, action);
      expect(state.isAuthenticated).toBe(true);
      expect(state.user?.email).toBe('stored@test.com');
    });

    it('should stay unauthenticated when payload is null', () => {
      const action = { type: loadStoredAuth.fulfilled.type, payload: null };
      const state = authReducer(initialState, action);
      expect(state.isAuthenticated).toBe(false);
      expect(state.loading).toBe(false);
    });
  });
});
