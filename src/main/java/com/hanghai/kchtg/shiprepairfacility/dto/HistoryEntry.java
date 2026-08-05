package com.hanghai.kchtg.shiprepairfacility.dto;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoryEntry {

    private UUID id;
    private ApprovalLevel approvalLevel;
    private String status;
    private String approvedBy;
    private LocalDateTime approvedDate;
    private String reason;
}
