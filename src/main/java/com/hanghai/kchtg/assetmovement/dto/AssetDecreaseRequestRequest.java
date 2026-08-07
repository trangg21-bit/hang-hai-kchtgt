package com.hanghai.kchtg.assetmovement.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

/**
 * Request DTO cho Yeu Cau Giam Tai San (create/update).
 */
@Getter
@Setter
public class AssetDecreaseRequestRequest {

    private UUID assetId;
    private String assetName;
    private int quantity;
    private String unitOfMeasure;
    private String reason;
    private String decreaseReason;
}
