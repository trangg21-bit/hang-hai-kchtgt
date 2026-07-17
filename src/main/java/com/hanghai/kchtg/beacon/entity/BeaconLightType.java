package com.hanghai.kchtg.beacon.entity;

import lombok.Getter;

/**
 * Enum for BeaconLight types.
 * LIGHTHOUSE = Hải đăng, BEACON_LIGHT = Đèn báo, BEACON_MARK = Cọc tiêu.
 */
@Getter
public enum BeaconLightType {
    LIGHTHOUSE(1),
    BEACON_LIGHT(2),
    BEACON_MARK(3);

    private final int value;

    BeaconLightType(int value) {
        this.value = value;
    }

    public static BeaconLightType fromValue(Integer value) {
        if (value == null) {
            return null;
        }
        for (BeaconLightType t : values()) {
            if (t.getValue() == value) {
                return t;
            }
        }
        throw new IllegalArgumentException("Unknown database value for BeaconLightType: " + value);
    }
}
