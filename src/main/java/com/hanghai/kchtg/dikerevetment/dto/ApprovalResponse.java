package com.hanghai.kchtg.dikerevetment.dto;

import lombok.*;

import java.time.LocalDate;

/**
 * Response DTO for a single approval action (F-045, F-046).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalResponse {

    private String id;
    private java.util.UUID dikeRevetmentId;
    private Integer approvalLevel;
    private String status;
    private String approver;
    private LocalDate approvalDate;
    private String reason;
}
