package com.hanghai.kchtg.port.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Unified status enum for Port and Berth entities.
 * Replaces the split OperationalStatus + ApprovalStatus approach.
 *
 * State machine:
 *   NHAP (draft) → CHO_PHE_DUYET (submit for approval)
 *   CHO_PHE_DUYET → DA_PHE_DUYET (approved) | TU_CHOI (rejected)
 *   TU_CHOI → CHO_PHE_DUYET (resubmit)
 *   DA_PHE_DUYET → CHO_PHE_DUYET (update triggers re-approval)
 *   Any → TAM_NGUNG (suspend) | DA_XOA (soft-delete, terminal)
 */
public enum PortStatus {

    NHAP(0),           // Draft - "Lưu tạm"
    CHO_PHE_DUYET(1),  // Pending approval - "Chờ phê duyệt"
    DA_PHE_DUYET(2),   // Approved - "Đã phê duyệt"
    TU_CHOI(3),        // Rejected - "Từ chối"
    TAM_NGUNG(4),      // Suspended - "Tạm ngừng"
    DA_XOA(5);         // Deleted - "Đã xóa" (used with soft-delete deletedAt)

    private final int value;

    PortStatus(int value) {
        this.value = value;
    }

    public int getValue() {
        return value;
    }

    @JsonCreator
    public static PortStatus fromString(String name) {
        if (name == null) return null;
        try {
            if (name.trim().matches("^\\d+$")) {
                int val = Integer.parseInt(name.trim());
                for (PortStatus st : values()) {
                    if (st.getValue() == val) return st;
                }
            }
            return PortStatus.valueOf(name.toUpperCase().trim());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + name);
        }
    }

    @JsonValue
    public String toJson() {
        return this.name();
    }
}
