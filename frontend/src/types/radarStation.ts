// RadarStation (Trạm Radar) — F-056..F-061

export interface RadarStationAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
}

export interface RadarStationResponse {
  id: string;
  stationName?: string;
  location: string;

  stationType?: string;
  coverage?: string;
  emissionArea?: number;
  source?: string;
  conditionStatus?: string;
  orgUnitId?: string;
  orgUnitName?: string;
  approvalStatus: string;
  approvedLevel1?: boolean;
  approverLevel1?: string;
  approvedDateLevel1?: string;
  approvedLevel2?: boolean;
  approverLevel2?: string;
  approvedDateLevel2?: string;
  rejectionReason?: string;
  createdBy?: string;
  createdDate?: string;
  updatedBy?: string;
  updatedDate?: string;
  attachments?: RadarStationAttachment[];
  history?: HistoryEntry[];
  loaiHinhHoc?: string;
  toaDo?: string;
  khongGianId?: string;
  towerHeight?: number;
  radarRange?: number;
  vtsSystemId?: string;
  vtsSystemName?: string;
}

export interface CreateRadarStationRequest {
  stationName?: string;
  location: string;

  stationType?: string;
  coverage?: string;
  emissionArea?: number;
  source?: string;
  conditionStatus?: string;
  orgUnitId?: string;
  loaiHinhHoc?: string;
  toaDo?: string;
  towerHeight?: number;
  radarRange?: number;
  vtsSystemId?: string;
}

export interface UpdateRadarStationRequest extends CreateRadarStationRequest {}

export interface ApprovalRequest {
  decision: string;
  reason?: string;
}

export interface PheDuyetRequest {
  decision: string;
  lyDo?: string;
}

export interface HistoryEntry {
  id: number;
  approvalLevel?: number;
  status: string;
  approvedBy: string;
  approvedDate: string;
  reason?: string;
}

export interface ListParams {
  page?: number;
  size?: number;
  orgUnitId?: string;
  keyword?: string;
  conditionStatus?: string;
  approvalStatus?: string;
}

export interface SearchResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}
