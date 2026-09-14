package com.hanghai.kchtg.report.dto;

import com.hanghai.kchtg.report.entity.ReportStatus;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Objects;

/**
 * DTO cho báo cáo tổng hợp tài sản — Mẫu 07 (SUMMARY).
 * Tóm tắt số lượng, giá trị tài sản theo mã và tên cơ sở.
 */
public class AssetSummaryReport {

    private String code;
    private String name;
    private Long totalAssets;
    private BigDecimal totalValue;
    private Integer portCount;
    private ReportStatus status;
    private Instant generatedAt;

    public AssetSummaryReport() {
    }

    public AssetSummaryReport(String code, String name, Long totalAssets, BigDecimal totalValue, Integer portCount, ReportStatus status, Instant generatedAt) {
        this.code = code;
        this.name = name;
        this.totalAssets = totalAssets;
        this.totalValue = totalValue;
        this.portCount = portCount;
        this.status = status;
        this.generatedAt = generatedAt;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Long getTotalAssets() {
        return totalAssets;
    }

    public void setTotalAssets(Long totalAssets) {
        this.totalAssets = totalAssets;
    }

    public BigDecimal getTotalValue() {
        return totalValue;
    }

    public void setTotalValue(BigDecimal totalValue) {
        this.totalValue = totalValue;
    }

    public Integer getPortCount() {
        return portCount;
    }

    public void setPortCount(Integer portCount) {
        this.portCount = portCount;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public void setStatus(ReportStatus status) {
        this.status = status;
    }

    public Instant getGeneratedAt() {
        return generatedAt;
    }

    public void setGeneratedAt(Instant generatedAt) {
        this.generatedAt = generatedAt;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        AssetSummaryReport that = (AssetSummaryReport) o;
        return Objects.equals(code, that.code) && Objects.equals(name, that.name) && Objects.equals(totalAssets, that.totalAssets) && Objects.equals(totalValue, that.totalValue) && Objects.equals(portCount, that.portCount) && status == that.status && Objects.equals(generatedAt, that.generatedAt);
    }

    @Override
    public int hashCode() {
        return Objects.hash(code, name, totalAssets, totalValue, portCount, status, generatedAt);
    }

    @Override
    public String toString() {
        return "AssetSummaryReport{" +
                "code='" + code + '\'' +
                ", name='" + name + '\'' +
                ", totalAssets=" + totalAssets +
                ", totalValue=" + totalValue +
                ", portCount=" + portCount +
                ", status=" + status +
                ", generatedAt=" + generatedAt +
                '}';
    }

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
