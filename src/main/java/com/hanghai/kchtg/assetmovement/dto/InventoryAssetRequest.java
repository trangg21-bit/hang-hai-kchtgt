package com.hanghai.kchtg.assetmovement.dto;

import com.hanghai.kchtg.assetmovement.entity.InventoryStatus;
import lombok.Data;

import java.util.UUID;

/**
 * Request DTO cho Tai San Kiem Ke (create/update).
 */
@Data
public class InventoryAssetRequest {

    private UUID planId;
    private UUID assetId;
    private String assetName;
    private String inventoryStatus;
    private int soLuongKyHienTai;
    private int soLuongKyThucTe;
    private java.math.BigDecimal bookValue;
    private java.math.BigDecimal actualValue;
    private String description;
    private String notes;

    public java.math.BigDecimal getBookValue() {
        return bookValue != null ? bookValue : java.math.BigDecimal.valueOf(soLuongKyHienTai);
    }

    public java.math.BigDecimal getActualValue() {
        return actualValue != null ? actualValue : java.math.BigDecimal.valueOf(soLuongKyThucTe);
    }

    public String getNotes() {
        return notes != null ? notes : description;
    }
}
