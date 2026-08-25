package com.hanghai.kchtg.common.entity;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import jakarta.persistence.Column;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import lombok.AllArgsConstructor;
import lombok.Builder;
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
 * hỗ trợ phân quyền theo đơn vị (org_unit_id), cấp độ bảo mật (security_level),
 * không gian GIS (spatial_id), tỉnh thành (province_id),
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

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

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

    @PrePersist
    protected void onBaseApprovablePrePersist() {
        if (this.securityLevel == null) {
            this.securityLevel = RecordSecurityLevel.NORMAL;
        }
        if (this.approvalStatus == null) {
            this.approvalStatus = ApprovalStatus.PROPOSED;
        }
    }
}
