// ── Buoy feature types (D-1: single source of truth = types/beacon.ts) ──
// Re-export the canonical Buoy entity types so consumers keep compiling
// against types/beacon.ts while this module owns the feature-scoped envelopes.

import type {
  Buoy,
  CreateBuoyRequest,
  UpdateBuoyRequest,
  BeaconStatus,
} from '../../types/beacon';

export type { Buoy, CreateBuoyRequest, UpdateBuoyRequest, BeaconStatus };

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
  approvalLevel: string;
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
