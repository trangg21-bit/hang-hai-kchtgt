package com.hanghai.kchtg.common.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TrangThaiPheDuyet {
    CHO_PHE_DUYET(0),
    DUOC_PHE_DUYET(1),
    TU_CHOI(2);

    private final int value;

    TrangThaiPheDuyet(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @JsonCreator
    public static TrangThaiPheDuyet fromString(String name) {
        if (name == null) return null;
        try {
            if (name.trim().matches("^\\d+$")) {
                int val = Integer.parseInt(name.trim());
                for (TrangThaiPheDuyet st : values()) {
                    if (st.getValue() == val) return st;
                }
            }
            return TrangThaiPheDuyet.valueOf(name.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái phê duyệt không hợp lệ: " + name);
        }
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}
