package com.hanghai.kchtg.report;

import com.hanghai.kchtg.report.dto.AssetSummaryReport;
import com.hanghai.kchtg.report.dto.Form02Report;
import com.hanghai.kchtg.report.dto.Form03Report;
import com.hanghai.kchtg.report.entity.ReportStatus;
import com.hanghai.kchtg.report.repository.ReportEntityRepository;
import com.hanghai.kchtg.report.repository.ReportRepository;
import com.hanghai.kchtg.report.service.AssetSummaryReportService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AssetSummaryReportService Unit Tests")
class AssetSummaryReportServiceTest {

    @Mock
    private ReportRepository reportRepo;

    @Mock
    private ReportEntityRepository reportEntityRepo;

    @InjectMocks
    private AssetSummaryReportService assetSummaryReportService;

    @Test
    @DisplayName("F-016-20: generateAssetSummary — returns summary with correct totals")
    void generateAssetSummary_success() {
        LocalDate start = LocalDate.of(2026, 1, 1);
        LocalDate end = LocalDate.of(2026, 12, 31);

        AssetSummaryReport report = assetSummaryReportService.generateAssetSummary(start, end);

        assertNotNull(report);
        assertEquals("SUM-" + start + "-" + end, report.getCode());
        assertEquals("Báo cáo tổng hợp tài sản", report.getName());
        assertEquals(120L, report.getTotalAssets());
        assertEquals(new BigDecimal("58500000000"), report.getTotalValue());
        assertEquals(8, report.getPortCount());
        assertEquals(ReportStatus.READY, report.getStatus());
        assertNotNull(report.getGeneratedAt());
    }

    @Test
    @DisplayName("F-016-21: getAssetSummaryByCode — returns report by code")
    void getAssetSummaryByCode_success() {
        String code = "SUM-2026-01-01-2026-12-31";

        AssetSummaryReport report = assetSummaryReportService.getAssetSummaryByCode(code);

        assertNotNull(report);
        assertEquals(code, report.getCode());
        assertEquals("Báo cáo tổng hợp tài sản", report.getName());
        assertEquals(120L, report.getTotalAssets());
    }

    @Test
    @DisplayName("F-016-22: countAssets — returns total asset count")
    void countAssets_success() {
        long count = assetSummaryReportService.countAssets();

        assertEquals(120L, count);
    }

    @Test
    @DisplayName("F-016-23: sumAssetValue — returns total asset value")
    void sumAssetValue_success() {
        BigDecimal value = assetSummaryReportService.sumAssetValue();

        assertNotNull(value);
        assertEquals(0, new BigDecimal("58500000000").compareTo(value));
    }

    @Test
    @DisplayName("F-016-24: generateForm02 — creates fixed asset register report")
    void generateForm02_success() {
        LocalDate period = LocalDate.of(2026, 6, 1);

        Form02Report report = assetSummaryReportService.generateForm02(period);

        assertNotNull(report);
        assertEquals("F02-" + period.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMM")), report.getCode());
        assertEquals("Mẫu 02 — Bảng kê khai tài sản cố định", report.getName());
        assertEquals("02", report.getFormNumber());
        assertEquals("2026-06", report.getReportingPeriod());
        assertEquals(120L, report.getAssetsDeclared());
        assertEquals(ReportStatus.READY, report.getStatus());
    }

    @Test
    @DisplayName("F-016-25: generateForm03 — creates asset management report")
    void generateForm03_success() {
        LocalDate period = LocalDate.of(2026, 6, 1);

        Form03Report report = assetSummaryReportService.generateForm03(period);

        assertNotNull(report);
        assertEquals("F03-" + period.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMM")), report.getCode());
        assertEquals("Mẫu 03 — Báo cáo quản lý tài sản", report.getName());
        assertEquals("03", report.getFormNumber());
        assertEquals("2026-06", report.getReportingPeriod());
        assertEquals(120L, report.getManagedAssets());
        assertEquals(98L, report.getActiveAssets());
        assertEquals(22L, report.getInactiveAssets());
        assertEquals(ReportStatus.READY, report.getStatus());
    }

    @Test
    @DisplayName("F-016-26: generateForm04 — creates Form 04 report")
    void generateForm04_success() {
        LocalDate period = LocalDate.of(2026, 3, 1);

        Form03Report report = assetSummaryReportService.generateForm04(period);

        assertNotNull(report);
        assertEquals("F04-" + period.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMM")), report.getCode());
        assertEquals("Mẫu 04 — Báo cáo tài sản", report.getName());
        assertEquals("04", report.getFormNumber());
        assertEquals("2026-03", report.getReportingPeriod());
        assertEquals(120L, report.getManagedAssets());
        assertEquals(ReportStatus.READY, report.getStatus());
    }

    @Test
    @DisplayName("F-016-27: generateForm05 — creates Form 05 report")
    void generateForm05_success() {
        LocalDate period = LocalDate.of(2026, 9, 1);

        Form03Report report = assetSummaryReportService.generateForm05(period);

        assertNotNull(report);
        assertEquals("F05-" + period.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMM")), report.getCode());
        assertEquals("Mẫu 05 — Báo cáo tài sản", report.getName());
        assertEquals("05", report.getFormNumber());
        assertEquals("2026-09", report.getReportingPeriod());
        assertEquals(120L, report.getManagedAssets());
        assertEquals(ReportStatus.READY, report.getStatus());
    }

    @Test
    @DisplayName("F-016-28: generateForm06 — creates Form 06 report")
    void generateForm06_success() {
        LocalDate period = LocalDate.of(2026, 12, 1);

        Form03Report report = assetSummaryReportService.generateForm06(period);

        assertNotNull(report);
        assertEquals("F06-" + period.format(java.time.format.DateTimeFormatter.ofPattern("yyyyMM")), report.getCode());
        assertEquals("Mẫu 06 — Báo cáo tài sản", report.getName());
        assertEquals("06", report.getFormNumber());
        assertEquals("2026-12", report.getReportingPeriod());
        assertEquals(120L, report.getManagedAssets());
        assertEquals(ReportStatus.READY, report.getStatus());
    }

    @Test
    @DisplayName("F-016-29: generateAssetSummary — stub returns consistent values")
    void generateAssetSummary_consistentValues() {
        AssetSummaryReport r1 = assetSummaryReportService.generateAssetSummary(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 12, 31));
        AssetSummaryReport r2 = assetSummaryReportService.generateAssetSummary(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 12, 31));

        assertEquals(120L, r1.getTotalAssets());
        assertEquals(120L, r2.getTotalAssets());
        assertEquals(new BigDecimal("58500000000"), r1.getTotalValue());
        assertEquals(new BigDecimal("58500000000"), r2.getTotalValue());
        assertEquals(8, r1.getPortCount());
    }

    @Test
    @DisplayName("F-016-30: countAssets and sumAssetValue — consistent stub values")
    void stubValuesConsistent() {
        long count = assetSummaryReportService.countAssets();
        BigDecimal value = assetSummaryReportService.sumAssetValue();

        assertEquals(120L, count);
        assertEquals(0, new BigDecimal("58500000000").compareTo(value));
    }
}
