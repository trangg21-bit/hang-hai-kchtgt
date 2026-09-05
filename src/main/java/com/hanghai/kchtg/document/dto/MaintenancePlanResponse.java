package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.MaintenanceStatus;
import com.hanghai.kchtg.document.entity.MaintenanceType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

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

    private UUID orgUnitId;
    private String orgUnitName;
    private UUID operatingOrgUnitId;
    private String infrastructureType;
    private String code;
    private String name;
    private String content;
    private String note;

    private UUID createdBy;
    private LocalDateTime createdDate;
    private UUID updatedBy;
    private LocalDateTime updatedDate;

    private List<MaintenancePlanWorkResponse> workItems;
    private List<MaintenancePlanFileResponse> files;
    private List<MaintenanceResultResponse> results;
}
