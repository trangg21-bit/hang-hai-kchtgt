package com.hanghai.kchtg.common.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ApprovalStatus {
    DRAFT(0),
    PENDING(1),
    PORT_AUTHORITY(2),
    APPROVED(3),
    REJECTED(4),
    SUSPENDED(5),
    DELETED(6);

    private final int value;

    ApprovalStatus(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @JsonCreator
    public static ApprovalStatus fromString(String name) {
        if (name == null) return null;
        try {
            if (name.trim().matches("^\\d+$")) {
                int val = Integer.parseInt(name.trim());
                for (ApprovalStatus st : values()) {
                    if (st.getValue() == val) return st;
                }
            }
            String upper = name.toUpperCase().trim();
            // Backward compatibility for old Vietnamese constant values
            switch (upper) {
                case "NHAP": return DRAFT;
                case "CHO_PHE_DUYET": return PENDING;
                case "CHO_PD_CAP_CUC": return PORT_AUTHORITY;
                case "DUOC_PHE_DUYET": return APPROVED;
                case "TU_CHOI": return REJECTED;
            }
            return ApprovalStatus.valueOf(upper);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái phê duyệt không hợp lệ: " + name);
        }
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}
