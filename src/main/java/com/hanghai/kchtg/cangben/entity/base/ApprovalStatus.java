package com.hanghai.kchtg.cangben.entity.base;

/**
 * Approval status for port-asset entities â€” used as a separate approval
 * tracking column (trang_thai_phe_duyet) on each entity table.
 * Values match CangBienStatus minus DA_XOA (approval status is independent
 * of soft-delete state).
 */
public enum ApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED
}
