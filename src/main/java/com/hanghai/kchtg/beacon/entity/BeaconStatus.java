package com.hanghai.kchtg.beacon.entity;

import lombok.Getter;

/**
 * Shared lifecycle status for both BeaconLight and Buoy.
 * Tracks business state: DRAFT → PENDING_APPROVAL → APPROVED_L1 → APPROVED_L2 → PUBLISHED,
 * with REJECTED and DELETED states.
 */
@Getter
public enum BeaconStatus {
    DRAFT(0),
    PENDING_APPROVAL(1),
    APPROVED_L1(2),
    APPROVED_L2(3),
    PUBLISHED(4),
    REJECTED(5),
    DELETED(6);

    private final int value;

    BeaconStatus(int value) {
        this.value = value;
    }

    public static BeaconStatus fromValue(Integer value) {
        if (value == null) {
            return null;
        }
        for (BeaconStatus s : values()) {
            if (s.getValue() == value) {
                return s;
            }
        }
        throw new IllegalArgumentException("Unknown database value for BeaconStatus: " + value);
    }
}
