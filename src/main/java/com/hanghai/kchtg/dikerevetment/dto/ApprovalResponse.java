package com.hanghai.kchtg.dikerevetment.dto;

import java.util.UUID;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import com.hanghai.kchtg.common.enums.ApprovalLevel;

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
    private UUID dikeRevetmentId;
    private ApprovalLevel approvalLevel;
    private String status;
    private String approver;
    private LocalDate approvalDate;
    private String reason;
}
