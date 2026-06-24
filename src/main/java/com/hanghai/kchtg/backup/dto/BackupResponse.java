package com.hanghai.kchtg.backup.dto;

import com.hanghai.kchtg.backup.entity.DatabaseBackup;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@NoArgsConstructor
public class BackupResponse {

    private UUID id;
    private String filename;
    private Long fileSize;
    private String backupType;
    private String status;
    private String errorDetail;
    private LocalDateTime createdAt;

    public BackupResponse(DatabaseBackup backup) {
        this.id = backup.getId();
        this.filename = backup.getFilename();
        this.fileSize = backup.getFileSize();
        this.backupType = backup.getBackupType().name();
        this.status = backup.getStatus().name();
        this.errorDetail = backup.getErrorDetail();
        this.createdAt = backup.getCreatedAt();
    }
}
