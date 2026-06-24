package com.hanghai.kchtg.siem.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.siem.dto.SiemMetricsResponse;
import com.hanghai.kchtg.siem.service.SiemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/siem")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
public class SiemController {

    private final SiemService siemService;

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
}
