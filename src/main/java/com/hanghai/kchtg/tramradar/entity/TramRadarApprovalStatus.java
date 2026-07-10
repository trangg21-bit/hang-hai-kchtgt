package com.hanghai.kchtg.tramradar.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TramRadarApprovalStatus {
    PROPOSED(0),
    UNDER_REVIEW(1),
    APPROVED(2),
    REJECTED(3);

    private final int value;

    TramRadarApprovalStatus(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @JsonCreator
    public static TramRadarApprovalStatus fromString(String name) {
        if (name == null) return null;
        try {
            if (name.trim().matches("^\\d+$")) {
                int val = Integer.parseInt(name.trim());
                for (TramRadarApprovalStatus st : values()) {
                    if (st.getValue() == val) return st;
                }
            }
            return TramRadarApprovalStatus.valueOf(name.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            // Safe fallback for other states
            if (name.equalsIgnoreCase("CREATE")) return PROPOSED;
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + name);
        }
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}
