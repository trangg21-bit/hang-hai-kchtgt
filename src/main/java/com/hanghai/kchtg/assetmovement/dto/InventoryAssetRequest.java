package com.hanghai.kchtg.assetmovement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Request DTO cho Tai San Kiem Ke (create/update).
 */
@NoArgsConstructor
@AllArgsConstructor
@Data
public class InventoryAssetRequest {

    private UUID planId;
    private UUID assetId;
    private String assetName;
    private String inventoryStatus;
    private int currentPeriodQuantity;
    private int actualPeriodQuantity;
    private java.math.BigDecimal bookValue;
    private java.math.BigDecimal actualValue;
    private String description;
    private String notes;

    public java.math.BigDecimal getBookValue() {
        return bookValue != null ? bookValue : java.math.BigDecimal.valueOf(currentPeriodQuantity);
    }

    public java.math.BigDecimal getActualValue() {
        return actualValue != null ? actualValue : java.math.BigDecimal.valueOf(actualPeriodQuantity);
    }

    public String getNotes() {
        return notes != null ? notes : description;
    }
}
