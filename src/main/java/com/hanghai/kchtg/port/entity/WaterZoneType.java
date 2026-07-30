package com.hanghai.kchtg.port.entity;

import lombok.Getter;

/**
 * Enum representing standard types of water zones (Vùng nước) in the DB.
 */
@Getter
public enum WaterZoneType {
    ANCHORAGE(1),
    QUARANTINE(2),
    PILOT_BOARDING(3),
    TURNING_BASIN(4),
    MOORING_BUOY(5),
    TRANSSHIPMENT(6),
    STORM_SHELTER(7);

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
