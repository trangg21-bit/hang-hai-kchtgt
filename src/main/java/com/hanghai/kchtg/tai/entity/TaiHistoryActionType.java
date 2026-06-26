package com.hanghai.kchtg.tai.entity;

/**
 * Enum cho các loại hành động lịch sử trong TaiHistory.
 * Bao gồm tất cả hành động CRUD và phê duyệt.
 */
public enum TaiHistoryActionType {
    CREATE,
    UPDATE,
    APPROVE,
    REJECT,
    DELETE
}
