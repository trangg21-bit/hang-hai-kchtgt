/**
 * Service API cho module M-028 — Sản lượng cảng biển (F-301 seaport_throughput).
 * EN identifiers, VI UI messages. Resource REST: /api/v1/seaport-throughput.
 */
import api from './api';
import type { AxiosResponse } from 'axios';

export type SeaportApprovalStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'APPROVED_LEVEL1'
  | 'REJECTED_LEVEL1'
  | 'REJECTED_LEVEL2'
  | 'APPROVED'
  | 'ARCHIVED';

/** 24 cột số sản lượng + passenger_trips (khớp feature-brief §2 / lean-spec domain model). */
export interface SeaportThroughputNumbers {
  domesticContainerTon: number;
  domesticContainerTonKm: number;
  domesticDryTon: number;
  domesticDryTonKm: number;
  domesticLiquidTon: number;
  domesticLiquidTonKm: number;
  domesticOtherTon: number;
  domesticOtherTonKm: number;
  foreignContainerTon: number;
  foreignContainerTonKm: number;
  foreignDryTon: number;
  foreignDryTonKm: number;
  foreignLiquidTon: number;
  foreignLiquidTonKm: number;
  foreignOtherTon: number;
  foreignOtherTonKm: number;
  routeContainerTon: number;
  routeContainerTonKm: number;
  routeDryTon: number;
  routeDryTonKm: number;
  routeLiquidTon: number;
  routeLiquidTonKm: number;
  routeOtherTon: number;
  routeOtherTonKm: number;
  passengerTrips: number;
}

/** Tất cả field theo dõi & phê duyệt (đuôi bản ghi theo base approvable) — đọc để hiển thị. */
export interface SeaportApprovalInfo {
  approvalStatus: SeaportApprovalStatus;
  submittedAt?: string;
  submittedBy?: string;
  level1ApprovedAt?: string;
  level1ApprovedBy?: string;
  level1ApprovalContent?: string;
  level2ApprovedAt?: string;
  level2ApprovedBy?: string;
  level2ApprovalContent?: string;
  rejectionReason?: string;
  createdDate?: string;
  createdBy?: string;
  createdByName?: string;
  updatedDate?: string;
  updatedBy?: string;
  updatedByName?: string;
}

export interface SeaportThroughputRecord extends SeaportThroughputNumbers, SeaportApprovalInfo {
  id: string;
  orgUnitId: string;
  orgUnitName?: string;
  reportMonth: string; // yyyy-MM(-dd)? — backend trả ISO; FE hiển thị MM/YYYY
  note?: string;
  files?: SeaportThroughputFileItem[];
}

export interface SeaportThroughputFileItem {
  id: string;
  throughputId?: string;
  fileName: string;
  filePath?: string;
  fileSize?: number;
  fileType?: string;
}

/** Báo cáo import Excel theo dòng (design §3: báo lỗi theo dòng, không ghi nửa chừng). */
export interface SeaportThroughputImportReport {
  total?: number;
  successCount?: number;
  errorCount?: number;
  errors?: Array<{ row?: number; message?: string }>;
}

export interface SeaportThroughputPayload extends SeaportThroughputNumbers {
  orgUnitId: string;
  reportMonth: string; // yyyy-MM
  note?: string;
}

export interface SeaportThroughputQuery {
  orgUnitId?: string;
  keyword?: string;
  reportMonth?: string;
  updatedFrom?: string;
  updatedTo?: string;
  approvalStatus?: SeaportApprovalStatus | 'REJECTED';
  page?: number;
  size?: number;
}

interface PageBody {
  content?: SeaportThroughputRecord[];
  data?: SeaportThroughputRecord[];
  totalElements?: number;
  total?: number;
}

const unwrapPage = (res: AxiosResponse): { items: SeaportThroughputRecord[]; total: number } => {
  const body: PageBody | SeaportThroughputRecord[] = res.data?.data ?? res.data ?? {};
  const list = Array.isArray(body)
    ? body
    : Array.isArray(body.content)
      ? body.content
      : Array.isArray(body.data)
        ? body.data
        : [];
  const bodyAny = body as Record<string, unknown>;
  const total =
    typeof bodyAny.totalElements === 'number'
      ? (bodyAny.totalElements as number)
      : typeof bodyAny.total === 'number'
        ? (bodyAny.total as number)
        : list.length;
  return { items: list, total };
};

export const seaportThroughputService = {
  async list(params: SeaportThroughputQuery): Promise<{ items: SeaportThroughputRecord[]; total: number }> {
    const res = await api.get('/v1/seaport-throughput', { params });
    return unwrapPage(res);
  },

  async getById(id: string): Promise<SeaportThroughputRecord> {
    const res = await api.get(`/v1/seaport-throughput/${id}`);
    return res.data?.data ?? res.data;
  },

  async create(payload: SeaportThroughputPayload): Promise<SeaportThroughputRecord> {
    const res = await api.post('/v1/seaport-throughput', payload);
    return res.data?.data ?? res.data;
  },

  async update(id: string, payload: Partial<SeaportThroughputPayload>): Promise<SeaportThroughputRecord> {
    const res = await api.put(`/v1/seaport-throughput/${id}`, payload);
    return res.data?.data ?? res.data;
  },

  async softDelete(id: string): Promise<void> {
    await api.delete(`/v1/seaport-throughput/${id}`);
  },

  async submit(id: string): Promise<SeaportThroughputRecord> {
    const res = await api.post(`/v1/seaport-throughput/${id}/submit`);
    return res.data?.data ?? res.data;
  },

  /** Báo cáo lỗi theo dòng của Import Excel (không ghi nửa chừng — BR-SLCB-09). */
  async approveLevel1(id: string, content?: string): Promise<SeaportThroughputRecord> {
    const res = await api.post(`/v1/seaport-throughput/${id}/approve/c1`, {
      content: (content ?? '').trim() || undefined,
    });
    return res.data?.data ?? res.data;
  },

  async approveLevel2(id: string, content?: string): Promise<SeaportThroughputRecord> {
    const res = await api.post(`/v1/seaport-throughput/${id}/approve/c2`, {
      content: (content ?? '').trim() || undefined,
    });
    return res.data?.data ?? res.data;
  },

  /** Từ chối — backend suy cấp từ trạng thái hiện tại của bản ghi (PENDING_APPROVAL → REJECTED_LEVEL1; APPROVED_LEVEL1 → REJECTED_LEVEL2). */
  async reject(id: string, reason: string): Promise<SeaportThroughputRecord> {
    const res = await api.post(`/v1/seaport-throughput/${id}/reject`, { reason: reason.trim() });
    return res.data?.data ?? res.data;
  },

  /** File đính kèm: danh sách nằm trong response GET /{id} (files[]); không có endpoint GET /files riêng (design §3). */
  async uploadFile(throughputId: string, file: File): Promise<SeaportThroughputFileItem> {
    const formData = new FormData();
    formData.append('files', file);
    const res = await api.post(`/v1/seaport-throughput/${throughputId}/files`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data ?? res.data;
  },

  async deleteFile(throughputId: string, fileId: string): Promise<void> {
    await api.delete(`/v1/seaport-throughput/${throughputId}/files/${fileId}`);
  },

  /** Import Excel theo dòng — trả về báo cáo lỗi theo dòng (design §3, action import). */
  async importExcel(file: File): Promise<SeaportThroughputImportReport> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/v1/seaport-throughput/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data?.data ?? res.data;
  },

  async history(id: string): Promise<unknown> {
    const res = await api.get(`/v1/seaport-throughput/${id}/history`);
    return res.data?.data ?? res.data;
  },
};

export default seaportThroughputService;
