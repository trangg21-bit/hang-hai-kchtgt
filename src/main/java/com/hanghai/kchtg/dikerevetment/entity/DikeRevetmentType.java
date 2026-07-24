package com.hanghai.kchtg.dikerevetment.entity;

import lombok.Getter;

/**
 * Enum representing standard types of dikes/revetments (Đê kè) in the DB.
 */
@Getter
public enum DikeRevetmentType {
    RIVER_DIKE(1),
    SAND_DIKE(2),
    FLOW_GUIDE_REVETMENT(3),
    BANK_PROTECTION_REVETMENT(4),
    TRAFFIC(5),
    WAVE_BREAK_REVETMENT(6),
    SAND_BREAK_REVETMENT(7);

    private final int value;

    DikeRevetmentType(int value) {
        this.value = value;
    }

    public static DikeRevetmentType fromValue(Integer value) {
        if (value == null) {
            return null;
        }
        for (DikeRevetmentType ld : values()) {
            if (ld.getValue() == value) {
                return ld;
            }
        }
        throw new IllegalArgumentException("Unknown database value for DikeRevetmentType: " + value);
    }
}
