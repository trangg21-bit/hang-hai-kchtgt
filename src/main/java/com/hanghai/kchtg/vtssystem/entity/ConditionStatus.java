package com.hanghai.kchtg.vtssystem.entity;

/**
 * Operational condition status of a VTS system asset.
 * Stored as SMALLINT ordinal in the database (0=OPERATIONAL, 1=STOPPED, 2=MAINTENANCE, 3=UNDER_CONSTRUCTION).
 */
public enum ConditionStatus {
    OPERATIONAL,
    STOPPED,
    MAINTENANCE,
    UNDER_CONSTRUCTION
}
