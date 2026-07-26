package com.hanghai.kchtg.document.dto;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.SeverityLevel;
import com.hanghai.kchtg.document.entity.ProcessingStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for Incident.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentResponse {

    private UUID id;
    private LocalDateTime discoveryTime;
    private String location;
    private SeverityLevel severityLevel;
    private String description;
    private ProcessingStatus processingStatus;
    private String reporter;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;
    private List<ProcessingProgressResponse> processingProgress;
}
