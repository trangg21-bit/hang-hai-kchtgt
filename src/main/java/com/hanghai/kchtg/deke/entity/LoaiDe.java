package com.hanghai.kchtg.deke.entity;

import lombok.Getter;

/**
 * Enum representing standard types of dikes/embankments (Đê kè) in the DB.
 */
@Getter
public enum LoaiDe {
    DE_CHAN_SONG(1),
    DE_CHAN_CAT(2),
    KE_HUONG_DONG(3),
    KE_BAO_VE_BO(4),
    GIAO_THONG(5),
    KE_CHAN_SONG(6),
    KE_CHAN_CAT(7);

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
