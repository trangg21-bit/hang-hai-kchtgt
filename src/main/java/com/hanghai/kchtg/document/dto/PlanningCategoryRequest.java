package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Danh mục quy hoạch chi tiết row payload (F-132 child planning_categories).
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class PlanningCategoryRequest {

    private UUID id;

    private String phase;
    private String categoryName;
    private String unitOfMeasure;
    private BigDecimal plannedValue;
    private BigDecimal actualValue;
    private String status;

    private String portCategory;
    private UUID portId;
    private String portName;
    private String exploitationFunction;
    private String classification;
    private Integer berthCount;
    /** Sau quy hoạch — Số cầu cảng KB cao (Excel row 30). Cặp low-high với berthCount. */
    private Integer berthCountHigh;
    private BigDecimal lengthM;
    /** Sau quy hoạch — Chiều dài KB cao (Excel row 31). Cặp low-high với lengthM. */
    private BigDecimal lengthHigh;
    private String shipSize;
    private BigDecimal capacity;
    /** Sau quy hoạch — Dự kiến công suất KB cao (Excel row 33). Cặp low-high với capacity. */
    private BigDecimal capacityHigh;
    private BigDecimal landArea;
    private BigDecimal waterArea;
    private String note;
}
