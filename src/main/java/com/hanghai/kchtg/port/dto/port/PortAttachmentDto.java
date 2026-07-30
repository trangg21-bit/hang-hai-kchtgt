package com.hanghai.kchtg.port.dto.port;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DTO for a file attachment belonging to a port.
 */
@Data
public class PortAttachmentDto {

    private UUID id;

    private String fileName;

    private String filePath;

    private Long fileSize;

    private String contentType;

    private UUID uploadedBy;

    private LocalDateTime uploadedAt;
}
