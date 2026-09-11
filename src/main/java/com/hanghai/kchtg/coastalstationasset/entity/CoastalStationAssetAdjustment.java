package com.hanghai.kchtg.coastalstationasset.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "coastal_station_asset_adjustments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@lombok.experimental.SuperBuilder
@lombok.EqualsAndHashCode(callSuper = true)
public class CoastalStationAssetAdjustment extends BaseEntity {

    @Column(nullable = false)
    private UUID assetId;

    @Column(nullable = false, length = 50)
    private String adjustmentType;

    @Column(length = 200)
    private String decisionNumber;

    private LocalDate decisionDate;
    private LocalDate adjustmentDate;

    @Column(length = 200)
    private String adjustmentReason;

    @Column(length = 1000)
    private String notes;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal originalValueBefore = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal originalValueAfter = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal remainingValueBefore = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal remainingValueAfter = BigDecimal.ZERO;

    private LocalDate declarationDate;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal adjustedOriginalValue = BigDecimal.ZERO;

    @Column(precision = 7, scale = 4)
    @Builder.Default
    private BigDecimal depreciationRate = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal remainingValue = BigDecimal.ZERO;

    @Column(length = 20)
    @Builder.Default
    private String currency = "VNĐ";

    @Column(length = 200)
    private String assignmentDecisionNumber;

    private LocalDate depreciationStartDate;
    private Integer depreciationMonths;
    private LocalDate depreciationEndDate;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal accumulatedDepreciation = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal monthlyDepreciation = BigDecimal.ZERO;

    @Column(length = 200)
    private String disposalMethod;

    private UUID submittedBy;
    private Instant submittedAt;
    private UUID portAuthorityApprovedBy;
    private Instant portAuthorityApprovedAt;

    @Column(length = 1000)
    private String portAuthorityApprovalContent;

    private UUID departmentApprovedBy;
    private Instant departmentApprovedAt;

    @Column(length = 1000)
    private String departmentApprovalContent;

    @Column(length = 50)
    @Builder.Default
    private String status = "DRAFT";
}
