package com.hanghai.kchtg.dikerevetment.dto;

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

    private Integer approvalLevel;

    @NotBlank(message = "Decision must not be empty")
    private String decision;

    private String reason;
}
