package com.hanghai.kchtg.port.dto.port;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for PortAttachment entity.
 */
@Data
@Builder
public class AttachmentResponse {

    private UUID id;
    private String fileName;
    private String filePath;
    private Long fileSize;
    private String contentType;
    private UUID uploadedBy;
    private LocalDateTime createdAt;
}
