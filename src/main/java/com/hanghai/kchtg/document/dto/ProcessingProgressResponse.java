package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for ProcessingProgress.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProcessingProgressResponse {

    private UUID id;
    private UUID incidentId;
    private LocalDateTime updatedAt;
    private String progressDescription;
    private String updatedBy;
}
