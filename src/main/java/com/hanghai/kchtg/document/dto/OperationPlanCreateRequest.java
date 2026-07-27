package com.hanghai.kchtg.document.dto;

import java.util.UUID;

import com.hanghai.kchtg.document.entity.OperationStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

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
    private UUID createdBy;
}
