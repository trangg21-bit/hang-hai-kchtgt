import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

// Simple in-memory localStorage mock for node test runner
const storageMap: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => storageMap[key] || null,
  setItem: (key: string, value: string) => { storageMap[key] = value; },
  removeItem: (key: string) => { delete storageMap[key]; },
  clear: () => { Object.keys(storageMap).forEach(k => delete storageMap[k]); },
};
globalThis.localStorage = localStorageMock as any;

describe('authStore replaceAccessToken and multi-tab sync', () => {
  beforeEach(() => {
    localStorageMock.clear();
    useAuthStore.setState({
      user: {
        username: 'alice',
        fullName: 'Alice Nguyen',
        permissions: ['port:read'],
        role: 'ROLE_USER',
        status: 'authenticated',
        userId: '11111111-1111-1111-1111-111111111111',
        email: 'alice@hanghai.vn',
      },
      isAuthenticated: true,
      token: 'valid.initial.token',
    });
  });

  const makeJwt = (payload: Record<string, unknown>) => {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const body = btoa(JSON.stringify(payload));
    return `${header}.${body}.signature`;
  };

  it('should reject malformed tokens without required claims', () => {
    const initialToken = useAuthStore.getState().token;

    // Missing sub, user_id, iat, exp
    useAuthStore.getState().replaceAccessToken('invalid-token-without-dots');
    expect(useAuthStore.getState().token).toBe(initialToken);

    // Missing user_id and iat
    const partialJwt = makeJwt({ sub: 'alice', permission_version: 2 });
    useAuthStore.getState().replaceAccessToken(partialJwt);
    expect(useAuthStore.getState().token).toBe(initialToken);
  });

  it('should reject expired tokens', () => {
    const initialToken = useAuthStore.getState().token;
    const expiredJwt = makeJwt({
      sub: 'alice',
      user_id: '11111111-1111-1111-1111-111111111111',
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      permission_version: 5,
      permissions: ['port:read', 'port:create'],
    });

    useAuthStore.getState().replaceAccessToken(expiredJwt);
    expect(useAuthStore.getState().token).toBe(initialToken);
  });

  it('should reject token belonging to a different user', () => {
    const initialToken = useAuthStore.getState().token;
    const otherUserJwt = makeJwt({
      sub: 'bob',
      user_id: '22222222-2222-2222-2222-222222222222',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      permission_version: 5,
    });

    useAuthStore.getState().replaceAccessToken(otherUserJwt);
    expect(useAuthStore.getState().token).toBe(initialToken);
  });

  it('should accept valid, newer token and update store & localStorage', () => {
    const validJwt = makeJwt({
      sub: 'alice',
      user_id: '11111111-1111-1111-1111-111111111111',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      permission_version: 2,
      permissions: ['port:read', 'port:create', 'berth:read'],
    });

    useAuthStore.getState().replaceAccessToken(validJwt);

    const state = useAuthStore.getState();
    expect(state.token).toBe(validJwt);
    expect(state.user?.permissions).toEqual(['port:read', 'port:create', 'berth:read']);
    expect(localStorage.getItem('auth_token')).toBe(validJwt);
  });

  it('should reject invalid or expired token during login', () => {
    useAuthStore.setState({ user: null, isAuthenticated: false, token: null });

    // Try logging in with malformed token
    useAuthStore.getState().login('alice', 'password', 'invalid-token');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();

    // Try logging in with expired token
    const expiredJwt = makeJwt({
      sub: 'alice',
      user_id: '11111111-1111-1111-1111-111111111111',
      iat: Math.floor(Date.now() / 1000) - 7200,
      exp: Math.floor(Date.now() / 1000) - 3600,
    });
    useAuthStore.getState().login('alice', 'password', expiredJwt);
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });

  it('should switch user when storage event receives a different user token (multi-tab switch)', () => {
    // Tab A is currently alice
    expect(useAuthStore.getState().user?.username).toBe('alice');

    // Tab B logs in as bob and writes to localStorage
    const bobJwt = makeJwt({
      sub: 'bob',
      user_id: '22222222-2222-2222-2222-222222222222',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
      permission_version: 1,
      role: 'ROLE_ADMIN',
      permissions: ['user:read', 'user:manage'],
    });

    // Tab A receives storage sync
    useAuthStore.getState().syncFromStorage(bobJwt);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.username).toBe('bob');
    expect(state.user?.userId).toBe('22222222-2222-2222-2222-222222222222');
    expect(state.user?.permissions).toEqual(['user:read', 'user:manage']);
    expect(state.token).toBe(bobJwt);
  });

  it('should clear session when storage event receives null token (multi-tab logout)', () => {
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    // Another tab logs out
    useAuthStore.getState().syncFromStorage(null);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
  });
});
