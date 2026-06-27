package com.hanghai.kchtg.dataconnection.controller;

import com.hanghai.kchtg.accesslog.annotation.AuditLog;
import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.dataconnection.dto.*;
import com.hanghai.kchtg.dataconnection.entity.ConnectionHealth;
import com.hanghai.kchtg.dataconnection.entity.SyncLog;
import com.hanghai.kchtg.dataconnection.repository.SyncLogRepository;
import com.hanghai.kchtg.dataconnection.service.ConnectionService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST controller for {@code /api/data-connections}.
 * Provides CRUD, health check history, sync logs, and test endpoints.
 */
@RestController
@RequestMapping("/api/data-connections")
public class DataConnectionController {

    private final ConnectionService service;
    private final SyncLogRepository syncLogRepository;

    public DataConnectionController(ConnectionService service, SyncLogRepository syncLogRepository) {
        this.service = service;
        this.syncLogRepository = syncLogRepository;
    }

    // ── CRUD ──────────────────────────────────────────────────────────

    @GetMapping
    @PreAuthorize("@auth.check(authentication, 'connection:manage')")
    public ResponseEntity<ApiResponse<List<ConnectionResponse>>> listAll() {
        List<ConnectionResponse> connections = service.listAll();
        return ResponseEntity.ok(ApiResponse.success(connections));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@auth.check(authentication, 'connection:manage')")
    public ResponseEntity<ApiResponse<ConnectionResponse>> getById(@PathVariable UUID id) {
        ConnectionResponse connection = service.getById(id);
        return ResponseEntity.ok(ApiResponse.success(connection));
    }

    @PostMapping
    @AuditLog(module = "CONNECTION", action = "CREATE_CONNECTION")
    @PreAuthorize("@auth.check(authentication, 'connection:manage')")
    public ResponseEntity<ApiResponse<ConnectionResponse>> create(
            @Valid @RequestBody CreateConnectionRequest request) {
        ConnectionResponse connection = service.create(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Data connection created", connection));
    }

    @PutMapping("/{id}")
    @AuditLog(module = "CONNECTION", action = "UPDATE_CONNECTION")
    @PreAuthorize("@auth.check(authentication, 'connection:manage')")
    public ResponseEntity<ApiResponse<ConnectionResponse>> update(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateConnectionRequest request) {
        ConnectionResponse connection = service.update(id, request);
        return ResponseEntity.ok(ApiResponse.success("Data connection updated", connection));
    }

    @DeleteMapping("/{id}")
    @AuditLog(module = "CONNECTION", action = "DELETE_CONNECTION")
    @PreAuthorize("@auth.check(authentication, 'connection:manage')")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity
                .status(HttpStatus.NO_CONTENT)
                .body(ApiResponse.success("Data connection deleted", null));
    }

    // ── Health Check ──────────────────────────────────────────────────

    @PostMapping("/{id}/health")
    @AuditLog(module = "CONNECTION", action = "RUN_HEALTH_CHECK")
    @PreAuthorize("@auth.check(authentication, 'connection:manage')")
    public ResponseEntity<ApiResponse<ConnectionHealth>> runHealthCheck(@PathVariable UUID id) {
        ConnectionHealth health = service.healthCheck(id);
        return ResponseEntity.ok(ApiResponse.success("Health check completed", health));
    }

    @GetMapping("/{id}/health")
    @PreAuthorize("@auth.check(authentication, 'connection:manage')")
    public ResponseEntity<ApiResponse<List<ConnectionHealth>>> getHealthHistory(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "24") int hours) {
        List<ConnectionHealth> history = service.getHealthHistory(id, hours);
        return ResponseEntity.ok(ApiResponse.success(history));
    }

    @GetMapping("/summary")
    @PreAuthorize("@auth.check(authentication, 'connection:manage')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHealthSummary() {
        List<ConnectionResponse> list = service.listAll();
        long total = list.size();
        long healthy = list.stream().filter(c -> c.getStatus() != null && "ACTIVE".equalsIgnoreCase(c.getStatus().name())).count();
        long down = list.stream().filter(c -> c.getStatus() != null && "ERROR".equalsIgnoreCase(c.getStatus().name())).count();
        long unknown = total - healthy - down;

        Map<String, Object> summary = new HashMap<>();
        summary.put("total", total);
        summary.put("healthy", healthy);
        summary.put("degraded", 0);
        summary.put("down", down);
        summary.put("unknown", unknown);
        summary.put("avgUptime", total > 0 ? 100.0 * healthy / total : 100.0);

        return ResponseEntity.ok(ApiResponse.success(summary));
    }

    // ── Sync History Logs ─────────────────────────────────────────────

    @GetMapping("/{id}/sync-log")
    @PreAuthorize("@auth.check(authentication, 'connection:manage')")
    public ResponseEntity<ApiResponse<List<SyncLog>>> getSyncHistory(@PathVariable UUID id) {
        List<SyncLog> logs = syncLogRepository.findByConnectionIdOrderByStartTimeDesc(id);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    // ── Test Connection (Sanity check) ────────────────────────────────

    @PostMapping("/{id}/test")
    @AuditLog(module = "CONNECTION", action = "TEST_CONNECTION")
    @PreAuthorize("@auth.check(authentication, 'connection:manage')")
    public ResponseEntity<ApiResponse<TestConnectionResponse>> testConnection(
            @PathVariable UUID id,
            @Valid @RequestBody(required = false) TestConnectionRequest request) {
        TestConnectionRequest overrides = request != null ? request : new TestConnectionRequest();

        // Use ConnectionService for checking
        ConnectionHealth health = service.healthCheck(id);
        TestConnectionResponse result = TestConnectionResponse.builder()
                .success(health.getErrorMessage() == null)
                .message(health.getErrorMessage() != null ? health.getErrorMessage() : "Endpoint reachable")
                .responseTimeMs(health.getLatencyMs() != null ? health.getLatencyMs().longValue() : 0L)
                .build();
        return ResponseEntity.ok(ApiResponse.success(result));
    }
}
