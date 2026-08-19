export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CreateLighthouseStationRequest {
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

export interface LighthouseStationResponse {
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

