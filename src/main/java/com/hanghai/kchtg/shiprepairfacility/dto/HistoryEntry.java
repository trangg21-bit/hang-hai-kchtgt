package com.hanghai.kchtg.shiprepairfacility.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoryEntry {

    private Long id;
    private Integer approvalLevel;
    private String status;
    private String approvedBy;
    private LocalDateTime approvedDate;
    private String reason;
}
