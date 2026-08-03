package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.MaintenanceStatus;
import com.hanghai.kchtg.document.entity.MaintenanceType;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Request DTO for creating a MaintenancePlan record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenancePlanCreateRequest {

    @NotBlank(message = "equipment không được để trống")
    private String equipment;
    private MaintenanceType maintenanceType;
    private LocalDate estimatedStartDate;
    private LocalDate estimatedEndDate;
    private MaintenanceStatus status;
    private BigDecimal estimatedCost;
    private UUID createdBy;
}
