package com.hanghai.kchtg.assetmovement.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.UUID;

/**
 * Request DTO cho Bao Cao Kiem Ke (create/update).
 */
@Data
public class InventoryReportRequest {

    @NotNull(message = "Kế hoạch kiểm kê không được để trống")
    private UUID planId;

    private String reportName;

    @NotNull(message = "Tổng số lượng kiểm không được để trống")
    private Integer totalQuantity;

    private int quantityVariance;
    private String result;
    private String description;
}
