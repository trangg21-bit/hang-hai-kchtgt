package com.hanghai.kchtg.backup.controller;

import com.hanghai.kchtg.backup.dto.BackupResponse;
import com.hanghai.kchtg.backup.entity.DatabaseBackup;
import com.hanghai.kchtg.backup.service.BackupService;
import com.hanghai.kchtg.common.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/backups")
@PreAuthorize("hasRole('ROLE_SYSTEM_ADMIN')")
public class BackupController {

    private final BackupService backupService;

    public BackupController(BackupService backupService) {
        this.backupService = backupService;
    }

    /**
     * POST /api/backups - manually trigger a database backup.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<BackupResponse>> createBackup() {
        DatabaseBackup backup = backupService.performBackup(DatabaseBackup.BackupType.MANUAL);
        BackupResponse response = new BackupResponse(backup);
        if (backup.getStatus() == DatabaseBackup.BackupStatus.SUCCESS) {
            return ResponseEntity.ok(ApiResponse.success("Sao lưu dữ liệu thành công", response));
        } else {
            return ResponseEntity.badRequest().body(ApiResponse.error("Sao lưu thất bại: " + backup.getErrorDetail(), response));
        }
    }

    /**
     * GET /api/backups - list all backup entries.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BackupResponse>>> listBackups() {
        List<BackupResponse> list = backupService.getAllBackups().stream()
                .map(BackupResponse::new)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    /**
     * POST /api/backups/{id}/restore - restore database from a backup.
     */
    @PostMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<String>> restore(@PathVariable UUID id) {
        try {
            backupService.restoreBackup(id);
            return ResponseEntity.ok(ApiResponse.success("Phục hồi dữ liệu thành công. Vui lòng tải lại trang.", "Dữ liệu đã được phục hồi"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Phục hồi thất bại: " + e.getMessage()));
        }
    }
}
