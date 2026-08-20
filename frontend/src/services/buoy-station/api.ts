// ── BuoyStation API — tất cả endpoints BuoyStationController ──
// Chuẩn cấu trúc /services/buoy/api.ts: BASE const + helper buildSearchParams
// + unwrap res.data.data (ApiResponse envelope).

import api from '../api';
import type {
  CreateBuoyStationRequest,
  BuoyStationResponse,
  PageResponse,
  BuoyStationHistoryPayload,
  BuoyStationAllHistoryPayload,
  StationBuoySummary,
} from './types';

export const BASE = '/v1/buoy-station';

// ── Helper: query param builder (skips undefined/empty) ──────────────

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

// ── 1. GET /v1/buoy-station (+ /search) — UNPAGED list (client-side pagination) ──

export interface BuoyStationSearchParams {
  name?: string;
  code?: string;
  type?: string;
  status?: string;
  unitId?: string;
  province?: string;
  portId?: string;
  operatingOrgId?: string;
  updatedFrom?: string;
  updatedTo?: string;
}

export async function fetchBuoyStationList(params?: BuoyStationSearchParams): Promise<PageResponse<BuoyStationResponse>> {
  const sp = buildSearchParams({
    name: params?.name,
    code: params?.code,
    type: params?.type,
    status: params?.status,
    unitId: params?.unitId,
    province: params?.province,
    portId: params?.portId,
    operatingOrgId: params?.operatingOrgId,
    updatedFrom: params?.updatedFrom,
    updatedTo: params?.updatedTo,
  });
  const hasFilter = !!sp.toString();
  const url = hasFilter ? `${BASE}/search` : BASE;
  const res = await api.get(`${url}?${sp}`);
  const list: BuoyStationResponse[] = res.data.data || [];
  return {
    content: list,
    totalElements: list.length,
    totalPages: list.length === 0 ? 0 : 1,
    size: list.length,
    number: 0,
    first: true,
    last: true,
  };
}

// ── 2. GET /v1/buoy-station/{id} ─────────────────────────────────────

export async function fetchBuoyStationById(id: string): Promise<BuoyStationResponse> {
  const res = await api.get(`${BASE}/${id}`);
  return res.data.data;
}

// ── GET /v1/buoy-station/generate-code?portId= ───────────────────────

export async function generateBuoyStationCode(portId: string): Promise<string> {
  const res = await api.get(`${BASE}/generate-code`, { params: { portId } });
  return res.data?.data?.code ?? res.data?.data ?? '';
}

// ── 3. POST /v1/buoy-station ─────────────────────────────────────────

export async function createBuoyStation(payload: CreateBuoyStationRequest): Promise<BuoyStationResponse> {
  const res = await api.post(BASE, payload);
  return res.data.data;
}

// ── 4. PUT /v1/buoy-station/{id} ─────────────────────────────────────

export async function updateBuoyStation(id: string, payload: CreateBuoyStationRequest): Promise<BuoyStationResponse> {
  const res = await api.put(`${BASE}/${id}`, payload);
  return res.data.data;
}

// ── 5. DELETE /v1/buoy-station/{id} ──────────────────────────────────

export async function deleteBuoyStation(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

// ── 6. POST /v1/buoy-station/{id}/submit-approval ────────────────────

export async function submitBuoyStationForApproval(id: string): Promise<void> {
  await api.post(`${BASE}/${id}/submit-approval`);
}

// ── 7. POST /v1/buoy-station/{id}/approve-l1?approverId= ──────────────

export async function approveBuoyStationL1(id: string, approverId: string, content?: string): Promise<BuoyStationResponse> {
  const res = await api.post(`${BASE}/${id}/approve-l1`, null, { params: { approverId, ...(content ? { content } : {}) } });
  return res.data.data;
}

// ── 8. POST /v1/buoy-station/{id}/approve-l2?approverId= ──────────────

export async function approveBuoyStationL2(id: string, approverId: string, content?: string): Promise<BuoyStationResponse> {
  const res = await api.post(`${BASE}/${id}/approve-l2`, null, { params: { approverId, ...(content ? { content } : {}) } });
  return res.data.data;
}

// ── 9. POST /v1/buoy-station/{id}/reject?rejectReason=&approverId= ───

export async function rejectBuoyStation(id: string, rejectReason: string, approverId: string): Promise<BuoyStationResponse> {
  const res = await api.post(`${BASE}/${id}/reject`, null, { params: { rejectReason, approverId } });
  return res.data.data;
}

// ── 10. GET /v1/buoy-station/{id}/history ─────────────────────────────

export async function fetchBuoyStationHistory(id: string): Promise<BuoyStationHistoryPayload> {
  const res = await api.get(`${BASE}/${id}/history`);
  return res.data?.data ?? { changeHistory: [], approvalLog: [] };
}

// ── 11. GET /v1/buoy-station/history/all — toàn bộ lịch sử mọi nhà trạm ──

export async function fetchBuoyStationAllHistory(): Promise<BuoyStationAllHistoryPayload> {
  const res = await api.get(`${BASE}/history/all`);
  return res.data?.data ?? { entityType: 'BuoyStation', changeHistory: [], entityNames: {} };
}

// ── 12. GET /v1/buoy-station/{id}/buoys — danh sách phao tiêu thuộc nhà trạm (CSV 34-38) ──

export async function fetchStationBuoys(id: string): Promise<StationBuoySummary[]> {
  const res = await api.get(`${BASE}/${id}/buoys`);
  return res.data?.data || [];
}
