package com.hanghai.kchtg.cangben.entity.base;

/**
 * Approval status for port-asset entities — used as a separate approval
 * tracking column (trang_thai_phe_duyet) on each entity table.
 * Values match CangBienStatus minus DA_XOA (approval status is independent
 * of soft-delete state).
 */
public enum ApprovalStatus {
    CHO_PHE_DUYET,
    DUOC_PHE_DUYET,
    TU_CHOI
}
