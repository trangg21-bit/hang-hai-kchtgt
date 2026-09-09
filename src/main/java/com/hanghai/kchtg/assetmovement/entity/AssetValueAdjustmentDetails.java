package com.hanghai.kchtg.assetmovement.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Embeddable
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssetValueAdjustmentDetails {
    @Column(length = 200) private String decisionNumber;
    private LocalDate decisionDate;
    private LocalDate adjustmentDate;
    @Column(length = 200) private String adjustmentReason;
    @Column(length = 1000) private String adjustmentNotes;
    @Column(precision = 15, scale = 2) private BigDecimal originalValueBefore;
    @Column(precision = 15, scale = 2) private BigDecimal originalValueAfter;
    @Column(precision = 15, scale = 2) private BigDecimal remainingValueBefore;
    @Column(precision = 15, scale = 2) private BigDecimal remainingValueAfter;
    private LocalDate declarationDate;
    @Column(precision = 7, scale = 4) private BigDecimal depreciationRate;
    @Column(length = 10) private String valueUnit;
    @Column(length = 200) private String assignmentDecisionNumber;
    private LocalDate depreciationStartDate;
    private Integer depreciationMonths;
    private LocalDate depreciationEndDate;
    @Column(name = "adjustment_accumulated_depreciation", precision = 15, scale = 2) private BigDecimal accumulatedDepreciation;
    @Column(precision = 15, scale = 2) private BigDecimal monthlyDepreciation;
    @Column(length = 200) private String disposalMethod;
}
