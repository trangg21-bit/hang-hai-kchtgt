package com.hanghai.kchtg.report.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.report.dto.ReportRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
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

/**
 * REST controller cho Báo cáo & Tổng hợp (M-016).
 * Wave 3: 6 endpoints — create, find, list, update-status, download, count-by-status.
 */
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
@Slf4j
@Validated
public class ReportController {

    private final ReportService reportService;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    /**
     * Tạo báo cáo mới với status = PENDING, sau đó sinh báo cáo.
     */
    @PostMapping("/generate")
    @PreAuthorize("hasRole('ROLE_REPORT_CREATE')")
    public ResponseEntity<ApiResponse<ReportResponse>> createReport(
            @Valid @RequestBody ReportRequest request) {
        log.info("Received report generation request: type={}", request.getReportType());
        reportService.generateReport(request);
        ReportResponse resp = ReportResponse.builder()
                .reportType(request.getReportType())
                .status(ReportStatus.READY)
                .outputFormat(request.getOutputFormat())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .parameters(request.getParameters())
                .build();
        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    /**
     * Tìm báo cáo theo mã code.
     */
    @GetMapping("/{code}")
    @PreAuthorize("hasRole('ROLE_REPORT_READ')")
    public ResponseEntity<ApiResponse<ReportResponse>> findById(
            @PathVariable String code) {
        var entity = reportService.findByCode(code);
        return ResponseEntity.ok(ApiResponse.success(toResponse(entity)));
    }

    /**
     * Liệt kê báo cáo READY, có thể lọc theo loại.
     */
    @GetMapping
    @PreAuthorize("hasRole('ROLE_REPORT_READ')")
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
    @PreAuthorize("hasRole('ROLE_REPORT_UPDATE')")
    public ResponseEntity<Void> updateStatus(
            @PathVariable String code,
            @PathVariable ReportStatus status) {
        log.info("Updating report [{}] status to {}", code, status);
        reportService.updateReportStatus(code, status);
        return ResponseEntity.ok().build();
    }

    /**
     * Tải file báo cáo theo mã (stub: trả về fileUrl).
     */
    @PostMapping("/{code}/download")
    @PreAuthorize("hasRole('ROLE_REPORT_READ')")
    public ResponseEntity<byte[]> download(@PathVariable String code) {
        String fileUrl = reportService.downloadReport(code);
        if (fileUrl == null) {
            return ResponseEntity.notFound().build();
        }
        byte[] data = fileUrl.getBytes();

        String filename = "baocao_" + code + ".pdf";
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + filename + "\"");
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
    @PreAuthorize("hasRole('ROLE_REPORT_READ')")
    public ResponseEntity<ApiResponse<Long>> countByStatus(
            @PathVariable ReportStatus status) {
        long count = reportService.countByStatus(status);
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    /**
     * Helper: convert ReportEntity → ReportResponse.
     */
    private ReportResponse toResponse(com.hanghai.kchtg.report.entity.ReportEntity entity) {
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
}