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

    public static Form02ReportBuilder builder() {
        return new Form02ReportBuilder();
    }

    public static class Form02ReportBuilder {
        private String code;
        private String name;
        private String formNumber;
        private String reportingPeriod;
        private Long assetsDeclared;
        private BigDecimal totalValue;
        private ReportStatus status;

        Form02ReportBuilder() {
        }

        public Form02ReportBuilder code(String code) {
            this.code = code;
            return this;
        }

        public Form02ReportBuilder name(String name) {
            this.name = name;
            return this;
        }

        public Form02ReportBuilder formNumber(String formNumber) {
            this.formNumber = formNumber;
            return this;
        }

        public Form02ReportBuilder reportingPeriod(String reportingPeriod) {
            this.reportingPeriod = reportingPeriod;
            return this;
        }

        public Form02ReportBuilder assetsDeclared(Long assetsDeclared) {
            this.assetsDeclared = assetsDeclared;
            return this;
        }

        public Form02ReportBuilder totalValue(BigDecimal totalValue) {
            this.totalValue = totalValue;
            return this;
        }

        public Form02ReportBuilder status(ReportStatus status) {
            this.status = status;
            return this;
        }

        public Form02Report build() {
            return new Form02Report(code, name, formNumber, reportingPeriod, assetsDeclared, totalValue, status);
        }
    }
}
