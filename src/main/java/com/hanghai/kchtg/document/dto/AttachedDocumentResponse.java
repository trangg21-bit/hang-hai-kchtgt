package com.hanghai.kchtg.document.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Response DTO for AttachedDocument.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AttachedDocumentResponse {

    private UUID id;
    private String documentName;
    private String filePath;
    private Long fileSize;
    private LocalDate uploadedAt;
}
