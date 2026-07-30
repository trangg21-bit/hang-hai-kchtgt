package com.hanghai.kchtg.navigationchannel.dto;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

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
