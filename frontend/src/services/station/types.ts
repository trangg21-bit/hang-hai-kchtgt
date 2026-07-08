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
  stationCode: string;
  stationName: string;
  latitude: number;
  longitude: number;
  equipmentType: string;
  satelliteName: string;
  locationAddress: string;
  contactPerson: string;
  contactPhone: string;
  status: string;
}

export interface CoastalStationInmarsatResponse {
  id: string;
  stationCode: string;
  stationName: string;
  latitude: number;
  longitude: number;
  equipmentType: string;
  satelliteName: string;
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
