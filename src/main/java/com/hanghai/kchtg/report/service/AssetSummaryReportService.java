package com.hanghai.kchtg.report.service;

import com.hanghai.kchtg.report.dto.AssetSummaryReport;
import com.hanghai.kchtg.report.dto.Form02Report;
import com.hanghai.kchtg.report.dto.Form03Report;
import com.hanghai.kchtg.report.entity.ReportStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * Service chuyên xử lý báo cáo tổng hợp tài sản và các biểu mẫu 02-07.
 * Chứa các phương thức sinh AssetSummaryReport, Form02Report, Form03Report.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AssetSummaryReportService {

    /**
     * Sinh AssetSummaryReport cho khoảng thời gian [start, end].
     * TODO: thay thế bằng truy vấn thực tế từ repository.
     */
    public AssetSummaryReport generateAssetSummary(LocalDate start, LocalDate end) {
        log.info("generateAssetSummary start={} end={}", start, end);
        // Stub: giả lập dữ liệu
        return AssetSummaryReport.builder()
                .code("SUM-" + start + "-" + end)
                .name("Báo cáo tổng hợp tài sản")
                .totalAssets(120L)
                .totalValue(new BigDecimal("58500000000"))
                .portCount(8)
                .status(ReportStatus.READY)
                .generatedAt(java.time.Instant.now())
                .build();
    }

    /**
     * Lấy AssetSummaryReport theo mã.
     */
    public AssetSummaryReport getAssetSummaryByCode(String code) {
        log.info("getAssetSummaryByCode [{}]", code);
        return AssetSummaryReport.builder()
                .code(code)
                .name("Báo cáo tổng hợp tài sản")
                .totalAssets(120L)
                .totalValue(new BigDecimal("58500000000"))
                .portCount(8)
                .status(ReportStatus.READY)
                .generatedAt(java.time.Instant.now())
                .build();
    }

    /**
     * Đếm tổng số tài sản (stub).
     */
    public long countAssets() {
        log.info("countAssets()");
        return 120L;
    }

    /**
     * Tổng giá trị tài sản (stub).
     */
    public BigDecimal sumAssetValue() {
        log.info("sumAssetValue()");
        return new BigDecimal("58500000000");
    }

    /**
     * Sinh Báo cáo Mẫu 02 — Bảng kê khai tài sản cố định.
     */
    public Form02Report generateForm02(LocalDate period) {
        log.info("generateForm02 period={}", period);
        return Form02Report.builder()
                .code("F02-" + period.format(DateTimeFormatter.ofPattern("yyyyMM")))
                .name("Mẫu 02 — Bảng kê khai tài sản cố định")
                .formNumber("02")
                .reportingPeriod(period.format(DateTimeFormatter.ofPattern("yyyy-MM")))
                .assetsDeclared(120L)
                .totalValue(new BigDecimal("58500000000"))
                .status(ReportStatus.READY)
                .build();
    }

    /**
     * Sinh Báo cáo Mẫu 03 — Quản lý tài sản.
     */
    public Form03Report generateForm03(LocalDate period) {
        log.info("generateForm03 period={}", period);
        return Form03Report.builder()
                .code("F03-" + period.format(DateTimeFormatter.ofPattern("yyyyMM")))
                .name("Mẫu 03 — Báo cáo quản lý tài sản")
                .formNumber("03")
                .reportingPeriod(period.format(DateTimeFormatter.ofPattern("yyyy-MM")))
                .managedAssets(120L)
                .activeAssets(98L)
                .inactiveAssets(22L)
                .status(ReportStatus.READY)
                .build();
    }

    /**
     * Sinh Báo cáo Mẫu 04 — Tương tự Form03 (stub).
     */
    public Form03Report generateForm04(LocalDate period) {
        log.info("generateForm04 period={}", period);
        return Form03Report.builder()
                .code("F04-" + period.format(DateTimeFormatter.ofPattern("yyyyMM")))
                .name("Mẫu 04 — Báo cáo tài sản")
                .formNumber("04")
                .reportingPeriod(period.format(DateTimeFormatter.ofPattern("yyyy-MM")))
                .managedAssets(120L)
                .activeAssets(98L)
                .inactiveAssets(22L)
                .status(ReportStatus.READY)
                .build();
    }

    /**
     * Sinh Báo cáo Mẫu 05 — Tương tự Form03 (stub).
     */
    public Form03Report generateForm05(LocalDate period) {
        log.info("generateForm05 period={}", period);
        return Form03Report.builder()
                .code("F05-" + period.format(DateTimeFormatter.ofPattern("yyyyMM")))
                .name("Mẫu 05 — Báo cáo tài sản")
                .formNumber("05")
                .reportingPeriod(period.format(DateTimeFormatter.ofPattern("yyyy-MM")))
                .managedAssets(120L)
                .activeAssets(98L)
                .inactiveAssets(22L)
                .status(ReportStatus.READY)
                .build();
    }

    /**
     * Sinh Báo cáo Mẫu 06 — Tương tự Form03 (stub).
     */
    public Form03Report generateForm06(LocalDate period) {
        log.info("generateForm06 period={}", period);
        return Form03Report.builder()
                .code("F06-" + period.format(DateTimeFormatter.ofPattern("yyyyMM")))
                .name("Mẫu 06 — Báo cáo tài sản")
                .formNumber("06")
                .reportingPeriod(period.format(DateTimeFormatter.ofPattern("yyyy-MM")))
                .managedAssets(120L)
                .activeAssets(98L)
                .inactiveAssets(22L)
                .status(ReportStatus.READY)
                .build();
    }
}
