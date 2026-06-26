package com.hanghai.kchtg.report.dto;

import com.hanghai.kchtg.report.entity.ReportFormat;
import com.hanghai.kchtg.report.entity.ReportStatus;
import com.hanghai.kchtg.report.entity.ReportType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

/**
 * Response DTO cho báo cáo tổng hợp M-016.
 * Chứa metadata, thống kê tổng quan và link tải file kết quả.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {

    private UUID id;
    private String code;
    private String name;
    private ReportType reportType;
    private ReportStatus status;
    private Instant generatedAt;
    private String fileUrl;
    private ReportFormat outputFormat;
    private LocalDate startDate;
    private LocalDate endDate;
    private Map<String, Object> parameters;

    // -- aggregate counts --
    private Long totalAssets;
    private BigDecimal totalValue;
    private Integer portsCount;
    private Integer maintenanceCount;
    private Integer navigationSignalsCount;
}
