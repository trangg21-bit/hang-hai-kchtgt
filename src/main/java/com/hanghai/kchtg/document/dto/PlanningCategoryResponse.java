package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Response DTO for a planning category (hàm mục quy hoạch) row (F-132).
 * Legacy fields preserved; §4.1 detail columns added.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldNameConstants
public class PlanningCategoryResponse {

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
