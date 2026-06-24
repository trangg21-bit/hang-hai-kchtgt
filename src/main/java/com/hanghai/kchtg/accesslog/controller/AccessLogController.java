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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Read-only REST controller for access-log audit records.
 * <p>
 * Endpoints:
 * <ul>
 *   <li>{@code GET /api/access-logs} - paginated list with optional filters</li>
 *   <li>{@code GET /api/access-logs/{id}} - single entry by ID</li>
 * </ul>
 * No create, update, or delete operations are exposed - the access-log is
 * an audit artifact populated by a cross-cutting aspect.
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
     * Default sort: newest entries first.
     * </p>
     *
     * @param filter   optional query parameters: userId, module, from, to
     * @param pageable pagination (page, size, sort) - defaults to page 0, size 20,
     *                 sorted by createdAt descending
     * @return paginated list of access-log entries
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<AccessLogResponse>>> list(
            AccessLogFilterRequest filter,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC)
            Pageable pageable) {

        log.debug("Listing access-logs with filter: userId={}, module={}, from={}, to={}",
                filter != null ? filter.getUserId() : null,
                filter != null ? filter.getModule() : null,
                filter != null ? filter.getFrom() : null,
                filter != null ? filter.getTo() : null);

        Page<AccessLogResponse> page = service.findAll(filter, pageable);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    /**
     * Get a single access-log entry by its ID.
     *
     * @param id the entity primary key
     * @return the access-log entry
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AccessLogResponse>> getById(@PathVariable UUID id) {
        log.debug("Fetching access-log entry: id={}", id);
        AccessLogResponse response = service.findById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}