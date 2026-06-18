export interface LineObject {
  id: string;
  name: string;
  code: string;
  objectType: LineObject.ObjectType;
  categoryId?: number;
  lineSymbolId?: number;
  coordinates: string;
  description?: string;
  status: LineObject.Status;
  unitId?: number;
  length?: number;
  material?: string;
  yearBuilt?: number;
  approvalStatus: LineObject.ApprovalStatus;
  approvedBy?: number;
  approvedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export namespace LineObject {
  export enum ObjectType {
    COASTLINE = 'COASTLINE',
    SHIPPING_ROUTE = 'SHIPPING_ROUTE',
    WATERWAY = 'WATERWAY',
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

export interface CreateLineObjectPayload {
  name: string;
  code: string;
  objectType: LineObject.ObjectType;
  categoryId?: number;
  lineSymbolId?: number;
  coordinates: string;
  description?: string;
  length?: number;
  material?: string;
  yearBuilt?: number;
}

export interface UpdateLineObjectPayload {
  name?: string;
  code?: string;
  objectType?: LineObject.ObjectType;
  categoryId?: number;
  lineSymbolId?: number;
  coordinates?: string;
  description?: string;
  status?: LineObject.Status;
  length?: number;
  material?: string;
  yearBuilt?: number;
}

export interface LineObjectFilters {
  search?: string;
  objectType?: string;
  status?: string;
}

export const LINE_OBJECT_TYPE_OPTIONS = [
  { value: LineObject.ObjectType.COASTLINE, label: 'Đường bờ biển' },
  { value: LineObject.ObjectType.SHIPPING_ROUTE, label: 'Tuyến hàng hải' },
  { value: LineObject.ObjectType.WATERWAY, label: 'Đường thủy' },
  { value: LineObject.ObjectType.OTHER, label: 'Khác' },
];

export const LINE_OBJECT_STATUS_MAP: Record<string, { color: string; label: string }> = {
  [LineObject.Status.DRAFT]: { color: 'default', label: 'Nháp' },
  [LineObject.Status.PENDING_APPROVAL]: { color: 'orange', label: 'Chờ duyệt' },
  [LineObject.Status.APPROVED_L1]: { color: 'blue', label: 'Đã duyệt L1' },
  [LineObject.Status.APPROVED_L2]: { color: 'cyan', label: 'Đã duyệt L2' },
  [LineObject.Status.PUBLISHED]: { color: 'green', label: 'Đã xuất bản' },
  [LineObject.Status.REJECTED]: { color: 'red', label: 'Từ chối' },
  [LineObject.Status.DELETED]: { color: 'default', label: 'Đã xóa' },
};
