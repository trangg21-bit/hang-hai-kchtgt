package com.hanghai.kchtg.beacon.entity;

import lombok.Getter;

/**
 * Shared approval state for both BeaconLight and Buoy.
 * Tracks the approval workflow status independently from lifecycle status.
 */
@Getter
public enum BeaconApprovalStatus {
    PENDING(0),
    APPROVED(1),
    REJECTED(2);

    private final int value;

    BeaconApprovalStatus(int value) {
        this.value = value;
    }

    public static BeaconApprovalStatus fromValue(Integer value) {
        if (value == null) {
            return null;
        }
        for (BeaconApprovalStatus s : values()) {
            if (s.getValue() == value) {
                return s;
            }
        }
        throw new IllegalArgumentException("Unknown database value for BeaconApprovalStatus: " + value);
    }
}
