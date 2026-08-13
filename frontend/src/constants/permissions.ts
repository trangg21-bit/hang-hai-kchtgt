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
    PERMISSION: 'group:permission',
  },

  /** Quản lý thành viên nhóm — tách khỏi quyền xem nhóm. */
  GROUP_MEMBER: {
    MANAGE: 'groupmember:manage',
  },

  /** Cảng biển (M-002) */
  PORT: {
    READ: 'port:read',
    CREATE: 'port:create',
    UPDATE: 'port:update',
    DELETE: 'port:delete',
    APPROVED: 'port:approved',
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

export const rawPermissionTree = [
  {
    key: 'group_system',
    title: 'Hệ thống & Quản trị',
    children: [
      { key: PERMISSIONS.ADMIN.MANAGE, title: 'Toàn quyền Admin' },
      { key: PERMISSIONS.ADMIN.VIEW, title: 'Xem Admin' },
      { key: PERMISSIONS.MAP.MANAGE, title: 'Quản lý Bản đồ' },
      { key: PERMISSIONS.LOG.MANAGE, title: 'Quản lý Nhật ký' },
      { key: PERMISSIONS.CONNECTION.READ, title: 'Xem Kết nối' },
      { key: PERMISSIONS.CONNECTION.MANAGE, title: 'Quản lý Kết nối' },
    ],
  },
  {
    key: 'group_user',
    title: 'Quản lý Người dùng & Nhóm',
    children: [
      { key: PERMISSIONS.USER.READ, title: 'Xem Người dùng' },
      { key: PERMISSIONS.USER.CREATE, title: 'Thêm Người dùng' },
      { key: PERMISSIONS.USER.UPDATE, title: 'Sửa Người dùng' },
      { key: PERMISSIONS.USER.DELETE, title: 'Xóa Người dùng' },
      { key: PERMISSIONS.USER.MANAGE, title: 'Quản lý Người dùng' },
      { key: PERMISSIONS.USER.APPROVE, title: 'Duyệt Người dùng' },
      { key: PERMISSIONS.GROUP.READ, title: 'Xem Nhóm' },
      { key: PERMISSIONS.GROUP.CREATE, title: 'Thêm Nhóm' },
      { key: PERMISSIONS.GROUP.EDIT, title: 'Sửa Nhóm' },
      { key: PERMISSIONS.GROUP.DELETE, title: 'Xóa Nhóm' },
      { key: PERMISSIONS.GROUP.LOCK, title: 'Khóa Nhóm' },
      { key: PERMISSIONS.GROUP.MANAGE, title: 'Quản lý Nhóm' },
      { key: PERMISSIONS.GROUP.PERMISSION, title: 'Phân quyền Nhóm' },
      { key: PERMISSIONS.ROLE.MANAGE, title: 'Quản lý Vai trò' },
      { key: PERMISSIONS.ORGUNIT.READ, title: 'Xem Đơn vị' },
      { key: PERMISSIONS.ORGUNIT.MANAGE, title: 'Quản lý Đơn vị' },
      { key: PERMISSIONS.ORGUNIT.APPROVE, title: 'Duyệt Đơn vị' },
    ],
  },
  {
    key: 'group_m002',
    title: 'KCHT Hàng hải (M-002)',
    children: [
      { key: PERMISSIONS.PORT.READ, title: 'Xem Cảng biển' },
      { key: PERMISSIONS.PORT.CREATE, title: 'Thêm Cảng biển' },
      { key: PERMISSIONS.PORT.UPDATE, title: 'Sửa Cảng biển' },
      { key: PERMISSIONS.PORT.DELETE, title: 'Xóa Cảng biển' },
      { key: PERMISSIONS.PORT.APPROVE_C1, title: 'Duyệt Cảng biển C1' },
      { key: PERMISSIONS.PORT.APPROVE_C2, title: 'Duyệt Cảng biển C2' },
      { key: PERMISSIONS.PORT.HISTORY, title: 'Lịch sử Cảng biển' },
      { key: PERMISSIONS.BERTH.READ, title: 'Xem Bến cảng' },
      { key: PERMISSIONS.BERTH.CREATE, title: 'Thêm Bến cảng' },
      { key: PERMISSIONS.BERTH.UPDATE, title: 'Sửa Bến cảng' },
      { key: PERMISSIONS.BERTH.DELETE, title: 'Xóa Bến cảng' },
      { key: PERMISSIONS.BERTH.APPROVE_C1, title: 'Duyệt Bến cảng C1' },
      { key: PERMISSIONS.BERTH.APPROVE_C2, title: 'Duyệt Bến cảng C2' },
      { key: PERMISSIONS.BERTH.HISTORY, title: 'Lịch sử Bến cảng' },
      { key: PERMISSIONS.PIER.READ, title: 'Xem Cầu cảng' },
      { key: PERMISSIONS.PIER.CREATE, title: 'Thêm Cầu cảng' },
      { key: PERMISSIONS.PIER.UPDATE, title: 'Sửa Cầu cảng' },
      { key: PERMISSIONS.PIER.DELETE, title: 'Xóa Cầu cảng' },
      { key: PERMISSIONS.PIER.APPROVE_C1, title: 'Duyệt Cầu cảng C1' },
      { key: PERMISSIONS.PIER.APPROVE_C2, title: 'Duyệt Cầu cảng C2' },
      { key: PERMISSIONS.PIER.HISTORY, title: 'Lịch sử Cầu cảng' },
      { key: PERMISSIONS.DRYPORT.READ, title: 'Xem Cảng cạn' },
      { key: PERMISSIONS.DRYPORT.CREATE, title: 'Thêm Cảng cạn' },
      { key: PERMISSIONS.DRYPORT.UPDATE, title: 'Sửa Cảng cạn' },
      { key: PERMISSIONS.DRYPORT.DELETE, title: 'Xóa Cảng cạn' },
      { key: PERMISSIONS.DRYPORT.APPROVE_C1, title: 'Duyệt Cảng cạn C1' },
      { key: PERMISSIONS.DRYPORT.APPROVE_C2, title: 'Duyệt Cảng cạn C2' },
      { key: PERMISSIONS.DRYPORT.HISTORY, title: 'Lịch sử Cảng cạn' },
      { key: PERMISSIONS.WATERAREA.READ, title: 'Xem Vùng nước' },
      { key: PERMISSIONS.WATERAREA.CREATE, title: 'Thêm Vùng nước' },
      { key: PERMISSIONS.WATERAREA.UPDATE, title: 'Sửa Vùng nước' },
      { key: PERMISSIONS.WATERAREA.DELETE, title: 'Xóa Vùng nước' },
      { key: PERMISSIONS.WATERAREA.APPROVE_C1, title: 'Duyệt Vùng nước C1' },
      { key: PERMISSIONS.WATERAREA.APPROVE_C2, title: 'Duyệt Vùng nước C2' },
      { key: PERMISSIONS.WATERAREA.HISTORY, title: 'Lịch sử Vùng nước' },
    ],
  },
  {
    key: 'group_m003',
    title: 'KCHT Bảo đảm an toàn (M-003)',
    children: [
      { key: PERMISSIONS.NAVIGATIONCHANNEL.READ, title: 'Xem Luồng hàng hải' },
      { key: PERMISSIONS.NAVIGATIONCHANNEL.CREATE, title: 'Thêm Luồng hàng hải' },
      { key: PERMISSIONS.NAVIGATIONCHANNEL.UPDATE, title: 'Sửa Luồng hàng hải' },
      { key: PERMISSIONS.NAVIGATIONCHANNEL.DELETE, title: 'Xóa Luồng hàng hải' },
      { key: PERMISSIONS.NAVIGATIONCHANNEL.APPROVE_C1, title: 'Duyệt Luồng hàng hải C1' },
      { key: PERMISSIONS.NAVIGATIONCHANNEL.APPROVE_C2, title: 'Duyệt Luồng hàng hải C2' },
      { key: PERMISSIONS.NAVIGATIONCHANNEL.HISTORY, title: 'Lịch sử Luồng hàng hải' },
      { key: PERMISSIONS.DIKEREVETMENT.READ, title: 'Xem Đê chắn sóng' },
      { key: PERMISSIONS.DIKEREVETMENT.CREATE, title: 'Thêm Đê chắn sóng' },
      { key: PERMISSIONS.DIKEREVETMENT.UPDATE, title: 'Sửa Đê chắn sóng' },
      { key: PERMISSIONS.DIKEREVETMENT.DELETE, title: 'Xóa Đê chắn sóng' },
      { key: PERMISSIONS.DIKEREVETMENT.APPROVE_C1, title: 'Duyệt Đê chắn sóng C1' },
      { key: PERMISSIONS.DIKEREVETMENT.APPROVE_C2, title: 'Duyệt Đê chắn sóng C2' },
      { key: PERMISSIONS.DIKEREVETMENT.HISTORY, title: 'Lịch sử Đê chắn sóng' },
      { key: PERMISSIONS.LIGHTHOUSESTATION.READ, title: 'Xem Trạm đèn biển' },
      { key: PERMISSIONS.LIGHTHOUSESTATION.CREATE, title: 'Thêm Trạm đèn biển' },
      { key: PERMISSIONS.LIGHTHOUSESTATION.UPDATE, title: 'Sửa Trạm đèn biển' },
      { key: PERMISSIONS.LIGHTHOUSESTATION.DELETE, title: 'Xóa Trạm đèn biển' },
      { key: PERMISSIONS.LIGHTHOUSESTATION.APPROVE_C1, title: 'Duyệt Trạm đèn biển C1' },
      { key: PERMISSIONS.LIGHTHOUSESTATION.APPROVE_C2, title: 'Duyệt Trạm đèn biển C2' },
      { key: PERMISSIONS.LIGHTHOUSESTATION.HISTORY, title: 'Lịch sử Trạm đèn biển' },
      { key: PERMISSIONS.RADARSTATION.READ, title: 'Xem Trạm Radar' },
      { key: PERMISSIONS.RADARSTATION.CREATE, title: 'Thêm Trạm Radar' },
      { key: PERMISSIONS.RADARSTATION.UPDATE, title: 'Sửa Trạm Radar' },
      { key: PERMISSIONS.RADARSTATION.DELETE, title: 'Xóa Trạm Radar' },
      { key: PERMISSIONS.RADARSTATION.APPROVE_C1, title: 'Duyệt Trạm Radar C1' },
      { key: PERMISSIONS.RADARSTATION.APPROVE_C2, title: 'Duyệt Trạm Radar C2' },
      { key: PERMISSIONS.RADARSTATION.HISTORY, title: 'Lịch sử Trạm Radar' },
      { key: PERMISSIONS.SHIPREPAIRFACILITY.READ, title: 'Xem CS sửa chữa' },
      { key: PERMISSIONS.SHIPREPAIRFACILITY.CREATE, title: 'Thêm CS sửa chữa' },
      { key: PERMISSIONS.SHIPREPAIRFACILITY.UPDATE, title: 'Sửa CS sửa chữa' },
      { key: PERMISSIONS.SHIPREPAIRFACILITY.DELETE, title: 'Xóa CS sửa chữa' },
      { key: PERMISSIONS.SHIPREPAIRFACILITY.APPROVE_C1, title: 'Duyệt CS sửa chữa C1' },
      { key: PERMISSIONS.SHIPREPAIRFACILITY.APPROVE_C2, title: 'Duyệt CS sửa chữa C2' },
      { key: PERMISSIONS.SHIPREPAIRFACILITY.HISTORY, title: 'Lịch sử CS sửa chữa' },
      { key: PERMISSIONS.BUOY.READ, title: 'Xem Phao/Báo hiệu' },
      { key: PERMISSIONS.BUOY.CREATE, title: 'Thêm Phao/Báo hiệu' },
      { key: PERMISSIONS.BUOY.UPDATE, title: 'Sửa Phao/Báo hiệu' },
      { key: PERMISSIONS.BUOY.DELETE, title: 'Xóa Phao/Báo hiệu' },
      { key: PERMISSIONS.BUOY.APPROVE_C1, title: 'Duyệt Phao/Báo hiệu C1' },
      { key: PERMISSIONS.BUOY.APPROVE_C2, title: 'Duyệt Phao/Báo hiệu C2' },
      { key: PERMISSIONS.BUOY.HISTORY, title: 'Lịch sử Phao/Báo hiệu' },
    ],
  },
  {
    key: 'group_document',
    title: 'Văn bản pháp lý',
    children: [
      { key: PERMISSIONS.DOCUMENT.READ, title: 'Xem Văn bản' },
      { key: PERMISSIONS.DOCUMENT.CREATE, title: 'Thêm Văn bản' },
      { key: PERMISSIONS.DOCUMENT.UPDATE, title: 'Sửa Văn bản' },
      { key: PERMISSIONS.DOCUMENT.DELETE, title: 'Xóa Văn bản' },
    ],
  },
];
