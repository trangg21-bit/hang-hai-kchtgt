export interface HanoiStationItem {
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
  portName?: string;
  district?: string;
  ward?: string;
  operationalLicense?: string;
  licenseExpiry?: string;
  inspectorName?: string;
  inspectorPhone?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  coverageArea?: string;
  equipmentType?: string;
  communicationFrequency?: string;
  servicesProvided?: string;
  services?: string[];
  description?: string;
  contactPerson?: string;
  contactPhone?: string;
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
  level1ApprovalContent?: string;
  approvalContentLevel1?: string;
  level2ApprovalContent?: string;
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

export interface CreateHanoiStationRequest {
  orgUnitId?: string;
  operatingOrgId?: string;
  provinceId?: number;
  code?: string;
  name: string;
  locationAddress?: string;
  conditionStatus?: string;
  portName?: string;
  district?: string;
  ward?: string;
  operationalLicense?: string;
  licenseExpiry?: string;
  inspectorName?: string;
  inspectorPhone?: string;
  lastInspectionDate?: string;
  nextInspectionDate?: string;
  coverageArea?: string;
  equipmentType?: string;
  communicationFrequency?: string;
  servicesProvided?: string;
  services?: string[];
  description?: string;
  contactPerson?: string;
  contactPhone?: string;
  spatialId?: string;
  symbolId?: string;
  geometryType?: string;
  symbol?: string;
  coordinateSystem?: string;
  displayRule?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: string;
}

export type UpdateHanoiStationRequest = CreateHanoiStationRequest;

export interface HanoiStationListParams {
  keyword?: string;
  orgUnitId?: string;
  operatingOrgId?: string;
  provinceId?: number;
  locationAddress?: string;
  conditionStatus?: string;
  approvalStatus?: number | string;
  updatedBy?: string;
  updatedFrom?: string;
  updatedTo?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
  /**
   * Có gọi kèm endpoint đếm theo tab hay không. Số trên tab không phụ thuộc
   * trang hay tab đang chọn, nên chỉ cần nạp lại khi bộ lọc đổi — mặc định true
   * để giữ nguyên hành vi cũ cho nơi gọi khác.
   */
  includeCounts?: boolean;
}

export interface HanoiStationSearchResponse {
  items: HanoiStationItem[];
  total: number;
  page: number;
  size: number;
  statusCounts?: Record<string, number>;
}

export const HANOI_SERVICE_OPTIONS = [
  { value: 'INMARSAT', label: 'INMARSAT — Thông tin vệ tinh Inmarsat' },
  { value: 'COSPAS-SARSAT', label: 'COSPAS-SARSAT — Tìm kiếm cứu nạn vệ tinh' },
  { value: 'DSC', label: 'DSC — Gọi chọn số kỹ thuật số' },
  { value: 'RTP', label: 'RTP — Vô tuyến thoại hàng hải' },
  { value: 'MSI RTP', label: 'MSI RTP — Thông tin an toàn hàng hải thoại' },
  { value: 'MSI NAVTEX', label: 'MSI NAVTEX — Bản tin an toàn hàng hải Navtex' },
  { value: 'MSI EGC', label: 'MSI EGC — Điện báo gọi nhóm nâng cao EGC' },
  { value: 'LRIT', label: 'LRIT — Nhận dạng và theo dõi tầm xa' },
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
