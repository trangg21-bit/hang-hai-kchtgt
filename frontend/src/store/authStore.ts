import { create } from 'zustand';

interface JwtPayload {
  sub?: string;
  role?: string;
  roles?: string[];
  permissions?: string[];
  user_id?: string;
  totp_enabled?: boolean;
  role_level?: number;
}

interface User {
  username: string;
  fullName: string;
  permissions: string[];
  role: string;
  status: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (username: string, _password: string, token: string) => void;
  logout: () => void;
}

const base64urlDecode = (str: string): string => {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) b64 += '=';
  return decodeURIComponent(Array.from(atob(b64), c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
};

const parseJwt = (token: string): JwtPayload => {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return {};
    return JSON.parse(base64urlDecode(parts[1]));
  } catch {
    return {};
  }
};

export const useAuthStore = create<AuthState>((set) => {
  const storedToken = localStorage.getItem('auth_token');
  let initialUser: User | null = null;
  if (storedToken) {
    const claims = parseJwt(storedToken);
    initialUser = {
      username: claims.sub || claims.role?.replace('ROLE_', '') || 'unknown',
      fullName: claims.sub || 'Unknown User',
      permissions: claims.permissions || [],
      role: claims.role || 'ROLE_USER',
      status: 'authenticated',
    };
  }

  return {
    user: initialUser,
    isAuthenticated: !!initialUser,
    token: storedToken || null,

    login: (_username: string, _password: string, token: string) => {
      const claims = parseJwt(token);
      const role = claims.role || 'ROLE_USER';
      set({
        user: {
          username: claims.sub || 'unknown',
          fullName: claims.sub || 'Unknown User',
          permissions: claims.permissions || [],
          role,
          status: 'authenticated',
        },
        isAuthenticated: true,
        token,
      });
      localStorage.setItem('auth_token', token);
    },

    logout: () => {
      set({ user: null, isAuthenticated: false, token: null });
      localStorage.removeItem('auth_token');
    },
  };
});
