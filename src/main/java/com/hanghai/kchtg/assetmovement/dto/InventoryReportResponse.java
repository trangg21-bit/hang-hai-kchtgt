package com.hanghai.kchtg.assetmovement.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Bao Cao Kiem Ke.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class InventoryReportResponse {

    private UUID id;
    private UUID planId;
    private String reportName;
    private int totalQuantity;
    private int quantityVariance;
    private String result;
    private String description;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
