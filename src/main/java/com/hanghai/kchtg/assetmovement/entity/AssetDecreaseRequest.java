package com.hanghai.kchtg.assetmovement.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Entity yêu cầu giảm tài sản KCHTGT (F-123).
 */
@Entity
@Table(name = "asset_decrease_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class AssetDecreaseRequest extends BaseEntity {

    private UUID assetId;

    @Column(length = 50)
    private DecreaseReason decreaseReason;

    private Instant decreaseDate;

    @Column(length = 1000)
    private String inspectionReport;

    @Column(precision = 15, scale = 2)
    private BigDecimal accumulatedDepreciation;

    @Column(precision = 15, scale = 2)
    private BigDecimal remainingValue;

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
