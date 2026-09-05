package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.OperationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

/**
 * Request DTO for creating a OperationPlan record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationPlanCreateRequest {

    private LocalDate operationDate;
    private String pier;
    private String equipment;
    private LocalTime startTime;
    private LocalTime endTime;
    private OperationStatus status;

    private UUID orgUnitId;
    private UUID operatingOrgUnitId;
    private String infrastructureType;
    private String code;
    private String name;
    private String content;
    private LocalDate expectedStartDate;
    private LocalDate expectedEndDate;
    private String note;
    private UUID createdBy;
}
