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

export interface CreateBuoyStationRequest {
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

export interface BuoyStationResponse {
  id: string; code: string; name: string; type: string;
  latitude: number; longitude: number;
  color: string; shape: string; lightCharacteristic: string;
  range: number; description: string;
  unitId: string; operatingOrgId?: string; portId?: string;
  waterwayId?: string; waterwayRouteId?: string;
  province?: string; address?: string;
  constructionDate?: string; totalArea?: number; usableArea?: number;
  staffCount?: number; lastMaintenanceYear?: number; note?: string;
  objectType?: string; icon?: string; coordinateSystem?: string; displayFormat?: string;
  lastInspectionDate: string; nextInspectionDate: string;
  isActive: boolean; status: string; approvalStatus: string;
  createdBy: string; createdByName: string; createdAt: string; updatedAt: string;
  loaiHinhHoc?: string; toaDo?: string; khongGianId?: string;
}
