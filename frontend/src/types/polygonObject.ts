export interface PolygonObject {
  id: string;
  name: string;
  code: string;
  objectType: PolygonObject.ObjectType;
  categoryId?: number;
  fillSymbolId?: number;
  coordinates: string;
  description?: string;
  status: PolygonObject.Status;
  unitId?: number;
  area?: number;
  purpose?: string;
  restrictionLevel?: string;
  approvalStatus: PolygonObject.ApprovalStatus;
  approvedBy?: number;
  approvedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export namespace PolygonObject {
  export enum ObjectType {
    WATER_ZONE = 'WATER_ZONE',
    ANCHORAGE = 'ANCHORAGE',
    STORM_SHELTER = 'STORM_SHELTER',
    RESTRICTED_AREA = 'RESTRICTED_AREA',
    LIMITED_ZONE = 'LIMITED_ZONE',
    OTHER = 'OTHER',
  }

  export enum Status {
    DRAFT = 'DRAFT',
    PENDING_APPROVAL = 'PENDING_APPROVAL',
    APPROVED_L1 = 'APPROVED_L1',
    APPROVED_L2 = 'APPROVED_L2',
    PUBLISHED = 'PUBLISHED',
    REJECTED = 'REJECTED',
    DELETED = 'DELETED',
  }

  export enum ApprovalStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
  }
}

export interface CreatePolygonObjectPayload {
  name: string;
  code: string;
  objectType: PolygonObject.ObjectType;
  categoryId?: number;
  fillSymbolId?: number;
  coordinates: string;
  description?: string;
  area?: number;
  purpose?: string;
  restrictionLevel?: string;
}

export interface UpdatePolygonObjectPayload {
  name?: string;
  code?: string;
  objectType?: PolygonObject.ObjectType;
  categoryId?: number;
  fillSymbolId?: number;
  coordinates?: string;
  description?: string;
  status?: PolygonObject.Status;
  area?: number;
  purpose?: string;
  restrictionLevel?: string;
}

export interface PolygonObjectFilters {
  search?: string;
  objectType?: string;
  status?: string;
}

export const POLYGON_OBJECT_TYPE_OPTIONS = [
  { value: PolygonObject.ObjectType.WATER_ZONE, label: 'Vùng nước' },
  { value: PolygonObject.ObjectType.ANCHORAGE, label: 'Vùng neo đậu' },
  { value: PolygonObject.ObjectType.STORM_SHELTER, label: 'Nơi tránh bão' },
  { value: PolygonObject.ObjectType.RESTRICTED_AREA, label: 'Khu vực cấm' },
  { value: PolygonObject.ObjectType.LIMITED_ZONE, label: 'Khu vực hạn chế' },
  { value: PolygonObject.ObjectType.OTHER, label: 'Khác' },
];

export const POLYGON_OBJECT_STATUS_MAP: Record<string, { color: string; label: string }> = {
  [PolygonObject.Status.DRAFT]: { color: 'default', label: 'Nháp' },
  [PolygonObject.Status.PENDING_APPROVAL]: { color: 'orange', label: 'Chờ duyệt' },
  [PolygonObject.Status.APPROVED_L1]: { color: 'blue', label: 'Đã duyệt L1' },
  [PolygonObject.Status.APPROVED_L2]: { color: 'cyan', label: 'Đã duyệt L2' },
  [PolygonObject.Status.PUBLISHED]: { color: 'green', label: 'Đã xuất bản' },
  [PolygonObject.Status.REJECTED]: { color: 'red', label: 'Từ chối' },
  [PolygonObject.Status.DELETED]: { color: 'default', label: 'Đã xóa' },
};
