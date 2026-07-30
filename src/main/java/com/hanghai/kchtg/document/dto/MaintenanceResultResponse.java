package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for MaintenanceResult.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceResultResponse {

    private UUID id;
    private java.util.UUID maintenancePlanId;
    private LocalDateTime actualStartDate;
    private LocalDateTime actualEndDate;
    private String resultDescription;
    private String replacedParts;
    private Long downtimeDuration;
    private String recorder;
    private LocalDate recordedDate;
}
