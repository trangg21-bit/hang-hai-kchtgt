package com.hanghai.kchtg.datasharingaggregation.entity;

import com.hanghai.kchtg.datasharingaggregation.enums.SharingType;
import com.hanghai.kchtg.datasharingaggregation.enums.SharingStatus;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "data_sharing_aggregation_record")
public class DataSharingAggregationRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Enumerated(EnumType.STRING)
    @Column(name = "sharing_type", nullable = false)
    private SharingType sharingType;

    @Column(name = "target_system", length = 100)
    private String targetSystem;

    @Column(name = "share_period", length = 50)
    private String sharePeriod;

    @Column(name = "data_payload", columnDefinition = "TEXT")
    private String dataPayload;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private SharingStatus status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "share_date", nullable = false)
    private LocalDateTime shareDate;

    @Column(name = "retry_count", nullable = false)
    private int retryCount;

    @Column(name = "created_by", length = 50)
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_by", length = 50)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Getters and setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public SharingType getSharingType() { return sharingType; }
    public void setSharingType(SharingType sharingType) { this.sharingType = sharingType; }
    public String getTargetSystem() { return targetSystem; }
    public void setTargetSystem(String targetSystem) { this.targetSystem = targetSystem; }
    public String getSharePeriod() { return sharePeriod; }
    public void setSharePeriod(String sharePeriod) { this.sharePeriod = sharePeriod; }
    public String getDataPayload() { return dataPayload; }
    public void setDataPayload(String dataPayload) { this.dataPayload = dataPayload; }
    public SharingStatus getStatus() { return status; }
    public void setStatus(SharingStatus status) { this.status = status; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public LocalDateTime getShareDate() { return shareDate; }
    public void setShareDate(LocalDateTime shareDate) { this.shareDate = shareDate; }
    public int getRetryCount() { return retryCount; }
    public void setRetryCount(int retryCount) { this.retryCount = retryCount; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public String getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
