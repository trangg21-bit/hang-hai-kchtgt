import api from './api';
import { toArray, toSingle, toTotalCount } from './resilient';
import type {
  CreateShipPortCallRequest,
  ShipPortCallListParams,
  ShipPortCallPage,
  ShipPortCallResponse,
} from '../types/shipPortCall';

/**
 * ShipPortCall CRUD service — mirror shipRepairFacilityService.ts (design §8.1):
 * GET /v1/ship-port-call (list + bộ lọc) và POST /v1/ship-port-call (tạo mới).
 * Response luôn bọc envelope { success, message, data, timestamp } → dùng resilient helpers.
 */
export const shipPortCallCRUD = {
  async list(params?: ShipPortCallListParams): Promise<ShipPortCallPage> {
    const p = params ?? {};
    const query: Record<string, string | number> = { page: p.page ?? 0, size: p.size ?? 20 };
    if (p.orgUnitId) query.orgUnitId = p.orgUnitId;
    if (p.keyword) query.keyword = p.keyword;
    if (p.reportDateFrom) query.reportDateFrom = p.reportDateFrom;
    if (p.reportDateTo) query.reportDateTo = p.reportDateTo;
    if (p.arrivalDateFrom) query.arrivalDateFrom = p.arrivalDateFrom;
    if (p.arrivalDateTo) query.arrivalDateTo = p.arrivalDateTo;
    if (p.departureDateFrom) query.departureDateFrom = p.departureDateFrom;
    if (p.departureDateTo) query.departureDateTo = p.departureDateTo;
    const res = await api.get('/v1/ship-port-call', { params: query });
    return {
      items: toArray<ShipPortCallResponse>(res.data),
      total: toTotalCount(res.data, 0),
    };
  },

  async create(data: CreateShipPortCallRequest): Promise<ShipPortCallResponse | null> {
    const res = await api.post('/v1/ship-port-call', data);
    return toSingle<ShipPortCallResponse>(res.data);
  },
};
