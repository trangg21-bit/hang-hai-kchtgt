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

    public UUID getAssetId() { return assetId; }
    public String getReason() { return reason; }
    public String getDecreaseReason() { return decreaseReason; }
}
