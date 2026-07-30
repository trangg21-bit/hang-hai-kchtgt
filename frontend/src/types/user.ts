import type { Status } from './common';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  roleId: string;
  roleName: string;
  orgUnitId?: string;
  orgUnitName?: string;
  status: Status;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  username: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
  orgUnitId?: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  role?: string;
  orgUnitId?: string;
  status?: Status;
}

export interface UserFilters {
  search?: string;
  roleId?: string;
  status?: Status;
}
