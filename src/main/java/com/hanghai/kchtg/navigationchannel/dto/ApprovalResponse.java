package com.hanghai.kchtg.navigationchannel.dto;

import java.util.UUID;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import com.hanghai.kchtg.common.enums.ApprovalLevel;

import lombok.*;

import java.time.LocalDate;

/**
 * Response DTO for a single approval action (F-039, F-040).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApprovalResponse {

    private String id;
    private UUID navigationChannelId;
    private ApprovalLevel approvalLevel;
    private String status;
    private UUID approvedBy;
    private LocalDate approvedDate;
    private String reason;
}
