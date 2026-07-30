package com.hanghai.kchtg.radarstation.dto;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryEntry {
    private UUID id;
    private ApprovalLevel approvalLevel;
    private String status;
    private UUID approvedBy;
    private LocalDateTime approvedDate;
    private String reason;
}
