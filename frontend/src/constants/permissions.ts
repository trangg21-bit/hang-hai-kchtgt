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

  /** Quản lý đơn vị tổ chức */
  ORGUNIT: {
    READ: 'orgunit:read',
    CREATE: 'orgunit:create',
    UPDATE: 'orgunit:update',
    DELETE: 'orgunit:delete',
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
    MANAGE: 'dryport:manage',
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

  /** Khu neo đậu (M-002) */
  ANCHORAGE: {
    MANAGE: 'anchorage:manage',
    READ: 'anchorage:read',
    CREATE: 'anchorage:create',
    UPDATE: 'anchorage:update',
    DELETE: 'anchorage:delete',
    APPROVE_C1: 'anchorage:approvec1',
    APPROVE_C2: 'anchorage:approvec2',
    HISTORY: 'anchorage:history',
  },

  /** Khu chuyển tải (M-002) */
  TRANSFER_AREA: {
    MANAGE: 'transferarea:manage',
    READ: 'transferarea:read',
    CREATE: 'transferarea:create',
    UPDATE: 'transferarea:update',
    DELETE: 'transferarea:delete',
    APPROVE_C1: 'transferarea:approvec1',
    APPROVE_C2: 'transferarea:approvec2',
    HISTORY: 'transferarea:history',
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


  /** Trạm radar (M-003) */
  RADARSTATION: {
    MANAGE: 'radarstation:manage',
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
    MANAGE: 'shiprepairfacility:manage',
    READ: 'shiprepairfacility:read',
    CREATE: 'shiprepairfacility:create',
    UPDATE: 'shiprepairfacility:update',
    DELETE: 'shiprepairfacility:delete',
    APPROVE_C1: 'shiprepairfacility:approvec1',
    APPROVE_C2: 'shiprepairfacility:approvec2',
    HISTORY: 'shiprepairfacility:history',
  },
  SHIP_REPAIR_YARD: {
    MANAGE: 'shiprepairyard:manage',
    READ: 'shiprepairyard:read',
    CREATE: 'shiprepairyard:create',
    UPDATE: 'shiprepairyard:update',
    DELETE: 'shiprepairyard:delete',
    APPROVE_C1: 'shiprepairyard:approvec1',
    APPROVE_C2: 'shiprepairyard:approvec2',
    HISTORY: 'shiprepairyard:history',
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

  /** Hệ thống VTS (M-004) */
  VTS: {
    READ: 'vts:read',
    CREATE: 'vts:create',
    UPDATE: 'vts:update',
    DELETE: 'vts:delete',
    APPROVE_C1: 'vts:approvec1',
    APPROVE_C2: 'vts:approvec2',
    HISTORY: 'vts:history',
  },

  /** Trung tâm điều hành VTS (M-004) */
  VTS_OPERATION_CENTER: {
    READ: 'vtsoperationcenter:read',
    CREATE: 'vtsoperationcenter:create',
    UPDATE: 'vtsoperationcenter:update',
    DELETE: 'vtsoperationcenter:delete',
    APPROVE_C1: 'vtsoperationcenter:approvec1',
    APPROVE_C2: 'vtsoperationcenter:approvec2',
    HISTORY: 'vtsoperationcenter:history',
  },

  /** Hệ thống AIS (M-004) */
  AIS_SYSTEM: {
    READ: 'aissystem:read',
    CREATE: 'aissystem:create',
    UPDATE: 'aissystem:update',
    DELETE: 'aissystem:delete',
    APPROVE_C1: 'aissystem:approvec1',
    APPROVE_C2: 'aissystem:approvec2',
    HISTORY: 'aissystem:history',
  },

  /** Đài thông tin nhận dạng và truy theo tầm xa (LRIT) (M-004) */
  COASTAL_STATION_LRIT: {
    READ: 'coastalstationlrit:read',
    CREATE: 'coastalstationlrit:create',
    UPDATE: 'coastalstationlrit:update',
    DELETE: 'coastalstationlrit:delete',
    APPROVE_C1: 'coastalstationlrit:approvec1',
    APPROVE_C2: 'coastalstationlrit:approvec2',
    HISTORY: 'coastalstationlrit:history',
  },

  /** Đài thông tin vệ tinh mặt đất Inmarsat Hải Phòng (M-004) */
  COASTAL_STATION_INMARSAT: {
    READ: 'coastalstationinmarsat:read',
    CREATE: 'coastalstationinmarsat:create',
    UPDATE: 'coastalstationinmarsat:update',
    DELETE: 'coastalstationinmarsat:delete',
    APPROVE_C1: 'coastalstationinmarsat:approvec1',
    APPROVE_C2: 'coastalstationinmarsat:approvec2',
    HISTORY: 'coastalstationinmarsat:history',
  },

  /** Đài TTXLTT Hà Nội / Hải Phòng (M-004) */
  COASTAL_STATION_HAIPHONG: {
    READ: 'coastalstationhaiphong:read',
    CREATE: 'coastalstationhaiphong:create',
    UPDATE: 'coastalstationhaiphong:update',
    DELETE: 'coastalstationhaiphong:delete',
    APPROVE_C1: 'coastalstationhaiphong:approvec1',
    APPROVE_C2: 'coastalstationhaiphong:approvec2',
    HISTORY: 'coastalstationhaiphong:history',
  },

  /** Hệ thống CCTV (M-004) */
  CCTV: {
    READ: 'cctv:read',
    CREATE: 'cctv:create',
    UPDATE: 'cctv:update',
    DELETE: 'cctv:delete',
    APPROVE_C1: 'cctv:approvec1',
    APPROVE_C2: 'cctv:approvec2',
    HISTORY: 'cctv:history',
  },

  /** Hệ thống SCADA (M-004) */
  SCADA: {
    MANAGE: 'scada:manage',
    READ: 'scada:read',
    CREATE: 'scada:create',
    UPDATE: 'scada:update',
    DELETE: 'scada:delete',
    APPROVE_C1: 'scada:approvec1',
    APPROVE_C2: 'scada:approvec2',
    HISTORY: 'scada:history',
  },

  /** Hệ thống truyền dẫn (M-004) */
  TRANSMISSION: {
    MANAGE: 'transmission:manage',
    READ: 'transmission:read',
    CREATE: 'transmission:create',
    UPDATE: 'transmission:update',
    DELETE: 'transmission:delete',
    APPROVE_C1: 'transmission:approvec1',
    APPROVE_C2: 'transmission:approvec2',
    HISTORY: 'transmission:history',
  },

  /** Hệ thống phụ trợ VTS (M-004) */
  VTS_ASSIST: {
    MANAGE: 'vtsassist:manage',
    READ: 'vtsassist:read',
    CREATE: 'vtsassist:create',
    UPDATE: 'vtsassist:update',
    DELETE: 'vtsassist:delete',
    APPROVE_C1: 'vtsassist:approvec1',
    APPROVE_C2: 'vtsassist:approvec2',
    HISTORY: 'vtsassist:history',
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
      { key: PERMISSIONS.ORGUNIT.READ, title: 'Xem Đơn vị' },
      { key: PERMISSIONS.ORGUNIT.CREATE, title: 'Thêm Đơn vị' },
      { key: PERMISSIONS.ORGUNIT.UPDATE, title: 'Sửa Đơn vị' },
      { key: PERMISSIONS.ORGUNIT.DELETE, title: 'Xóa Đơn vị' },
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
      { key: PERMISSIONS.DRYPORT.MANAGE, title: 'Quản lý Cảng cạn' },
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
      { key: PERMISSIONS.ANCHORAGE.MANAGE, title: 'Quản lý Khu neo đậu' },
      { key: PERMISSIONS.ANCHORAGE.READ, title: 'Xem Khu neo đậu' },
      { key: PERMISSIONS.ANCHORAGE.CREATE, title: 'Thêm Khu neo đậu' },
      { key: PERMISSIONS.ANCHORAGE.UPDATE, title: 'Sửa Khu neo đậu' },
      { key: PERMISSIONS.ANCHORAGE.DELETE, title: 'Xóa Khu neo đậu' },
      { key: PERMISSIONS.ANCHORAGE.APPROVE_C1, title: 'Duyệt Khu neo đậu C1' },
      { key: PERMISSIONS.ANCHORAGE.APPROVE_C2, title: 'Duyệt Khu neo đậu C2' },
      { key: PERMISSIONS.ANCHORAGE.HISTORY, title: 'Lịch sử Khu neo đậu' },
      { key: PERMISSIONS.TRANSFER_AREA.MANAGE, title: 'Quản lý Khu chuyển tải' },
      { key: PERMISSIONS.TRANSFER_AREA.READ, title: 'Xem Khu chuyển tải' },
      { key: PERMISSIONS.TRANSFER_AREA.CREATE, title: 'Thêm Khu chuyển tải' },
      { key: PERMISSIONS.TRANSFER_AREA.UPDATE, title: 'Sửa Khu chuyển tải' },
      { key: PERMISSIONS.TRANSFER_AREA.DELETE, title: 'Xóa Khu chuyển tải' },
      { key: PERMISSIONS.TRANSFER_AREA.APPROVE_C1, title: 'Duyệt Khu chuyển tải C1' },
      { key: PERMISSIONS.TRANSFER_AREA.APPROVE_C2, title: 'Duyệt Khu chuyển tải C2' },
      { key: PERMISSIONS.TRANSFER_AREA.HISTORY, title: 'Lịch sử Khu chuyển tải' },
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
      { key: PERMISSIONS.RADARSTATION.MANAGE, title: 'Quản lý Trạm radar' },
      { key: PERMISSIONS.RADARSTATION.READ, title: 'Xem Trạm radar' },
      { key: PERMISSIONS.RADARSTATION.CREATE, title: 'Thêm Trạm radar' },
      { key: PERMISSIONS.RADARSTATION.UPDATE, title: 'Sửa Trạm radar' },
      { key: PERMISSIONS.RADARSTATION.DELETE, title: 'Xóa Trạm radar' },
      { key: PERMISSIONS.RADARSTATION.APPROVE_C1, title: 'Duyệt Trạm radar C1' },
      { key: PERMISSIONS.RADARSTATION.APPROVE_C2, title: 'Duyệt Trạm radar C2' },
      { key: PERMISSIONS.RADARSTATION.HISTORY, title: 'Lịch sử Trạm radar' },
      { key: PERMISSIONS.SHIPREPAIRFACILITY.MANAGE, title: 'Quản lý CS sửa chữa' },
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
    key: 'group_m004',
    title: 'Hệ thống VTS & Hệ thống thông tin duyên hải Việt Nam',
    children: [
      { key: PERMISSIONS.VTS.READ, title: 'Xem Hệ thống VTS' },
      { key: PERMISSIONS.VTS.CREATE, title: 'Thêm Hệ thống VTS' },
      { key: PERMISSIONS.VTS.UPDATE, title: 'Sửa Hệ thống VTS' },
      { key: PERMISSIONS.VTS.DELETE, title: 'Xóa Hệ thống VTS' },
      { key: PERMISSIONS.VTS.APPROVE_C1, title: 'Duyệt Hệ thống VTS C1' },
      { key: PERMISSIONS.VTS.APPROVE_C2, title: 'Duyệt Hệ thống VTS C2' },
      { key: PERMISSIONS.VTS.HISTORY, title: 'Lịch sử Hệ thống VTS' },
      { key: PERMISSIONS.VTS_OPERATION_CENTER.READ, title: 'Xem TTDH VTS' },
      { key: PERMISSIONS.VTS_OPERATION_CENTER.CREATE, title: 'Thêm TTDH VTS' },
      { key: PERMISSIONS.VTS_OPERATION_CENTER.UPDATE, title: 'Sửa TTDH VTS' },
      { key: PERMISSIONS.VTS_OPERATION_CENTER.DELETE, title: 'Xóa TTDH VTS' },
      { key: PERMISSIONS.VTS_OPERATION_CENTER.APPROVE_C1, title: 'Duyệt TTDH VTS C1' },
      { key: PERMISSIONS.VTS_OPERATION_CENTER.APPROVE_C2, title: 'Duyệt TTDH VTS C2' },
      { key: PERMISSIONS.VTS_OPERATION_CENTER.HISTORY, title: 'Lịch sử TTDH VTS' },
      { key: PERMISSIONS.AIS_SYSTEM.READ, title: 'Xem Hệ thống AIS' },
      { key: PERMISSIONS.AIS_SYSTEM.CREATE, title: 'Thêm Hệ thống AIS' },
      { key: PERMISSIONS.AIS_SYSTEM.UPDATE, title: 'Sửa Hệ thống AIS' },
      { key: PERMISSIONS.AIS_SYSTEM.DELETE, title: 'Xóa Hệ thống AIS' },
      { key: PERMISSIONS.AIS_SYSTEM.APPROVE_C1, title: 'Duyệt Hệ thống AIS C1' },
      { key: PERMISSIONS.AIS_SYSTEM.APPROVE_C2, title: 'Duyệt Hệ thống AIS C2' },
      { key: PERMISSIONS.AIS_SYSTEM.HISTORY, title: 'Lịch sử Hệ thống AIS' },
      { key: PERMISSIONS.COASTAL_STATION_LRIT.READ, title: 'Xem Đài thông tin nhận dạng và truy theo tầm xa (LRIT)' },
      { key: PERMISSIONS.COASTAL_STATION_LRIT.CREATE, title: 'Thêm Đài thông tin nhận dạng và truy theo tầm xa (LRIT)' },
      { key: PERMISSIONS.COASTAL_STATION_LRIT.UPDATE, title: 'Sửa Đài thông tin nhận dạng và truy theo tầm xa (LRIT)' },
      { key: PERMISSIONS.COASTAL_STATION_LRIT.DELETE, title: 'Xóa Đài thông tin nhận dạng và truy theo tầm xa (LRIT)' },
      { key: PERMISSIONS.COASTAL_STATION_LRIT.APPROVE_C1, title: 'Duyệt Đài thông tin nhận dạng và truy theo tầm xa (LRIT) C1' },
      { key: PERMISSIONS.COASTAL_STATION_LRIT.APPROVE_C2, title: 'Duyệt Đài thông tin nhận dạng và truy theo tầm xa (LRIT) C2' },
      { key: PERMISSIONS.COASTAL_STATION_LRIT.HISTORY, title: 'Lịch sử Đài thông tin nhận dạng và truy theo tầm xa (LRIT)' },
      { key: PERMISSIONS.COASTAL_STATION_INMARSAT.READ, title: 'Xem Đài thông tin vệ tinh mặt đất Inmarsat Hải Phòng' },
      { key: PERMISSIONS.COASTAL_STATION_INMARSAT.CREATE, title: 'Thêm Đài thông tin vệ tinh mặt đất Inmarsat Hải Phòng' },
      { key: PERMISSIONS.COASTAL_STATION_INMARSAT.UPDATE, title: 'Sửa Đài thông tin vệ tinh mặt đất Inmarsat Hải Phòng' },
      { key: PERMISSIONS.COASTAL_STATION_INMARSAT.DELETE, title: 'Xóa Đài thông tin vệ tinh mặt đất Inmarsat Hải Phòng' },
      { key: PERMISSIONS.COASTAL_STATION_INMARSAT.APPROVE_C1, title: 'Duyệt Đài thông tin vệ tinh mặt đất Inmarsat Hải Phòng C1' },
      { key: PERMISSIONS.COASTAL_STATION_INMARSAT.APPROVE_C2, title: 'Duyệt Đài thông tin vệ tinh mặt đất Inmarsat Hải Phòng C2' },
      { key: PERMISSIONS.COASTAL_STATION_INMARSAT.HISTORY, title: 'Lịch sử Đài thông tin vệ tinh mặt đất Inmarsat Hải Phòng' },
      { key: PERMISSIONS.COASTAL_STATION_HAIPHONG.READ, title: 'Xem Đài TTXLTT Hà Nội' },
      { key: PERMISSIONS.COASTAL_STATION_HAIPHONG.CREATE, title: 'Thêm Đài TTXLTT Hà Nội' },
      { key: PERMISSIONS.COASTAL_STATION_HAIPHONG.UPDATE, title: 'Sửa Đài TTXLTT Hà Nội' },
      { key: PERMISSIONS.COASTAL_STATION_HAIPHONG.DELETE, title: 'Xóa Đài TTXLTT Hà Nội' },
      { key: PERMISSIONS.COASTAL_STATION_HAIPHONG.APPROVE_C1, title: 'Duyệt Đài TTXLTT Hà Nội C1' },
      { key: PERMISSIONS.COASTAL_STATION_HAIPHONG.APPROVE_C2, title: 'Duyệt Đài TTXLTT Hà Nội C2' },
      { key: PERMISSIONS.COASTAL_STATION_HAIPHONG.HISTORY, title: 'Lịch sử Đài TTXLTT Hà Nội' },
      { key: PERMISSIONS.CCTV.READ, title: 'Xem Hệ thống CCTV' },
      { key: PERMISSIONS.CCTV.CREATE, title: 'Thêm Hệ thống CCTV' },
      { key: PERMISSIONS.CCTV.UPDATE, title: 'Sửa Hệ thống CCTV' },
      { key: PERMISSIONS.CCTV.DELETE, title: 'Xóa Hệ thống CCTV' },
      { key: PERMISSIONS.CCTV.APPROVE_C1, title: 'Duyệt Hệ thống CCTV C1' },
      { key: PERMISSIONS.CCTV.APPROVE_C2, title: 'Duyệt Hệ thống CCTV C2' },
      { key: PERMISSIONS.CCTV.HISTORY, title: 'Lịch sử Hệ thống CCTV' },
      { key: PERMISSIONS.SCADA.MANAGE, title: 'Quản lý Hệ thống SCADA' },
      { key: PERMISSIONS.SCADA.READ, title: 'Xem Hệ thống SCADA' },
      { key: PERMISSIONS.SCADA.CREATE, title: 'Thêm Hệ thống SCADA' },
      { key: PERMISSIONS.SCADA.UPDATE, title: 'Sửa Hệ thống SCADA' },
      { key: PERMISSIONS.SCADA.DELETE, title: 'Xóa Hệ thống SCADA' },
      { key: PERMISSIONS.SCADA.APPROVE_C1, title: 'Duyệt Hệ thống SCADA C1' },
      { key: PERMISSIONS.SCADA.APPROVE_C2, title: 'Duyệt Hệ thống SCADA C2' },
      { key: PERMISSIONS.SCADA.HISTORY, title: 'Lịch sử Hệ thống SCADA' },
      { key: PERMISSIONS.TRANSMISSION.MANAGE, title: 'Quản lý Hệ thống truyền dẫn' },
      { key: PERMISSIONS.TRANSMISSION.READ, title: 'Xem Hệ thống truyền dẫn' },
      { key: PERMISSIONS.TRANSMISSION.CREATE, title: 'Thêm Hệ thống truyền dẫn' },
      { key: PERMISSIONS.TRANSMISSION.UPDATE, title: 'Sửa Hệ thống truyền dẫn' },
      { key: PERMISSIONS.TRANSMISSION.DELETE, title: 'Xóa Hệ thống truyền dẫn' },
      { key: PERMISSIONS.TRANSMISSION.APPROVE_C1, title: 'Duyệt Hệ thống truyền dẫn C1' },
      { key: PERMISSIONS.TRANSMISSION.APPROVE_C2, title: 'Duyệt Hệ thống truyền dẫn C2' },
      { key: PERMISSIONS.TRANSMISSION.HISTORY, title: 'Lịch sử Hệ thống truyền dẫn' },
      { key: PERMISSIONS.VTS_ASSIST.MANAGE, title: 'Quản lý Phụ trợ VTS' },
      { key: PERMISSIONS.VTS_ASSIST.READ, title: 'Xem Phụ trợ VTS' },
      { key: PERMISSIONS.VTS_ASSIST.CREATE, title: 'Thêm Phụ trợ VTS' },
      { key: PERMISSIONS.VTS_ASSIST.UPDATE, title: 'Sửa Phụ trợ VTS' },
      { key: PERMISSIONS.VTS_ASSIST.DELETE, title: 'Xóa Phụ trợ VTS' },
      { key: PERMISSIONS.VTS_ASSIST.APPROVE_C1, title: 'Duyệt Phụ trợ VTS C1' },
      { key: PERMISSIONS.VTS_ASSIST.APPROVE_C2, title: 'Duyệt Phụ trợ VTS C2' },
      { key: PERMISSIONS.VTS_ASSIST.HISTORY, title: 'Lịch sử Phụ trợ VTS' },
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
