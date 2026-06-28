package com.hanghai.kchtg.accesslog.controller;

import com.hanghai.kchtg.accesslog.dto.AccessLogFilterRequest;
import com.hanghai.kchtg.accesslog.dto.AccessLogResponse;
import com.hanghai.kchtg.accesslog.service.AccessLogService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * Read-only REST controller for access-log audit records.
 * <p>
 * F-005 changes:
 * - PK type changed from UUID to Long
 * - {@code @PreAuthorize} guards added per BA role table
 * - Immutability enforcement: PUT/DELETE/POST return 403 (not 404)
 * - Filter supports type, severity, keyword (via AccessLogFilterRequest)
 * </p>
 */
@RestController
@RequestMapping("/api/access-logs")
public class AccessLogController {

    private static final Logger log = LoggerFactory.getLogger(AccessLogController.class);

    private final AccessLogService service;

    public AccessLogController(AccessLogService service) {
        this.service = service;
    }

    /**
     * List access-log entries with optional filters and pagination.
     * <p>
     * F-005: Added @PreAuthorize guard per BA role table.
     * Supports type, severity, keyword filters via query params.
     * </p>
     */
    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<Page<AccessLogResponse>>> list(
            AccessLogFilterRequest filter,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {

        log.debug("Listing access-logs with filter: userId={}, module={}, type={}, severity={}, keyword={}, from={}, to={}",
                filter != null ? filter.getUserId() : null,
                filter != null ? filter.getModule() : null,
                filter != null ? filter.getType() : null,
                filter != null ? filter.getSeverity() : null,
                filter != null ? filter.getKeyword() : null,
                filter != null ? filter.getFrom() : null,
                filter != null ? filter.getTo() : null);

        Page<AccessLogResponse> page = service.findAll(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * Get a single access-log entry by its ID.
     * <p>
     * F-005: PK type changed from UUID to Long.
     * </p>
     */
    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'admin:manage')")
    public ResponseEntity<ApiResponse<AccessLogResponse>> getById(@PathVariable Long id) {
        log.debug("Fetching access-log entry: id={}", id);
        AccessLogResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    // ── Immutability enforcement — BR-025 ─────────────────────────────

    /**
     * Reject POST attempts to create logs manually.
     * BR-005-08: Only the system creates logs.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<Void>> createLog() {
        log.warn("Attempted manual log creation via POST /api/access-logs — rejected");
        return ResponseEntity.status(403)
                .body(ApiResponse.error("Log chỉ được tạo tự động bởi hệ thống"));
    }

    /**
     * Reject PUT attempts to modify logs.
     * BR-005-02: Logs are immutable.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> updateLog(@PathVariable Long id) {
        log.warn("Attempted to UPDATE access-log id={} — rejected", id);
        return ResponseEntity.status(403)
                .body(ApiResponse.error("Log không thể sửa đổi"));
    }

    /**
     * Reject DELETE attempts on logs.
     * BR-005-02: Logs are immutable.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteLog(@PathVariable Long id) {
        log.warn("Attempted to DELETE access-log id={} — rejected", id);
        return ResponseEntity.status(403)
                .body(ApiResponse.error("Log không thể xóa"));
    }
}
