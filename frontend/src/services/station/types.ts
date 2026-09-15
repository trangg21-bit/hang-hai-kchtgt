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
  orgUnitId?: string | null;
  operatingOrgId?: string | null;
  code?: string;
  deviceCode?: string;
  name?: string;
  stationName?: string;
  provinceId?: number | null;
  locationAddress?: string | null;
  locationDetail?: string | null;
  conditionStatus?: string | null;
  coverageZone?: string | null;
  coverageArea?: string | null;
  services?: string | null;
  frequency?: string | null;
  modemType?: string;
  sarCode?: string;
  satelliteSystem?: string;
  notes?: string | null;
  description?: string;
  contactPerson?: string;
  contactPhone?: string;
  spatialId?: string;
  objectType?: string;
  geometryType?: string | null;
  symbol?: string | null;
  symbolId?: string | null;
  coordinateSystem?: string | null;
  displayRule?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coordinates?: string | null;
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
  unitId?: string;
  orgUnitId?: string;
  operatingOrgId?: string;
  provinceId?: number;
  locationAddress?: string;
  conditionStatus?: string;
  coverageArea?: string;
  services?: string[];
  frequency?: string;
  description?: string;
  note?: string;
  beaconProtocol?: string;
  emergencyChannel?: string;
  antennaType?: string;
  contactPerson?: string;
  contactPhone?: string;
  signalRange?: number;
  operatingMode?: string;
  // GIS Fields
  objectType?: string;
  geometryType?: string;
  symbolId?: string;
  coordinateSystem?: string;
  displayRule?: string;
  coordinates?: Array<{ latitude: number; longitude: number; pointOrder?: number }>;
  wktGeometry?: string;
  latitude?: number;
  longitude?: number;
}

export interface CoastalStationCospasSarsatResponse {
  id: string;
  code?: string;
  stationCode: string;
  name?: string;
  stationName: string;
  unitId?: string;
  orgUnitId?: string;
  orgUnitName?: string;
  operatingOrgId?: string;
  provinceId?: number;
  locationAddress?: string;
  conditionStatus?: string;
  coverageArea?: string;
  services?: string[];
  frequency?: string;
  description?: string;
  note?: string;
  beaconProtocol?: string;
  emergencyChannel?: string;
  antennaType?: string;
  contactPerson?: string;
  contactPhone?: string;
  signalRange?: number;
  operatingMode?: string;
  status?: string;
  approvalStatus: string;
  approvalLevel?: number;
  submittedAt?: string;
  submittedBy?: string;
  submittedByName?: string;
  approverLevel1?: string;
  approverLevel1Name?: string;
  approvedDateLevel1?: string;
  level1ApprovalContent?: string;
  approverLevel2?: string;
  approverLevel2Name?: string;
  approvedDateLevel2?: string;
  level2ApprovalContent?: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedDate?: string;
  rejectionReason?: string;
  owningOrgId?: string;
  owningOrgName?: string;
  createdAt?: string;
  updatedAt?: string;
  updatedBy?: string;
  updatedByName?: string;
  deletedAt?: string;
  // GIS Fields
  objectType?: string;
  geometryType?: string;
  symbolId?: string;
  coordinateSystem?: string;
  displayRule?: string;
  coordinates?: Array<{ latitude: number; longitude: number; pointOrder?: number }>;
  wktGeometry?: string;
  latitude?: number;
  longitude?: number;
  files?: any[];
}

export interface CoastalStationCospasSarsatOptionResponse {
  id: string;
  code: string;
  name: string;
  orgUnitId?: string;
  conditionStatus?: string;
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
