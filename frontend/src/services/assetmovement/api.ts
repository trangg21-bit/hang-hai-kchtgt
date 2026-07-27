import api from '../api';
import type {
  PageResponse,
  AssetIncreaseRequest,
  AssetIncreaseResponse,
  AssetDecreaseRequest,
  AssetDecreaseResponse,
  InventoryPlanRequest,
  InventoryPlanResponse,
  InventoryReportRequest,
  InventoryReportResponse,
  AssetExploitationRequest,
  AssetExploitationResponse,
  AssetProcessingRecordRequest,
  AssetProcessingRecordResponse,
} from './types';

// ==========================================
// 1. Yêu cầu tăng tài sản
// ==========================================
export async function fetchAssetIncreaseList(params: {
  page?: number;
  size?: number;
  assetId?: string;
}): Promise<PageResponse<AssetIncreaseResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.assetId) sp.set('assetId', params.assetId);

  const res = await api.get(`/v1/asset/asset-increase-requests?${sp}`);
  return res.data.data;
}

export async function fetchAssetIncreaseById(id: string): Promise<AssetIncreaseResponse> {
  const res = await api.get(`/v1/asset/asset-increase-requests/${id}`);
  return res.data.data;
}

export async function createAssetIncrease(payload: AssetIncreaseRequest): Promise<AssetIncreaseResponse> {
  const res = await api.post('/v1/asset/asset-increase-requests', payload);
  return res.data.data;
}

export async function updateAssetIncrease(id: string, payload: AssetIncreaseRequest): Promise<AssetIncreaseResponse> {
  const res = await api.put(`/v1/asset/asset-increase-requests/${id}`, payload);
  return res.data.data;
}

export async function deleteAssetIncrease(id: string): Promise<void> {
  await api.delete(`/v1/asset/asset-increase-requests/${id}`);
}

// ==========================================
// 2. Yêu cầu giảm tài sản
// ==========================================
export async function fetchAssetDecreaseList(params: {
  page?: number;
  size?: number;
  assetId?: string;
}): Promise<PageResponse<AssetDecreaseResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.assetId) sp.set('assetId', params.assetId);

  const res = await api.get(`/v1/asset/asset-decrease-requests?${sp}`);
  return res.data.data;
}

export async function fetchAssetDecreaseById(id: string): Promise<AssetDecreaseResponse> {
  const res = await api.get(`/v1/asset/asset-decrease-requests/${id}`);
  return res.data.data;
}

export async function createAssetDecrease(payload: AssetDecreaseRequest): Promise<AssetDecreaseResponse> {
  const res = await api.post('/v1/asset/asset-decrease-requests', payload);
  return res.data.data;
}

export async function updateAssetDecrease(id: string, payload: AssetDecreaseRequest): Promise<AssetDecreaseResponse> {
  const res = await api.put(`/v1/asset/asset-decrease-requests/${id}`, payload);
  return res.data.data;
}

export async function deleteAssetDecrease(id: string): Promise<void> {
  await api.delete(`/v1/asset/asset-decrease-requests/${id}`);
}

// ==========================================
// 3. Kế hoạch kiểm kê
// ==========================================
export async function fetchInventoryPlanList(params: {
  page?: number;
  size?: number;
}): Promise<PageResponse<InventoryPlanResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));

  const res = await api.get(`/v1/asset/inventory-plans?${sp}`);
  return res.data.data;
}

export async function createInventoryPlan(payload: InventoryPlanRequest): Promise<InventoryPlanResponse> {
  const res = await api.post('/v1/asset/inventory-plans', payload);
  return res.data.data;
}

// ==========================================
// 4. Báo cáo kiểm kê
// ==========================================
export async function fetchInventoryReportList(params: {
  page?: number;
  size?: number;
  planId?: string;
}): Promise<PageResponse<InventoryReportResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.planId) sp.set('planId', params.planId);

  const res = await api.get(`/v1/asset/inventory-reports?${sp}`);
  return res.data.data;
}

export async function createInventoryReport(payload: InventoryReportRequest): Promise<InventoryReportResponse> {
  const res = await api.post('/v1/asset/inventory-reports', payload);
  return res.data.data;
}

// ==========================================
// 5. Khai thác tài sản
// ==========================================
export async function fetchKhaiThacList(params: {
  page?: number;
  size?: number;
  assetId?: string;
  exploitationYear?: number;
}): Promise<PageResponse<AssetExploitationResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.assetId) sp.set('assetId', params.assetId);
  if (params.exploitationYear !== undefined) sp.set('exploitationYear', String(params.exploitationYear));

  const res = await api.get(`/v1/asset/asset-exploitations?${sp}`);
  return res.data.data;
}

export async function createKhaiThac(payload: AssetExploitationRequest): Promise<AssetExploitationResponse> {
  const res = await api.post('/v1/asset/asset-exploitations', payload);
  return res.data.data;
}

export async function deleteKhaiThac(id: string): Promise<void> {
  await api.delete(`/v1/asset/asset-exploitations/${id}`);
}

// ==========================================
// 6. Hồ sơ xử lý tài sản
// ==========================================
export async function fetchHoSoXuLyList(params: {
  page?: number;
  size?: number;
  assetId?: string;
}): Promise<PageResponse<AssetProcessingRecordResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.assetId) sp.set('assetId', params.assetId);

  const res = await api.get(`/v1/asset/asset-processing-records?${sp}`);
  return res.data.data;
}

export async function createHoSoXuLy(payload: AssetProcessingRecordRequest): Promise<AssetProcessingRecordResponse> {
  const res = await api.post('/v1/asset/asset-processing-records', payload);
  return res.data.data;
}

// ==========================================
// 7. Lưu phê duyệt
// ==========================================
export async function fetchApprovalRecordHistory(id: string): Promise<any> {
  const res = await api.get(`/v1/asset/approval-records/${id}`);
  return res.data.data;
}

// ==========================================
// 8. Bổ sung: Lấy danh sách tài sản KCHT và duyệt tăng/giam
// ==========================================
export async function fetchInfraAssetList(params?: {
  page?: number;
  size?: number;
}): Promise<PageResponse<any>> {
  const sp = new URLSearchParams();
  if (params?.page !== undefined) sp.set('page', String(params.page));
  if (params?.size !== undefined) sp.set('size', String(params.size));
  const res = await api.get(`/v1/asset/infra-assets?${sp}`);
  return res.data.data;
}

export async function approveAssetIncrease(id: string, remarks?: string): Promise<AssetIncreaseResponse> {
  const res = await api.post(`/v1/asset/asset-increase-requests/${id}/approve`, { remarks });
  return res.data.data;
}

export async function rejectAssetIncrease(id: string, remarks?: string): Promise<AssetIncreaseResponse> {
  const res = await api.post(`/v1/asset/asset-increase-requests/${id}/reject`, { remarks });
  return res.data.data;
}

export async function approveAssetDecrease(id: string, remarks?: string): Promise<AssetDecreaseResponse> {
  const res = await api.post(`/v1/asset/asset-decrease-requests/${id}/approve`, { remarks });
  return res.data.data;
}

export async function rejectAssetDecrease(id: string, remarks?: string): Promise<AssetDecreaseResponse> {
  const res = await api.post(`/v1/asset/asset-decrease-requests/${id}/reject`, { remarks });
  return res.data.data;
}

export async function approveInventoryPlan(id: string, remarks?: string): Promise<InventoryPlanResponse> {
  const res = await api.post(`/v1/asset/inventory-plans/${id}/approve`, { remarks });
  return res.data.data;
}

export async function rejectInventoryPlan(id: string, remarks?: string): Promise<InventoryPlanResponse> {
  const res = await api.post(`/v1/asset/inventory-plans/${id}/reject`, { remarks });
  return res.data.data;
}

export async function startInventoryPlan(id: string): Promise<InventoryPlanResponse> {
  const res = await api.post(`/v1/asset/inventory-plans/${id}/start`);
  return res.data.data;
}

export async function completeInventoryPlan(id: string): Promise<InventoryPlanResponse> {
  const res = await api.post(`/v1/asset/inventory-plans/${id}/complete`);
  return res.data.data;
}

export async function approveInventoryReport(id: string, remarks?: string): Promise<InventoryReportResponse> {
  const res = await api.post(`/v1/asset/inventory-reports/${id}/approve`, { remarks });
  return res.data.data;
}

export async function rejectInventoryReport(id: string, remarks?: string): Promise<InventoryReportResponse> {
  const res = await api.post(`/v1/asset/inventory-reports/${id}/reject`, { remarks });
  return res.data.data;
}

