package com.hanghai.kchtg.vtssystem.entity;

/**
 * Physical condition status of a VTS system asset.
 * Stored as SMALLINT ordinal in the database (0=GOOD, 1=DEGRADED, 2=DAMAGED).
 */
public enum ConditionStatus {
    GOOD,
    DEGRADED,
    DAMAGED
}
