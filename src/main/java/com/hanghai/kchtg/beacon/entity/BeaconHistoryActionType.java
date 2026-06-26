package com.hanghai.kchtg.beacon.entity;

/**
 * Enum for history action types recorded in BeaconHistory.
 * Covers all CRUD and approval actions.
 */
public enum BeaconHistoryActionType {
    CREATE,
    UPDATE,
    APPROVE_L1,
    APPROVE_L2,
    REJECT,
    SOFT_DELETE
}
