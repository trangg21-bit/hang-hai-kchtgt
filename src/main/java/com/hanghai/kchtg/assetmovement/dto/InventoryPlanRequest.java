package com.hanghai.kchtg.assetmovement.dto;

import com.hanghai.kchtg.assetmovement.entity.InventoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

/**
 * Request DTO cho Ke Hoach Kiem Ke (create/update).
 */
@NoArgsConstructor
@AllArgsConstructor
@Data
public class InventoryPlanRequest {

    @NotBlank(message = "Tên kế hoạch không được để trống")
    private String planName;

    private String scope;

    @NotNull(message = "Loại kiểm kê không được để trống")
    private InventoryType inventoryType;

    @NotNull(message = "Ngày bắt đầu không được để trống")
    private Instant startDate;

    @NotNull(message = "Ngày kết thúc không được để trống")
    private Instant endDate;

    @NotBlank(message = "Tổ trưởng kiểm kê không được để trống")
    private String inventoryLeader;

    private String description;

    public String getScope() {
        return scope != null ? scope : planName;
    }
}
