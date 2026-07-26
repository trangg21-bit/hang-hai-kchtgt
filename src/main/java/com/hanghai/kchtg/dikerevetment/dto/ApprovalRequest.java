package com.hanghai.kchtg.dikerevetment.dto;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import com.hanghai.kchtg.common.enums.ApprovalLevel;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

/**
 * Approval request for DikeRevetment (F-045, F-046).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalRequest {

    private ApprovalLevel approvalLevel;

    @NotBlank(message = "Decision must not be empty")
    private String decision;

    private String reason;
}
