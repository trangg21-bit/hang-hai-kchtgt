package com.hanghai.kchtg.nhatram.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum NhaTramStatus {
    DRAFT(0),
    PENDING_APPROVAL(1),
    APPROVED_L1(2),
    APPROVED_L2(3),
    PUBLISHED(4),
    DELETED(5);

    private final int value;

    NhaTramStatus(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @JsonCreator
    public static NhaTramStatus fromString(String name) {
        if (name == null) return null;
        try {
            if (name.trim().matches("^\\d+$")) {
                int val = Integer.parseInt(name.trim());
                for (NhaTramStatus st : values()) {
                    if (st.getValue() == val) return st;
                }
            }
            return NhaTramStatus.valueOf(name.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + name);
        }
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}
