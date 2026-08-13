import type { Status } from './common';

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  avatar?: string;
  orgUnitId?: string;
  orgUnitName?: string;
  status: Status;
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
  username: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
  permissionCodes?: string[];
  orgUnitId?: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  permissionCodes?: string[];
  orgUnitId?: string;
  status?: Status;
}

export interface UserFilters {
  search?: string;
  status?: Status;
}
