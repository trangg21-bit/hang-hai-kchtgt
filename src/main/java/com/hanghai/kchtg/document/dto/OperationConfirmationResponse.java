package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for OperationConfirmation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationConfirmationResponse {

    private UUID id;
    private UUID operationPlanId;
    private LocalDateTime actualStartDate;
    private LocalDateTime actualEndDate;
    private String operatingTime;
    private String operatingStatus;
    private String downtime;
    private String incidentFrequency;
    private BigDecimal maxCapacity;
    private BigDecimal actualCapacity;
    private String resultContent;
    private String resultNote;
    private String recorder;
    private LocalDate recordedDate;
}
