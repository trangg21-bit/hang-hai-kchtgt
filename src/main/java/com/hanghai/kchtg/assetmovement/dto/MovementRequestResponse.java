package com.hanghai.kchtg.assetmovement.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Yeu Cau Bien Dong.
 */
@Data
@Builder
public class MovementRequestResponse {

    private UUID id;
    private UUID assetId;
    private String movementType;
    private String assetName;
    private int quantity;
    private String status;
    private String description;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
