export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CreateNhaTramDenRequest {
  code: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  lightRange: number;
  lightColor: string;
  lightCharacteristic: string;
  range: number;
  description: string;
  unitId: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  isActive: boolean;
  status: string;
  loaiHinhHoc?: string;
  toaDo?: string;
}

export interface NhaTramDenResponse {
  id: string;
  code: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  lightRange: number;
  lightColor: string;
  lightCharacteristic: string;
  range: number;
  description: string;
  unitId: string;
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  isActive: boolean;
  status: string;
  approvalStatus: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  loaiHinhHoc?: string;
  toaDo?: string;
  khongGianId?: string;
}

export interface CreateNhaTramPhaoRequest {
  code: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  color: string;
  shape: string;
  lightCharacteristic: string;
  range: number;
  description: string;
  unitId: string;
  lastInspectionDate: string;
  nextInspectionDate: string;
  isActive: boolean;
  status: string;
  loaiHinhHoc?: string;
  toaDo?: string;
}

export interface NhaTramPhaoResponse {
  id: string;
  code: string;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
  color: string;
  shape: string;
  lightCharacteristic: string;
  range: number;
  description: string;
  unitId: string;
  lastInspectionDate: string;
  nextInspectionDate: string;
  isActive: boolean;
  status: string;
  approvalStatus: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  loaiHinhHoc?: string;
  toaDo?: string;
  khongGianId?: string;
}
