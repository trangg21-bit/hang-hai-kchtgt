package com.hanghai.kchtg.vts.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TinhTrangVTS {
    TOT(1),
    XUONG_CAP(2),
    HU_HONG(3);

    private final int value;

    TinhTrangVTS(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @JsonCreator
    public static TinhTrangVTS fromString(String name) {
        if (name == null) return null;
        try {
            String trimmed = name.trim();
            if (trimmed.matches("^\\d+$")) {
                int val = Integer.parseInt(trimmed);
                for (TinhTrangVTS st : values()) {
                    if (st.getValue() == val) return st;
                }
            }
            if (trimmed.equalsIgnoreCase("Tốt") || trimmed.equalsIgnoreCase("TOT")) return TOT;
            if (trimmed.equalsIgnoreCase("Xuống cấp") || trimmed.equalsIgnoreCase("XUONG_CAP")) return XUONG_CAP;
            if (trimmed.equalsIgnoreCase("Hư hỏng") || trimmed.equalsIgnoreCase("HU_HONG")) return HU_HONG;

            return TinhTrangVTS.valueOf(trimmed.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Tình trạng không hợp lệ: " + name);
        }
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}
