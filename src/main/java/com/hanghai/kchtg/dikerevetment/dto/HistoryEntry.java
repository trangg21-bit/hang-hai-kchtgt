package com.hanghai.kchtg.dikerevetment.dto;

import java.util.UUID;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import com.hanghai.kchtg.common.enums.ApprovalLevel;

import lombok.*;

import java.time.LocalDate;

/**
 * History entry for approval timeline (F-049).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoryEntry {

    private UUID id;
    private UUID dikeRevetmentId;
    private ApprovalLevel approvalLevel;
    private String status;
    private String approver;
    private LocalDate approvalDate;
    private String reason;
}
