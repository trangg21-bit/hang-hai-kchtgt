package com.hanghai.kchtg.transmissionasset.entity;

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
@Table(name = "transmission_asset_adjustments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@lombok.experimental.SuperBuilder
@lombok.EqualsAndHashCode(callSuper = true)
public class TransmissionAssetAdjustment extends BaseEntity {

    @Column(nullable = false)
    private UUID assetId;

    @Column(nullable = false, length = 50)
    private String adjustmentType; // TANG, GIAM

    @Column(length = 200)
    private String decisionNumber;

    private LocalDate decisionDate;
    private LocalDate adjustmentDate;

    @Column(length = 200)
    private String adjustmentReason;

    @Column(length = 1000)
    private String notes;

    @Column(precision = 15, scale = 2)
    private BigDecimal originalValueBefore;

    @Column(precision = 15, scale = 2)
    private BigDecimal originalValueAfter;

    @Column(precision = 15, scale = 2)
    private BigDecimal remainingValueBefore;

    @Column(precision = 15, scale = 2)
    private BigDecimal remainingValueAfter;

    private LocalDate declarationDate;

    @Column(precision = 7, scale = 4)
    private BigDecimal depreciationRate;

    @Column(length = 200)
    private String assignmentDecisionNumber;

    private LocalDate depreciationStartDate;
    private Integer depreciationMonths;
    private LocalDate depreciationEndDate;

    @Column(precision = 15, scale = 2)
    private BigDecimal accumulatedDepreciation;

    @Column(precision = 15, scale = 2)
    private BigDecimal monthlyDepreciation;

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
