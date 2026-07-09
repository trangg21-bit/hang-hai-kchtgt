package com.hanghai.kchtg.common.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TrangThaiHoatDong {
    TAM_NGUNG(0),
    HIEN_HANH(1);

    private final int value;

    TrangThaiHoatDong(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @JsonCreator
    public static TrangThaiHoatDong fromString(String name) {
        if (name == null) return null;
        try {
            if (name.trim().matches("^\\d+$")) {
                int val = Integer.parseInt(name.trim());
                for (TrangThaiHoatDong st : values()) {
                    if (st.getValue() == val) return st;
                }
            }
            return TrangThaiHoatDong.valueOf(name.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái hoạt động không hợp lệ: " + name);
        }
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}
