package com.hanghai.kchtg.port.entity;

import lombok.Getter;

/**
 * Enum representing standard types of berths (Loại bến cảng) as per URD catalog,
 * mapped to integer values for database storage.
 */
@Getter
public enum BerthType {
    BEN_CONTAINER(1),
    BEN_TONG_HOP(2),
    BEN_CHUYEN_DUNG(3),
    BEN_HANH_KHACH(4),
    BEN_PHAO(5),
    BEN_THUY_NOI_DIA(6);

    private final int value;

    BerthType(int value) {
        this.value = value;
    }

    public static BerthType fromValue(Integer value) {
        if (value == null) {
            return null;
        }
        for (BerthType lb : values()) {
            if (lb.getValue() == value) {
                return lb;
            }
        }
        throw new IllegalArgumentException("Unknown database value for BerthType: " + value);
    }
}
