package com.hanghai.kchtg.assetmovement.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Luu Phe Duyet.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ApprovalRecordResponse {

    private UUID id;
    private UUID requestId;
    private String requestType;
    private String result;
    private String approverName;
    private String notes;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
