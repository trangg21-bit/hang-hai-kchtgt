package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.AdjustmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

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
