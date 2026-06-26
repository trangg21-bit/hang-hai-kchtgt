package com.hanghai.kchtg.beacon.entity;

/**
 * Shared lifecycle status for both BeaconLight and Buoy.
 * Tracks business state: DRAFT → PENDING_APPROVAL → APPROVED_L1 → APPROVED_L2 → PUBLISHED,
 * with REJECTED and DELETED states.
 */
public enum BeaconStatus {
    DRAFT,
    PENDING_APPROVAL,
    APPROVED_L1,
    APPROVED_L2,
    PUBLISHED,
    REJECTED,
    DELETED
}
