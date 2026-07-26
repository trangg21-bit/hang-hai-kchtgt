package com.hanghai.kchtg.assetmovement.entity;

import java.util.UUID;

import com.hanghai.kchtg.common.entity.BaseEntity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity hồ sơ xử lý tài sản KCHTGT (F-124).
 */
@Entity
@Table(name = "asset_processing_records")
@Data
@NoArgsConstructor
@AllArgsConstructor
@lombok.experimental.SuperBuilder
@lombok.EqualsAndHashCode(callSuper = true)
public class AssetProcessingRecord extends BaseEntity {

    private UUID assetId;

    @Column(length = 50)
    private ProcessingType processingType;

    @Column(length = 200)
    private String recipient;

    @Column(length = 1000)
    private String processingReason;

    @Column(precision = 15, scale = 2)
    private BigDecimal liquidationValue;

    @Column(length = 1000)
    private String description;

    @Column(length = 50)
    private ProcessingRecordStatus status;

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
