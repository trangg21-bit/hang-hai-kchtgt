import api from '../api';
import type {
  PageResponse,
  LegalDocumentCreateRequest,
  LegalDocumentResponse,
  LegalDocumentHistoryResponse,
  SuCoCreateRequest,
  SuCoResponse,
  QuyHoachBenCangCreateRequest,
  QuyHoachBenCangResponse,
} from './types';

// ==========================================
// 1. Văn bản pháp lý
// ==========================================
export async function fetchLegalDocumentList(params: {
  page?: number;
  size?: number;
  keyword?: string;
  documentNumber?: string;
  issuingAuthority?: string;
  type?: string;
  status?: string;
  applicationArea?: string;
  issueDateStart?: string;
  issueDateEnd?: string;
  effectiveDateStart?: string;
  effectiveDateEnd?: string;
}): Promise<PageResponse<LegalDocumentResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.keyword) sp.set('keyword', params.keyword);
  if (params.documentNumber) sp.set('documentNumber', params.documentNumber);
  if (params.issuingAuthority) sp.set('issuingAuthority', params.issuingAuthority);
  if (params.type) sp.set('type', params.type);
  if (params.status) sp.set('status', params.status);
  if (params.applicationArea) sp.set('applicationArea', params.applicationArea);
  if (params.issueDateStart) sp.set('issueDateStart', params.issueDateStart);
  if (params.issueDateEnd) sp.set('issueDateEnd', params.issueDateEnd);
  if (params.effectiveDateStart) sp.set('effectiveDateStart', params.effectiveDateStart);
  if (params.effectiveDateEnd) sp.set('effectiveDateEnd', params.effectiveDateEnd);

  const res = await api.get(`/v1/legal-documents/search?${sp}`);
  const data = res.data.data;
  return {
    content: data.results || [],
    totalElements: data.totalElements || 0,
    totalPages: data.totalPages || 1,
    size: data.pageSize || 10,
    number: data.currentPage || 0,
    statusCounts: data.statusCounts || {},
  };
}

export async function fetchLegalDocumentById(id: string): Promise<LegalDocumentResponse> {
  const res = await api.get(`/v1/legal-documents/${id}`);
  return res.data.data;
}

export async function createLegalDocument(payload: LegalDocumentCreateRequest): Promise<LegalDocumentResponse> {
  const res = await api.post('/v1/legal-documents', payload);
  return res.data.data;
}

export async function updateLegalDocument(id: string, payload: LegalDocumentCreateRequest): Promise<LegalDocumentResponse> {
  const res = await api.put(`/v1/legal-documents/${id}`, payload);
  return res.data.data;
}

export async function deleteLegalDocument(id: string): Promise<void> {
  await api.delete(`/v1/legal-documents/${id}`);
}

export async function invalidateLegalDocument(id: string): Promise<void> {
  await api.post(`/v1/legal-documents/${id}/invalidate`);
}

export async function uploadLegalDocumentAttachment(id: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post(`/v1/legal-documents/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data;
}

export async function deleteLegalDocumentAttachment(id: string, attachmentId: string): Promise<void> {
  await api.delete(`/v1/legal-documents/${id}/attachments/${attachmentId}`);
}

export async function fetchLegalDocumentHistory(id: string): Promise<LegalDocumentHistoryResponse[]> {
  const res = await api.get(`/v1/legal-documents/${id}/history`);
  return res.data.data || [];
}

export async function fetchLegalDocumentSuggestions(keyword: string): Promise<Array<{ id: string; keyword: string }>> {
  const res = await api.get('/v1/legal-documents/suggestions', { params: { keyword } });
  return res.data.data || [];
}

// ==========================================
// 2. Sự cố hàng hải
// ==========================================
export async function fetchIncidentList(params: {
  page?: number;
  size?: number;
  keyword?: string;
  orgUnitId?: string;
  occurredFrom?: string;
  occurredTo?: string;
  processingStatus?: string;
  incidentType?: string;
  damageStatus?: string;
}): Promise<PageResponse<SuCoResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.keyword) sp.set('keyword', params.keyword);
  if (params.orgUnitId) sp.set('orgUnitId', params.orgUnitId);
  if (params.occurredFrom) sp.set('occurredFrom', params.occurredFrom);
  if (params.occurredTo) sp.set('occurredTo', params.occurredTo);
  if (params.processingStatus) sp.set('processingStatus', params.processingStatus);
  if (params.incidentType) sp.set('incidentType', params.incidentType);
  if (params.damageStatus) sp.set('damageStatus', params.damageStatus);

  const res = await api.get(`/v1/incidents?${sp}`);
  const data = res.data.data;
  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: 1,
      size: data.length,
      number: 0,
      statusCounts: {},
    };
  }
  const page = data || {};
  return {
    content: page.content || [],
    totalElements: page.totalElements || 0,
    totalPages: page.totalPages || 1,
    size: page.size || 10,
    number: page.number || 0,
    statusCounts: page.statusCounts || {},
  };
}

export async function fetchIncidentById(id: string): Promise<SuCoResponse> {
  const res = await api.get(`/v1/incidents/${id}`);
  return res.data.data;
}

export async function createSuCo(payload: SuCoCreateRequest): Promise<SuCoResponse> {
  const res = await api.post('/v1/incidents', payload);
  return res.data.data;
}

export async function updateSuCo(id: string, payload: SuCoCreateRequest): Promise<SuCoResponse> {
  const res = await api.put(`/v1/incidents/${id}`, payload);
  return res.data.data;
}

export async function deleteSuCo(id: string): Promise<void> {
  await api.delete(`/v1/incidents/${id}`);
}

// ==========================================
// 3. Quy hoạch bến cảng
// ==========================================
export async function fetchPortPlanningList(params: {
  page?: number;
  size?: number;
  keyword?: string;
  orgUnitId?: string;
  status?: string;
  decisionNumber?: string;
  decisionFrom?: string;
  decisionTo?: string;
}): Promise<PageResponse<QuyHoachBenCangResponse>> {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set('page', String(params.page));
  if (params.size !== undefined) sp.set('size', String(params.size));
  if (params.keyword) sp.set('keyword', params.keyword);
  if (params.orgUnitId) sp.set('orgUnitId', params.orgUnitId);
  if (params.status) sp.set('status', params.status);
  if (params.decisionNumber) sp.set('decisionNumber', params.decisionNumber);
  if (params.decisionFrom) sp.set('decisionFrom', params.decisionFrom);
  if (params.decisionTo) sp.set('decisionTo', params.decisionTo);

  const res = await api.get(`/v1/port-planning/search?${sp}`);
  const data = res.data.data;
  return {
    content: data.results || [],
    totalElements: data.totalElements || 0,
    totalPages: data.totalPages || 1,
    size: data.pageSize || 10,
    number: data.currentPage || 0,
    statusCounts: data.statusCounts || {},
  };
}

export async function fetchPortPlanningById(id: string): Promise<QuyHoachBenCangResponse> {
  const res = await api.get(`/v1/port-planning/${id}`);
  return res.data.data;
}

export async function createQuyHoach(payload: QuyHoachBenCangCreateRequest): Promise<QuyHoachBenCangResponse> {
  const res = await api.post('/v1/port-planning', payload);
  return res.data.data;
}

export async function updateQuyHoach(id: string, payload: QuyHoachBenCangCreateRequest): Promise<QuyHoachBenCangResponse> {
  const res = await api.put(`/v1/port-planning/${id}`, payload);
  return res.data.data;
}

export async function deleteQuyHoach(id: string): Promise<void> {
  await api.delete(`/v1/port-planning/${id}`);
}
