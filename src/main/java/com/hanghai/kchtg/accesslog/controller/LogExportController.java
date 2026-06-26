package com.hanghai.kchtg.accesslog.controller;

import com.hanghai.kchtg.accesslog.dto.AccessLogFilterRequest;
import com.hanghai.kchtg.accesslog.service.LogService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.file.Path;
import java.util.List;

/**
 * REST Controller cho việc xuất và xem access logs.
 * <p>
 * Base path: {@code /api/logs}
 * </p>
 */
@RestController
@RequestMapping("/api/logs")
public class LogExportController {

    private final LogService logService;

    public LogExportController(LogService logService) {
        this.logService = logService;
    }

    /**
     * Export access logs thành file CSV.
     */
    @GetMapping("/export/csv")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<Resource> exportCsv(
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size) {

        AccessLogFilterRequest filter = new AccessLogFilterRequest();
        if (userId != null && !userId.isBlank()) filter.setUserId(java.util.UUID.fromString(userId));
        if (module != null && !module.isBlank()) filter.setModule(module);
        if (action != null && !action.isBlank()) filter.setAction(action);
        if (from != null && !from.isBlank()) filter.setFrom(java.time.LocalDateTime.parse(from));
        if (to != null && !to.isBlank()) filter.setTo(java.time.LocalDateTime.parse(to));

        String filePath = logService.exportToCsv(filter, PageRequest.of(page, size, Sort.by("createdAt").descending()));
        Resource resource = new FileSystemResource(filePath);

        String fileName = Path.of(filePath).getFileName().toString();
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .body(resource);
    }

    /**
     * Kiểm tra cảnh báo failures - số lượng log FAILED trong 30 phút qua.
     */
    @GetMapping("/alerts/failures")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Integer>> checkFailureAlerts() {
        int count = logService.checkFailureAlerts();
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    /**
     * Thống kê logs theo status trong ngày.
     */
    @GetMapping("/stats/daily")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<List<Object[]>>> getDailyStats() {
        return ResponseEntity.ok(ApiResponse.success(logService.getDailyStats()));
    }

    /**
     * Tổng số log trong hệ thống.
     */
    @GetMapping("/stats/total")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<Long>> getTotalCount() {
        return ResponseEntity.ok(ApiResponse.success(logService.getTotalCount()));
    }
}
