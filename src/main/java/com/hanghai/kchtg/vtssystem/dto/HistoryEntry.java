package com.hanghai.kchtg.vtssystem.dto;

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
    private String approvedBy;
    private String approvedByName;
    private String changedBy;
    private UUID orgUnitId;
    private String orgUnitName;
    private LocalDateTime approvedDate;
    private LocalDateTime changedAt;
    private String reason;
    private String changedField;
    private String fieldName;
    private String previousValue;
    private String oldValue;
    private String newValue;
}
