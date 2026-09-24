import api from './api';
import type { OrgUnitTreeOption } from '../components/org-unit/orgUnitHelpers';

export interface RegisterAccountPayload {
  username: string;
  password?: string;
  email: string;
  fullName?: string;
  phone?: string;
  orgUnitId: string;
  department?: string;
  position?: string;
}

export interface RegisterResponse {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  phone?: string;
  orgUnitId?: string;
  orgUnitName?: string;
  department?: string;
  position?: string;
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

export const getRegistrationOrgUnits = async (): Promise<OrgUnitTreeOption[]> => {
  const res = await api.get('/register/org-units');
  const list = res.data?.data || [];
  return list.map((o: any) => ({
    id: String(o.id),
    name: o.name,
    code: o.code,
    parentId: o.parentId ? String(o.parentId) : undefined,
  }));
};

export const registerAccount = async (payload: RegisterAccountPayload): Promise<RegisterResponse> => {
  const res = await api.post('/register', payload);
  return res.data?.data || res.data;
};

