package com.hanghai.kchtg.backup.dto;

import com.hanghai.kchtg.backup.entity.DatabaseBackup;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
public class BackupResponse {

    private UUID id;
    private String filename;
    private Long fileSize;
    private String backupType;
    private String status;
    private String errorDetail;
    private LocalDateTime createdAt;

    // ── Entity-to-DTO constructor ────────────────────────────────────

    public BackupResponse(DatabaseBackup entity) {
        this.id = entity.getId();
        this.filename = entity.getFilename();
        this.fileSize = entity.getFileSize();
        this.backupType = entity.getBackupType() != null ? entity.getBackupType().name() : null;
        this.status = entity.getStatus() != null ? entity.getStatus().name() : null;
        this.errorDetail = entity.getErrorDetail();
        this.createdAt = entity.getCreatedAt();
    }

}
