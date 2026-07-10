package com.hanghai.kchtg.luonghanghai.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum LuongHangHaiApprovalStatus {
    PROPOSED(0),
    UNDER_REVIEW(1),
    APPROVED(2),
    REJECTED(3);

    private final int value;

    LuongHangHaiApprovalStatus(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @JsonCreator
    public static LuongHangHaiApprovalStatus fromString(String name) {
        if (name == null) return null;
        try {
            if (name.trim().matches("^\\d+$")) {
                int val = Integer.parseInt(name.trim());
                for (LuongHangHaiApprovalStatus st : values()) {
                    if (st.getValue() == val) return st;
                }
            }
            return LuongHangHaiApprovalStatus.valueOf(name.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + name);
        }
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}
