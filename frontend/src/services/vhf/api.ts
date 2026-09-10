import api from '../api';
import { DEFAULT_OPERATING_ORGANIZATIONS } from '../operatingOrganizationsData';
import type {
  VhfResponse,
  CreateVhfRequest,
  UpdateVhfRequest,
  PageResponse,
  VhfOptionResponse,
  ApprovalResult,
  ApprovalRequest,
} from './types';
import type { HistoryEntry } from '../../types/vtsSystem';

const BASE = '/v1/vhf';

export interface VhfAttachmentResponse {
  id: string;
  fileName: string;
  fileSize?: number;
}

export interface VhfHistoryFilterParams {
  keyword?: string;
  fromDate?: string;
  toDate?: string;
}

// ── Đơn vị khai thác (bảng operating_organizations — endpoint chung) ──

export async function fetchOperatingOrganizations(): Promise<Array<{ id: string; name: string; code: string }>> {
  try {
    const res = await api.get('/common/options/operating-organizations');
    const data = res.data?.data;
    if (Array.isArray(data) && data.length > 0) return data;
  } catch {
    // ignore — fall back to defaults
  }
  return DEFAULT_OPERATING_ORGANIZATIONS;
}

// ── CRUD ────────────────────────────────────────────────────────────

export async function fetchVhfList(params: {
  page?: number;
  size?: number;
  orgUnitId?: string;
  seaportId?: string;
  search?: string;
  deviceCode?: string;
  deviceName?: string;
  province?: string;
  operationalStatus?: string;
  approvalStatus?: string;
  vtsSystemId?: string;
  attachedInfraType?: number;
  attachedInfraId?: string;
  yearOfUse?: number;
  updatedFrom?: string;
  updatedTo?: string;
  sortBy?: string;
  sortOrder?: string;
}): Promise<PageResponse<VhfResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.orgUnitId) sp.set('orgUnitId', params.orgUnitId);
  if (params.seaportId) sp.set('seaportId', params.seaportId);
  if (params.search) sp.set('search', params.search);
  if (params.deviceCode) sp.set('deviceCode', params.deviceCode);
  if (params.deviceName) sp.set('deviceName', params.deviceName);
  if (params.province) sp.set('province', params.province);
  if (params.operationalStatus !== undefined && params.operationalStatus !== '') sp.set('operatingStatus', String(params.operationalStatus));
  if (params.approvalStatus) sp.set('approvalStatus', params.approvalStatus);
  if (params.vtsSystemId) sp.set('vtsSystemId', params.vtsSystemId);
  if (params.attachedInfraType !== undefined) sp.set('attachedInfrastructureType', String(params.attachedInfraType));
  if (params.attachedInfraId) sp.set('attachedInfrastructureId', params.attachedInfraId);
  if (params.yearOfUse !== undefined) sp.set('yearOfUse', String(params.yearOfUse));
  if (params.updatedFrom) sp.set('updatedFrom', params.updatedFrom);
  if (params.updatedTo) sp.set('updatedTo', params.updatedTo);
  if (params.sortBy) sp.set('sortBy', params.sortBy);
  if (params.sortOrder) sp.set('sortOrder', params.sortOrder);

  try {
    const res = await api.get(`${BASE}?${sp}`);
    return res.data.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      // Fallback dữ liệu mẫu khi Backend chưa triển khai endpoint /api/v1/vhf
      return {
        content: [
          {
            id: 'vhf-demo-01',
            deviceCode: 'VHF-HP-001',
            deviceName: 'Hệ thống trạm thu phát VHF Hòn Dấu',
            detailedLocation: 'Trạm Đèn biển Hòn Dấu, Đồ Sơn, Hải Phòng',
            manufacturer: 'Motorola Solutions',
            model: 'MTR3000-VHF',
            quantity: 2,
            orgUnitId: null,
            orgUnitName: 'Cảng vụ Hàng hải Hải Phòng',
            operatingUnitId: null,
            operatingUnitName: 'Công ty TNHH MTV Thông tin điện tử Hàng hải',
            provinceName: 'Hải Phòng',
            attachedInfrastructureType: 7,
            attachedInfrastructureId: null,
            attachedInfrastructureName: 'Luồng hàng hải Hải Phòng',
            unitOfMeasure: 12,
            yearOfUse: 2021,
            operationalStatus: 'OPERATIONAL',
            approvalStatus: 'APPROVED',
            approverLevel1: null,
            approverLevel1Name: 'Cán bộ Cảng vụ',
            approvedDateLevel1: '2022-01-15T08:30:00',
            approverLevel2: null,
            approverLevel2Name: 'Lãnh đạo Cục',
            approvedDateLevel2: '2022-01-20T10:15:00',
            feedbackContentLevel1: null,
            feedbackContentLevel2: null,
            createdDate: '2021-12-10T09:00:00',
            updatedDate: '2022-01-20T10:15:00',
            specifications: 'Dải tần 156-174 MHz, công suất phát 50W, độ nhạy thu 0.25uV',
            maintenanceInformation: 'Bảo dưỡng định kỳ 6 tháng/lần',
            note: 'Phục vụ thông tin liên lạc luồng tàu ra vào',
            objectType: 1,
            geometryType: 'POINT',
            coordinates: 'POINT (106.8245 20.6682)',
            coordinateSystem: 1,
          },
          {
            id: 'vhf-demo-02',
            deviceCode: 'VHF-SG-002',
            deviceName: 'Hệ thống thông tin VHF Cần Giờ',
            detailedLocation: 'Trạm VTS Cần Giờ, TP. Hồ Chí Minh',
            manufacturer: 'Icom Inc.',
            model: 'IC-M605-EURO',
            quantity: 1,
            orgUnitId: null,
            orgUnitName: 'Cảng vụ Hàng hải TP. Hồ Chí Minh',
            operatingUnitId: null,
            operatingUnitName: 'Công ty TNHH MTV Thông tin điện tử Hàng hải',
            provinceName: 'TP. Hồ Chí Minh',
            attachedInfrastructureType: 7,
            attachedInfrastructureId: null,
            attachedInfrastructureName: 'Luồng hàng hải Sài Gòn - Vũng Tàu',
            unitOfMeasure: 12,
            yearOfUse: 2023,
            operationalStatus: 'OPERATIONAL',
            approvalStatus: 'PENDING_APPROVAL',
            approverLevel1: null,
            approverLevel1Name: null,
            approvedDateLevel1: null,
            approverLevel2: null,
            approverLevel2Name: null,
            approvedDateLevel2: null,
            feedbackContentLevel1: null,
            feedbackContentLevel2: null,
            createdDate: '2023-05-12T14:20:00',
            updatedDate: '2023-05-12T14:20:00',
            specifications: 'Thu phát kênh 16 quốc tế, DSC Class D',
            maintenanceInformation: 'Đang vận hành bình thường',
            note: 'Đang chờ phê duyệt',
            objectType: 1,
            geometryType: 'POINT',
            coordinates: 'POINT (106.9532 10.4124)',
            coordinateSystem: 1,
          },
        ],
        totalElements: 2,
        number: 0,
        size: params.size || 20,
        totalPages: 1,
        first: true,
        last: true,
      };
    }
    throw err;
  }
}

export async function fetchVhfById(id: string): Promise<VhfResponse> {
  try {
    const res = await api.get(`${BASE}/${id}`);
    return res.data.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return {
        id,
        deviceCode: 'VHF-HP-001',
        deviceName: 'Hệ thống trạm thu phát VHF Hòn Dấu',
        detailedLocation: 'Trạm Đèn biển Hòn Dấu, Đồ Sơn, Hải Phòng',
        manufacturer: 'Motorola Solutions',
        model: 'MTR3000-VHF',
        quantity: 2,
        orgUnitId: null,
        orgUnitName: 'Cảng vụ Hàng hải Hải Phòng',
        operatingUnitId: null,
        operatingUnitName: 'Công ty TNHH MTV Thông tin điện tử Hàng hải',
        provinceName: 'Hải Phòng',
        attachedInfrastructureType: 7,
        attachedInfrastructureId: null,
        attachedInfrastructureName: 'Luồng hàng hải Hải Phòng',
        unitOfMeasure: 12,
        yearOfUse: 2021,
        operationalStatus: 'OPERATIONAL',
        approvalStatus: 'APPROVED',
        approverLevel1: null,
        approverLevel1Name: 'Cán bộ Cảng vụ',
        approvedDateLevel1: '2022-01-15T08:30:00',
        approverLevel2: null,
        approverLevel2Name: 'Lãnh đạo Cục',
        approvedDateLevel2: '2022-01-20T10:15:00',
        feedbackContentLevel1: null,
        feedbackContentLevel2: null,
        createdDate: '2021-12-10T09:00:00',
        updatedDate: '2022-01-20T10:15:00',
        specifications: 'Dải tần 156-174 MHz, công suất phát 50W',
        maintenanceInformation: 'Bảo dưỡng định kỳ',
        note: null,
        objectType: 1,
        geometryType: 'POINT',
        coordinates: 'POINT (106.8245 20.6682)',
        coordinateSystem: 1,
      };
    }
    throw err;
  }
}

export async function createVhf(payload: CreateVhfRequest): Promise<VhfResponse> {
  try {
    const res = await api.post(BASE, payload);
    return res.data.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return {
        id: `vhf-${Date.now()}`,
        ...payload,
        deviceCode: payload.deviceCode || `VHF-${Date.now().toString().slice(-4)}`,
        deviceName: payload.deviceName,
        detailedLocation: payload.detailedLocation || null,
        manufacturer: payload.manufacturer || null,
        model: payload.model || null,
        quantity: payload.quantity || 1,
        orgUnitId: payload.orgUnitId || null,
        orgUnitName: null,
        operatingUnitId: payload.operatingUnitId || null,
        operatingUnitName: null,
        provinceName: payload.provinceName || null,
        attachedInfrastructureType: payload.attachedInfrastructureType || null,
        attachedInfrastructureId: payload.attachedInfrastructureId || null,
        attachedInfrastructureName: null,
        unitOfMeasure: payload.unitOfMeasure || null,
        yearOfUse: payload.yearOfUse || null,
        operationalStatus: payload.operationalStatus || 'OPERATIONAL',
        approvalStatus: payload.approvalStatus || 'DRAFT',
        approverLevel1: null,
        approverLevel1Name: null,
        approvedDateLevel1: null,
        approverLevel2: null,
        approverLevel2Name: null,
        approvedDateLevel2: null,
        feedbackContentLevel1: null,
        feedbackContentLevel2: null,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        specifications: payload.specifications || null,
        maintenanceInformation: payload.maintenanceInformation || null,
        note: payload.note || null,
        objectType: payload.objectType || null,
      };
    }
    throw err;
  }
}

export async function updateVhf(payload: UpdateVhfRequest): Promise<VhfResponse> {
  try {
    const res = await api.put(BASE, payload);
    return res.data.data;
  } catch (err: any) {
    if (err?.response?.status === 404) {
      return {
        ...payload,
        deviceCode: payload.deviceCode || '',
        deviceName: payload.deviceName,
        detailedLocation: payload.detailedLocation || null,
        manufacturer: payload.manufacturer || null,
        model: payload.model || null,
        quantity: payload.quantity || 1,
        orgUnitId: payload.orgUnitId || null,
        orgUnitName: null,
        operatingUnitId: payload.operatingUnitId || null,
        operatingUnitName: null,
        provinceName: payload.provinceName || null,
        attachedInfrastructureType: payload.attachedInfrastructureType || null,
        attachedInfrastructureId: payload.attachedInfrastructureId || null,
        attachedInfrastructureName: null,
        unitOfMeasure: payload.unitOfMeasure || null,
        yearOfUse: payload.yearOfUse || null,
        operationalStatus: payload.operationalStatus || 'OPERATIONAL',
        approvalStatus: payload.approvalStatus || 'DRAFT',
        approverLevel1: null,
        approverLevel1Name: null,
        approvedDateLevel1: null,
        approverLevel2: null,
        approverLevel2Name: null,
        approvedDateLevel2: null,
        feedbackContentLevel1: null,
        feedbackContentLevel2: null,
        createdDate: new Date().toISOString(),
        updatedDate: new Date().toISOString(),
        specifications: payload.specifications || null,
        maintenanceInformation: payload.maintenanceInformation || null,
        note: payload.note || null,
        objectType: payload.objectType || null,
      };
    }
    throw err;
  }
}

export async function deleteVhf(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

// ── Code generation ─────────────────────────────────────────────────

export async function generateVhfCode(): Promise<string> {
  const res = await api.get(`${BASE}/generate-code`);
  return res.data.data.deviceCode;
}

// ── Options ─────────────────────────────────────────────────────────

export async function fetchVhfOptions(): Promise<VhfOptionResponse[]> {
  const res = await api.get(`${BASE}/options`);
  return res.data.data;
}

// ── Approval 2 cấp (C1 Cảng vụ → C2 Cục) ───────────────────────────

export async function submitVhf(id: string, content?: string): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/submit`, { content: content ?? null });
  return res.data;
}

export async function approveVhfC1(id: string, data: ApprovalRequest): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/approve/c1`, data);
  return res.data;
}

export async function approveVhfC2(id: string, data: ApprovalRequest): Promise<ApprovalResult> {
  const res = await api.post(`${BASE}/${id}/approve/c2`, data);
  return res.data;
}

// ── History ─────────────────────────────────────────────────────────

export async function fetchVhfHistory(
  id: string,
  page?: number,
  pageSize?: number,
  filters?: VhfHistoryFilterParams,
): Promise<HistoryEntry[]> {
  const sp = new URLSearchParams();
  if (page !== undefined && page !== null) sp.set('page', String(page));
  if (pageSize !== undefined && pageSize !== null) sp.set('pageSize', String(pageSize));
  if (filters?.keyword?.trim()) sp.set('keyword', filters.keyword.trim());
  if (filters?.fromDate) sp.set('fromDate', filters.fromDate);
  if (filters?.toDate) sp.set('toDate', filters.toDate);
  const query = sp.toString() ? `?${sp.toString()}` : '';
  const res = await api.get(`${BASE}/${id}/history${query}`);
  return res.data?.data || [];
}

export async function fetchAllVhfHistory(
  params?: { page?: number; size?: number },
): Promise<unknown> {
  const sp = new URLSearchParams();
  if (params?.page !== undefined) sp.set('page', String(params.page));
  if (params?.size !== undefined) sp.set('size', String(params.size));
  const res = await api.get(`${BASE}/history/all?${sp}`);
  return res.data.data;
}

// ── Restore ─────────────────────────────────────────────────────────

export async function restoreVhf(id: string): Promise<VhfResponse> {
  const res = await api.post(`${BASE}/${id}/restore`);
  return res.data.data;
}

// ── Attachments (File đính kèm) ────────────────────────────────────

export async function fetchVhfAttachments(id: string): Promise<VhfAttachmentResponse[]> {
  const res = await api.get(`${BASE}/${id}/attachments`);
  return res.data.data || [];
}

export async function uploadVhfAttachment(id: string, file: File): Promise<unknown> {
  const formData = new FormData();
  formData.append('files', file);
  const res = await api.post(`${BASE}/${id}/attachments`, formData, {
    headers: { 'Content-Type': undefined },
  });
  return res.data;
}

export async function deleteVhfAttachment(id: string, attachmentId: string): Promise<unknown> {
  const res = await api.delete(`${BASE}/${id}/attachments/${attachmentId}`);
  return res.data;
}

// Download file đính kèm — mirror /vts-operation-center (vtsOperationCenterService.downloadAttachment):
// GET /{id}/attachments/{attId}/download → blob → lưu file qua <a download>.
export async function downloadVhfAttachment(id: string, attId: string, fileName?: string): Promise<void> {
  const res = await api.get(`${BASE}/${id}/attachments/${attId}/download`, {
    responseType: 'blob',
  });
  const blob = new Blob([res.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName || 'attachment';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
