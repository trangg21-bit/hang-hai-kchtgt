import api from './api';

export interface RegisterAccountPayload {
  username: string;
  password?: string;
  email: string;
  fullName?: string;
  phone?: string;
}

export interface RegisterResponse {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  status?: string;
  message?: string;
}

export interface PasswordPolicy {
  minLength: number;
  maxLength?: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireDigit: boolean;
  requireSpecialChar: boolean;
}

export interface RegisterConfigResponse {
  passwordPolicy?: PasswordPolicy;
  rsaEncryptionEnabled?: boolean;
  rsaPublicKey?: string;
  rateLimit?: {
    maxRequests: number;
    windowMinutes: number;
  };
}

export const getRegistrationConfig = async (): Promise<RegisterConfigResponse> => {
  const res = await api.get('/register/config');
  return res.data?.data || {};
};

export const registerAccount = async (payload: RegisterAccountPayload): Promise<RegisterResponse> => {
  const res = await api.post('/register', payload);
  return res.data?.data || res.data;
};
