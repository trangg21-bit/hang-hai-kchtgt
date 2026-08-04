package com.hanghai.kchtg.assetmovement.dto;

import lombok.Data;

import java.util.UUID;

/**
 * Request DTO cho Yeu Cau Tang Tai San (create/update).
 */
@Data
public class AssetIncreaseRequestRequest {

    private UUID assetId;
    private String assetName;
    private int quantity;
    private String unitOfMeasure;
    private String reason;
    private String increaseCode;
}
