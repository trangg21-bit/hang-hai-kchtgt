package com.hanghai.kchtg.integration.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.dataconnection.entity.SyncLog;
import com.hanghai.kchtg.integration.service.IntegrationSyncService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Endpoint to trigger manual synchronization for a specific connection.
 */
@RestController
@RequestMapping("/api/v1/integration/sync")
public class IntegrationSyncController {

    private final IntegrationSyncService syncService;

    public IntegrationSyncController(IntegrationSyncService syncService) {
        this.syncService = syncService;
    }

    @PostMapping("/{connectionId}")
    @PreAuthorize("hasAnyRole('ROLE_ADMIN', 'ROLE_SYSTEM_ADMIN')")
    public ResponseEntity<ApiResponse<SyncLog>> triggerSync(@PathVariable UUID connectionId) {
        SyncLog syncLog = syncService.executeSync(connectionId);
        return ResponseEntity.ok(ApiResponse.success("Sync executed successfully", syncLog));
    }
}