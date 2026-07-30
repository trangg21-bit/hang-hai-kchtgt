package com.hanghai.kchtg.dikerevetment.dto;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

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
