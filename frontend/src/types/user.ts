import type { Status } from './common';

export type UserStatus =
  | Status
  | 'pending_verification'
  | 'pending_approval'
  | 'PENDING_VERIFICATION'
  | 'PENDING_APPROVAL';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  department?: string;
  position?: string;
  note?: string;
  avatar?: string;
  orgUnitId?: string;
  orgUnitName?: string;
  status: UserStatus;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  groupIds?: string[];
  groupNames?: string[];
  permissionCodes?: string[];
  createdBy?: string;
  createdByName?: string;
  updatedBy?: string;
  updatedByName?: string;
  deletedAt?: string;
  deletedBy?: string;
  deletedByName?: string;
}

export interface CreateUserPayload {
  username?: string;
  fullName: string;
  email: string;
  phone: string;
  password?: string;
  permissionCodes?: string[];
  orgUnitId?: string;
  status: UserStatus;
  address?: string;
  department?: string;
  position?: string;
  note?: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  permissionCodes?: string[];
  orgUnitId?: string;
  status?: UserStatus;
  address?: string;
  department?: string;
  position?: string;
  note?: string;
}

export interface UserFilters {
  search?: string;
  status?: UserStatus;
}
