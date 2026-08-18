// ── Buoy API — all 11 BuoyController endpoints (design Section 3) ──
// The axios instance (services/api.ts) already prefixes baseURL '/api'.
// Every function unwraps res.data.data (ApiResponse envelope).

import api from '../api';
import type {
  Buoy,
  CreateBuoyRequest,
  UpdateBuoyRequest,
} from '../../types/beacon';
import type { BuoyHistoryPayload } from './types';

export const BASE = '/buoys';

// ── Helper: query param builder (skips undefined/empty) ──────────────

function buildSearchParams(params: Record<string, string | number | undefined>) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') sp.set(k, String(v));
  }
  return sp;
}

// ── 1. GET /buoys ────────────────────────────────────────────────────

export async function fetchAllBuoys(): Promise<Buoy[]> {
  const res = await api.get(BASE);
  return res.data.data || [];
}

// ── 2. GET /buoys/{id} ───────────────────────────────────────────────

export async function fetchBuoyById(id: string): Promise<Buoy> {
  const res = await api.get(`${BASE}/${id}`);
  return res.data.data;
}

// ── 3. GET /buoys/search — UNPAGED list (D-3: client-side pagination) ─

export interface BuoySearchParams {
  name?: string;
  code?: string;
  type?: string;
  status?: string;
}

export async function searchBuoys(params?: BuoySearchParams): Promise<Buoy[]> {
  const sp = buildSearchParams({
    name: params?.name,
    code: params?.code,
    type: params?.type,
    status: params?.status,
  });
  const res = await api.get(`${BASE}/search?${sp}`);
  return res.data.data || [];
}

// ── GET /buoys/generate-code ──────────────────────────────────────

export async function generateBuoyCode(stationId?: string): Promise<string> {
  const res = await api.get(`${BASE}/generate-code`, { params: { stationId } });
  return res.data.data.buoyCode;
}

// ── 4. POST /buoys ───────────────────────────────────────────────────

export async function createBuoy(payload: CreateBuoyRequest): Promise<Buoy> {
  const res = await api.post(BASE, payload);
  return res.data.data;
}

// ── 5. PUT /buoys/{id} ───────────────────────────────────────────────

export async function updateBuoy(id: string, payload: UpdateBuoyRequest): Promise<Buoy> {
  const res = await api.put(`${BASE}/${id}`, payload);
  return res.data.data;
}

// ── 6. DELETE /buoys/{id} ────────────────────────────────────────────

export async function deleteBuoy(id: string): Promise<void> {
  await api.delete(`${BASE}/${id}`);
}

// ── 7. POST /buoys/{id}/submit-approval ──────────────────────────────

export async function submitBuoyForApproval(id: string): Promise<void> {
  await api.post(`${BASE}/${id}/submit-approval`);
}

// ── 8. POST /buoys/{id}/approve-l1?approverId= ───────────────────────

export async function approveBuoyL1(id: string, approverId: string): Promise<Buoy> {
  const res = await api.post(`${BASE}/${id}/approve-l1`, null, { params: { approverId } });
  return res.data.data;
}

// ── 9. POST /buoys/{id}/approve-l2?approverId= ───────────────────────

export async function approveBuoyL2(id: string, approverId: string): Promise<Buoy> {
  const res = await api.post(`${BASE}/${id}/approve-l2`, null, { params: { approverId } });
  return res.data.data;
}

// ── 10. POST /buoys/{id}/reject?rejectReason=&approverId= ────────────

export async function rejectBuoy(id: string, rejectReason: string, approverId: string): Promise<Buoy> {
  const res = await api.post(`${BASE}/${id}/reject`, null, { params: { rejectReason, approverId } });
  return res.data.data;
}

// ── 11. GET /buoys/{id}/history ──────────────────────────────────────

export async function fetchBuoyHistory(id: string): Promise<BuoyHistoryPayload> {
  const res = await api.get(`${BASE}/${id}/history`);
  return res.data?.data ?? { changeHistory: [], approvalLog: [] };
}
