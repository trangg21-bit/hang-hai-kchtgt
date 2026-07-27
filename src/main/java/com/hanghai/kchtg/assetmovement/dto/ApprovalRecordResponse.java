package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Luu Phe Duyet.
 */
@Data
@Builder
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
