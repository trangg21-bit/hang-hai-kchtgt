package com.hanghai.kchtg.assetmovement.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Ke Hoach Kiem Ke.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
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
