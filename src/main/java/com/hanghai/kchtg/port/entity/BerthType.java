package com.hanghai.kchtg.port.entity;

import lombok.Getter;

/**
 * Enum representing standard types of berths (Loại bến cảng) as per URD catalog,
 * mapped to integer values for database storage.
 */
@Getter
public enum BerthType {
    CONTAINER(1),
    GENERAL_CARGO(2),
    SPECIALIZED(3),
    PASSENGER(4),
    MOORING_BUOY(5),
    INLAND_WATERWAY(6);

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
