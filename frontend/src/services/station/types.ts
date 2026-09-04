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
  approvalLevel?: number;
  submittedAt?: string;
  submittedBy?: string;
  approverLevel1?: string;
  approvedDateLevel1?: string;
  approverLevel2?: string;
  approvedDateLevel2?: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

// --- COASTAL STATION INMARSAT (M-004: F-098..F-103) ---

export interface CoastalStationInmarsatRequest {
  orgUnitId?: string;
  operatingOrgId?: string;
  code?: string;
  deviceCode?: string;
  name?: string;
  stationName?: string;
  provinceId?: number;
  locationAddress?: string;
  locationDetail?: string;
  conditionStatus?: string;
  coverageZone?: string;
  coverageArea?: string;
  services?: string;
  frequency?: string;
  modemType?: string;
  sarCode?: string;
  satelliteSystem?: string;
  notes?: string;
  description?: string;
  contactPerson?: string;
  contactPhone?: string;
  spatialId?: string;
  objectType?: string;
  symbol?: string;
  symbolId?: string;
  coordinateSystem?: string;
  displayRule?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: string;
}

export interface CoastalStationInmarsatUpdateRequest extends CoastalStationInmarsatRequest {}

export interface CoastalStationInmarsatResponse {
  id: string;
  orgUnitId?: string;
  orgUnitName?: string;
  operatingOrgId?: string;
  operatingOrgName?: string;
  code?: string;
  deviceCode?: string;
  name?: string;
  stationName?: string;
  provinceId?: number;
  provinceName?: string;
  locationAddress?: string;
  locationDetail?: string;
  conditionStatus?: string;
  status?: string;
  isActive?: boolean;
  coverageZone?: string;
  coverageArea?: string;
  services?: string;
  frequency?: string;
  modemType?: string;
  sarCode?: string;
  satelliteSystem?: string;
  notes?: string;
  description?: string;
  contactPerson?: string;
  contactPhone?: string;
  spatialId?: string;
  objectType?: string;
  geometryType?: string;
  symbol?: string;
  symbolId?: string;
  coordinateSystem?: string;
  displayRule?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: string;
  approvalStatus?: string;
  approvalLevel?: string;
  submittedAt?: string;
  submittedDate?: string;
  submittedBy?: string;
  submittedByName?: string;
  approverLevel1?: string;
  approverNameLevel1?: string;
  approverLevel1Name?: string;
  approvedDateLevel1?: string;
  approvalContentLevel1?: string;
  level1ApprovalContent?: string;
  approvalReasonLevel1?: string;
  rejectionReasonLevel1?: string;
  approverLevel2?: string;
  approverNameLevel2?: string;
  approverLevel2Name?: string;
  approvedDateLevel2?: string;
  approvalContentLevel2?: string;
  level2ApprovalContent?: string;
  approvalReasonLevel2?: string;
  rejectionReasonLevel2?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedDate?: string;
  rejectionReason?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: string;
  deletedBy?: string;
  deletedAt?: string;
}

export interface CoastalStationInmarsatOptionResponse {
  id: string;
  code: string;
  name: string;
  orgUnitId?: string;
  conditionStatus?: string;
}

export interface CoastalStationInmarsatHistoryResponse {
  id: string;
  deviceCode: string;
  actionType: string;
  previousValue?: string;
  newValue?: string;
  changedBy?: string;
  changedAt?: string;
}

// --- COASTAL STATION COSPAS-SARSAT ---

export interface CoastalStationCospasSarsatRequest {
  stationCode: string;
  stationName: string;
  frequency?: string;
  coverageArea?: string;
  beaconProtocol?: string;
  emergencyChannel?: string;
  antennaType?: string;
  locationAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  signalRange?: number;
  operatingMode?: string;
}

export interface CoastalStationCospasSarsatResponse {
  id: string;
  stationCode: string;
  stationName: string;
  frequency?: string;
  coverageArea?: string;
  beaconProtocol?: string;
  emergencyChannel?: string;
  antennaType?: string;
  locationAddress?: string;
  contactPerson?: string;
  contactPhone?: string;
  signalRange?: number;
  operatingMode?: string;
  status?: string;
  approvalStatus: string;
  approvalLevel?: number;
  submittedAt?: string;
  submittedBy?: string;
  approverLevel1?: string;
  approvedDateLevel1?: string;
  approverLevel2?: string;
  approvedDateLevel2?: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

export interface CoastalStationCospasSarsatHistoryResponse {
  id: string;
  stationCode?: string;
  actionType: string;
  previousValue?: string;
  newValue?: string;
  changedBy?: string;
  changedAt?: string;
}
