package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;
import lombok.Data;

/**
 * Request DTO cho Yeu Cau Giam Tai San (create/update).
 */
@Data
public class AssetDecreaseRequestRequest {

    private UUID assetId;
    private String assetName;
    private int soLuong;
    private String donViTinh;
    private String reason;
    private String decreaseReason;
}
