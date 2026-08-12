package com.hanghai.kchtg.common.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ApprovalStatus {
    DRAFT(0),
    PROPOSED(1),
    PENDING_APPROVAL(2),
    APPROVED_LEVEL1(3),
    APPROVED_LEVEL2(4),
    APPROVED(5),
    REJECTED(6),
    UNDER_REVIEW(7);

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
            switch (upper) {
                case "NHAP": return DRAFT;
                case "PROPOSED": return PROPOSED;
                case "UNDER_REVIEW": return UNDER_REVIEW;
                case "PENDING": case "CHO_PHE_DUYET":
                case "PORT_AUTHORITY": case "CHO_PD_CAP_CUC": return PENDING_APPROVAL;
                case "APPROVED_L1": case "APPROVED_LEVEL1": return APPROVED_LEVEL1;
                case "APPROVED_L2": case "APPROVED_LEVEL2": return APPROVED_LEVEL2;
                case "APPROVED": case "DUOC_PHE_DUYET": case "PUBLISHED": return APPROVED;
                case "REJECTED": case "TU_CHOI": return REJECTED;
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
