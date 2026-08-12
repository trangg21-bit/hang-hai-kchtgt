package com.hanghai.kchtg.port.dto.berth;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
public class AttachmentDto {

    private UUID id;
    private String entityType;
    private UUID entityId;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String contentType;
    private UUID uploadedBy;
    private LocalDateTime uploadedAt;
}
