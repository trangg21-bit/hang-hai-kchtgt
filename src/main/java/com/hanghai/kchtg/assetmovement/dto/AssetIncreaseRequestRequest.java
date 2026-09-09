package com.hanghai.kchtg.assetmovement.dto;

import com.hanghai.kchtg.assetmovement.entity.AssetValueAdjustmentDetails;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/**
 * Request DTO cho Yeu Cau Tang Tai San (create/update).
 */
@Getter
@Setter
public class AssetIncreaseRequestRequest {

    private UUID assetId;
    private String assetName;
    private int quantity;
    private String unitOfMeasure;
    private String reason;
    private String increaseCode;
    private AssetValueAdjustmentDetails adjustmentDetails;
}
