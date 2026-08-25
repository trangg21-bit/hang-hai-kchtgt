import { create } from 'zustand';
import api from '../services/api';

interface JwtPayload {
  sub?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  user_id?: string;
  email?: string;
  totp_enabled?: boolean;
  role_level?: number;
  permission_version?: number;
  iat?: number;
  exp?: number;
}

interface User {
  username: string;
  fullName: string;
  permissions: string[];
  role: string;
  status: string;
  userId?: string;
  email?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, _password: string, token: string) => void;
  logout: () => Promise<void>;
  replaceAccessToken: (newToken: string, reqToken?: string | null) => void;
  syncFromStorage: (storedToken: string | null) => void;
}

const base64urlDecode = (str: string): string => {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return decodeURIComponent(Array.from(atob(b64), c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
};

const parseJwt = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(base64urlDecode(parts[1]));
    if (!payload || typeof payload !== 'object') return null;
    return payload;
  } catch {
    return null;
  }
};

export const useAuthStore = create<AuthState>((set, get) => {
  const storedToken = typeof localStorage !== 'undefined' ? localStorage.getItem('auth_token') : null;
  let initialUser: User | null = null;
  if (storedToken) {
    const claims = parseJwt(storedToken);
    if (claims && claims.sub && claims.user_id && typeof claims.exp === 'number' && claims.exp * 1000 >= Date.now()) {
      initialUser = {
        username: claims.sub,
        fullName: claims.sub || 'Unknown User',
        permissions: claims.permissions || [],
        role: claims.role || 'ROLE_USER',
        status: 'authenticated',
        userId: claims.user_id,
        email: claims.email,
      };
    } else if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('auth_token');
    }
  }

  return {
    user: initialUser,
    isAuthenticated: !!initialUser,
    token: initialUser ? storedToken : null,

    login: (username: string, _password: string, token: string) => {
      const claims = parseJwt(token);
      if (
        !claims ||
        !claims.sub ||
        !claims.user_id ||
        typeof claims.exp !== 'number' ||
        claims.exp * 1000 < Date.now()
      ) {
        console.error('[authStore] Rejected invalid or expired token on login');
        return;
      }

      const role = claims.role || 'ROLE_USER';
      set({
        user: {
          username: username || claims.sub,
          fullName: claims.sub || username || 'Unknown User',
          permissions: claims.permissions || [],
          role,
          status: 'authenticated',
          userId: claims.user_id,
          email: claims.email,
        },
        isAuthenticated: true,
        token,
      });
      localStorage.setItem('auth_token', token);
    },

    replaceAccessToken: (newToken: string, reqToken?: string | null) => {
      if (!newToken || typeof newToken !== 'string') return;

      const state = get();

      // Guard 1: Verify that an active authenticated session exists.
      // If user logged out while request was in-flight, do NOT resurrect session.
      if (!state.isAuthenticated || !state.user || !state.token) {
        return;
      }

      // Guard 2: If the request was made with a specific token, ensure it matches current session token.
      if (reqToken && reqToken !== state.token) {
        return;
      }

      const claims = parseJwt(newToken);

      // Guard 3: Reject malformed tokens without required claims (sub, user_id, iat, exp)
      if (
        !claims ||
        !claims.sub ||
        !claims.user_id ||
        typeof claims.iat !== 'number' ||
        typeof claims.exp !== 'number'
      ) {
        return;
      }

      // Guard 3b: Reject expired tokens
      if (claims.exp * 1000 < Date.now()) {
        return;
      }

      // Guard 4: Verify user identity (user_id and username) matches current logged-in user.
      if (state.user.userId && claims.user_id !== state.user.userId) {
        return;
      }
      if (state.user.username && claims.sub !== state.user.username) {
        return;
      }

      // Guard 5: Monotonic version + iat check to prevent stale out-of-order race conditions.
      const newVersion = claims.permission_version ?? 0;
      const currentClaims = parseJwt(state.token);
      const currentVersion = currentClaims?.permission_version ?? -1;

      const newIat = claims.iat;
      const currentIat = currentClaims?.iat ?? 0;

      // Condition: strictly higher version, OR same version with strictly newer issued-at (iat) timestamp
      const isStrictlyNewer = newVersion > currentVersion || (newVersion === currentVersion && newIat > currentIat);

      if (isStrictlyNewer && newToken !== state.token) {
        const role = claims.role || state.user.role || 'ROLE_USER';
        set({
          user: {
            username: claims.sub,
            fullName: claims.sub || state.user.fullName || 'Unknown User',
            permissions: claims.permissions || [],
            role,
            status: 'authenticated',
            userId: claims.user_id,
            email: claims.email || state.user.email,
          },
          isAuthenticated: true,
          token: newToken,
        });
        localStorage.setItem('auth_token', newToken);
      }
    },

    syncFromStorage: (storedToken: string | null) => {
      if (!storedToken) {
        // Token was removed in another tab (logout)
        set({ user: null, isAuthenticated: false, token: null });
        return;
      }

      const claims = parseJwt(storedToken);
      if (
        !claims ||
        !claims.sub ||
        !claims.user_id ||
        typeof claims.exp !== 'number' ||
        claims.exp * 1000 < Date.now()
      ) {
        // Token in storage is malformed or expired
        set({ user: null, isAuthenticated: false, token: null });
        return;
      }

      const state = get();
      const isDifferentUser =
        !state.isAuthenticated ||
        !state.user ||
        claims.user_id !== state.user.userId ||
        claims.sub !== state.user.username;

      if (isDifferentUser) {
        // Switched account in another tab -> adopt new user session immediately
        const role = claims.role || 'ROLE_USER';
        set({
          user: {
            username: claims.sub,
            fullName: claims.sub || 'Unknown User',
            permissions: claims.permissions || [],
            role,
            status: 'authenticated',
            userId: claims.user_id,
            email: claims.email,
          },
          isAuthenticated: true,
          token: storedToken,
        });
      } else {
        // Same user session -> upgrade token if newer
        get().replaceAccessToken(storedToken);
      }
    },

    logout: async () => {
      try {
        await api.post('/auth/logout');
      } catch { /* silent — still clear state even if API fails */ }
      set({ user: null, isAuthenticated: false, token: null });
      localStorage.removeItem('auth_token');
    },
  };
});

// Cross-tab synchronization: sync state across tabs when localStorage changes
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'auth_token') {
      useAuthStore.getState().syncFromStorage(event.newValue);
    }
  });
}
