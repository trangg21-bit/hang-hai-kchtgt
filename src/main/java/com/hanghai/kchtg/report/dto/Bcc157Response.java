package com.hanghai.kchtg.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Response DTO for BCC_157 (F-142) report.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bcc157Response {

    private UUID id;
    private UUID orgUnitId;
    private Integer reportYear;
    private String nguonDuLieu;
    private String status;

    // --- Section 1: Nguyên giá ---

    private String openingOriginalCostCode;
    private BigDecimal assetOpeningOriginalCost;

    private String originalCostIncreaseCode;
    private BigDecimal assetOriginalCostIncrease;

    private String originalCostDecreaseCode;
    private BigDecimal assetOriginalCostDecrease;

    private String closingOriginalCostCode;
    private BigDecimal assetClosingOriginalCost;

    // --- Section 2: Giá trị hao mòn lũy kế ---

    private String openingAccumulatedDepreciationCode;
    private BigDecimal assetOpeningAccumulatedDepreciation;

    private String depreciationIncreaseCode;
    private BigDecimal assetDepreciationIncrease;

    private String depreciationDecreaseCode;
    private BigDecimal assetDepreciationDecrease;

    private String closingDepreciationCode;
    private BigDecimal assetClosingDepreciation;

    // --- Section 3: Giá trị còn lại ---

    private String openingResidualValueCode;
    private BigDecimal assetOpeningResidualValue;

    private String closingResidualValueCode;
    private BigDecimal assetClosingResidualValue;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
