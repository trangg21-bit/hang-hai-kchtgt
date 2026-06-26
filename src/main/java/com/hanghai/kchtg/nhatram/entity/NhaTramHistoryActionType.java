package com.hanghai.kchtg.nhatram.entity;

/**
 * Enum cho các loại hành động lịch sử trong NhaTramHistory.
 * Bao gồm tất cả hành động CRUD và phê duyệt.
 */
public enum NhaTramHistoryActionType {
    CREATE,
    UPDATE,
    APPROVE_L1,
    APPROVE_L2,
    REJECT,
    SOFT_DELETE
}
