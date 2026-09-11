package com.hanghai.kchtg.radarstation.entity;

import com.hanghai.kchtg.common.entity.ApprovableEntity;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Lớp thực thể cơ sở cho RadarStation, hỗ trợ đầy đủ kiểm toán (auditing)
 * và quy trình phê duyệt 2 cấp theo M-1006.
 * Không sử dụng @SQLRestriction("deleted_at IS NULL") để cho phép truy vấn và hiển thị
 * các bản ghi trạm radar đã bị xóa theo trạng thái "Đã xóa".
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@MappedSuperclass
@FieldNameConstants
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseRadarStationEntity implements ApprovableEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "deleted_by")
    private UUID deletedBy;

    @CreatedBy
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "created_by")
    private UUID createdBy;

    @LastModifiedBy
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "updated_by")
    private UUID updatedBy;

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

    public void softDelete(UUID deletedBy) {
        this.deletedAt = LocalDateTime.now();
        this.deletedBy = deletedBy;
    }

    @PrePersist
    protected void onBasePrePersist() {
        if (this.approvalStatus == null) {
            this.approvalStatus = ApprovalStatus.DRAFT;
        }
    }
}
