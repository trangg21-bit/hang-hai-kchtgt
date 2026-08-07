package com.hanghai.kchtg.assetmovement.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Yeu Cau Giam Tai San.
 */
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AssetDecreaseRequestResponse {

    private UUID id;
    private UUID assetId;
    private String assetName;
    private int quantity;
    private String unitOfMeasure;
    private String reason;
    private String status;
    private String decreaseReason;
    private UUID createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
