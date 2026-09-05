package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.PlanningStatus;
import com.hanghai.kchtg.document.entity.PortPlanningGroup;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for a PortPlanning record (F-132/133/134).
 * Legacy fields preserved; §4.2 additions included (orgUnitName populated via
 * OrgUnitCacheService in the service wave).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class PortPlanningResponse {

    private UUID id;

    private UUID orgUnitId;
    private String orgUnitName;

    private String projectName;

    private String approvalAuthority;
    private LocalDate approvalDate;
    private String applicationScope;
    private String mapScale;
    private PlanningStatus status;
    private String filePath;

    private String decisionNumber;
    private LocalDate decisionDate;

    private PortPlanningGroup planningGroup;
    private UUID seaportId;
    private String seaportGroup;
    private UUID dryPortId;

    private Integer planToYear;
    private String planContent;
    private String landWaterDemand;
    private String capitalDemand;
    private String implementationSolution;
    private String priorityProjects;
    private String implementationOrg;

    private UUID createdBy;
    private LocalDateTime createdAt;
    private UUID updatedBy;
    private LocalDateTime updatedAt;

    private List<PlanningCategoryResponse> planningCategories = new ArrayList<>();
    private List<PortPlanningCargoForecastResponse> cargoForecasts = new ArrayList<>();
    private List<PlanningFileResponse> planningFiles = new ArrayList<>();
}
