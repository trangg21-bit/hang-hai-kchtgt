package com.hanghai.kchtg.common.entity;

import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import jakarta.persistence.*;
import lombok.experimental.FieldNameConstants;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "infrastructure_history", indexes = {
        @Index(name = "idx_infra_history_ref", columnList = "ref_type, ref_id, approved_date DESC"),
        @Index(name = "idx_infra_history_ref_id_date", columnList = "ref_id, approved_date DESC")
})
@EntityListeners(AuditingEntityListener.class)
@FieldNameConstants
public class InfrastructureHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "ref_id", nullable = false)
    private UUID refId;

    @Enumerated(EnumType.STRING)
    @Column(name = "ref_type", nullable = false, length = 64)
    private InfrastructureType refType;

    @Enumerated(EnumType.STRING)
    @Column(name = "approval_level", length = 32)
    private ApprovalLevel approvalLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private InfrastructureHistoryStatus status;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @CreatedDate
    @Column(name = "approved_date", nullable = false, updatable = false,
            columnDefinition = "TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime approvedDate;

    @Column(name = "reason", length = 500)
    private String reason;

    @Column(name = "changed_field", length = 1000)
    private String changedField;

    @Column(name = "previous_value", columnDefinition = "TEXT")
    private String previousValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    public InfrastructureHistory() {}

    public InfrastructureHistory(UUID id, UUID refId, InfrastructureType refType, ApprovalLevel approvalLevel,
                                 InfrastructureHistoryStatus status, UUID approvedBy, LocalDateTime approvedDate,
                                 String reason, String changedField, String previousValue, String newValue) {
        this.id = id;
        this.refId = refId;
        this.refType = refType;
        this.approvalLevel = approvalLevel;
        this.status = status;
        this.approvedBy = approvedBy;
        this.approvedDate = approvedDate;
        this.reason = reason;
        this.changedField = changedField;
        this.previousValue = previousValue;
        this.newValue = newValue;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private UUID id;
        private UUID refId;
        private InfrastructureType refType;
        private ApprovalLevel approvalLevel;
        private InfrastructureHistoryStatus status;
        private UUID approvedBy;
        private LocalDateTime approvedDate;
        private String reason;
        private String changedField;
        private String previousValue;
        private String newValue;

        public Builder id(UUID id) { this.id = id; return this; }
        public Builder refId(UUID refId) { this.refId = refId; return this; }
        public Builder refType(InfrastructureType refType) { this.refType = refType; return this; }
        public Builder approvalLevel(ApprovalLevel approvalLevel) { this.approvalLevel = approvalLevel; return this; }
        public Builder status(InfrastructureHistoryStatus status) { this.status = status; return this; }
        public Builder approvedBy(UUID approvedBy) { this.approvedBy = approvedBy; return this; }
        public Builder approvedDate(LocalDateTime approvedDate) { this.approvedDate = approvedDate; return this; }
        public Builder reason(String reason) { this.reason = reason; return this; }
        public Builder changedField(String changedField) { this.changedField = changedField; return this; }
        public Builder previousValue(String previousValue) { this.previousValue = previousValue; return this; }
        public Builder newValue(String newValue) { this.newValue = newValue; return this; }

        public InfrastructureHistory build() {
            return new InfrastructureHistory(id, refId, refType, approvalLevel, status, approvedBy, approvedDate, reason, changedField, previousValue, newValue);
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public UUID getRefId() { return refId; }
    public void setRefId(UUID refId) { this.refId = refId; }

    public InfrastructureType getRefType() { return refType; }
    public void setRefType(InfrastructureType refType) { this.refType = refType; }

    public ApprovalLevel getApprovalLevel() { return approvalLevel; }
    public void setApprovalLevel(ApprovalLevel approvalLevel) { this.approvalLevel = approvalLevel; }

    public InfrastructureHistoryStatus getStatus() { return status; }
    public void setStatus(InfrastructureHistoryStatus status) { this.status = status; }

    public UUID getApprovedBy() { return approvedBy; }
    public void setApprovedBy(UUID approvedBy) { this.approvedBy = approvedBy; }

    public LocalDateTime getApprovedDate() { return approvedDate; }
    public void setApprovedDate(LocalDateTime approvedDate) { this.approvedDate = approvedDate; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getChangedField() { return changedField; }
    public void setChangedField(String changedField) { this.changedField = changedField; }

    public String getPreviousValue() { return previousValue; }
    public void setPreviousValue(String previousValue) { this.previousValue = previousValue; }

    public String getNewValue() { return newValue; }
    public void setNewValue(String newValue) { this.newValue = newValue; }
}
