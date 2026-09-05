package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Tệp sự cố response (F-131 child incident_file).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class IncidentFileResponse {

    private UUID id;
    private String fileName;
    private String filePath;
    private String fileType;
    private Long fileSize;
    private String fileCategory;
    private LocalDateTime uploadedAt;
    private UUID uploadedBy;
}
