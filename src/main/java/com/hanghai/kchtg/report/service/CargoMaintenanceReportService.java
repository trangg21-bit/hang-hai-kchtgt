package com.hanghai.kchtg.report.service;

import com.hanghai.kchtg.report.dto.CargoThroughputReport;
import com.hanghai.kchtg.report.dto.MaintenanceReport;
import com.hanghai.kchtg.report.entity.ReportStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Service chuyên xử lý báo cáo lưu lượng hàng hóa và bảo trì hạ tầng hàng hải.
 * Chứa các phương thức sinh CargoThroughputReport, MaintenanceReport.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CargoMaintenanceReportService {

    /**
     * Sinh báo cáo lưu lượng hàng hóa cho cảng, tháng, năm.
     */
    public CargoThroughputReport generateCargoThroughput(String portCode, Integer month, Integer year) {
        log.info("generateCargoThroughput port={} month={} year={}", portCode, month, year);
        return CargoThroughputReport.builder()
                .code("CT-" + portCode + "-" + year + String.format("%02d", month))
                .name("Báo cáo lưu lượng hàng hóa")
                .portCode(portCode)
                .cargoType("Tổng hợp")
                .month(month)
                .year(year)
                .totalVolume(new BigDecimal("4500000"))
                .status(ReportStatus.READY)
                .build();
    }

    /**
     * Lấy báo cáo lưu lượng hàng hóa tháng (stub).
     */
    public CargoThroughputReport getMonthlyCargo(String portCode, Integer month, Integer year) {
        log.info("getMonthlyCargo port={} month={} year={}", portCode, month, year);
        return CargoThroughputReport.builder()
                .code("CT-" + portCode + "-" + year + String.format("%02d", month))
                .name("Báo cáo lưu lượng hàng hóa tháng")
                .portCode(portCode)
                .cargoType("Tổng hợp")
                .month(month)
                .year(year)
                .totalVolume(new BigDecimal("4500000"))
                .status(ReportStatus.READY)
                .build();
    }

    /**
     * Lấy báo cáo lưu lượng hàng hóa năm (stub).
     */
    public CargoThroughputReport getYearlyCargo(String portCode, Integer year) {
        log.info("getYearlyCargo port={} year={}", portCode, year);
        return CargoThroughputReport.builder()
                .code("CT-" + portCode + "-Y" + year)
                .name("Báo cáo lưu lượng hàng hóa năm")
                .portCode(portCode)
                .cargoType("Tổng hợp")
                .year(year)
                .totalVolume(new BigDecimal("54000000"))
                .status(ReportStatus.READY)
                .build();
    }

    /**
     * Sinh báo cáo bảo trì theo loại cơ sở hạ tầng.
     */
    public MaintenanceReport generateMaintenanceReport(String facilityType, String period) {
        log.info("generateMaintenanceReport type={} period={}", facilityType, period);
        return MaintenanceReport.builder()
                .code("MT-" + facilityType + "-" + period)
                .name("Báo cáo bảo trì hạ tầng")
                .facilityType(facilityType)
                .period(period)
                .maintenanceCount(45)
                .totalCost(new BigDecimal("2500000000"))
                .status(ReportStatus.READY)
                .build();
    }

    /**
     * Sinh báo cáo bảo trì cảng biển.
     */
    public MaintenanceReport generatePortMaintenance(String period) {
        log.info("generatePortMaintenance period={}", period);
        return MaintenanceReport.builder()
                .code("MT-PORT-" + period)
                .name("Báo cáo bảo trì cảng biển")
                .facilityType("PORT")
                .period(period)
                .maintenanceCount(15)
                .totalCost(new BigDecimal("1200000000"))
                .status(ReportStatus.READY)
                .build();
    }

    /**
     * Sinh báo cáo bảo trì phao tiêu, hải đăng.
     */
    public MaintenanceReport generateNavSignalMaintenance(String period) {
        log.info("generateNavSignalMaintenance period={}", period);
        return MaintenanceReport.builder()
                .code("MT-NAV-" + period)
                .name("Báo cáo bảo trì phao tiêu, hải đăng")
                .facilityType("NAV_SIGNAL")
                .period(period)
                .maintenanceCount(20)
                .totalCost(new BigDecimal("800000000"))
                .status(ReportStatus.READY)
                .build();
    }

    /**
     * Sinh báo cáo bảo trì đê kè.
     */
    public MaintenanceReport generateDikeMaintenance(String period) {
        log.info("generateDikeMaintenance period={}", period);
        return MaintenanceReport.builder()
                .code("MT-DIKE-" + period)
                .name("Báo cáo bảo trì đê kè")
                .facilityType("DIKE")
                .period(period)
                .maintenanceCount(10)
                .totalCost(new BigDecimal("500000000"))
                .status(ReportStatus.READY)
                .build();
    }
}
