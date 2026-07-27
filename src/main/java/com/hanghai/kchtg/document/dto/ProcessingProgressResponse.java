package com.hanghai.kchtg.document.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response DTO for ProcessingProgress.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessingProgressResponse {

    private UUID id;
    private java.util.UUID incidentId;
    private LocalDateTime updatedAt;
    private String progressDescription;
    private String updatedBy;
}
