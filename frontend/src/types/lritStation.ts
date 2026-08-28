export interface LritStationItem {
  id: string;
  code: string;
  name: string;
  orgUnitId?: string;
  orgUnitName?: string;
  operatingOrgId?: string;
  operatingOrgName?: string;
  provinceId?: number;
  provinceName?: string;
  locationAddress?: string;
  conditionStatus?: string;
  status?: number;
  approvalStatus?: number;
  terminalId?: string;
  imoNumber?: string;
  reportingInterval?: number;
  antennaHeight?: number;
  powerOutput?: number;
  antennaType?: string;
  dataFormat?: string;
  communicationChannel?: string;
  coverageArea?: string;
  servicesProvided?: string;
  description?: string;
  contactPerson?: string;
  contactPhone?: string;
  spatialId?: string;
  geometryType?: string;
  symbol?: string;
  coordinateSystem?: string;
  displayRule?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: string;
  submittedAt?: string;
  submittedBy?: string;
  submittedByName?: string;
  approverLevel1?: string;
  approverLevel1Name?: string;
  approvedDateLevel1?: string;
  approverLevel2?: string;
  approverLevel2Name?: string;
  approvedDateLevel2?: string;
  rejectionReason?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: string;
}

export interface CreateLritStationRequest {
  orgUnitId?: string;
  operatingOrgId?: string;
  provinceId?: number;
  code?: string;
  name: string;
  locationAddress?: string;
  conditionStatus?: string;
  terminalId?: string;
  imoNumber?: string;
  reportingInterval?: number;
  antennaHeight?: number;
  powerOutput?: number;
  antennaType?: string;
  dataFormat?: string;
  communicationChannel?: string;
  coverageArea?: string;
  servicesProvided?: string;
  description?: string;
  contactPerson?: string;
  contactPhone?: string;
  geometryType?: string;
  symbol?: string;
  coordinateSystem?: string;
  displayRule?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: string;
}

export type UpdateLritStationRequest = CreateLritStationRequest;

export interface LritStationListParams {
  keyword?: string;
  orgUnitId?: string;
  operatingOrgId?: string;
  provinceId?: number;
  conditionStatus?: string;
  approvalStatus?: number | string;
  updatedBy?: string;
  updatedFrom?: string;
  updatedTo?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export interface LritStationSearchResponse {
  items: LritStationItem[];
  total: number;
  page: number;
  size: number;
  statusCounts: Record<string, number>;
}
