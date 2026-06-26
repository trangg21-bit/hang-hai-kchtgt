package com.hanghai.kchtg.beacon.entity;

/**
 * Shared approval state for both BeaconLight and Buoy.
 * Tracks the approval workflow status independently from lifecycle status.
 */
public enum BeaconApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED
}
