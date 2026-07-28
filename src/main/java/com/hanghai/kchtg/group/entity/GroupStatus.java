package com.hanghai.kchtg.group.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Trạng thái của nhóm người dùng.
 */
public enum GroupStatus {
    ACTIVE,
    INACTIVE;

    @JsonCreator
    public static GroupStatus fromValue(String value) {
        if (value == null || value.isBlank()) return ACTIVE;
        return valueOf(value.toUpperCase().trim());
    }

    @JsonValue
    public String toValue() {
        return name().toLowerCase();
    }
}