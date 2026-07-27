package com.hanghai.kchtg.group.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Trạng thái thành viên trong nhóm.
 */
public enum GroupMemberStatus {
    /** Thành viên đang hoạt động. */
    ACTIVE,
    /** Đã rời nhóm. */
    REMOVED,
    /** Bị cấm khỏi nhóm. */
    BANNED;

    @JsonCreator
    public static GroupMemberStatus fromValue(String value) {
        if (value == null || value.isBlank()) return ACTIVE;
        return valueOf(value.toUpperCase().trim());
    }

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }
}