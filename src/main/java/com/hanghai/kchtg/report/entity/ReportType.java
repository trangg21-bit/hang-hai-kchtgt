package com.hanghai.kchtg.report.entity;

import lombok.Getter;

/**
 * Standard report form types for the maritime KCHTGT reporting module.
 * Each type maps to a numbered government form (Mẫu B03/CCTT, Mẫu 02-07, etc.).
 */
@Getter
public enum ReportType {
    B03_CCTT(1, "Mẫu B03/CCTT"),
    FORM_02(2, "Mẫu 02"),
    FORM_03(3, "Mẫu 03"),
    FORM_04(4, "Mẫu 04"),
    FORM_05(5, "Mẫu 05"),
    FORM_06(6, "Mẫu 06"),
    SUMMARY(7, "Mẫu 07");

    private final int value;
    private final String description;

    ReportType(int value, String description) {
        this.value = value;
        this.description = description;
    }
}
