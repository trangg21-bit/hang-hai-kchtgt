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

/** One ChangeLog row (matches ChangeLog serialization — BuoyController GET /{id}/history). */
export interface ChangeHistory {
  id: string;
  entityType: string;
  entityId: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedBy: string;
  changedAt: string;
  createdAt: string;
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
