package com.hanghai.kchtg.statistics.entity;

/**
 * Lifecycle status of a statistical form submission.
 */
public enum StatFormStatus {

    DRAFT("Nháp"),
    SUBMITTED("ĐÃ nộp"),
    APPROVED("Đã duyệt"),
    REJECTED("Từ chối");

    private final String label;

    StatFormStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
