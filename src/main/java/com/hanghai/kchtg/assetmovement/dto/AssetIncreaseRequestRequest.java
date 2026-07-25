package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;
import lombok.Data;

/**
 * Request DTO cho Yeu Cau Tang Tai San (create/update).
 */
@Data
public class AssetIncreaseRequestRequest {

    private UUID assetId;
    private String assetName;
    private int soLuong;
    private String donViTinh;
    private String reason;
    private String maSoTang;
}
