package com.hanghai.kchtg.common.enums;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum InfrastructureHistoryStatus {
    CREATED(0, "CREATED"),
    PROPOSED(1, "PROPOSED"),
    UNDER_REVIEW(2, "UNDER_REVIEW"),
    APPROVED(3, "APPROVED"),
    REJECTED(4, "REJECTED"),
    UPDATED(5, "UPDATED"),
    DELETED(6, "DELETED"),
    ATTACHMENT_UPLOADED(7, "ATTACHMENT_UPLOADED"),
    ATTACHMENT_DELETED(8, "ATTACHMENT_DELETED"),
    DRAFT_SAVED(9, "DRAFT_SAVED"),
    EXPIRED(10, "EXPIRED"),
    STATUS_CHANGED(11, "STATUS_CHANGED");

    private final int value;
    private final String code;

    InfrastructureHistoryStatus(int value, String code) {
        this.value = value;
        this.code = code;
    }

    @JsonValue
    public int getValue() {
        return value;
    }

    public String getCode() {
        return code;
    }

    @JsonCreator
    public static InfrastructureHistoryStatus fromValue(Object input) {
        if (input == null) return CREATED;
        if (input instanceof Number) {
            int val = ((Number) input).intValue();
            for (InfrastructureHistoryStatus status : values()) {
                if (status.value == val) return status;
            }
        }
        String str = input.toString();
        for (InfrastructureHistoryStatus status : values()) {
            if (status.code.equalsIgnoreCase(str)) return status;
        }
        return CREATED;
    }
}
