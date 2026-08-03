package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.PlanningStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for PortPlanning.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortPlanningResponse {

    private UUID id;
    private String projectName;
    private String approvalAuthority;
    private LocalDate approvalDate;
    private String applicationScope;
    private String mapScale;
    private PlanningStatus status;
    private String filePath;
    private String createdBy;
    private LocalDateTime createdAt;
    private String updatedBy;
    private LocalDateTime updatedAt;
    private List<PlanningCategoryResponse> planningCategories;
}
