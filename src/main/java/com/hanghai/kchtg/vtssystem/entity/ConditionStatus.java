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
            case "DANG_KHAI_THAC":
            case "DANG_HOAT_DONG":
            case "ACTIVE":
            case "OPERATIONAL":
                return OPERATIONAL;
            case "1":
            case "DUNG_KHAI_THAC":
            case "DUNG_HOAT_DONG":
            case "INACTIVE":
            case "STOPPED":
                return STOPPED;
            case "2":
            case "BAO_TRI":
            case "DANG_BAO_TRI":
            case "MAINTENANCE":
                return MAINTENANCE;
            case "3":
            case "DANG_XAY_DUNG":
            case "UNDER_CONSTRUCTION":
                return UNDER_CONSTRUCTION;
            case "4":
            case "CHUA_KHAI_THAC":
            case "CHUA_HOAT_DONG":
            case "NOT_YET_OPERATIONAL":
                return NOT_YET_OPERATIONAL;
            case "5":
            case "TAM_DUNG":
            case "SUSPENDED":
                return SUSPENDED;
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

