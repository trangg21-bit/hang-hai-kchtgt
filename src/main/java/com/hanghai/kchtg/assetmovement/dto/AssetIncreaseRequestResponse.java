package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Yeu Cau Tang Tai San.
 */
@Data
@Builder
public class AssetIncreaseRequestResponse {

    private UUID id;
    private UUID assetId;
    private String assetName;
    private int quantity;
    private String unitOfMeasure;
    private String reason;
    private String status;
    private String increaseCode;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
