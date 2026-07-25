export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export interface AssetIncreaseRequest {
  assetId: string;
  assetName: string;
  soLuong: number;
  donViTinh: string;
  reason: string;
  maSoTang: string;
}

export interface AssetIncreaseResponse {
  id: string;
  assetId: string;
  assetName: string;
  soLuong: number;
  donViTinh: string;
  reason: string;
  status: string;
  maSoTang: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetDecreaseRequest {
  assetId: string;
  assetName: string;
  soLuong: number;
  donViTinh: string;
  reason: string;
  decreaseReason: string;
}

export interface AssetDecreaseResponse {
  id: string;
  assetId: string;
  assetName: string;
  soLuong: number;
  donViTinh: string;
  reason: string;
  status: string;
  decreaseReason: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryPlanRequest {
  planName: string;
  scope: string;
  inventoryType: 'DINH_KY' | 'DOT_XUAT';
  startDate: string;
  endDate: string;
  inventoryLeader: string;
  description: string;
}

export interface InventoryPlanResponse {
  id: string;
  planName: string;
  description: string;
  status: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryReportRequest {
  planId: string;
  tenBaoCao: string;
  tongSoLuong: number;
  soLuongChenhLech: number;
  result: string;
  description: string;
}

export interface InventoryReportResponse {
  id: string;
  planId: string;
  tenBaoCao: string;
  tongSoLuong: number;
  soLuongChenhLech: number;
  result: string;
  description: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetExploitationRequest {
  assetId: string;
  assetName: string;
  exploitationYear: number;
  doanhThu: number;
  haoMon: number;
  description: string;
}

export interface AssetExploitationResponse {
  id: string;
  assetId: string;
  assetName: string;
  exploitationYear: number;
  doanhThu: number;
  haoMon: number;
  description: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}

export interface AssetProcessingRecordRequest {
  assetId: string;
  assetName: string;
  processingType: string;
  recipient: string;
  processingReason: string;
  description: string;
}

export interface AssetProcessingRecordResponse {
  id: string;
  assetId: string;
  assetName: string;
  processingType: string;
  description: string;
  trangThaiHoSo: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
}
