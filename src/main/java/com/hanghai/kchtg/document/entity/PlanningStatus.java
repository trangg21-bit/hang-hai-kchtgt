package com.hanghai.kchtg.document.entity;

/**
 * Trạng thái ban hành quy hoạch bến cảng (D6 — stored as ORDINAL INT).
 * DRAFT has no legacy rows; legacy 'HIEN_HANH'/'DA_THAY_THE'/'LICH_SU'
 * migrate to EFFECTIVE/REPLACED/HISTORY (1/2/3) in V20260905110000.
 */
public enum PlanningStatus {

    DRAFT("Lưu tạm"),
    EFFECTIVE("Đã ban hành"),
    REPLACED("Đã thay thế"),
    HISTORY("Lịch sử");

    private final String label;

    PlanningStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
