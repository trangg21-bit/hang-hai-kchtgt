package com.hanghai.kchtg.assetmovement.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Filter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Entity lưu thông tin tài sản KCHTGT.
 */
@Entity
@Table(name = "infra_assets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@lombok.experimental.SuperBuilder
@lombok.EqualsAndHashCode(callSuper = true)
@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
public class InfraAsset extends BaseEntity {

    @Column(unique = true, nullable = false, length = 50)
    private String assetCode;

    @Column(nullable = false, length = 200)
    private String assetName;

    @Column(length = 50)
    private InfraAssetType assetType;

    private UUID parentOrgUnitId;
    private UUID orgUnitId;
    private UUID usingOrgUnitId;
    private UUID berthId;
    private UUID anchorageId;
    private UUID beaconStationId;
    private UUID dikeRevetmentId;
    private UUID buoyId;
    private UUID buoyStationId;
    private UUID navigationChannelId;

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

    @Column(precision = 7, scale = 4)
    private BigDecimal depreciationRate;

    @Column(length = 200)
    private String assignmentDecisionNumber;

    private LocalDate depreciationStartDate;
    private Integer depreciationMonths;
    private LocalDate depreciationEndDate;

    @Column(precision = 15, scale = 2)
    private BigDecimal monthlyDepreciation;

    @Column(length = 200)
    private String disposalMethod;

    @Column(length = 200)
    private String location;

    @Column(length = 1000)
    private String technicalSpecs;

    @Column(length = 200)
    private String fundingSource;

    @Column(precision = 15, scale = 2)
    private BigDecimal originalValue;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal accumulatedDepreciation = BigDecimal.ZERO;

    @Column(precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal remainingValue = BigDecimal.ZERO;

    @Column(length = 50)
    private AssetStatus status;

    @Column(length = 50)
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

    private UUID approvedBy;
    private Instant approvedAt;

    @Column(length = 1000)
    private String approvedRemarks;

    private UUID unapprovedBy;
    private Instant unapprovedAt;

    @Column(length = 1000)
    private String unapprovedRemarks;

    @Version
    private Integer lockVersion;

    public String getAssetName() { return assetName; }
    public AssetStatus getStatus() { return status; }
    public void setStatus(AssetStatus status) { this.status = status; }
    public void setApprovedBy(UUID approvedBy) { this.approvedBy = approvedBy; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }
}
