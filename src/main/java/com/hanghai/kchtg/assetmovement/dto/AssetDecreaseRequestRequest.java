package com.hanghai.kchtg.assetmovement.dto;

import lombok.Data;

import java.util.UUID;

/**
 * Request DTO cho Yeu Cau Giam Tai San (create/update).
 */
@Data
public class AssetDecreaseRequestRequest {

    private UUID assetId;
    private String assetName;
    private int quantity;
    private String unitOfMeasure;
    private String reason;
    private String decreaseReason;
}
