export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface CoastalStationVTSRequest {
  stationCode: string;
  stationName: string;
  latitude: number;
  longitude: number;
  frequencyBand: string;
  transmitPower: number;
  equipmentType: string;
  locationAddress: string;
  contactPerson: string;
  contactPhone: string;
  status: string;
}

export interface CoastalStationVTSResponse {
  id: string;
  stationCode: string;
  stationName: string;
  latitude: number;
  longitude: number;
  frequencyBand: string;
  transmitPower: number;
  equipmentType: string;
  locationAddress: string;
  contactPerson: string;
  contactPhone: string;
  status: string;
  approvalStatus: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CoastalStationInmarsatRequest {
  deviceCode: string;
  stationName: string;
  latitude?: number;
  longitude?: number;
  modemType?: string;
  frequency?: string;
  coverageZone?: string;
  sarCode?: string;
  locationAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  status: string;
}

export interface CoastalStationInmarsatResponse {
  id: string;
  deviceCode: string;
  stationName: string;
  latitude?: number;
  longitude?: number;
  modemType?: string;
  frequency?: string;
  coverageZone?: string;
  sarCode?: string;
  locationAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  status: string;
  approvalStatus: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ==========================================
// 3. Lighthouse Station (Nhà trạm đèn biển)
// ==========================================
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

// ==========================================
// 4. Buoy Station (Nhà trạm phao tiêu)
// ==========================================
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
