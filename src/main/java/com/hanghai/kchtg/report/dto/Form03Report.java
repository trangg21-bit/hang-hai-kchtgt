package com.hanghai.kchtg.report.dto;

import com.hanghai.kchtg.report.entity.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho Báo cáo Mẫu 03 — Báo cáo quản lý tài sản.
 * Thống kê tài sản đang quản lý, hoạt động và không hoạt động.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Form03Report {

    private String code;
    private String name;
    private String formNumber;
    private String reportingPeriod;
    private Long managedAssets;
    private Long activeAssets;
    private Long inactiveAssets;
    private ReportStatus status;
}
