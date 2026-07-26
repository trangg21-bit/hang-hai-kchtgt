package com.hanghai.kchtg.document.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Request DTO for recording MaintenanceResult.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceResultRequest {

    @NotNull(message = "maintenancePlanId không được để trống")
    private java.util.UUID maintenancePlanId;

    private LocalDateTime actualStartDate;
    private LocalDateTime actualEndDate;
    private String resultDescription;
    private String replacedParts;
    private Long downtimeDuration;
    private String recorder;
    private LocalDate recordedDate;
}
