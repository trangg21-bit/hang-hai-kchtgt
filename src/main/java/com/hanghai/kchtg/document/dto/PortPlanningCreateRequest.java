package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.PlanningStatus;
import com.hanghai.kchtg.document.entity.PortPlanningGroup;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Request DTO for creating/updating a PortPlanning record (F-132/134).
 * Legacy fields preserved; §4.1 additions included.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class PortPlanningCreateRequest {

    /** Đơn vị quản lý — mandatory for new rows (BR-132-01: assign within scope, never NULL). */
    private UUID orgUnitId;

    @NotBlank(message = "projectName không được để trống")
    private String projectName;

    private String approvalAuthority;
    private LocalDate approvalDate;
    private String applicationScope;
    private String mapScale;
    private PlanningStatus status;
    private String filePath;

    private String decisionNumber;
    private LocalDate decisionDate;

    /** Nhóm quy hoạch (Cảng biển / Cảng cạn) — branch fields below per group. */
    private PortPlanningGroup planningGroup;
    private UUID seaportId;
    private String seaportGroup;
    private UUID dryPortId;

    /** Kế hoạch quy hoạch — Dự báo đến năm + nội dung textareas. */
    private Integer planToYear;
    private String planContent;
    private String landWaterDemand;
    private String capitalDemand;
    private String implementationSolution;
    private String priorityProjects;
    private String implementationOrg;

    private List<PlanningCategoryRequest> planningCategories;
    private List<PortPlanningCargoForecastRequest> cargoForecasts;
    private List<PlanningFileCreateRequest> planningFiles;

    /** Legacy audit field — server-side UUID audit replaces it in the service wave. */
    private UUID createdBy;
}
