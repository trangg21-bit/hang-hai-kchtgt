package com.hanghai.kchtg.report.dto;

import com.hanghai.kchtg.report.entity.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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

    public static AssetSummaryReportBuilder builder() {
        return new AssetSummaryReportBuilder();
    }

    public static class AssetSummaryReportBuilder {
        private String code;
        private String name;
        private Long totalAssets;
        private BigDecimal totalValue;
        private Integer portCount;
        private ReportStatus status;
        private Instant generatedAt;

        AssetSummaryReportBuilder() {
        }

        public AssetSummaryReportBuilder code(String code) {
            this.code = code;
            return this;
        }

        public AssetSummaryReportBuilder name(String name) {
            this.name = name;
            return this;
        }

        public AssetSummaryReportBuilder totalAssets(Long totalAssets) {
            this.totalAssets = totalAssets;
            return this;
        }

        public AssetSummaryReportBuilder totalValue(BigDecimal totalValue) {
            this.totalValue = totalValue;
            return this;
        }

        public AssetSummaryReportBuilder portCount(Integer portCount) {
            this.portCount = portCount;
            return this;
        }

        public AssetSummaryReportBuilder status(ReportStatus status) {
            this.status = status;
            return this;
        }

        public AssetSummaryReportBuilder generatedAt(Instant generatedAt) {
            this.generatedAt = generatedAt;
            return this;
        }

        public AssetSummaryReport build() {
            return new AssetSummaryReport(code, name, totalAssets, totalValue, portCount, status, generatedAt);
        }
    }
}
