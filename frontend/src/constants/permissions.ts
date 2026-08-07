/**
 * Centralized Permission Constants (RBAC Tokens)
 * 
 * Single source of truth for all permission keys across the Frontend.
 * Do not hardcode permission string literals in UI components.
 * Always import from this file.
 */

export const PERMISSIONS = {
  /** Quản trị hệ thống */
  ADMIN: {
    MANAGE: 'admin:manage',
    VIEW: 'admin:view',
  },

  /** Quản lý người dùng */
  USER: {
    READ: 'user:read',
    CREATE: 'user:create',
    UPDATE: 'user:update',
    DELETE: 'user:delete',
    MANAGE: 'user:manage',
    APPROVE: 'user:approve',
  },

  /** Quản lý vai trò */
  ROLE: {
    MANAGE: 'role:manage',
  },

  /** Quản lý đơn vị tổ chức */
  ORGUNIT: {
    READ: 'orgunit:read',
    MANAGE: 'orgunit:manage',
    APPROVE: 'orgunit:approve',
  },

  /** Quản lý nhóm người dùng */
  GROUP: {
    READ: 'group:read',
    CREATE: 'group:create',
    EDIT: 'group:edit',
    DELETE: 'group:delete',
    LOCK: 'group:lock',
    MANAGE: 'group:manage',
    COPY: 'group:copy',
    HISTORY: 'group:history',
    PERMISSION: 'group:permission',
  },

  /** Cảng biển (M-002) */
  PORT: {
    READ: 'port:read',
    CREATE: 'port:create',
    UPDATE: 'port:update',
    DELETE: 'port:delete',
    APPROVE_C1: 'port:approvec1',
    APPROVE_C2: 'port:approvec2',
    HISTORY: 'port:history',
  },

  /** Bến cảng (M-002) */
  BERTH: {
    READ: 'berth:read',
    CREATE: 'berth:create',
    UPDATE: 'berth:update',
    DELETE: 'berth:delete',
    APPROVE_C1: 'berth:approvec1',
    APPROVE_C2: 'berth:approvec2',
    HISTORY: 'berth:history',
  },

  /** Cầu cảng (M-002) */
  PIER: {
    READ: 'pier:read',
    CREATE: 'pier:create',
    UPDATE: 'pier:update',
    DELETE: 'pier:delete',
    APPROVE_C1: 'pier:approvec1',
    APPROVE_C2: 'pier:approvec2',
    HISTORY: 'pier:history',
  },

  /** Cảng cạn (M-002) */
  DRYPORT: {
    READ: 'dryport:read',
    CREATE: 'dryport:create',
    UPDATE: 'dryport:update',
    DELETE: 'dryport:delete',
    APPROVE_C1: 'dryport:approvec1',
    APPROVE_C2: 'dryport:approvec2',
    HISTORY: 'dryport:history',
  },

  /** Vùng nước (M-002) */
  WATERAREA: {
    READ: 'waterarea:read',
    CREATE: 'waterarea:create',
    UPDATE: 'waterarea:update',
    DELETE: 'waterarea:delete',
    APPROVE_C1: 'waterarea:approvec1',
    APPROVE_C2: 'waterarea:approvec2',
    HISTORY: 'waterarea:history',
  },

  /** Luồng hàng hải (M-003) */
  NAVIGATIONCHANNEL: {
    READ: 'navigationchannel:read',
    CREATE: 'navigationchannel:create',
    UPDATE: 'navigationchannel:update',
    DELETE: 'navigationchannel:delete',
    APPROVE_C1: 'navigationchannel:approvec1',
    APPROVE_C2: 'navigationchannel:approvec2',
    HISTORY: 'navigationchannel:history',
  },

  /** Đê chắn sóng / Đê chắn cát (M-003) */
  DIKEREVETMENT: {
    READ: 'dikerevetment:read',
    CREATE: 'dikerevetment:create',
    UPDATE: 'dikerevetment:update',
    DELETE: 'dikerevetment:delete',
    APPROVE_C1: 'dikerevetment:approvec1',
    APPROVE_C2: 'dikerevetment:approvec2',
    HISTORY: 'dikerevetment:history',
  },

  /** Nhà trạm đèn biển (M-003) */
  LIGHTHOUSESTATION: {
    READ: 'lighthousestation:read',
    CREATE: 'lighthousestation:create',
    UPDATE: 'lighthousestation:update',
    DELETE: 'lighthousestation:delete',
    APPROVE_C1: 'lighthousestation:approvec1',
    APPROVE_C2: 'lighthousestation:approvec2',
    HISTORY: 'lighthousestation:history',
  },

  /** Trạm Radar (M-003) */
  RADARSTATION: {
    READ: 'radarstation:read',
    CREATE: 'radarstation:create',
    UPDATE: 'radarstation:update',
    DELETE: 'radarstation:delete',
    APPROVE_C1: 'radarstation:approvec1',
    APPROVE_C2: 'radarstation:approvec2',
    HISTORY: 'radarstation:history',
  },

  /** Cơ sở sửa chữa / đóng tàu (M-003) */
  SHIPREPAIRFACILITY: {
    READ: 'shiprepairfacility:read',
    CREATE: 'shiprepairfacility:create',
    UPDATE: 'shiprepairfacility:update',
    DELETE: 'shiprepairfacility:delete',
    APPROVE_C1: 'shiprepairfacility:approvec1',
    APPROVE_C2: 'shiprepairfacility:approvec2',
    HISTORY: 'shiprepairfacility:history',
  },

  /** Phao / Đèn biển / Báo hiệu (M-003) */
  BUOY: {
    READ: 'buoy:read',
    CREATE: 'buoy:create',
    UPDATE: 'buoy:update',
    DELETE: 'buoy:delete',
    APPROVE_C1: 'buoy:approvec1',
    APPROVE_C2: 'buoy:approvec2',
    HISTORY: 'buoy:history',
  },

  /** Văn bản pháp lý (M-001) */
  DOCUMENT: {
    READ: 'document:read',
    CREATE: 'document:create',
    UPDATE: 'document:update',
    DELETE: 'document:delete',
  },

  /** Bản đồ & Lớp GIS */
  MAP: {
    MANAGE: 'map:manage',
  },

  /** Nhật ký hệ thống */
  LOG: {
    MANAGE: 'log:manage',
  },

  /** Kết nối chia sẻ dữ liệu */
  CONNECTION: {
    READ: 'connection:read',
    MANAGE: 'connection:manage',
  },
} as const;

export type PermissionKey = typeof PERMISSIONS[keyof typeof PERMISSIONS][keyof typeof PERMISSIONS[keyof typeof PERMISSIONS]];
