package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.PlanningStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for creating a PortPlanning record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortPlanningCreateRequest {

    @NotBlank(message = "projectName không được để trống")
    private String projectName;

    private String approvalAuthority;
    private LocalDate approvalDate;
    private String applicationScope;
    private String mapScale;
    private PlanningStatus status;
    private String filePath;
    private String createdBy;
}
