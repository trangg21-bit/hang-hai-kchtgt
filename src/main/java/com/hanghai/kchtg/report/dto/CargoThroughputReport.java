package com.hanghai.kchtg.report.dto;

import com.hanghai.kchtg.report.entity.ReportStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * DTO cho Báo cáo lưu lượng hàng hóa qua cảng — Mẫu 05/06.
 * Tập trung vào khối lượng hàng hóa phân theo cảng, loại hàng, tháng/năm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CargoThroughputReport {

    private String code;
    private String name;
    private String portCode;
    private String cargoType;
    private Integer month;
    private Integer year;
    private BigDecimal totalVolume;
    private ReportStatus status;

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
