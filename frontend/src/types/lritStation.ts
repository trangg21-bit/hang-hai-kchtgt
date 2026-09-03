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
  services?: string[];
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
  services?: string[];
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
}

export interface LritStationSearchResponse {
  items: LritStationItem[];
  total: number;
  page: number;
  size: number;
  statusCounts?: Record<string, number>;
}

export const LRIT_SERVICE_OPTIONS = [
  { value: 'LRIT', label: 'LRIT — Nhận dạng và theo dõi tầm xa' },
  { value: 'INMARSAT', label: 'INMARSAT — Thông tin vệ tinh Inmarsat' },
  { value: 'COSPAS-SARSAT', label: 'COSPAS-SARSAT — Tìm kiếm cứu nạn vệ tinh' },
  { value: 'DSC', label: 'DSC — Gọi chọn số kỹ thuật số' },
  { value: 'RTP', label: 'RTP — Vô tuyến thoại hàng hải' },
  { value: 'MSI RTP', label: 'MSI RTP — Thông tin an toàn hàng hải thoại' },
  { value: 'MSI NAVTEX', label: 'MSI NAVTEX — Bản tin an toàn hàng hải Navtex' },
  { value: 'MSI EGC', label: 'MSI EGC — Điện báo gọi nhóm nâng cao EGC' },
  { value: 'Kết nối TT hàng hải', label: 'Kết nối thông tin hàng hải chuyên dùng' },
];

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
