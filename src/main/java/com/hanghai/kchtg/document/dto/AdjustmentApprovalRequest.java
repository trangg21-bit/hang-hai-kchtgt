package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Request DTO for creating/approving a AdjustmentApproval record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdjustmentApprovalRequest {

    private String approvalLevel;
    private String status;
    private String approver;
    private LocalDate approvalDate;
    private String notes;
}
