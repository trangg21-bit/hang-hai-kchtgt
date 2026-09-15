package com.hanghai.kchtg.vtssystem.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Operational condition status of a VTS system asset.
 * Stored as SMALLINT ordinal in the database (0=OPERATIONAL, 1=STOPPED, 2=MAINTENANCE, 3=UNDER_CONSTRUCTION, 4=NOT_YET_OPERATIONAL, 5=SUSPENDED).
 */
public enum ConditionStatus {
    OPERATIONAL,
    STOPPED,
    MAINTENANCE,
    UNDER_CONSTRUCTION,
    NOT_YET_OPERATIONAL,
    SUSPENDED;

    @JsonCreator
    public static ConditionStatus fromString(String name) {
        if (name == null || name.trim().isEmpty()) return null;
        String upper = name.toUpperCase().trim();
        switch (upper) {
            case "0":
            case "CHUA_KHAI_THAC":
            case "CHUA_HOAT_DONG":
            case "NOT_YET_OPERATIONAL":
                return NOT_YET_OPERATIONAL;
            case "1":
            case "DANG_KHAI_THAC":
            case "DANG_HOAT_DONG":
            case "ACTIVE":
            case "OPERATIONAL":
                return OPERATIONAL;
            case "2":
            case "DUNG_KHAI_THAC":
            case "DUNG_HOAT_DONG":
            case "TAM_DUNG":
            case "SUSPENDED":
                return SUSPENDED;
            case "STOPPED":
            case "INACTIVE":
                return STOPPED;
            case "MAINTENANCE":
                return MAINTENANCE;
            case "UNDER_CONSTRUCTION":
                return UNDER_CONSTRUCTION;
            default:
                try {
                    return ConditionStatus.valueOf(upper);
                } catch (IllegalArgumentException e) {
                    return OPERATIONAL;
                }
        }
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}

