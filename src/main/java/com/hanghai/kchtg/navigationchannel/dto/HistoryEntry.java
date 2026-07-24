package com.hanghai.kchtg.navigationchannel.dto;

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

    private Long id;
    private java.util.UUID navigationChannelId;
    private Integer approvalLevel;
    private String status;
    private String approvedBy;
    private LocalDate approvedDate;
    private String reason;
}
