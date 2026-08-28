package com.hanghai.kchtg.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lớp thực thể cơ sở chuẩn cho toàn bộ các công trình Kết cấu hạ tầng hàng hải (KCHT)
 * hỗ trợ phân quyền theo đơn vị (org_unit_id), không gian GIS (spatial_id), tỉnh thành (province_id),
 * và quy trình phê duyệt 2 cấp theo M-1006.
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@MappedSuperclass
@FieldNameConstants
@EqualsAndHashCode(callSuper = false)
public abstract class BaseApprovableEntity extends BaseEntity implements ApprovableEntity {

    public static final class Fields {
        public static final String provinceId = "provinceId";
        public static final String orgUnitId = "orgUnitId";
        public static final String spatialId = "spatialId";
        public static final String approvalStatus = "approvalStatus";
        public static final String approverLevel1 = "approverLevel1";
        public static final String approvedDateLevel1 = "approvedDateLevel1";
        public static final String approverLevel2 = "approverLevel2";
        public static final String approvedDateLevel2 = "approvedDateLevel2";
        public static final String rejectionReason = "rejectionReason";
        public static final String submittedAt = "submittedAt";
        public static final String submittedBy = "submittedBy";
        public static final String level1ApprovalContent = "level1ApprovalContent";
        public static final String level2ApprovalContent = "level2ApprovalContent";
    }

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "spatial_id")
    private UUID spatialId;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "approval_status", nullable = false, columnDefinition = "SMALLINT")
    private ApprovalStatus approvalStatus;

    @Column(name = "approver_level1")
    private UUID approverLevel1;

    @Column(name = "approved_date_level1")
    private LocalDateTime approvedDateLevel1;

    @Column(name = "approver_level2")
    private UUID approverLevel2;

    @Column(name = "approved_date_level2")
    private LocalDateTime approvedDateLevel2;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "submitted_by")
    private UUID submittedBy;

    @Column(name = "level1_approval_content", length = 2000)
    private String level1ApprovalContent;

    @Column(name = "level2_approval_content", length = 2000)
    private String level2ApprovalContent;

    public Integer getProvinceId() { return provinceId; }
    public void setProvinceId(Integer provinceId) { this.provinceId = provinceId; }

    public UUID getOrgUnitId() { return orgUnitId; }
    public void setOrgUnitId(UUID orgUnitId) { this.orgUnitId = orgUnitId; }

    public UUID getSpatialId() { return spatialId; }
    public void setSpatialId(UUID spatialId) { this.spatialId = spatialId; }

    public ApprovalStatus getApprovalStatus() { return approvalStatus; }
    public void setApprovalStatus(ApprovalStatus approvalStatus) { this.approvalStatus = approvalStatus; }

    public UUID getApproverLevel1() { return approverLevel1; }
    public void setApproverLevel1(UUID approverLevel1) { this.approverLevel1 = approverLevel1; }

    public LocalDateTime getApprovedDateLevel1() { return approvedDateLevel1; }
    public void setApprovedDateLevel1(LocalDateTime approvedDateLevel1) { this.approvedDateLevel1 = approvedDateLevel1; }

    public UUID getApproverLevel2() { return approverLevel2; }
    public void setApproverLevel2(UUID approverLevel2) { this.approverLevel2 = approverLevel2; }

    public LocalDateTime getApprovedDateLevel2() { return approvedDateLevel2; }
    public void setApprovedDateLevel2(LocalDateTime approvedDateLevel2) { this.approvedDateLevel2 = approvedDateLevel2; }

    public String getRejectionReason() { return rejectionReason; }
    public void setRejectionReason(String rejectionReason) { this.rejectionReason = rejectionReason; }

    public LocalDateTime getSubmittedAt() { return submittedAt; }
    public void setSubmittedAt(LocalDateTime submittedAt) { this.submittedAt = submittedAt; }

    public UUID getSubmittedBy() { return submittedBy; }
    public void setSubmittedBy(UUID submittedBy) { this.submittedBy = submittedBy; }

    public String getLevel1ApprovalContent() { return level1ApprovalContent; }
    public void setLevel1ApprovalContent(String level1ApprovalContent) { this.level1ApprovalContent = level1ApprovalContent; }

    public String getLevel2ApprovalContent() { return level2ApprovalContent; }
    public void setLevel2ApprovalContent(String level2ApprovalContent) { this.level2ApprovalContent = level2ApprovalContent; }

    @PrePersist
    protected void onBaseApprovablePrePersist() {
        if (this.approvalStatus == null) {
            this.approvalStatus = ApprovalStatus.DRAFT;
        }
    }
}
