// ── Dry Port Types (Đồng bộ với Spring Boot DryPort entity / DTO) ──

export type SaveAction = 'DRAFT' | 'SUBMIT' | 'SAVE_AND_APPROVE' | 'APPROVE';

export interface DryPortAttachment {
  id: string;
  dryPortId?: string;
  fileName: string;
  filePath?: string;
  fileSize?: number;
  contentType?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt?: string;
  uploadedDate?: string;
}

export interface DryPort {
  id: string;
  dryPortCode: string;
  dryPortName: string;
  provinceId?: number | null;
  orgUnitId?: string | null;
  orgUnitName?: string | null;
  // General info
  operatingUnit?: string | null;
  region?: string | null;
  detailedLocation?: string | null;
  transportCorridor?: string | null;
  area?: number | null;
  warehouseArea?: number | null;
  yardArea?: number | null;
  teuCapacity?: number | null;
  connectionMode?: string | null;
  portStatus?: number | null;
  operationalStatus?: string | null;
  remarks?: string | null;
  // Announcement
  announcementTime?: string | null;
  announcementDecisionNumber?: string | null;
  announcementDecisionDate?: string | null;
  announcementOrg?: string | null;
  // GIS
  coordinateSystem?: number | null;
  displayRule?: number | null;
  mapSymbolId?: string | null;
  mapSymbolName?: string | null;
  geometryType?: string | null;
  spatialId?: string | null;
  coordinates?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  coordinateList?: Array<{ latitude: number; longitude: number }>;
  // Status
  approvalStatus: string;
  approverLevel1?: string | null;
  approvedDateLevel1?: string | null;
  approverLevel2?: string | null;
  approvedDateLevel2?: string | null;
  rejectionReason?: string | null;
  // Audit
  createdBy?: string | null;
  createdByName?: string | null;
  updatedBy?: string | null;
  updatedByName?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface DryPortFilterParams {
  page?: number;
  size?: number;
  search?: string;
  code?: string;
  orgUnitId?: string;
  provinceId?: number;
  region?: string;
  portStatus?: number;
  transportCorridor?: string;
  approvalStatus?: string;
  updatedFrom?: string;
  updatedTo?: string;
}

export interface CreateDryPortRequest {
  saveAction?: string;
  dryPortCode?: string;
  dryPortName: string;
  provinceId?: number;
  orgUnitId?: string;
  operatingUnit?: string;
  region?: string;
  detailedLocation?: string;
  transportCorridor?: string;
  area?: number;
  warehouseArea?: number;
  yardArea?: number;
  teuCapacity?: number;
  connectionMode?: string;
  portStatus?: number;
  remarks?: string;
  announcementTime?: string;
  announcementDecisionNumber?: string;
  announcementDecisionDate?: string;
  announcementOrg?: string;
  coordinateSystem?: number;
  displayRule?: number;
  mapSymbolId?: string;
  geometryType?: string;
  coordinates?: string;
  latitude?: number;
  longitude?: number;
}

export interface UpdateDryPortRequest extends Partial<CreateDryPortRequest> {
  id: string;
}
