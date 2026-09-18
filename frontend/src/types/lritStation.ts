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
  status?: string;
  approvalStatus?: string;
  coverageArea?: string;
  servicesProvided?: string;
  services?: string[];
  description?: string;
  spatialId?: string;
  symbolId?: string;
  symbolName?: string;
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
  approvalContentLevel1?: string;
  approvalContentLevel2?: string;
  rejectionReason?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  updatedBy?: string;
  updatedByName?: string;
  updatedAt?: string;
  updatedDate?: string;
}

export interface LritStationListResponse {
  id: string;
  code: string;
  name: string;
  orgUnitId?: string;
  orgUnitName?: string;
  operatingOrgId?: string;
  operatingOrgName?: string;
  provinceId?: number;
  provinceName?: string;
  conditionStatus?: string;
  approvalStatus?: string;
  rejectionReason?: string;
  approverLevel1?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt?: string;
  updatedByName?: string;
  updatedAt?: string;
}

export interface CreateLritStationRequest {
  orgUnitId?: string | null;
  operatingOrgId?: string | null;
  provinceId?: number | null;
  code?: string | null;
  name: string;
  locationAddress?: string | null;
  conditionStatus?: string | null;
  coverageArea?: string | null;
  servicesProvided?: string | null;
  services?: string[] | null;
  description?: string | null;
  geometryType?: string | null;
  symbolId?: string | null;
  symbol?: string;
  coordinateSystem?: string | null;
  displayRule?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coordinates?: string | null;
}

export type UpdateLritStationRequest = CreateLritStationRequest;

export interface LritStationListParams {
  keyword?: string;
  /** Lọc riêng theo Tên đài (bộ lọc thường) */
  name?: string;
  /** Lọc riêng theo Mã đài (bộ lọc nâng cao) */
  code?: string;
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
  includeCounts?: boolean;
}

export interface LritStationSearchResponse {
  items: LritStationListResponse[];
  total: number;
  page: number;
  size: number;
  statusCounts?: Record<string, number>;
}

import { MARITIME_SERVICES_OPTIONS } from '../constants/maritimeServices';

export const LRIT_SERVICE_OPTIONS = MARITIME_SERVICES_OPTIONS;

export interface OperationPlanItem {
  id?: string;
  planCode: string;
  planName: string;
  startDate: string;
  endDate: string;
}

export interface MaintenancePlanItem {
  id?: string;
  planCode: string;
  planName: string;
  startTime: string;
  endTime: string;
}

export interface IncidentItem {
  id?: string;
  incidentCode: string;
  incidentType: string;
  location: string;
  incidentTime: string;
}
