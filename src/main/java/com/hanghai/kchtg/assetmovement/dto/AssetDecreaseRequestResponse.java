package com.hanghai.kchtg.assetmovement.dto;

import lombok.Builder;
import lombok.Data;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO cho Yeu Cau Giam Tai San.
 */
@Data
@Builder
public class AssetDecreaseRequestResponse {

    private UUID id;
    private UUID assetId;
    private String assetName;
    private int soLuong;
    private String donViTinh;
    private String reason;
    private String status;
    private String decreaseReason;
    private String createdBy;
    private String createdByName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
