package com.hanghai.kchtg.report.entity;

import lombok.Getter;

/**
 * Supported output formats for report generation.
 */
@Getter
public enum ReportFormat {
    PDF("PDF"),
    EXCEL("Excel"),
    CSV("CSV");

    private final String label;

    ReportFormat(String label) {
        this.label = label;
    }
}
