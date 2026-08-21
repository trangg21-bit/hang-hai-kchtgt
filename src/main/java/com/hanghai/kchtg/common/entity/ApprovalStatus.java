package com.hanghai.kchtg.common.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ApprovalStatus {
    DRAFT(0, "Lưu tạm"),
    PROPOSED(1, "Đang đề xuất"),
    PENDING_APPROVAL(2, "Chờ Cảng vụ / Chi cục duyệt"),
    APPROVED_LEVEL1(3, "Chờ Cục duyệt"),
    APPROVED_LEVEL2(4, "Đã duyệt cấp 2 (Legacy)"),
    APPROVED(5, "Đã duyệt"),
    REJECTED(6, "Từ chối (Legacy)"),
    ARCHIVED(7, "Đã xóa (Lịch sử)"),
    REJECTED_LEVEL1(8, "Bị Cảng vụ / Chi cục trả về"),
    REJECTED_LEVEL2(9, "Bị Cục trả về");

    private final int value;
    private final String label;

    ApprovalStatus(int value, String label) {
        this.value = value;
        this.label = label;
    }

    public int getValue() {
        return value;
    }

    public String getLabel() {
        return label;
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
                case "DRAFT": return DRAFT;
                case "PROPOSED": return PROPOSED;
                case "PENDING": case "PENDING_APPROVAL": case "PORT_AUTHORITY": return PENDING_APPROVAL;
                case "APPROVED_L1": case "APPROVED_LEVEL1": return APPROVED_LEVEL1;
                case "APPROVED_L2": case "APPROVED_LEVEL2": return APPROVED_LEVEL2;
                case "APPROVED": case "PUBLISHED": return APPROVED;
                case "REJECTED": return REJECTED;
                case "ARCHIVED": return ARCHIVED;
                case "REJECTED_L1": case "REJECTED_LEVEL1": return REJECTED_LEVEL1;
                case "REJECTED_L2": case "REJECTED_LEVEL2": return REJECTED_LEVEL2;
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
