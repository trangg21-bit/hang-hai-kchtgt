package com.hanghai.kchtg.port.entity;

import lombok.Getter;

/**
 * Enum representing standard types of water zones (Vùng nước) in the DB.
 */
@Getter
public enum WaterZoneType {
    NEO_DAU(1),
    KIEM_DICH(2),
    DON_TRA_HOA_TIEU(3),
    QUAY_TRO_TAU(4),
    BEN_PHAO(5),
    CHUYEN_TAI(6),
    TRANH_BAO(7);

    private final int value;

    WaterZoneType(int value) {
        this.value = value;
    }

    public static WaterZoneType fromValue(Integer value) {
        if (value == null) {
            return null;
        }
        for (WaterZoneType lvn : values()) {
            if (lvn.getValue() == value) {
                return lvn;
            }
        }
        throw new IllegalArgumentException("Unknown database value for WaterZoneType: " + value);
    }
}
