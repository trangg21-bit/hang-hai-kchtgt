export interface PointObject {
  id: string;
  name: string;
  code: string;
  objectType: PointObject.ObjectType;
  categoryId?: number;
  iconId?: number;
  longitude: number;
  latitude: number;
  description?: string;
  status: PointObject.Status;
  unitId?: number;
  approvalStatus: PointObject.ApprovalStatus;
  approvedBy?: number;
  approvedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export namespace PointObject {
  export enum ObjectType {
    PORT = 'PORT',
    LIGHTHOUSE = 'LIGHTHOUSE',
    BUOY = 'BUOY',
    BEACON = 'BEACON',
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

export interface CreatePointObjectPayload {
  name: string;
  code: string;
  objectType: PointObject.ObjectType;
  categoryId?: number;
  iconId?: number;
  longitude: number;
  latitude: number;
  description?: string;
}

export interface UpdatePointObjectPayload {
  name?: string;
  code?: string;
  objectType?: PointObject.ObjectType;
  categoryId?: number;
  iconId?: number;
  longitude?: number;
  latitude?: number;
  description?: string;
  status?: PointObject.Status;
}

export interface PointObjectFilters {
  search?: string;
  objectType?: string;
  status?: string;
}

export const POINT_OBJECT_TYPE_OPTIONS = [
  { value: PointObject.ObjectType.PORT, label: 'Cảng' },
  { value: PointObject.ObjectType.LIGHTHOUSE, label: 'Đèn biển' },
  { value: PointObject.ObjectType.BUOY, label: 'Phao标的' },
  { value: PointObject.ObjectType.BEACON, label: 'Đèn hiệu' },
  { value: PointObject.ObjectType.OTHER, label: 'Khác' },
];

export const POINT_OBJECT_STATUS_MAP: Record<string, { color: string; label: string }> = {
  [PointObject.Status.DRAFT]: { color: 'default', label: 'Nháp' },
  [PointObject.Status.PENDING_APPROVAL]: { color: 'orange', label: 'Chờ duyệt' },
  [PointObject.Status.APPROVED_L1]: { color: 'blue', label: 'Đã duyệt L1' },
  [PointObject.Status.APPROVED_L2]: { color: 'cyan', label: 'Đã duyệt L2' },
  [PointObject.Status.PUBLISHED]: { color: 'green', label: 'Đã xuất bản' },
  [PointObject.Status.REJECTED]: { color: 'red', label: 'Từ chối' },
  [PointObject.Status.DELETED]: { color: 'default', label: 'Đã xóa' },
};
