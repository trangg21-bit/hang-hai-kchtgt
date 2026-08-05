package com.hanghai.kchtg.vtssystem.entity;

/**
 * Approval workflow status for a VTS system record.
 * Stored as SMALLINT ordinal in the database (0=PROPOSED, 1=UNDER_REVIEW, 2=APPROVED, 3=REJECTED).
 */
public enum ApprovalStatus {
    PROPOSED,
    UNDER_REVIEW,
    APPROVED,
    REJECTED
}
