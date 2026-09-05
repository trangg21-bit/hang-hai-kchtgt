package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.ProcessingStatus;
import com.hanghai.kchtg.document.entity.SeverityLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for an Incident record (F-131).
 * Legacy fields preserved; §3.2 additions included (orgUnitName is populated by
 * the service mapper via OrgUnitCacheService in the service wave).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class IncidentResponse {

    private UUID id;

    private String code;

    private UUID orgUnitId;
    private String orgUnitName;

    private LocalDateTime discoveryTime;
    private LocalDateTime occurredTo;

    private String location;

    private String incidentType;

    private String infrastructureType;
    private UUID infrastructureId;
    private String infrastructureName;

    private String description;

    private String damageStatus;

    private SeverityLevel severityLevel;
    private ProcessingStatus processingStatus;

    private String reporter;

    private String note;

    private UUID createdBy;
    private LocalDateTime createdAt;
    private UUID updatedBy;
    private LocalDateTime updatedAt;

    private List<IncidentEvolutionResponse> evolutions = new ArrayList<>();
    private List<IncidentHandlingResponse> handlings = new ArrayList<>();
    private List<IncidentFileResponse> files = new ArrayList<>();
    private List<ProcessingProgressResponse> processingProgress = new ArrayList<>();
}
