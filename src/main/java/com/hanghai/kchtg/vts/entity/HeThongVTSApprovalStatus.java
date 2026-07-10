package com.hanghai.kchtg.vts.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum HeThongVTSApprovalStatus {
    PROPOSED(0),
    CREATED(1),
    UNDER_REVIEW(2),
    APPROVED(3),
    REJECTED(4),
    DELETED(5),
    UPDATED(6);

    private final int value;

    HeThongVTSApprovalStatus(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @JsonCreator
    public static HeThongVTSApprovalStatus fromString(String name) {
        if (name == null) return null;
        try {
            if (name.trim().matches("^\\d+$")) {
                int val = Integer.parseInt(name.trim());
                for (HeThongVTSApprovalStatus st : values()) {
                    if (st.getValue() == val) return st;
                }
            }
            return HeThongVTSApprovalStatus.valueOf(name.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + name);
        }
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}
