package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

/**
 * Response DTO for OperationPlanWork (công trình trong kế hoạch vận hành).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OperationPlanWorkResponse {

    private UUID id;
    private UUID infrastructureId;
    private String infrastructureName;
    private String location;
    private String portName;
}
