package com.hanghai.kchtg.port.entity;

import lombok.Getter;

/**
 * Enum representing standard types of cranes/piers (Cầu cảng) in the DB.
 */
@Getter
public enum PierType {
    CONTAINER(1),
    TONG_HOP(2),
    HANH_KHACH(3),
    CHUYEN_DUNG_XANG_DAU(4),
    CHUYEN_DUNG_ROI_QUANG(5),
    KHAC(6);

    private final int value;

    PierType(int value) {
        this.value = value;
    }

    public static PierType fromValue(Integer value) {
        if (value == null) {
            return null;
        }
        for (PierType lc : values()) {
            if (lc.getValue() == value) {
                return lc;
            }
        }
        throw new IllegalArgumentException("Unknown database value for PierType: " + value);
    }
}
