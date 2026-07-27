package com.hanghai.kchtg.port.dto.document;

import java.util.UUID;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response trả về thông tin giấy tờ / tài liệu đính kèm.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentResponse {

    private UUID id;

    private String entityType;

    private String entityId;

    private String fileName;

    private Long fileSize;

    private String mimeType;

    private String storageKey;

    private String uploadedBy;

    private LocalDateTime createdAt;
}
