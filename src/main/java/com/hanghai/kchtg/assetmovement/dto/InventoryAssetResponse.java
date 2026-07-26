package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Tai San Kiem Ke.
 */
@Data
@Builder
public class InventoryAssetResponse {

    private UUID id;
    private UUID planId;
    private UUID assetId;
    private String assetName;
    private String inventoryStatus;
    private int currentPeriodQuantity;
    private int actualPeriodQuantity;
    private String description;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
