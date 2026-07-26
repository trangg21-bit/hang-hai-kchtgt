package com.hanghai.kchtg.port.entity.base;

/**
 * Approval status for port-asset entities — used as a separate approval
 * tracking column (trang_thai_phe_duyet) on each entity table.
 * Values match PortStatus minus DA_XOA (approval status is independent
 * of soft-delete state).
 */
public enum ApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED
}
