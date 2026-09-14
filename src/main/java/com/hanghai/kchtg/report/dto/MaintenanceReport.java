package com.hanghai.kchtg.report.dto;

import com.hanghai.kchtg.report.entity.ReportStatus;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * DTO cho Báo cáo bảo trì — Mẫu 08.
 * Thống kê số lượng bảo trì, tổng chi phí theo loại cơ sở hạ tầng.
 */
public class MaintenanceReport {

    private String code;
    private String name;
    private String facilityType;
    private String period;
    private Integer maintenanceCount;
    private BigDecimal totalCost;
    private ReportStatus status;

    public MaintenanceReport() {
    }

    public MaintenanceReport(String code, String name, String facilityType, String period, Integer maintenanceCount, BigDecimal totalCost, ReportStatus status) {
        this.code = code;
        this.name = name;
        this.facilityType = facilityType;
        this.period = period;
        this.maintenanceCount = maintenanceCount;
        this.totalCost = totalCost;
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

    public String getFacilityType() {
        return facilityType;
    }

    public void setFacilityType(String facilityType) {
        this.facilityType = facilityType;
    }

    public String getPeriod() {
        return period;
    }

    public void setPeriod(String period) {
        this.period = period;
    }

    public Integer getMaintenanceCount() {
        return maintenanceCount;
    }

    public void setMaintenanceCount(Integer maintenanceCount) {
        this.maintenanceCount = maintenanceCount;
    }

    public BigDecimal getTotalCost() {
        return totalCost;
    }

    public void setTotalCost(BigDecimal totalCost) {
        this.totalCost = totalCost;
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
        MaintenanceReport that = (MaintenanceReport) o;
        return Objects.equals(code, that.code) && Objects.equals(name, that.name) && Objects.equals(facilityType, that.facilityType) && Objects.equals(period, that.period) && Objects.equals(maintenanceCount, that.maintenanceCount) && Objects.equals(totalCost, that.totalCost) && status == that.status;
    }

    @Override
    public int hashCode() {
        return Objects.hash(code, name, facilityType, period, maintenanceCount, totalCost, status);
    }

    @Override
    public String toString() {
        return "MaintenanceReport{" +
                "code='" + code + '\'' +
                ", name='" + name + '\'' +
                ", facilityType='" + facilityType + '\'' +
                ", period='" + period + '\'' +
                ", maintenanceCount=" + maintenanceCount +
                ", totalCost=" + totalCost +
                ", status=" + status +
                '}';
    }

    public static MaintenanceReportBuilder builder() {
        return new MaintenanceReportBuilder();
    }

    public static class MaintenanceReportBuilder {
        private String code;
        private String name;
        private String facilityType;
        private String period;
        private Integer maintenanceCount;
        private BigDecimal totalCost;
        private ReportStatus status;

        MaintenanceReportBuilder() {
        }

        public MaintenanceReportBuilder code(String code) {
            this.code = code;
            return this;
        }

        public MaintenanceReportBuilder name(String name) {
            this.name = name;
            return this;
        }

        public MaintenanceReportBuilder facilityType(String facilityType) {
            this.facilityType = facilityType;
            return this;
        }

        public MaintenanceReportBuilder period(String period) {
            this.period = period;
            return this;
        }

        public MaintenanceReportBuilder maintenanceCount(Integer maintenanceCount) {
            this.maintenanceCount = maintenanceCount;
            return this;
        }

        public MaintenanceReportBuilder totalCost(BigDecimal totalCost) {
            this.totalCost = totalCost;
            return this;
        }

        public MaintenanceReportBuilder status(ReportStatus status) {
            this.status = status;
            return this;
        }

        public MaintenanceReport build() {
            return new MaintenanceReport(code, name, facilityType, period, maintenanceCount, totalCost, status);
        }
    }
}
