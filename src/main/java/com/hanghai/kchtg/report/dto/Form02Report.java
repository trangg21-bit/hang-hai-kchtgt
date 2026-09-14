package com.hanghai.kchtg.report.dto;

import com.hanghai.kchtg.report.entity.ReportStatus;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * DTO cho Báo cáo Mẫu 02 — Bảng kê khai tài sản cố định.
 */
public class Form02Report {

    private String code;
    private String name;
    private String formNumber;
    private String reportingPeriod;
    private Long assetsDeclared;
    private BigDecimal totalValue;
    private ReportStatus status;

    public Form02Report() {
    }

    public Form02Report(String code, String name, String formNumber, String reportingPeriod, Long assetsDeclared, BigDecimal totalValue, ReportStatus status) {
        this.code = code;
        this.name = name;
        this.formNumber = formNumber;
        this.reportingPeriod = reportingPeriod;
        this.assetsDeclared = assetsDeclared;
        this.totalValue = totalValue;
        this.status = status;
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

    public String getFormNumber() {
        return formNumber;
    }

    public void setFormNumber(String formNumber) {
        this.formNumber = formNumber;
    }

    public String getReportingPeriod() {
        return reportingPeriod;
    }

    public void setReportingPeriod(String reportingPeriod) {
        this.reportingPeriod = reportingPeriod;
    }

    public Long getAssetsDeclared() {
        return assetsDeclared;
    }

    public void setAssetsDeclared(Long assetsDeclared) {
        this.assetsDeclared = assetsDeclared;
    }

    public BigDecimal getTotalValue() {
        return totalValue;
    }

    public void setTotalValue(BigDecimal totalValue) {
        this.totalValue = totalValue;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public void setStatus(ReportStatus status) {
        this.status = status;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Form02Report that = (Form02Report) o;
        return Objects.equals(code, that.code) && Objects.equals(name, that.name) && Objects.equals(formNumber, that.formNumber) && Objects.equals(reportingPeriod, that.reportingPeriod) && Objects.equals(assetsDeclared, that.assetsDeclared) && Objects.equals(totalValue, that.totalValue) && status == that.status;
    }

    @Override
    public int hashCode() {
        return Objects.hash(code, name, formNumber, reportingPeriod, assetsDeclared, totalValue, status);
    }

    @Override
    public String toString() {
        return "Form02Report{" +
                "code='" + code + '\'' +
                ", name='" + name + '\'' +
                ", formNumber='" + formNumber + '\'' +
                ", reportingPeriod='" + reportingPeriod + '\'' +
                ", assetsDeclared=" + assetsDeclared +
                ", totalValue=" + totalValue +
                ", status=" + status +
                '}';
    }

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
