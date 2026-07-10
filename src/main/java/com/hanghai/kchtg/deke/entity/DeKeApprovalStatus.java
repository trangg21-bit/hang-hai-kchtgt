package com.hanghai.kchtg.deke.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum DeKeApprovalStatus {
    PROPOSED(0),
    UNDER_REVIEW(1),
    APPROVED(2),
    REJECTED(3);

    private final int value;

    DeKeApprovalStatus(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @JsonCreator
    public static DeKeApprovalStatus fromString(String name) {
        if (name == null) return null;
        try {
            if (name.trim().matches("^\\d+$")) {
                int val = Integer.parseInt(name.trim());
                for (DeKeApprovalStatus st : values()) {
                    if (st.getValue() == val) return st;
                }
            }
            return DeKeApprovalStatus.valueOf(name.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + name);
        }
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}
