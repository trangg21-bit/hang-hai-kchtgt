package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;

import lombok.Data;

import java.util.UUID;

/**
 * Request DTO cho Ho So Xu Ly Tai San (create/update).
 */
@Data
public class AssetProcessingRecordRequest {

    private UUID assetId;
    private String assetName;
    private String processingType;
    private String recipient;
    private String processingReason;
    private String description;
}
