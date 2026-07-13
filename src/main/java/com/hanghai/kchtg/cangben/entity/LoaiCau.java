package com.hanghai.kchtg.cangben.entity;

import lombok.Getter;

/**
 * Enum representing standard types of cranes/piers (Cầu cảng) in the DB.
 */
@Getter
public enum LoaiCau {
    CONTAINER(1),
    TONG_HOP(2),
    HANH_KHACH(3),
    CHUYEN_DUNG_XANG_DAU(4),
    CHUYEN_DUNG_ROI_QUANG(5),
    KHAC(6);

    private final int value;

    LoaiCau(int value) {
        this.value = value;
    }

    public static LoaiCau fromValue(Integer value) {
        if (value == null) {
            return null;
        }
        for (LoaiCau lc : values()) {
            if (lc.getValue() == value) {
                return lc;
            }
        }
        throw new IllegalArgumentException("Unknown database value for LoaiCau: " + value);
    }
}
