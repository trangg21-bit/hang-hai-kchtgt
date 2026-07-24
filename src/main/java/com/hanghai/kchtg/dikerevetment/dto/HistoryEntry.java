package com.hanghai.kchtg.dikerevetment.dto;

import lombok.*;

import java.time.LocalDate;

/**
 * History entry for approval timeline (F-049).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoryEntry {

    private Long id;
    private java.util.UUID dikeRevetmentId;
    private Integer approvalLevel;
    private String status;
    private String approver;
    private LocalDate approvalDate;
    private String reason;
}
