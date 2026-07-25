package com.hanghai.kchtg.assetmovement.dto;

import java.util.UUID;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * Request DTO cho Bao Cao Kiem Ke (create/update).
 */
@Data
public class InventoryReportRequest {

    @NotNull(message = "Kế hoạch kiểm kê không được để trống")
    private UUID planId;

    private String tenBaoCao;

    @NotNull(message = "Tổng số lượng kiểm không được để trống")
    private Integer tongSoLuong;

    private int soLuongChenhLech;
    private String result;
    private String description;
}
