package com.hanghai.kchtg.document.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Response DTO for AdjustmentApproval.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdjustmentApprovalResponse {

    private UUID id;
    private java.util.UUID planningAdjustmentId;
    private String approvalLevel;
    private String status;
    private String approver;
    private LocalDate approvalDate;
    private String notes;
}
