import api from "../api";
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
  InfrastructureAssetType,
  PortTerminalAsset,
  PortTerminalAssetFilters,
  PortTerminalAssetPayload,
  BuoyAsset,
  BuoyAssetFilters,
  BuoyAssetPayload,
  TransferAreaAsset,
  TransferAreaAssetFilters,
  TransferAreaAssetPayload,
  StormShelterAsset,
  StormShelterAssetFilters,
  StormShelterAssetPayload,
  BuoyBerthAssetFilters,
  BuoyBerthAsset,
  BuoyBerthAssetPayload,
  PierAssetFilters,
  PierAsset,
  PierAssetPayload,
  ChannelAssetFilters,
  ChannelAsset,
  ChannelAssetPayload,
} from "./types";

// ==========================================
// 1. Yêu cầu tăng tài sản
// ==========================================
export async function fetchAssetIncreaseList(params: {
  page?: number;
  size?: number;
  assetId?: string;
}): Promise<PageResponse<AssetIncreaseResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set("page", String(params.page));
  if (params.size !== undefined) sp.set("size", String(params.size));
  if (params.assetId) sp.set("assetId", params.assetId);

  const res = await api.get(`/v1/asset/asset-increase-requests?${sp}`);
  return res.data.data;
}

export async function fetchAssetIncreaseById(
  id: string,
): Promise<AssetIncreaseResponse> {
  const res = await api.get(`/v1/asset/asset-increase-requests/${id}`);
  return res.data.data;
}

export async function createAssetIncrease(
  payload: AssetIncreaseRequest,
): Promise<AssetIncreaseResponse> {
  const res = await api.post("/v1/asset/asset-increase-requests", payload);
  return res.data.data;
}

export async function updateAssetIncrease(
  id: string,
  payload: AssetIncreaseRequest,
): Promise<AssetIncreaseResponse> {
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
  if (params.page !== undefined) sp.set("page", String(params.page));
  if (params.size !== undefined) sp.set("size", String(params.size));
  if (params.assetId) sp.set("assetId", params.assetId);

  const res = await api.get(`/v1/asset/asset-decrease-requests?${sp}`);
  return res.data.data;
}

export async function fetchAssetDecreaseById(
  id: string,
): Promise<AssetDecreaseResponse> {
  const res = await api.get(`/v1/asset/asset-decrease-requests/${id}`);
  return res.data.data;
}

export async function createAssetDecrease(
  payload: AssetDecreaseRequest,
): Promise<AssetDecreaseResponse> {
  const res = await api.post("/v1/asset/asset-decrease-requests", payload);
  return res.data.data;
}

export async function updateAssetDecrease(
  id: string,
  payload: AssetDecreaseRequest,
): Promise<AssetDecreaseResponse> {
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
  if (params.page !== undefined) sp.set("page", String(params.page));
  if (params.size !== undefined) sp.set("size", String(params.size));

  const res = await api.get(`/v1/asset/inventory-plans?${sp}`);
  return res.data.data;
}

export async function createInventoryPlan(
  payload: InventoryPlanRequest,
): Promise<InventoryPlanResponse> {
  const res = await api.post("/v1/asset/inventory-plans", payload);
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
  if (params.page !== undefined) sp.set("page", String(params.page));
  if (params.size !== undefined) sp.set("size", String(params.size));
  if (params.planId) sp.set("planId", params.planId);

  const res = await api.get(`/v1/asset/inventory-reports?${sp}`);
  return res.data.data;
}

export async function createInventoryReport(
  payload: InventoryReportRequest,
): Promise<InventoryReportResponse> {
  const res = await api.post("/v1/asset/inventory-reports", payload);
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
  if (params.page !== undefined) sp.set("page", String(params.page));
  if (params.size !== undefined) sp.set("size", String(params.size));
  if (params.assetId) sp.set("assetId", params.assetId);
  if (params.exploitationYear !== undefined)
    sp.set("exploitationYear", String(params.exploitationYear));

  const res = await api.get(`/v1/asset/asset-exploitations?${sp}`);
  return res.data.data;
}

export async function createKhaiThac(
  payload: AssetExploitationRequest,
): Promise<AssetExploitationResponse> {
  const res = await api.post("/v1/asset/asset-exploitations", payload);
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
  if (params.page !== undefined) sp.set("page", String(params.page));
  if (params.size !== undefined) sp.set("size", String(params.size));
  if (params.assetId) sp.set("assetId", params.assetId);

  const res = await api.get(`/v1/asset/asset-processing-records?${sp}`);
  return res.data.data;
}

export async function createHoSoXuLy(
  payload: AssetProcessingRecordRequest,
): Promise<AssetProcessingRecordResponse> {
  const res = await api.post("/v1/asset/asset-processing-records", payload);
  return res.data.data;
}

// ==========================================
// 7. Lưu phê duyệt
// ==========================================
export async function fetchApprovalRecordHistory(id: string): Promise<unknown> {
  const res = await api.get(`/v1/asset/approval-records/${id}`);
  return res.data.data;
}

// ==========================================
// 8. Bổ sung: Lấy danh sách tài sản KCHT và duyệt tăng/giam
// ==========================================
export async function fetchInfraAssetList(params?: {
  page?: number;
  size?: number;
}): Promise<PageResponse<PortTerminalAsset>> {
  const sp = new URLSearchParams();
  if (params?.page !== undefined) sp.set("page", String(params.page));
  if (params?.size !== undefined) sp.set("size", String(params.size));
  const res = await api.get(`/v1/asset/infra-assets?${sp}`);
  return res.data.data;
}

export async function fetchInfrastructureAssets(
  assetType: InfrastructureAssetType,
  params: PortTerminalAssetFilters,
): Promise<PageResponse<PortTerminalAsset>> {
  const sp = new URLSearchParams();
  Object.entries({ ...params, assetType }).forEach(([key, value]) => {
    if (value !== undefined && value !== "") sp.set(key, String(value));
  });
  const res = await api.get(`/v1/asset/infra-assets?${sp}`);
  return res.data.data;
}

export async function createInfrastructureAsset(
  assetType: InfrastructureAssetType,
  payload: PortTerminalAssetPayload,
): Promise<PortTerminalAsset> {
  const res = await api.post("/v1/asset/infra-assets", {
    ...payload,
    assetType,
  });
  return res.data.data;
}

export async function updateInfrastructureAsset(
  id: string,
  assetType: InfrastructureAssetType,
  payload: PortTerminalAssetPayload,
): Promise<PortTerminalAsset> {
  const res = await api.put(`/v1/asset/infra-assets/${id}`, {
    ...payload,
    assetType,
  });
  return res.data.data;
}

export async function deleteInfrastructureAsset(id: string): Promise<void> {
  await api.delete(`/v1/asset/infra-assets/${id}`);
}

export async function fetchPortTerminalAssets(
  params: PortTerminalAssetFilters,
): Promise<PageResponse<PortTerminalAsset>> {
  return fetchInfrastructureAssets("PORT_TERMINAL", params);
}

export async function fetchPortTerminalAsset(
  id: string,
): Promise<PortTerminalAsset> {
  const res = await api.get(`/v1/asset/infra-assets/${id}`);
  return res.data.data;
}

export async function createPortTerminalAsset(
  payload: PortTerminalAssetPayload,
): Promise<PortTerminalAsset> {
  return createInfrastructureAsset("PORT_TERMINAL", payload);
}

export async function updatePortTerminalAsset(
  id: string,
  payload: PortTerminalAssetPayload,
): Promise<PortTerminalAsset> {
  return updateInfrastructureAsset(id, "PORT_TERMINAL", payload);
}

export async function deletePortTerminalAsset(id: string): Promise<void> {
  await deleteInfrastructureAsset(id);
}

// ==========================================
// 6. Tài sản phao, tiêu và nhà trạm QLVH
// ==========================================
export async function fetchBuoyAssets(
  params: BuoyAssetFilters,
): Promise<PageResponse<BuoyAsset>> {
  const sp = new URLSearchParams();
  const { refId, ...rest } = params;
  const merged: Record<string, unknown> = { ...rest, assetType: "BUOY" };
  if (refId) {
    if (!merged.buoyId && !merged.buoyStationId) {
      merged.buoyId = refId;
    }
  }
  Object.entries(merged).forEach(([key, value]) => {
    if (value !== undefined && value !== "") sp.set(key, String(value));
  });
  const res = await api.get(`/v1/asset/infra-assets?${sp}`);
  return res.data.data;
}

export async function fetchBuoyAsset(id: string): Promise<BuoyAsset> {
  const res = await api.get(`/v1/asset/infra-assets/${id}`);
  return res.data.data;
}

export async function createBuoyAsset(
  payload: BuoyAssetPayload,
): Promise<BuoyAsset> {
  const res = await api.post("/v1/asset/infra-assets", {
    ...payload,
    assetType: "BUOY",
  });
  return res.data.data;
}

export async function updateBuoyAsset(
  id: string,
  payload: BuoyAssetPayload,
): Promise<BuoyAsset> {
  const res = await api.put(`/v1/asset/infra-assets/${id}`, {
    ...payload,
    assetType: "BUOY",
  });
  return res.data.data;
}

export async function deleteBuoyAsset(id: string): Promise<void> {
  await api.delete(`/v1/asset/infra-assets/${id}`);
}

export async function fetchTransferAreaAssets(
  params: TransferAreaAssetFilters,
): Promise<PageResponse<TransferAreaAsset>> {
  const sp = new URLSearchParams();
  Object.entries({ ...params, assetType: "TRANSFER_AREA" }).forEach(
    ([key, value]) => {
      if (value !== undefined && value !== "") sp.set(key, String(value));
    },
  );
  const res = await api.get(`/v1/asset/infra-assets?${sp}`);
  return res.data.data;
}

export async function fetchTransferAreaAsset(
  id: string,
): Promise<TransferAreaAsset> {
  const res = await api.get(`/v1/asset/infra-assets/${id}`);
  return res.data.data;
}

export async function createTransferAreaAsset(
  payload: TransferAreaAssetPayload,
): Promise<TransferAreaAsset> {
  const res = await api.post("/v1/asset/infra-assets", {
    ...payload,
    assetType: "TRANSFER_AREA",
  });
  return res.data.data;
}

export async function updateTransferAreaAsset(
  id: string,
  payload: TransferAreaAssetPayload,
): Promise<TransferAreaAsset> {
  const res = await api.put(`/v1/asset/infra-assets/${id}`, {
    ...payload,
    assetType: "TRANSFER_AREA",
  });
  return res.data.data;
}

export async function deleteTransferAreaAsset(id: string): Promise<void> {
  await api.delete(`/v1/asset/infra-assets/${id}`);
}

export async function fetchStormShelterAssetList(
  params: StormShelterAssetFilters = {},
): Promise<PageResponse<StormShelterAsset>> {
  const sp = new URLSearchParams();
  Object.entries({ ...params, assetType: "STORM_SHELTER" }).forEach(
    ([key, value]) => {
      if (value !== undefined && value !== "") sp.set(key, String(value));
    },
  );
  const res = await api.get(`/v1/asset/infra-assets?${sp}`);
  return res.data.data;
}

export async function fetchStormShelterAsset(
  id: string,
): Promise<StormShelterAsset> {
  const res = await api.get(`/v1/asset/infra-assets/${id}`);
  return res.data.data;
}

export async function createStormShelterAsset(
  payload: StormShelterAssetPayload,
): Promise<StormShelterAsset> {
  const res = await api.post("/v1/asset/infra-assets", {
    ...payload,
    assetType: "STORM_SHELTER",
  });
  return res.data.data;
}

export async function updateStormShelterAsset(
  id: string,
  payload: StormShelterAssetPayload,
): Promise<StormShelterAsset> {
  const res = await api.put(`/v1/asset/infra-assets/${id}`, {
    ...payload,
    assetType: "STORM_SHELTER",
  });
  return res.data.data;
}

export async function deleteStormShelterAsset(id: string): Promise<void> {
  await api.delete(`/v1/asset/infra-assets/${id}`);
}

export async function fetchBuoyBerthAssets(
  params: BuoyBerthAssetFilters = {},
): Promise<PageResponse<BuoyBerthAsset>> {
  const sp = new URLSearchParams();
  Object.entries({ ...params, assetType: "BUOY_BERTH" }).forEach(
    ([key, value]) => {
      if (value !== undefined && value !== "") sp.set(key, String(value));
    },
  );
  const res = await api.get(`/v1/asset/infra-assets?${sp}`);
  return res.data.data;
}

export async function fetchBuoyBerthAsset(id: string): Promise<BuoyBerthAsset> {
  const res = await api.get(`/v1/asset/infra-assets/${id}`);
  return res.data.data;
}

export async function createBuoyBerthAsset(
  payload: BuoyBerthAssetPayload,
): Promise<BuoyBerthAsset> {
  const res = await api.post("/v1/asset/infra-assets", {
    ...payload,
    assetType: "BUOY_BERTH",
  });
  return res.data.data;
}

export async function updateBuoyBerthAsset(
  id: string,
  payload: BuoyBerthAssetPayload,
): Promise<BuoyBerthAsset> {
  const res = await api.put(`/v1/asset/infra-assets/${id}`, {
    ...payload,
    assetType: "BUOY_BERTH",
  });
  return res.data.data;
}

export async function deleteBuoyBerthAsset(id: string): Promise<void> {
  await api.delete(`/v1/asset/infra-assets/${id}`);
}

export async function fetchPierAssets(
  params: PierAssetFilters = {},
): Promise<PageResponse<PierAsset>> {
  const sp = new URLSearchParams();
  Object.entries({ ...params, assetType: "PIER" }).forEach(([key, value]) => {
    if (value !== undefined && value !== "") sp.set(key, String(value));
  });
  const res = await api.get(`/v1/asset/infra-assets?${sp}`);
  return res.data.data;
}

export async function fetchPierAsset(id: string): Promise<PierAsset> {
  const res = await api.get(`/v1/asset/infra-assets/${id}`);
  return res.data.data;
}

export async function createPierAsset(
  payload: PierAssetPayload,
): Promise<PierAsset> {
  const res = await api.post("/v1/asset/infra-assets", {
    ...payload,
    assetType: "PIER",
  });
  return res.data.data;
}

export async function updatePierAsset(
  id: string,
  payload: PierAssetPayload,
): Promise<PierAsset> {
  const res = await api.put(`/v1/asset/infra-assets/${id}`, {
    ...payload,
    assetType: "PIER",
  });
  return res.data.data;
}

export async function deletePierAsset(id: string): Promise<void> {
  await api.delete(`/v1/asset/infra-assets/${id}`);
}

export async function approveAssetIncrease(
  id: string,
  remarks?: string,
): Promise<AssetIncreaseResponse> {
  const res = await api.post(
    `/v1/asset/asset-increase-requests/${id}/approve`,
    { remarks },
  );
  return res.data.data;
}

export async function rejectAssetIncrease(
  id: string,
  remarks?: string,
): Promise<AssetIncreaseResponse> {
  const res = await api.post(`/v1/asset/asset-increase-requests/${id}/reject`, {
    remarks,
  });
  return res.data.data;
}

export async function approveAssetDecrease(
  id: string,
  remarks?: string,
): Promise<AssetDecreaseResponse> {
  const res = await api.post(
    `/v1/asset/asset-decrease-requests/${id}/approve`,
    { remarks },
  );
  return res.data.data;
}

export async function rejectAssetDecrease(
  id: string,
  remarks?: string,
): Promise<AssetDecreaseResponse> {
  const res = await api.post(`/v1/asset/asset-decrease-requests/${id}/reject`, {
    remarks,
  });
  return res.data.data;
}

export async function approveInventoryPlan(
  id: string,
  remarks?: string,
): Promise<InventoryPlanResponse> {
  const res = await api.post(`/v1/asset/inventory-plans/${id}/approve`, {
    remarks,
  });
  return res.data.data;
}

export async function rejectInventoryPlan(
  id: string,
  remarks?: string,
): Promise<InventoryPlanResponse> {
  const res = await api.post(`/v1/asset/inventory-plans/${id}/reject`, {
    remarks,
  });
  return res.data.data;
}

export async function startInventoryPlan(
  id: string,
): Promise<InventoryPlanResponse> {
  const res = await api.post(`/v1/asset/inventory-plans/${id}/start`);
  return res.data.data;
}

export async function completeInventoryPlan(
  id: string,
): Promise<InventoryPlanResponse> {
  const res = await api.post(`/v1/asset/inventory-plans/${id}/complete`);
  return res.data.data;
}

export async function approveInventoryReport(
  id: string,
  remarks?: string,
): Promise<InventoryReportResponse> {
  const res = await api.post(`/v1/asset/inventory-reports/${id}/approve`, {
    remarks,
  });
  return res.data.data;
}

export async function rejectInventoryReport(
  id: string,
  remarks?: string,
): Promise<InventoryReportResponse> {
  const res = await api.post(`/v1/asset/inventory-reports/${id}/reject`, {
    remarks,
  });
  return res.data.data;
}

// ==========================================
// 8. Tài sản luồng hàng hải
// ==========================================
export async function fetchChannelAssets(
  params: ChannelAssetFilters,
): Promise<PageResponse<ChannelAsset>> {
  const sp = new URLSearchParams();
  const merged: Record<string, unknown> = {
    ...params,
    assetType: "NAVIGATION_CHANNEL",
  };
  Object.entries(merged).forEach(([key, value]) => {
    if (value !== undefined && value !== "") sp.set(key, String(value));
  });
  const res = await api.get(`/v1/asset/infra-assets?${sp}`);
  return res.data.data;
}

export async function fetchChannelAsset(id: string): Promise<ChannelAsset> {
  const res = await api.get(`/v1/asset/infra-assets/${id}`);
  return res.data.data;
}

export async function createChannelAsset(
  payload: ChannelAssetPayload,
): Promise<ChannelAsset> {
  const res = await api.post("/v1/asset/infra-assets", {
    ...payload,
    assetType: "NAVIGATION_CHANNEL",
  });
  return res.data.data;
}

export async function updateChannelAsset(
  id: string,
  payload: ChannelAssetPayload,
): Promise<ChannelAsset> {
  const res = await api.put(`/v1/asset/infra-assets/${id}`, {
    ...payload,
    assetType: "NAVIGATION_CHANNEL",
  });
  return res.data.data;
}

export async function deleteChannelAsset(id: string): Promise<void> {
  await api.delete(`/v1/asset/infra-assets/${id}`);
}

// ==========================================
// 10. File đính kèm tài sản KCHT (Attachments)
// ==========================================
export interface InfraAssetAttachmentResponse {
  id: string;
  entityType: string;
  entityId: string;
  fileName: string;
  filePath?: string;
  fileSize?: number;
  contentType?: string;
  uploadedBy?: string;
  uploadedByName?: string;
  uploadedAt?: string;
}

export async function fetchInfraAssetAttachments(
  assetId: string,
): Promise<InfraAssetAttachmentResponse[]> {
  const res = await api.get(`/v1/asset/infra-assets/${assetId}/attachments`);
  return res.data.data;
}

export async function uploadInfraAssetAttachments(
  assetId: string,
  files: File[],
): Promise<InfraAssetAttachmentResponse[]> {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  const res = await api.post(
    `/v1/asset/infra-assets/${assetId}/attachments`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    },
  );
  return res.data.data;
}

const INFRA_ASSET_ATTACHMENT_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isPersistedInfraAssetAttachmentId(attId: string): boolean {
  return INFRA_ASSET_ATTACHMENT_ID_PATTERN.test(attId);
}

export async function deleteInfraAssetAttachment(
  assetId: string,
  attId: string,
): Promise<void> {
  // Hồ sơ legacy chỉ có tên file được dựng thành ID hiển thị `att-*`.
  // Backend khai báo PathVariable UUID, vì vậy các ID này chỉ xóa ở client.
  if (!isPersistedInfraAssetAttachmentId(attId)) return;
  await api.delete(`/v1/asset/infra-assets/${assetId}/attachments/${attId}`);
}

export async function downloadInfraAssetAttachment(
  assetId: string,
  attId: string,
  fileName: string,
): Promise<void> {
  const res = await api.get(
    `/v1/asset/infra-assets/${assetId}/attachments/${attId}/download`,
    {
      responseType: "blob",
    },
  );
  const blob = new Blob([res.data], {
    type: res.headers["content-type"] || "application/octet-stream",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName || "attachment";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
