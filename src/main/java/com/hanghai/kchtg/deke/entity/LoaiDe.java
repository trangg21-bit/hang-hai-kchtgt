package com.hanghai.kchtg.deke.entity;

import lombok.Getter;

/**
 * Enum representing standard types of dikes/embankments (Đê kè) in the DB.
 */
@Getter
public enum LoaiDe {
    DE_DAT(1),
    DE_BETONG(2),
    KE_DA(3),
    KE_BETONG(4),
    KHAC(5);

    private final int value;

    LoaiDe(int value) {
        this.value = value;
    }

    public static LoaiDe fromValue(Integer value) {
        if (value == null) {
            return null;
        }
        for (LoaiDe ld : values()) {
            if (ld.getValue() == value) {
                return ld;
            }
        }
        throw new IllegalArgumentException("Unknown database value for LoaiDe: " + value);
    }
}
