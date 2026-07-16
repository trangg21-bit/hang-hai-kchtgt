package com.hanghai.kchtg.beacon.entity;

import lombok.Getter;

/**
 * Enum for Buoy types.
 * CARDINAL = Hướng, SECTOR = Phân khu, SPECIAL = Đặc biệt, SAFE_WATER = Vùng nước an toàn,
 * ISOLATED_DANGER = Nguy hiểm cô lập.
 */
@Getter
public enum BuoyType {
    CARDINAL(1),
    SECTOR(2),
    SPECIAL(3),
    SAFE_WATER(4),
    ISOLATED_DANGER(5);

    private final int value;

    BuoyType(int value) {
        this.value = value;
    }

    public static BuoyType fromValue(Integer value) {
        if (value == null) {
            return null;
        }
        for (BuoyType t : values()) {
            if (t.getValue() == value) {
                return t;
            }
        }
        throw new IllegalArgumentException("Unknown database value for BuoyType: " + value);
    }
}
