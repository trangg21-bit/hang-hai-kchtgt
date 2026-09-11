package com.hanghai.kchtg.report.dto;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.DecimalMin;
import lombok.experimental.FieldNameConstants;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Create request DTO for BCC_157 (F-142) report.
 * Matches the 20 report fields from V1 Bcc157Dto.Bcc157ZlstComReport.
 */
@FieldNameConstants
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Bcc157CreateRequest {

    private UUID orgUnitId;
    private Integer reportYear;
    private String nguonDuLieu;
    private Long version;

    // --- Section 1: Nguyên giá ---

    private String openingOriginalCostCode;
    @DecimalMin("0")
    @Digits(integer = 16, fraction = 4)
    private BigDecimal assetOpeningOriginalCost;

    private String originalCostIncreaseCode;
    @DecimalMin("0")
    @Digits(integer = 16, fraction = 4)
    private BigDecimal assetOriginalCostIncrease;

    private String originalCostDecreaseCode;
    @DecimalMin("0")
    @Digits(integer = 16, fraction = 4)
    private BigDecimal assetOriginalCostDecrease;

    private String closingOriginalCostCode;
    @DecimalMin("0")
    @Digits(integer = 16, fraction = 4)
    private BigDecimal assetClosingOriginalCost;

    // --- Section 2: Giá trị hao mòn lũy kế ---

    private String openingAccumulatedDepreciationCode;
    @DecimalMin("0")
    @Digits(integer = 16, fraction = 4)
    private BigDecimal assetOpeningAccumulatedDepreciation;

    private String depreciationIncreaseCode;
    @DecimalMin("0")
    @Digits(integer = 16, fraction = 4)
    private BigDecimal assetDepreciationIncrease;

    private String depreciationDecreaseCode;
    @DecimalMin("0")
    @Digits(integer = 16, fraction = 4)
    private BigDecimal assetDepreciationDecrease;

    private String closingDepreciationCode;
    @DecimalMin("0")
    @Digits(integer = 16, fraction = 4)
    private BigDecimal assetClosingDepreciation;

    // --- Section 3: Giá trị còn lại ---

    private String openingResidualValueCode;
    @DecimalMin("0")
    @Digits(integer = 16, fraction = 4)
    private BigDecimal assetOpeningResidualValue;

    private String closingResidualValueCode;
    @DecimalMin("0")
    @Digits(integer = 16, fraction = 4)
    private BigDecimal assetClosingResidualValue;
}
