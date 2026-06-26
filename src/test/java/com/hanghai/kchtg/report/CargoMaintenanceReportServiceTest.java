package com.hanghai.kchtg.report;

import com.hanghai.kchtg.report.dto.CargoThroughputReport;
import com.hanghai.kchtg.report.dto.MaintenanceReport;
import com.hanghai.kchtg.report.entity.ReportStatus;
import com.hanghai.kchtg.report.repository.ReportEntityRepository;
import com.hanghai.kchtg.report.repository.ReportRepository;
import com.hanghai.kchtg.report.service.CargoMaintenanceReportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CargoMaintenanceReportService Unit Tests")
class CargoMaintenanceReportServiceTest {

    @Mock
    private ReportRepository reportRepo;

    @Mock
    private ReportEntityRepository reportEntityRepo;

    @InjectMocks
    private CargoMaintenanceReportService cargoMaintenanceReportService;

    @Test
    @DisplayName("F-016-40: generateCargoThroughput — returns cargo report with correct data")
    void generateCargoThroughput_success() {
        CargoThroughputReport report = cargoMaintenanceReportService.generateCargoThroughput("HP-PORT", 6, 2026);

        assertNotNull(report);
        assertEquals("CT-HP-PORT-202606", report.getCode());
        assertEquals("Báo cáo lưu lượng hàng hóa", report.getName());
        assertEquals("HP-PORT", report.getPortCode());
        assertEquals("Tổng hợp", report.getCargoType());
        assertEquals(6, report.getMonth());
        assertEquals(2026, report.getYear());
        assertEquals(0, new BigDecimal("4500000").compareTo(report.getTotalVolume()));
        assertEquals(ReportStatus.READY, report.getStatus());
    }

    @Test
    @DisplayName("F-016-41: getMonthlyCargo — returns monthly cargo report")
    void getMonthlyCargo_success() {
        CargoThroughputReport report = cargoMaintenanceReportService.getMonthlyCargo("HP-PORT", 3, 2026);

        assertNotNull(report);
        assertEquals("CT-HP-PORT-202603", report.getCode());
        assertEquals("Báo cáo lưu lượng hàng hóa tháng", report.getName());
        assertEquals(3, report.getMonth());
        assertEquals(2026, report.getYear());
        assertEquals(ReportStatus.READY, report.getStatus());
    }

    @Test
    @DisplayName("F-016-42: getYearlyCargo — returns yearly cargo report")
    void getYearlyCargo_success() {
        CargoThroughputReport report = cargoMaintenanceReportService.getYearlyCargo("HP-PORT", 2026);

        assertNotNull(report);
        assertEquals("CT-HP-PORT-Y2026", report.getCode());
        assertEquals("Báo cáo lưu lượng hàng hóa năm", report.getName());
        assertEquals("HP-PORT", report.getPortCode());
        assertEquals(2026, report.getYear());
        assertEquals(0, new BigDecimal("54000000").compareTo(report.getTotalVolume()));
        assertEquals(ReportStatus.READY, report.getStatus());
    }

    @Test
    @DisplayName("F-016-43: generateMaintenanceReport — returns maintenance report by facility type")
    void generateMaintenanceReport_success() {
        MaintenanceReport report = cargoMaintenanceReportService.generateMaintenanceReport("PORT", "2026-Q2");

        assertNotNull(report);
        assertEquals("MT-PORT-2026-Q2", report.getCode());
        assertEquals("Báo cáo bảo trì hạ tầng", report.getName());
        assertEquals("PORT", report.getFacilityType());
        assertEquals("2026-Q2", report.getPeriod());
        assertEquals(45, report.getMaintenanceCount());
        assertEquals(0, new BigDecimal("2500000000").compareTo(report.getTotalCost()));
        assertEquals(ReportStatus.READY, report.getStatus());
    }

    @Test
    @DisplayName("F-016-44: generatePortMaintenance — returns port maintenance report")
    void generatePortMaintenance_success() {
        MaintenanceReport report = cargoMaintenanceReportService.generatePortMaintenance("2026-06");

        assertNotNull(report);
        assertEquals("MT-PORT-2026-06", report.getCode());
        assertEquals("Báo cáo bảo trì cảng biển", report.getName());
        assertEquals("PORT", report.getFacilityType());
        assertEquals("2026-06", report.getPeriod());
        assertEquals(15, report.getMaintenanceCount());
        assertEquals(0, new BigDecimal("1200000000").compareTo(report.getTotalCost()));
        assertEquals(ReportStatus.READY, report.getStatus());
    }

    @Test
    @DisplayName("F-016-45: generateNavSignalMaintenance — returns nav signal maintenance report")
    void generateNavSignalMaintenance_success() {
        MaintenanceReport report = cargoMaintenanceReportService.generateNavSignalMaintenance("2026-06");

        assertNotNull(report);
        assertEquals("MT-NAV-2026-06", report.getCode());
        assertEquals("Báo cáo bảo trì phao tiêu, hải đăng", report.getName());
        assertEquals("NAV_SIGNAL", report.getFacilityType());
        assertEquals("2026-06", report.getPeriod());
        assertEquals(20, report.getMaintenanceCount());
        assertEquals(0, new BigDecimal("800000000").compareTo(report.getTotalCost()));
        assertEquals(ReportStatus.READY, report.getStatus());
    }

    @Test
    @DisplayName("F-016-46: generateDikeMaintenance — returns dike maintenance report")
    void generateDikeMaintenance_success() {
        MaintenanceReport report = cargoMaintenanceReportService.generateDikeMaintenance("2026-06");

        assertNotNull(report);
        assertEquals("MT-DIKE-2026-06", report.getCode());
        assertEquals("Báo cáo bảo trì đê kè", report.getName());
        assertEquals("DIKE", report.getFacilityType());
        assertEquals("2026-06", report.getPeriod());
        assertEquals(10, report.getMaintenanceCount());
        assertEquals(0, new BigDecimal("500000000").compareTo(report.getTotalCost()));
        assertEquals(ReportStatus.READY, report.getStatus());
    }

    @Test
    @DisplayName("F-016-47: generateCargoThroughput — different port codes produce unique codes")
    void generateCargoThroughput_uniqueCodesPerPort() {
        CargoThroughputReport r1 = cargoMaintenanceReportService.generateCargoThroughput("HP-PORT", 1, 2026);
        CargoThroughputReport r2 = cargoMaintenanceReportService.generateCargoThroughput("QN-PORT", 1, 2026);

        assertNotEquals(r1.getCode(), r2.getCode());
        assertTrue(r1.getCode().startsWith("CT-HP-PORT-"));
        assertTrue(r2.getCode().startsWith("CT-QN-PORT-"));
    }

    @Test
    @DisplayName("F-016-48: generateMaintenanceReport — different types produce unique codes")
    void generateMaintenanceReport_uniqueCodesPerType() {
        MaintenanceReport r1 = cargoMaintenanceReportService.generateMaintenanceReport("PORT", "2026");
        MaintenanceReport r2 = cargoMaintenanceReportService.generateMaintenanceReport("NAV_SIGNAL", "2026");

        assertNotEquals(r1.getCode(), r2.getCode());
        assertEquals("PORT", r1.getFacilityType());
        assertEquals("NAV_SIGNAL", r2.getFacilityType());
    }

    @Test
    @DisplayName("F-016-49: all maintenance reports — status always READY (stub)")
    void maintenanceReportsAlwaysReady() {
        MaintenanceReport port = cargoMaintenanceReportService.generatePortMaintenance("2026");
        MaintenanceReport nav = cargoMaintenanceReportService.generateNavSignalMaintenance("2026");
        MaintenanceReport dike = cargoMaintenanceReportService.generateDikeMaintenance("2026");

        assertEquals(ReportStatus.READY, port.getStatus());
        assertEquals(ReportStatus.READY, nav.getStatus());
        assertEquals(ReportStatus.READY, dike.getStatus());
    }
}
