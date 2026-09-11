package com.hanghai.kchtg.assetmovement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InfraAssetAttachmentResponse {
    private UUID id;
    private String entityType;
    private UUID entityId;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String contentType;
    private UUID uploadedBy;
    private String uploadedByName;
    private LocalDateTime uploadedAt;
}
