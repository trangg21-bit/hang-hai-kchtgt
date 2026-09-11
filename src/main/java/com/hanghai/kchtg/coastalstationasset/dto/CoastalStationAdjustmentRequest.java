package com.hanghai.kchtg.coastalstationasset.dto;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CoastalStationAdjustmentRequest {
    private String adjustmentType;
    private String decisionNumber;
    private LocalDate decisionDate;
    private LocalDate adjustmentDate;
    private String adjustmentReason;
    private String notes;
    private BigDecimal originalValueBefore;
    private BigDecimal originalValueAfter;
    private BigDecimal remainingValueBefore;
    private BigDecimal remainingValueAfter;
    private LocalDate declarationDate;
    private BigDecimal adjustedOriginalValue;
    private BigDecimal depreciationRate;
    private BigDecimal remainingValue;
    private String currency;
    private String assignmentDecisionNumber;
    private LocalDate depreciationStartDate;
    private Integer depreciationMonths;
    private LocalDate depreciationEndDate;
    private BigDecimal accumulatedDepreciation;
    private BigDecimal monthlyDepreciation;
    private String disposalMethod;
}
