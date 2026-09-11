package com.hanghai.kchtg.cctvasset.entity;

import com.hanghai.kchtg.assetmovement.entity.AssetStatus;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "cctv_system_assets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
@SQLRestriction("deleted_at IS NULL")
@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
public class CctvSystemAsset extends BaseEntity {

    @Column(unique = true, nullable = false, length = 50)
    private String assetCode;

    @Column(nullable = false, length = 500)
    private String assetName;

    private UUID parentOrgUnitId;
    private UUID orgUnitId;
    private UUID usingOrgUnitId;
    private UUID cctvId;

    @Column(length = 100)
    private String assetType;

    @Column(length = 100)
    private String barcode;

    @Column(length = 100)
    private String assetCondition;

    @Column(length = 100)
    private String usageStatus;

    @Column(length = 200)
    private String assetGroup;

    @Column(length = 200)
    private String assetSubgroup;

    @Column(length = 500)
    private String address;

    @Column(length = 200)
    private String origin;

    @Column(precision = 15, scale = 3)
    private BigDecimal quantity;

    @Column(length = 50)
    private String quantityUnit;

    @Column(length = 100)
    private String model;

    @Column(length = 100)
    private String serialNumber;

    @Column(length = 100)
    private String countryOfOrigin;

    @Column(length = 200)
    private String manufacturer;

    private Integer constructionYear;
    private LocalDate useDate;

    @Column(precision = 15, scale = 3)
    private BigDecimal landArea;

    @Column(precision = 15, scale = 3)
    private BigDecimal floorArea;

    @Column(length = 500)
    private String assetLocation;

    @Column(length = 500)
    private String attachmentName;

    private LocalDate declarationDate;

    @Column(precision = 15, scale = 2)
    private BigDecimal originalValue;

    @Column(precision = 7, scale = 4)
    private BigDecimal depreciationRate;

    @Column(precision = 15, scale = 2)
    private BigDecimal remainingValue;

    @Column(length = 20)
    @Builder.Default
    private String valueUnit = "VNĐ";

    @Column(length = 200)
    private String assignmentDecisionNumber;

    private LocalDate depreciationStartDate;
    private Integer depreciationMonths;
    private LocalDate depreciationEndDate;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal accumulatedDepreciation = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    private BigDecimal monthlyDepreciation;

    @Column(length = 200)
    private String disposalMethod;

    @Column(length = 50)
    @Builder.Default
    private AssetStatus status = AssetStatus.MANAGED;

    @Column(name = "approval_status")
    @Builder.Default
    private ApprovalStatus approvalStatus = ApprovalStatus.DRAFT;

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

    @Column(length = 1000)
    private String rejectionReason;

    @Version
    @Column(name = "lock_version")
    @Builder.Default
    private Integer lockVersion = 0;
}
