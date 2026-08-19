package com.hanghai.kchtg.report.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.report.dto.ReportPreviewRequest;
import com.hanghai.kchtg.report.dto.ReportRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.entity.ReportEntity;
import com.hanghai.kchtg.report.entity.ReportStatus;
import com.hanghai.kchtg.report.entity.ReportType;
import com.hanghai.kchtg.report.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import com.hanghai.kchtg.security.annotation.DataScope;

/**
 * REST controller cho Báo cáo & Tổng hợp (M-016).
 * Wave 3: 6 endpoints — create, find, list, update-status, download, count-by-status.
 */
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Slf4j
@Validated
@DataScope
public class ReportController {

    private final ReportService reportService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    /**
     * Tạo báo cáo mới với status = PENDING, sau đó sinh báo cáo.
     */
    @PostMapping("/generate")
    @PreAuthorize("@auth.check(authentication, 'report:create')")
    public ResponseEntity<ApiResponse<ReportResponse>> createReport(
            @Valid @RequestBody ReportRequest request) {
        log.info("Received report generation request: type={}", request.getReportType());
        ReportEntity entity = reportService.createReport(request);
        reportService.generateReport(request);
        return ResponseEntity.ok(ApiResponse.success(toResponse(entity)));
    }

    /**
     * Tìm báo cáo theo mã code.
     */
    @GetMapping("/{code}")
    @PreAuthorize("@auth.check(authentication, 'report:read')")
    public ResponseEntity<ApiResponse<ReportResponse>> findById(
            @PathVariable String code) {
        var entity = reportService.findByCode(code);
        return ResponseEntity.ok(ApiResponse.success(toResponse(entity)));
    }

    /**
     * Liệt kê báo cáo READY, có thể lọc theo loại.
     */
    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'report:read')")
    public ResponseEntity<ApiResponse<List<ReportResponse>>> findAll(
            @RequestParam(required = false) ReportType type,
            Pageable pageable) {
        List<ReportResponse> results = (type != null)
                ? reportService.findByReportType(type).stream().map(this::toResponse).toList()
                : reportService.findAll(pageable).getContent().stream().map(this::toResponse).toList();
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    /**
     * Cập nhật trạng thái báo cáo (DRAFT / PENDING / READY / ERROR).
     */
    @PutMapping("/{code}/status/{status}")
    @PreAuthorize("@auth.check(authentication, 'report:update')")
    public ResponseEntity<Void> updateStatus(
            @PathVariable String code,
            @PathVariable ReportStatus status) {
        log.info("Updating report [{}] status to {}", code, status);
        reportService.updateReportStatus(code, status);
        return ResponseEntity.ok().build();
    }

    /**
     * Tải file báo cáo theo mã.
     */
    @PostMapping("/{code}/download")
    @PreAuthorize("@auth.check(authentication, 'report:read')")
    public ResponseEntity<byte[]> download(@PathVariable String code) {
        String fileUrl = reportService.downloadReport(code);
        if (fileUrl == null) {
            return ResponseEntity.notFound().build();
        }
        byte[] data = fileUrl.getBytes();

        String reportName = getReportNameVietnamese(code);
        String dateSuffix = java.time.format.DateTimeFormatter.ofPattern("ddMMyyyy").format(java.time.LocalDate.now());
        String filename = reportName + "___" + dateSuffix + ".pdf";

        org.springframework.http.ContentDisposition contentDisposition = org.springframework.http.ContentDisposition.builder("attachment")
                .filename(filename, java.nio.charset.StandardCharsets.UTF_8)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(contentDisposition);
        headers.set(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(org.springframework.http.MediaType.APPLICATION_PDF)
                .body(data);
    }

    /**
     * Đếm số báo cáo theo trạng thái.
     */
    @GetMapping("/count-by-status/{status}")
    @PreAuthorize("@auth.check(authentication, 'report:read')")
    public ResponseEntity<ApiResponse<Long>> countByStatus(
            @PathVariable ReportStatus status) {
        long count = reportService.countByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    /**
     * POST /api/v1/reports/preview — Xem trước dữ liệu báo cáo động.
     */
    @PostMapping("/preview")
    @PreAuthorize("@auth.check(authentication, 'report:read')")
    public ResponseEntity<ApiResponse<ReportResponse>> getPreview(
            @RequestBody ReportPreviewRequest request) {
        log.info("Generating preview for report code: {}, orgUnitId: {}", request.getReportCode(), request.getOrgUnitId());
        ReportResponse response = reportService.getPreview(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * POST /api/v1/reports/export — Xuất file báo cáo (Excel / Text).
     */
    @PostMapping("/export")
    @PreAuthorize("@auth.check(authentication, 'report:read')")
    public ResponseEntity<byte[]> exportReport(
            @RequestBody ReportPreviewRequest request) {
        log.info("Exporting report code: {}, format: {}", request.getReportCode(), request.getFormat());
        byte[] fileBytes = reportService.exportReport(request);

        String reportCodeStr = request.getReportCode() != null ? request.getReportCode() : "F-141";
        boolean isExcel = "EXCEL".equalsIgnoreCase(request.getFormat());

        String reportName = getReportNameVietnamese(reportCodeStr);
        String dateSuffix = java.time.format.DateTimeFormatter.ofPattern("ddMMyyyy").format(java.time.LocalDate.now());
        String filename = reportName + "___" + dateSuffix + (isExcel ? ".xlsx" : ".pdf");

        org.springframework.http.ContentDisposition contentDisposition = org.springframework.http.ContentDisposition.builder("attachment")
                .filename(filename, java.nio.charset.StandardCharsets.UTF_8)
                .build();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentDisposition(contentDisposition);
        headers.set(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(isExcel ? org.springframework.http.MediaType.APPLICATION_OCTET_STREAM
                                    : org.springframework.http.MediaType.APPLICATION_PDF)
                .body(fileBytes);
    }

    /**
     * Helper: convert ReportEntity → ReportResponse.
     */
    private ReportResponse toResponse(ReportEntity entity) {
        return ReportResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .reportType(entity.getReportType())
                .status(entity.getStatus())
                .generatedAt(entity.getGeneratedAt())
                .fileUrl(entity.getFileUrl())
                .outputFormat(entity.getOutputFormat())
                .startDate(entity.getStartDate())
                .endDate(entity.getEndDate())
                .parameters(parseParameters(entity.getParameters()))
                .totalAssets(entity.getTotalAssets())
                .totalValue(entity.getTotalValue())
                .portsCount(entity.getPortsCount())
                .maintenanceCount(entity.getMaintenanceCount())
                .navigationSignalsCount(entity.getNavigationSignalsCount())
                .build();
    }

    @SuppressWarnings("unchecked")
    private java.util.Map<String, Object> parseParameters(String paramsJson) {
        if (paramsJson == null || paramsJson.isBlank()) {
            return java.util.Map.of();
        }
        try {
            return objectMapper.readValue(paramsJson, java.util.Map.class);
        } catch (Exception e) {
            log.error("Failed to parse report parameters JSON: {}", paramsJson, e);
            return java.util.Map.of();
        }
    }

    private String getReportNameVietnamese(String reportCode) {
        if (reportCode == null) return "Bao_cao";
        String code = reportCode.toUpperCase();
        switch (code) {
            case "F-141": return "Báo cáo thống kê tăng giảm tài sản";
            case "F-142": return "Mẫu B04a/BCTC: Thuyết minh chi tiết số liệu tài sản kết cấu hạ tầng đơn vị được giao quản lý nhưng không trực tiếp khai thác, sử dụng";
            case "F-143": return "Mẫu số 02: Báo cáo kê khai tài sản kết cấu hạ tầng hàng hải";
            case "F-144": return "Mẫu số 03: Báo cáo tình hình quản lý tài sản kết cấu hạ tầng hàng hải";
            case "F-145": return "Mẫu số 04: Báo cáo tình hình xử lý tài sản kết cấu hạ tầng hàng hải";
            case "F-146": return "Mẫu số 05: Báo cáo tình hình khai thác tài sản kết cấu hạ tầng hàng hải";
            case "F-147": return "Mẫu số 06: Tổng hợp danh mục TS KCHTGT hàng hải đề nghị xử lý";
            case "F-180N": return "Biểu 12-T: Khối lượng hàng hóa, hành khách thông qua cảng biển theo ngày";
            case "F-182N": return "Biểu 13-T: Lượt tàu thuyền vào, rời cảng biển theo ngày";
            case "F-183N": return "Biểu 14-T: Khối lượng hàng hóa, hành khách, lượt tàu thông qua cảng biển bằng đội tàu Việt Nam theo ngày";
            case "F-184N": return "Biểu 15-T: Khối lượng hàng hóa, hành khách thông qua qua cảng biển, bến cảng, khu chuyển tải trong khu vực quản lý theo ngày";
        }
        try {
            if (code.startsWith("F-")) {
                int num = Integer.parseInt(code.substring(2));
                int mapped = num + 15;
                String enumName = null;
                if (mapped >= 163 && mapped <= 175) enumName = "BCKCHT_" + mapped;
                else if (mapped >= 176 && mapped <= 184) enumName = "BCDL_" + mapped;
                else if (mapped >= 185 && mapped <= 187) enumName = "BCPTTV_" + mapped;
                else if (mapped >= 188 && mapped <= 189) enumName = "BCDN_" + mapped;
                else if (mapped >= 190 && mapped <= 194) enumName = "BCTT48_" + mapped;
                else if (mapped >= 195 && mapped <= 204) enumName = "BCCNDB_" + mapped;

                if (enumName != null) {
                    ReportType type = ReportType.valueOf(enumName);
                    return type.getDescription();
                }
            }
        } catch (Exception e) {
            // Ignore
        }
        return "Báo cáo " + reportCode;
    }
}
