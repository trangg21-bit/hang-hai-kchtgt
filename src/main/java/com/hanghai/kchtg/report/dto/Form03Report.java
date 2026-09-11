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
