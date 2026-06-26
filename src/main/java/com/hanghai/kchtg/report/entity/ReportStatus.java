package com.hanghai.kchtg.report.entity;

import lombok.Getter;

/**
 * Lifecycle status of a generated report.
 */
@Getter
public enum ReportStatus {
    DRAFT(1, "Bản nháp"),
    PENDING(2, "Đang tạo"),
    READY(3, "Sẵn sàng"),
    ERROR(4, "Lỗi");

    private final int value;
    private final String description;

    ReportStatus(int value, String description) {
        this.value = value;
        this.description = description;
    }
}
