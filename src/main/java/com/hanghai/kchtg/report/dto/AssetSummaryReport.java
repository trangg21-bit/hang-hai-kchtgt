package com.hanghai.kchtg.report.dto;

import com.hanghai.kchtg.report.entity.ReportStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * DTO cho báo cáo tổng hợp tài sản — Mẫu 07 (SUMMARY).
 * Tóm tắt số lượng, giá trị tài sản theo mã và tên cơ sở.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetSummaryReport {

    private String code;
    private String name;
    private Long totalAssets;
    private BigDecimal totalValue;
    private Integer portCount;
    private ReportStatus status;
    private Instant generatedAt;
}
