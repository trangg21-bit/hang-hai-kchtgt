package com.hanghai.kchtg.report.dto;

import com.hanghai.kchtg.report.entity.ReportStatus;

import java.util.Objects;

/**
 * DTO cho Báo cáo Mẫu 03 — Báo cáo quản lý tài sản.
 * Thống kê tài sản đang quản lý, hoạt động và không hoạt động.
 */
public class Form03Report {

    private String code;
    private String name;
    private String formNumber;
    private String reportingPeriod;
    private Long managedAssets;
    private Long activeAssets;
    private Long inactiveAssets;
    private ReportStatus status;

    public Form03Report() {
    }

    public Form03Report(String code, String name, String formNumber, String reportingPeriod, Long managedAssets, Long activeAssets, Long inactiveAssets, ReportStatus status) {
        this.code = code;
        this.name = name;
        this.formNumber = formNumber;
        this.reportingPeriod = reportingPeriod;
        this.managedAssets = managedAssets;
        this.activeAssets = activeAssets;
        this.inactiveAssets = inactiveAssets;
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

    public Long getManagedAssets() {
        return managedAssets;
    }

    public void setManagedAssets(Long managedAssets) {
        this.managedAssets = managedAssets;
    }

    public Long getActiveAssets() {
        return activeAssets;
    }

    public void setActiveAssets(Long activeAssets) {
        this.activeAssets = activeAssets;
    }

    public Long getInactiveAssets() {
        return inactiveAssets;
    }

    public void setInactiveAssets(Long inactiveAssets) {
        this.inactiveAssets = inactiveAssets;
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
        Form03Report that = (Form03Report) o;
        return Objects.equals(code, that.code) && Objects.equals(name, that.name) && Objects.equals(formNumber, that.formNumber) && Objects.equals(reportingPeriod, that.reportingPeriod) && Objects.equals(managedAssets, that.managedAssets) && Objects.equals(activeAssets, that.activeAssets) && Objects.equals(inactiveAssets, that.inactiveAssets) && status == that.status;
    }

    @Override
    public int hashCode() {
        return Objects.hash(code, name, formNumber, reportingPeriod, managedAssets, activeAssets, inactiveAssets, status);
    }

    @Override
    public String toString() {
        return "Form03Report{" +
                "code='" + code + '\'' +
                ", name='" + name + '\'' +
                ", formNumber='" + formNumber + '\'' +
                ", reportingPeriod='" + reportingPeriod + '\'' +
                ", managedAssets=" + managedAssets +
                ", activeAssets=" + activeAssets +
                ", inactiveAssets=" + inactiveAssets +
                ", status=" + status +
                '}';
    }

    public static Form03ReportBuilder builder() {
        return new Form03ReportBuilder();
    }

    public static class Form03ReportBuilder {
        private String code;
        private String name;
        private String formNumber;
        private String reportingPeriod;
        private Long managedAssets;
        private Long activeAssets;
        private Long inactiveAssets;
        private ReportStatus status;

        Form03ReportBuilder() {
        }

        public Form03ReportBuilder code(String code) {
            this.code = code;
            return this;
        }

        public Form03ReportBuilder name(String name) {
            this.name = name;
            return this;
        }

        public Form03ReportBuilder formNumber(String formNumber) {
            this.formNumber = formNumber;
            return this;
        }

        public Form03ReportBuilder reportingPeriod(String reportingPeriod) {
            this.reportingPeriod = reportingPeriod;
            return this;
        }

        public Form03ReportBuilder managedAssets(Long managedAssets) {
            this.managedAssets = managedAssets;
            return this;
        }

        public Form03ReportBuilder activeAssets(Long activeAssets) {
            this.activeAssets = activeAssets;
            return this;
        }

        public Form03ReportBuilder inactiveAssets(Long inactiveAssets) {
            this.inactiveAssets = inactiveAssets;
            return this;
        }

        public Form03ReportBuilder status(ReportStatus status) {
            this.status = status;
            return this;
        }

        public Form03Report build() {
            return new Form03Report(code, name, formNumber, reportingPeriod, managedAssets, activeAssets, inactiveAssets, status);
        }
    }
}
