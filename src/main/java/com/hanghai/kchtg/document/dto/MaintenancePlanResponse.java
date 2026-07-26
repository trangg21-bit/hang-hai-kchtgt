package com.hanghai.kchtg.document.dto;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.MaintenanceType;
import com.hanghai.kchtg.document.entity.MaintenanceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO for MaintenancePlan.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenancePlanResponse {

    private UUID id;
    private String equipment;
    private MaintenanceType maintenanceType;
    private LocalDate estimatedStartDate;
    private LocalDate estimatedEndDate;
    private MaintenanceStatus status;
    private BigDecimal estimatedCost;
    private UUID createdBy;
    private LocalDateTime createdDate;
    private UUID updatedBy;
    private LocalDateTime updatedDate;
}
