package com.hanghai.kchtg.orgunit.entity;

/**
 * Enum representing the rank ("Cấp đơn vị") of an organisational unit.
 *
 * <p>Persisted as SMALLINT (ordinal) via {@link OrgUnitRankConverter}. Serialized
 * as enum NAME by Jackson (no {@code @JsonValue}).</p>
 */
public enum OrgUnitRank {
    /** 0 — "Cục" */
    DEPARTMENT,
    /** 1 — "Chi cục/ Cảng vụ/ Công ty bảo đảm" */
    BRANCH,
    /** 2 — "Đại diện" */
    REPRESENTATIVE
}
