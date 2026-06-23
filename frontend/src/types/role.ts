export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  userCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRolePayload {
  name: string;
  code: string;
  description: string;
  permissions: string[];
}

export interface UpdateRolePayload {
  name?: string;
  code?: string;
  description?: string;
  permissions?: string[];
}
