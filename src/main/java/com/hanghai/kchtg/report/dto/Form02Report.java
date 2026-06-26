package com.hanghai.kchtg.report.dto;

import com.hanghai.kchtg.report.entity.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO cho Báo cáo Mẫu 02 — Bảng kê khai tài sản cố định.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Form02Report {

    private String code;
    private String name;
    private String formNumber;
    private String reportingPeriod;
    private Long assetsDeclared;
    private BigDecimal totalValue;
    private ReportStatus status;
}
