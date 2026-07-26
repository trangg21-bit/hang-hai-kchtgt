package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Ke Hoach Kiem Ke.
 */
@Data
@Builder
public class InventoryPlanResponse {

    private UUID id;
    private String planName;
    private String description;
    private String status;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
