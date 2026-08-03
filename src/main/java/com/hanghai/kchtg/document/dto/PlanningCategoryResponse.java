package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Response DTO for PlanningCategory.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PlanningCategoryResponse {

    private UUID id;
    private String categoryName;
    private String unitOfMeasure;
    private BigDecimal plannedValue;
    private BigDecimal actualValue;
    private String status;
}
