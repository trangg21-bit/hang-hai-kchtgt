package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.ProcessingStatus;
import com.hanghai.kchtg.document.entity.SeverityLevel;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Request DTO for creating/updating an Incident record (F-131).
 * Legacy fields preserved (compile + legacy flows); §3.1 additions included.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class IncidentCreateRequest {

    /** Đơn vị quản lý — mandatory for new rows (BR-131-04: assign within scope, never NULL). */
    private UUID orgUnitId;

    private String code;

    @NotNull(message = "location không được để trống")
    private String location;

    /** Legacy name of the occurred-from timestamp (parsed by the service). */
    private String discoveryTime;

    private LocalDateTime occurredTo;

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

    private UUID updatedBy;

    private List<IncidentEvolutionRequest> evolutions;
    private List<IncidentHandlingRequest> handlings;
    private List<IncidentFileRequest> files;
}
