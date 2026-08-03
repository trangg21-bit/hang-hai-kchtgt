package com.hanghai.kchtg.assetmovement.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity lưu thông tin tài sản KCHTGT.
 */
@Entity
@Table(name = "infra_assets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@lombok.experimental.SuperBuilder
@lombok.EqualsAndHashCode(callSuper = true)
public class InfraAsset extends BaseEntity {

    @Column(unique = true, nullable = false, length = 50)
    private String assetCode;

    @Column(nullable = false, length = 200)
    private String assetName;

    @Column(length = 50)
    private InfraAssetType assetType;

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

}
