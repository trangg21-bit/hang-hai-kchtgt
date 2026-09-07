package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Response DTO for MaintenancePlanWork (công trình trong kế hoạch bảo trì).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenancePlanWorkResponse {

    private UUID id;
    private UUID infrastructureId;
    private String infrastructureName;
    private String portName;
    private String location;
    private BigDecimal cost;
}
