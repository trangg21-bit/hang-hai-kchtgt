package com.hanghai.kchtg.report.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.report.dto.ReportRequest;
import com.hanghai.kchtg.report.dto.ReportResponse;
import com.hanghai.kchtg.report.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping("/preview")
    public ResponseEntity<ApiResponse<ReportResponse>> getReportPreview(@Valid @RequestBody ReportRequest request) {
        ReportResponse preview = reportService.generateReportPreview(request);
        return ResponseEntity.ok(ApiResponse.success(preview));
    }

    @PostMapping("/export")
    public ResponseEntity<byte[]> exportReport(@Valid @RequestBody ReportRequest request) {
        byte[] data = reportService.exportReport(request);
        
        String filename = "baocao_" + request.getReportCode().toLowerCase() + "_" + System.currentTimeMillis();
        boolean isExcel = "EXCEL".equalsIgnoreCase(request.getFormat());
        
        filename += isExcel ? ".csv" : ".txt";
        String contentType = isExcel ? "text/csv; charset=UTF-8" : "text/plain; charset=UTF-8";

        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        headers.set(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
        headers.set(HttpHeaders.PRAGMA, "no-cache");
        headers.set(HttpHeaders.EXPIRES, "0");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType(contentType))
                .body(data);
    }
}
