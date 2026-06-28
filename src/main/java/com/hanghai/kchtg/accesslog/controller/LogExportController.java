package com.hanghai.kchtg.accesslog.controller;

import com.hanghai.kchtg.accesslog.dto.AccessLogFilterRequest;
import com.hanghai.kchtg.accesslog.dto.LogAggregateResponse;
import com.hanghai.kchtg.accesslog.entity.LogRetentionPolicy;
import com.hanghai.kchtg.accesslog.service.LogService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * REST Controller cho việc xuat log, xem thong ke, canh bao, va config retention policy.
 * <p>
 * Base path: {@code /api/logs}
 * <p>
 * F-005 changes:
 * - CSV export changed from FileSystemResource to StreamingResponseBody (G3)
 * - Alert threshold changed to 5 failures/1hr (G4)
 * - Added aggregate endpoints (G6)
 * - Added retention policy endpoints (G5)
 * - Extended @PreAuthorize for new BA roles
 * </p>
 */
@RestController
@RequestMapping("/api/logs")
public class LogExportController {

    private static final Logger log = LoggerFactory.getLogger(LogExportController.class);

    private final LogService logService;

    public LogExportController(LogService logService) {
        this.logService = logService;
    }

    // ── CSV Export — StreamingResponseBody (G3) ───────────────────────

    /**
     * Export access logs to CSV using streaming response.
     * BR-027: max 10,000 rows per export.
     * Only system-admin and security-admin can export.
     */
    @GetMapping(value = "/export/csv", produces = MediaType.TEXT_PLAIN_VALUE)
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<StreamingResponseBody> exportCsv(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) String module,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String severity,
            @RequestParam(required = false) String keyword) {

        AccessLogFilterRequest filter = new AccessLogFilterRequest();
        if (userId != null) filter.setUserId(userId);
        if (module != null && !module.isBlank()) filter.setModule(module);
        if (action != null && !action.isBlank()) filter.setAction(action);
        if (from != null && !from.isBlank()) filter.setFrom(java.time.LocalDateTime.parse(from));
        if (to != null && !to.isBlank()) filter.setTo(java.time.LocalDateTime.parse(to));
        if (type != null && !type.isBlank()) filter.setType(type);
        if (severity != null && !severity.isBlank()) filter.setSeverity(severity);
        if (keyword != null && !keyword.isBlank()) filter.setKeyword(keyword);

        StreamingResponseBody stream = logService.exportToCsvStreaming(filter);

        String fileName = "access_logs_" + LocalDate.now() + ".csv";
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .header("X-Max-Export-Rows", String.valueOf(10000))
                .body(stream);
    }

    // ── Failure Alerts — G4 ──────────────────────────────────────────

    /**
     * Check login failure alerts.
     * BR-028: >=5 login failures in 1 hour triggers alert.
     * Only system-admin.
     */
    @GetMapping("/alerts/failures")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<Integer>> checkFailureAlerts() {
        int count = logService.checkFailureAlerts();
        return ResponseEntity.ok(ApiResponse.success(count));
    }

    // ── Daily Stats ──────────────────────────────────────────────────

    /**
     * Thống kê logs theo status trong ngày.
     */
    @GetMapping("/stats/daily")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<List<Object[]>>> getDailyStats() {
        return ResponseEntity.ok(ApiResponse.success(logService.getDailyStats()));
    }

    /**
     * Tổng số log trong hệ thống.
     */
    @GetMapping("/stats/total")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<Long>> getTotalCount() {
        return ResponseEntity.ok(ApiResponse.success(logService.getTotalCount()));
    }

    // ── Aggregate Statistics — G6 ─────────────────────────────────────

    /**
     * List aggregate statistics, optionally filtered by date range.
     */
    @GetMapping("/aggregate")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<List<LogAggregateResponse>>> listAggregates(
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to) {

        Optional<LocalDate> fromOpt = from != null && !from.isBlank()
                ? Optional.of(LocalDate.parse(from)) : Optional.empty();
        Optional<LocalDate> toOpt = to != null && !to.isBlank()
                ? Optional.of(LocalDate.parse(to)) : Optional.empty();

        return ResponseEntity.ok(ApiResponse.success(logService.listAggregates(fromOpt, toOpt)));
    }

    /**
     * Force compute aggregate for a specific date.
     */
    @PostMapping("/aggregate/compute")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<LogAggregateResponse>> computeAggregate(
            @RequestParam String date) {

        LocalDate parsed = LocalDate.parse(date);
        var aggregate = logService.computeDailyAggregate(parsed);

        LogAggregateResponse resp = new LogAggregateResponse();
        resp.setId(aggregate.getId());
        resp.setDate(aggregate.getDate().toString());
        resp.setTotalAccesses(aggregate.getTotalAccesses());
        resp.setUniqueUsers(aggregate.getUniqueUsers());
        resp.setSuccessRate(aggregate.getSuccessRate() != null ? aggregate.getSuccessRate().toString() : "0.00");
        resp.setAvgDuration(aggregate.getAvgDuration());
        resp.setCreatedAt(aggregate.getCreatedAt() != null ? aggregate.getCreatedAt().toString() : null);

        return ResponseEntity.ok(ApiResponse.success(resp));
    }

    // ── Retention Policy — G5 ────────────────────────────────────────

    /**
     * View current retention policy. Only system-admin.
     */
    @GetMapping("/retention")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<LogRetentionPolicy>> getRetentionPolicy() {
        return logService.getRetentionPolicy()
                .map(policy -> ResponseEntity.ok(ApiResponse.success(policy)))
                .orElse(ResponseEntity.ok(ApiResponse.success(new LogRetentionPolicy())));
    }

    /**
     * Update retention policy. Only system-admin.
     */
    @PutMapping("/retention")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<LogRetentionPolicy>> updateRetentionPolicy(
            @RequestBody LogRetentionPolicy policy) {

        if (policy.getRetentionDays() != null && policy.getRetentionDays() <= 0) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("retentionDays phải lớn hơn 0"));
        }

        return logService.updateRetentionPolicy(policy)
                .map(p -> ResponseEntity.ok(ApiResponse.success(p)))
                .orElse(ResponseEntity.badRequest()
                        .body(ApiResponse.error("Không tìm thấy retention policy để cập nhật")));
    }
}
