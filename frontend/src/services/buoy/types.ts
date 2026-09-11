// ── Buoy feature types (single source of truth = types/buoy.ts) ──
import type {
  Buoy,
  CreateBuoyRequest,
  UpdateBuoyRequest,
  BuoyStatus,
} from '../../types/buoy';

export type { Buoy, CreateBuoyRequest, UpdateBuoyRequest, BuoyStatus };

// ── Feature-scoped envelopes ─────────────────────────────────────────

/** Spring Page serialization (used only where a paged payload exists). */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  number: number;
  size: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

/** Common ApiResponse envelope: { success, message, data } — api.ts unwraps res.data.data. */
export interface ApiResponseEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

/**
 * One InfrastructureHistory row — BuoyController GET /buoys/{id}/history serializes
 * the entity DIRECTLY. JSON keys: id, refId, refType, approvalLevel, status,
 * approvedBy (UUID), approvedDate, reason, changedField, previousValue, newValue.
 */
export interface ChangeHistory {
  id: string;
  refId: string;
  refType: string;
  status: string;
  approvedBy: string | null;
  approvedDate: string;
  reason: string | null;
  changedField: string | null;
  previousValue: string | null;
  newValue: string | null;
}

/** Body of GET /buoys/{id}/history. */
export interface BuoyHistoryPayload {
  changeHistory: ChangeHistory[];
  approvalLog: unknown[];
}

/** Approval endpoint result (submit/approve/reject return data: null). */
export interface ApprovalResult {
  success: boolean;
  message: string;
  data: null;
}
