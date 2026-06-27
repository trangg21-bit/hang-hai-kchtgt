package com.hanghai.kchtg.siem.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.siem.dto.SiemMetricsResponse;
import com.hanghai.kchtg.siem.dto.SiemReportRequest;
import com.hanghai.kchtg.siem.dto.SiemReportResponse;
import com.hanghai.kchtg.siem.entity.SiemReportStatus;
import com.hanghai.kchtg.siem.service.SiemReportService;
import com.hanghai.kchtg.siem.service.SiemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/siem")
@RequiredArgsConstructor
@PreAuthorize("@auth.check(authentication, 'security:manage')")
public class SiemController {

    private final SiemService siemService;
    private final SiemReportService siemReportService;

    /**
     * GET /api/siem/metrics
     * Returns real-time SIEM metrics summary.
     */
    @GetMapping("/metrics")
    public ResponseEntity<ApiResponse<SiemMetricsResponse>> getMetrics() {
        return ResponseEntity.ok(ApiResponse.success(siemService.getMetrics()));
    }

    /**
     * GET /api/siem/reports/export
     * Export SIEM report based on the requested format.
     */
    @GetMapping("/reports/export")
    public ResponseEntity<byte[]> exportReport(@RequestParam String format) {
        try {
            byte[] fileContent;
            String filename;
            MediaType mediaType;

            switch (format.toLowerCase()) {
                case "word":
                case "docx":
                    fileContent = siemService.exportWordReport();
                    filename = "siem_report.docx";
                    mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
                    break;

                case "excel":
                case "xlsx":
                    fileContent = siemService.exportExcelReport();
                    filename = "siem_report.xlsx";
                    mediaType = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
                    break;

                case "pdf":
                    fileContent = siemService.exportPdfReport();
                    filename = "siem_report.pdf";
                    mediaType = MediaType.APPLICATION_PDF;
                    break;

                case "html":
                    fileContent = siemService.exportHtmlReport();
                    filename = "siem_report.html";
                    mediaType = MediaType.TEXT_HTML;
                    break;

                case "xml":
                    fileContent = siemService.exportXmlReport();
                    filename = "siem_report.xml";
                    mediaType = MediaType.APPLICATION_XML;
                    break;

                default:
                    return ResponseEntity.badRequest().body(("Định dạng báo cáo không hợp lệ: " + format).getBytes());
            }

            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                    .body(fileContent);

        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(("Xuất báo cáo thất bại: " + e.getMessage()).getBytes());
        }
    }

    // ====================== F-283: SIEM Report Management Endpoints ======================

    /**
     * POST /api/siem/reports
     * Generate a new SIEM report (creates a versioned report record, status = PENDING).
     * Returns the report metadata immediately; content is finalized asynchronously.
     */
    @PostMapping("/reports")
    public ResponseEntity<ApiResponse<SiemReportResponse>> generateReport(@RequestBody SiemReportRequest request) {
        try {
            if (request.getFormat() == null || request.getFormat().isEmpty()) {
                return ResponseEntity.badRequest().body(
                        ApiResponse.error("Định dạng báo cáo không được để trống"));
            }

            SiemReportResponse report = siemReportService.generateReport(request);
            return ResponseEntity.ok(ApiResponse.success(report));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(
                    ApiResponse.error("Lỗi định dạng: " + e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("Tạo báo cáo thất bại: " + e.getMessage()));
        }
    }

    /**
     * GET /api/siem/reports/{id}
     * Get SIEM report metadata by ID (does NOT expose content bytes).
     */
    @GetMapping("/reports/{id}")
    public ResponseEntity<ApiResponse<SiemReportResponse>> getReport(@PathVariable UUID id) {
        try {
            SiemReportResponse report = siemReportService.getReportMetadata(id);
            return ResponseEntity.ok(ApiResponse.success(report));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("Lỗi khi lấy báo cáo: " + e.getMessage()));
        }
    }

    /**
     * GET /api/siem/reports
     * List all reports (with optional filters for format and status).
     */
    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<SiemReportResponse>>> listReports(
            @RequestParam(required = false) String format,
            @RequestParam(required = false) String status) {
        try {
            List<SiemReportResponse> reports;
            if (format != null && !format.isEmpty()) {
                if (status != null && !status.isEmpty()) {
                    reports = siemReportService.listReportsByStatus(SiemReportStatus.valueOf(status.toUpperCase()));
                } else {
                    reports = siemReportService.listReportsByFormat(format);
                }
            } else {
                // Return all reports
                reports = siemReportService.listReportsByStatus(SiemReportStatus.COMPLETED);
            }
            return ResponseEntity.ok(ApiResponse.success(reports));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(
                    ApiResponse.error("Lỗi khi lấy danh sách báo cáo: " + e.getMessage()));
        }
    }
}
