package com.hanghai.kchtg.assetmovement.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity yêu cầu tăng tài sản KCHTGT (F-122).
 */
@Entity
@Table(name = "asset_increase_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@lombok.experimental.SuperBuilder
@lombok.EqualsAndHashCode(callSuper = true)
public class AssetIncreaseRequest extends BaseEntity {

    private UUID assetId;

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

    @Column(length = 1000)
    private String description;

    @Column(length = 50)
    private RequestStatus status;

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
