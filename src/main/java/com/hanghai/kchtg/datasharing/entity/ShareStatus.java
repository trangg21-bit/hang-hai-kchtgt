package com.hanghai.kchtg.datasharing.entity;

/**
 * Lifecycle status of a shared data record.
 */
public enum ShareStatus {

    DRAFT("Nháp"),
    SHARED("Đã chia sẻ"),
    REVOKED("Đã thu hồi"),
    EXPIRED("Hết hạn");

    private final String label;

    ShareStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
