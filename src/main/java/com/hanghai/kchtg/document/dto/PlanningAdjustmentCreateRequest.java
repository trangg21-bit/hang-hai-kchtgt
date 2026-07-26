package com.hanghai.kchtg.document.dto;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.AdjustmentStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Request DTO for creating a PlanningAdjustment record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanningAdjustmentCreateRequest {

    @NotNull(message = "planningId không được để trống")
    private UUID planningId;

    private String adjustmentType;
    private String reason;
    private String detailedDescription;
    private String affectedScope;
    private AdjustmentStatus status;
    private String registrant;
    private LocalDateTime registeredAt;
}
