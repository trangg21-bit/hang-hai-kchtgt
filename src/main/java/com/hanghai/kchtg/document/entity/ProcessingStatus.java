package com.hanghai.kchtg.document.entity;

/**
 * Tình trạng xử lý sự cố (D4 — stored as ORDINAL INT).
 * Ordinal values MUST stay stable: 0..2 legacy, 3 = UNRESOLVED (no legacy rows),
 * 4 = CLOSED (legacy 'DA_DONG' migrated to 4 in V20260905100000).
 */
public enum ProcessingStatus {

    TIEP_NHAN("Tiếp nhận"),
    DANG_XU_LY("Đang xử lý"),
    DA_XU_LY("Đã xử lý"),
    UNRESOLVED("Chưa xử lý dứt điểm"),
    DA_DONG("Đã đóng");

    private final String label;

    ProcessingStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
