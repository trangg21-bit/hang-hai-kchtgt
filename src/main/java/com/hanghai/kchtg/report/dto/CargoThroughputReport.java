package com.hanghai.kchtg.report.dto;

import com.hanghai.kchtg.report.entity.ReportStatus;

import java.math.BigDecimal;
import java.util.Objects;

/**
 * DTO cho Báo cáo lưu lượng hàng hóa qua cảng — Mẫu 05/06.
 * Tập trung vào khối lượng hàng hóa phân theo cảng, loại hàng, tháng/năm.
 */
public class CargoThroughputReport {

    private String code;
    private String name;
    private String portCode;
    private String cargoType;
    private Integer month;
    private Integer year;
    private BigDecimal totalVolume;
    private ReportStatus status;

    public CargoThroughputReport() {
    }

    public CargoThroughputReport(String code, String name, String portCode, String cargoType, Integer month, Integer year, BigDecimal totalVolume, ReportStatus status) {
        this.code = code;
        this.name = name;
        this.portCode = portCode;
        this.cargoType = cargoType;
        this.month = month;
        this.year = year;
        this.totalVolume = totalVolume;
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

    public String getPortCode() {
        return portCode;
    }

    public void setPortCode(String portCode) {
        this.portCode = portCode;
    }

    public String getCargoType() {
        return cargoType;
    }

    public void setCargoType(String cargoType) {
        this.cargoType = cargoType;
    }

    public Integer getMonth() {
        return month;
    }

    public void setMonth(Integer month) {
        this.month = month;
    }

    public Integer getYear() {
        return year;
    }

    public void setYear(Integer year) {
        this.year = year;
    }

    public BigDecimal getTotalVolume() {
        return totalVolume;
    }

    public void setTotalVolume(BigDecimal totalVolume) {
        this.totalVolume = totalVolume;
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
        CargoThroughputReport that = (CargoThroughputReport) o;
        return Objects.equals(code, that.code) && Objects.equals(name, that.name) && Objects.equals(portCode, that.portCode) && Objects.equals(cargoType, that.cargoType) && Objects.equals(month, that.month) && Objects.equals(year, that.year) && Objects.equals(totalVolume, that.totalVolume) && status == that.status;
    }

    @Override
    public int hashCode() {
        return Objects.hash(code, name, portCode, cargoType, month, year, totalVolume, status);
    }

    @Override
    public String toString() {
        return "CargoThroughputReport{" +
                "code='" + code + '\'' +
                ", name='" + name + '\'' +
                ", portCode='" + portCode + '\'' +
                ", cargoType='" + cargoType + '\'' +
                ", month=" + month +
                ", year=" + year +
                ", totalVolume=" + totalVolume +
                ", status=" + status +
                '}';
    }

    public static CargoThroughputReportBuilder builder() {
        return new CargoThroughputReportBuilder();
    }

    public static class CargoThroughputReportBuilder {
        private String code;
        private String name;
        private String portCode;
        private String cargoType;
        private Integer month;
        private Integer year;
        private BigDecimal totalVolume;
        private ReportStatus status;

        CargoThroughputReportBuilder() {
        }

        public CargoThroughputReportBuilder code(String code) {
            this.code = code;
            return this;
        }

        public CargoThroughputReportBuilder name(String name) {
            this.name = name;
            return this;
        }

        public CargoThroughputReportBuilder portCode(String portCode) {
            this.portCode = portCode;
            return this;
        }

        public CargoThroughputReportBuilder cargoType(String cargoType) {
            this.cargoType = cargoType;
            return this;
        }

        public CargoThroughputReportBuilder month(Integer month) {
            this.month = month;
            return this;
        }

        public CargoThroughputReportBuilder year(Integer year) {
            this.year = year;
            return this;
        }

        public CargoThroughputReportBuilder totalVolume(BigDecimal totalVolume) {
            this.totalVolume = totalVolume;
            return this;
        }

        public CargoThroughputReportBuilder status(ReportStatus status) {
            this.status = status;
            return this;
        }

        public CargoThroughputReport build() {
            return new CargoThroughputReport(code, name, portCode, cargoType, month, year, totalVolume, status);
        }
    }
}
