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
 * Entity yêu cầu giảm tài sản KCHTGT (F-123).
 */
@Entity
@Table(name = "asset_decrease_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@lombok.experimental.SuperBuilder
@lombok.EqualsAndHashCode(callSuper = true)
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

    public UUID getAssetId() { return assetId; }
    public void setAssetId(UUID assetId) { this.assetId = assetId; }
    public DecreaseReason getDecreaseReason() { return decreaseReason; }
    public void setDecreaseReason(DecreaseReason decreaseReason) { this.decreaseReason = decreaseReason; }
    public RequestStatus getStatus() { return status; }
    public void setStatus(RequestStatus status) { this.status = status; }
    public void setApprovedBy(UUID approvedBy) { this.approvedBy = approvedBy; }
    public void setApprovedAt(Instant approvedAt) { this.approvedAt = approvedAt; }
    public void setApprovedRemarks(String approvedRemarks) { this.approvedRemarks = approvedRemarks; }
    public void setUnapprovedBy(UUID unapprovedBy) { this.unapprovedBy = unapprovedBy; }
    public void setUnapprovedAt(Instant unapprovedAt) { this.unapprovedAt = unapprovedAt; }
    public void setUnapprovedRemarks(String unapprovedRemarks) { this.unapprovedRemarks = unapprovedRemarks; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
