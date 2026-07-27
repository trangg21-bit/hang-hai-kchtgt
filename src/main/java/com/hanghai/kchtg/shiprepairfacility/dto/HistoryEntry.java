package com.hanghai.kchtg.shiprepairfacility.dto;

import java.util.UUID;

import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import com.hanghai.kchtg.common.enums.ApprovalLevel;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoryEntry {

    private UUID id;
    private ApprovalLevel approvalLevel;
    private String status;
    private UUID approvedBy;
    private LocalDateTime approvedDate;
    private String reason;
}
