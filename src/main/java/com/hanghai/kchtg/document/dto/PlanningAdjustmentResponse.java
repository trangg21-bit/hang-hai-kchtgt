package com.hanghai.kchtg.document.dto;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.AdjustmentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Response DTO for PlanningAdjustment.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanningAdjustmentResponse {

    private UUID id;
    private java.util.UUID planningId;
    private String adjustmentType;
    private String reason;
    private String detailedDescription;
    private String affectedScope;
    private AdjustmentStatus status;
    private String registrant;
    private LocalDateTime registeredAt;
    private LocalDateTime updatedAt;
    private List<AdjustmentApprovalResponse> approvals;
}
