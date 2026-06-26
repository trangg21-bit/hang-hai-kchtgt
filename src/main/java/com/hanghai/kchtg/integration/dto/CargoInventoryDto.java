package com.hanghai.kchtg.integration.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;

/**
 * Cargo inventory check summary for F-226 (chieu-kiem-hang-hoa).
 * Returned by GET /api/v1/integration/share/cargo/inventory.
 */
@Data
@Builder
public class CargoInventoryDto {

    private String id;
    private String cargoName;
    private Long quantity;
    private String unit;
    private LocalDate lastCheckedAt;
    private String status;
}
