import api from "./api";
import type { PaginatedResponse } from "../types/common";
import type { Status } from "../types/common";

// ============================================================
// Types
// ============================================================
export interface Admin {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  roleId: string;
  roleName: string;
  status: Status;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetType: string;
  targetId?: string;
  targetName?: string;
  ipAddress?: string;
  userAgent?: string;
  result: "success" | "failure";
  details?: string;
  createdAt: string;
}

export interface CreateAdminPayload {
  username: string;
  fullName: string;
  email: string;
  phone?: string;
  password: string;
  roleId: string;
}

export interface UpdateAdminPayload {
  fullName?: string;
  email?: string;
  phone?: string;
  roleId?: string;
  status?: Status;
}

export interface AdminFilters {
  search?: string;
  roleId?: string;
  status?: Status;
}

export interface AuditFilters {
  adminId?: string;
  action?: string;
  result?: "success" | "failure";
  startDate?: string;
  endDate?: string;
}

// ============================================================
// API Response normalizer
// ============================================================
/**
 * Backend returns { success, message, data, timestamp } wrapped in Axios response.
 * Extract the payload data from the ApiResponse envelope.
 */
function extractData<T>(response: any): T {
  return response.data?.data ?? response.data;
}

// ============================================================
// Service -- real API calls
// ============================================================

export const adminService = {
  /**
   * GET /api/admin-accounts
   * Note: Backend returns flat list (no pagination endpoint).
   * Frontend applies pagination client-side for UI consistency.
   */
  async list(
    params?: {
      page?: number;
      pageSize?: number;
      search?: string;
      roleId?: string;
      status?: Status;
    }
  ): Promise<PaginatedResponse<Admin>> {
    const resp = await api.get("/admin-accounts");
    const items: any[] = extractData(resp) ?? [];

    // Client-side filtering (backend has no paginated/list filters yet)
    let filtered: any[] = [...items];

    if (params?.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (a) => (a.username || "").toLowerCase().includes(q)
      );
    }
    if (params?.status) {
      filtered = filtered.filter((a) => {
        const st = a.status?.toLowerCase();
        return st === (params.status as string)?.toLowerCase();
      });
    }

    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const start = (page - 1) * pageSize;

    // Map backend DTO -> frontend Admin interface
    const data: Admin[] = filtered
      .slice(start, start + pageSize)
      .map((item) => ({
        id: item.id ?? String(item.userId),
        username: item.username ?? "",
        fullName: "", // backend does not return fullName in AdminResponse
        email: "", // backend does not return email in AdminResponse
        phone: undefined, // backend does not return phone in AdminResponse
        roleId: item.role ?? "",
        roleName: item.role ?? "",
        status: (item.status?.toLowerCase() as Status) ?? "active",
        lastLoginAt: undefined, // backend does not return lastLoginAt
        createdAt: item.createdAt
          ? new Date(item.createdAt).toISOString()
          : "",
        updatedAt: item.updatedAt
          ? new Date(item.updatedAt).toISOString()
          : "",
      }));

    return {
      data,
      total: filtered.length,
      page,
      pageSize,
    };
  },

  /**
   * GET /api/admin-accounts/:id
   */
  async getById(id: string): Promise<Admin> {
    const resp = await api.get(`/admin-accounts/${id}`);
    const item: any = extractData(resp);
    if (!item) throw new Error("Quáº£n trá»‹ viÃªn khÃ´ng tá»“n táº¡i");

    return {
      id: item.id ?? String(item.userId),
      username: item.username ?? "",
      fullName: "",
      email: "",
      phone: undefined,
      roleId: item.role ?? "",
      roleName: item.role ?? "",
      status: (item.status?.toLowerCase() as Status) ?? "active",
      lastLoginAt: undefined,
      createdAt: item.createdAt
        ? new Date(item.createdAt).toISOString()
        : "",
      updatedAt: item.updatedAt
        ? new Date(item.updatedAt).toISOString()
        : "",
    };
  },

  /**
   * POST /api/admin-accounts
   * Now: Backend CreateAdminWithUserRequest expects { username, password, fullName, email, phone, role }.
   */
  async create(payload: CreateAdminPayload): Promise<Admin> {
    const resp = await api.post("/admin-accounts", {
      username: payload.username,
      password: payload.password,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      role: payload.roleId,
    });
    const item: any = extractData(resp);

    return {
      id: item.id ?? "",
      username: payload.username,
      fullName: payload.fullName,
      email: payload.email,
      phone: payload.phone,
      roleId: payload.roleId,
      roleName: payload.roleId,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  /**
   * PUT /api/admin-accounts/:id
   */
  async update(id: string, payload: UpdateAdminPayload): Promise<Admin> {
    const resp = await api.put(`/admin-accounts/${id}`, {
      role: payload.roleId,
      status: payload.status?.toUpperCase(),
      modules: [],
    });
    const item: any = extractData(resp);

    return {
      id: item.id ?? id,
      username: item.username ?? "",
      fullName: payload.fullName ?? "",
      email: payload.email ?? "",
      phone: payload.phone,
      roleId: payload.roleId ?? item.role ?? "",
      roleName: payload.roleId ?? item.role ?? "",
      status:
        (payload.status ?? item.status?.toLowerCase()) as Status ?? "active",
      createdAt: item.createdAt
        ? new Date(item.createdAt).toISOString()
        : "",
      updatedAt: item.updatedAt
        ? new Date(item.updatedAt).toISOString()
        : "",
    };
  },

  /**
   * DELETE /api/admin-accounts/:id
   */
  async delete(id: string): Promise<void> {
    await api.delete(`/admin-accounts/${id}`);
  },

  /**
   * Toggle admin lock status -> maps to PUT /admin-accounts/:id with status update.
   */
  async toggleLock(id: string): Promise<Admin> {
    // Fetch current status first
    const current = await this.getById(id);
    const newStatus = current.status === "locked" ? "active" : "locked";

    const resp = await api.put(`/admin-accounts/${id}`, {
      status: newStatus.toUpperCase(),
      modules: [],
    });
    const item: any = extractData(resp);

    return {
      id: item.id ?? id,
      username: item.username ?? current.username,
      fullName: current.fullName,
      email: current.email,
      phone: current.phone,
      roleId: item.role ?? current.roleId,
      roleName: item.role ?? current.roleName,
      status: newStatus as Status,
      createdAt: item.createdAt
        ? new Date(item.createdAt).toISOString()
        : current.createdAt,
      updatedAt:
        item.updatedAt?.toISOString() ?? new Date().toISOString(),
    };
  },

  // --- Audit ---
  /**
   * Admin audit logs endpoint (if implemented).
   * Returns empty paginated response when endpoint is not available.
   */
  async getAuditLogs(
    params?: {
      page?: number;
      pageSize?: number;
      adminId?: string;
      action?: string;
      result?: "success" | "failure";
      startDate?: string;
      endDate?: string;
    }
  ): Promise<PaginatedResponse<AdminAuditLog>> {
    try {
      const resp = await api.get("/admin-accounts/audit", {
        params: {
          adminId: params?.adminId,
          action: params?.action,
          result: params?.result,
          startDate: params?.startDate,
          endDate: params?.endDate,
        },
      });
      const items: any[] = extractData(resp) ?? [];

      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const start = (page - 1) * pageSize;

      const data: AdminAuditLog[] = items
        .slice(start, start + pageSize)
        .map((item) => ({
          id: item.id ?? "",
          adminId: item.adminId ?? "",
          adminName: item.adminName ?? "",
          action: item.action ?? "",
          targetType: item.targetType ?? "",
          targetId: item.targetId,
          targetName: item.targetName,
          ipAddress: item.ipAddress,
          userAgent: item.userAgent,
          result: item.result ?? "success",
          details: item.details,
          createdAt: item.createdAt
            ? new Date(item.createdAt).toISOString()
            : "",
        }));

      return {
        data,
        total: items.length,
        page,
        pageSize,
      };
    } catch {
      // Audit endpoint not yet implemented -> return empty paginated result
      return {
        data: [],
        total: 0,
        page: params?.page || 1,
        pageSize: params?.pageSize || 10,
      };
    }
  },

  async getAuditStats(
    adminId?: string
  ): Promise<{
    total: number;
    successCount: number;
    failureCount: number;
    topActions: Array<{ action: string; count: number }>;
  }> {
    try {
      const resp = await api.get("/admin-accounts/audit/stats", {
        params: { adminId },
      });
      return extractData(resp);
    } catch {
      // Stats endpoint not yet implemented -> return zeroes
      return {
        total: 0,
        successCount: 0,
        failureCount: 0,
        topActions: [],
      };
    }
  },
};
