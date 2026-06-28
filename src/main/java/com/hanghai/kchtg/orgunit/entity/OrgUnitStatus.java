package com.hanghai.kchtg.orgunit.entity;

/**
 * Enum representing the approval status of an organisational unit.
 *
 * State machine: DRAFT --[submit]--> PENDING --[approve]--> APPROVED
 *                                                      |
 *                                                      +--[reject]--> REJECTED
 */
public enum OrgUnitStatus {
    DRAFT,
    PENDING,
    APPROVED,
    REJECTED
}
