package com.hanghai.kchtg.vtssystem.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HistoryEntry {
    private Long id;
    private Integer approvalLevel;
    private String status;
    private String approvedBy;
    private LocalDateTime approvedDate;
    private String reason;
}
