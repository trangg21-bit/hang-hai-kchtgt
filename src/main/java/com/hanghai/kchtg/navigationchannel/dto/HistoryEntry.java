package com.hanghai.kchtg.navigationchannel.dto;

import java.util.UUID;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import com.hanghai.kchtg.common.enums.ApprovalLevel;

import lombok.*;

import java.time.LocalDate;

/**
 * History entry for approval timeline (F-043).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoryEntry {

    private UUID id;
    private UUID navigationChannelId;
    private ApprovalLevel approvalLevel;
    private String status;
    private UUID approvedBy;
    private LocalDate approvedDate;
    private String reason;
}
