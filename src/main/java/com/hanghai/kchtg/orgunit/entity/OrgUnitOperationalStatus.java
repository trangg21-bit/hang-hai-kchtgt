package com.hanghai.kchtg.orgunit.entity;

/**
 * Operational availability of an organisational unit.
 *
 * <p>This is intentionally separate from {@link OrgUnitStatus}, which tracks
 * the approval workflow. The ordinal values match the legacy system:
 * {@code INACTIVE = 0} and {@code ACTIVE = 1}.</p>
 */
public enum OrgUnitOperationalStatus {
    INACTIVE,
    ACTIVE
}
