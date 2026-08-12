package com.hanghai.kchtg.common.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum OperationalStatus {
    NOT_YET_OPERATIONAL(0),
    OPERATIONAL(1),
    SUSPENDED(2);

    private final int value;

    OperationalStatus(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @JsonCreator
    public static OperationalStatus fromString(String name) {
        if (name == null) return null;
        try {
            if (name.trim().matches("^\\d+$")) {
                int val = Integer.parseInt(name.trim());
                for (OperationalStatus st : values()) {
                    if (st.getValue() == val) return st;
                }
            }
            String upper = name.toUpperCase().trim();
            switch (upper) {
                case "CHUA_KHAI_THAC": case "DANG_KHAI_THAC": return OPERATIONAL;
                case "DUNG_KHAI_THAC": return SUSPENDED;
            }
            return OperationalStatus.valueOf(upper);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái hoạt động không hợp lệ: " + name);
        }
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}
