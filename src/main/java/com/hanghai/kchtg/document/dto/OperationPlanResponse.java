package com.hanghai.kchtg.document.dto;

import com.hanghai.kchtg.document.entity.OperationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

/**
 * Response DTO for OperationPlan.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationPlanResponse {

    private UUID id;
    private LocalDate operationDate;
    private String pier;
    private String equipment;
    private LocalTime startTime;
    private LocalTime endTime;
    private OperationStatus status;

    private UUID orgUnitId;
    private String orgUnitName;
    private UUID operatingOrgUnitId;
    private String infrastructureType;
    private String code;
    private String name;
    private String content;
    private LocalDate expectedStartDate;
    private LocalDate expectedEndDate;
    private String note;

    private UUID createdBy;
    private LocalDateTime createdDate;
    private UUID updatedBy;
    private LocalDateTime updatedDate;

    private List<OperationDetailResponse> operationDetails;
    private List<OperationPlanWorkResponse> workItems;
    private List<OperationPlanFileResponse> files;
    private List<OperationConfirmationResponse> confirmations;
}
