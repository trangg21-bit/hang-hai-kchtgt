package com.hanghai.kchtg.assetmovement.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Ho So Xu Ly Tai San.
 */
@Data
@Builder
public class AssetProcessingRecordResponse {

    private UUID id;
    private UUID assetId;
    private String assetName;
    private String processingType;
    private String description;
    private String documentStatus;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
