package com.hanghai.kchtg.station.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.Accessors;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.SQLRestriction;

import java.util.UUID;

@Entity
@Table(name = "coastal_station_vts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Accessors(chain = true)
@FieldNameConstants
@SQLRestriction("deleted_at IS NULL")
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "unit_id IN (:orgUnitIds)")
@org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
public class CoastalStationVTS extends BaseEntity {

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(length = 50)
    protected String code;

    @Column(length = 255)
    protected String name;

    @Column(length = 1000)
    protected String description;

    @Column(name = "unit_id")
    protected UUID unitId;

    @Column(name = "spatial_id")
    protected UUID spatialId;

    @Column(name = "is_active")
    protected Boolean isActive;

    @Enumerated(jakarta.persistence.EnumType.ORDINAL)
    @Column(name = "status", columnDefinition = "smallint default 0")
    protected StationStatus status;

    @Enumerated(jakarta.persistence.EnumType.ORDINAL)
    @Column(name = "approval_status", columnDefinition = "smallint default 0")
    protected ApprovalStatus approvalStatus;

    @Enumerated(jakarta.persistence.EnumType.ORDINAL)
    protected ApprovalLevel approvalLevel;

    // --- Phê duyệt 2 cấp (docs/conventions/approval-2-level-spec.md mục 3) ---
    @Column(name = "submitted_at")
    protected java.time.LocalDateTime submittedAt;

    @Column(name = "submitted_by")
    protected UUID submittedBy;

    @Column(name = "approver_level1")
    protected UUID approverLevel1;

    @Column(name = "approved_date_level1")
    protected java.time.LocalDateTime approvedDateLevel1;

    @Column(name = "approver_level2")
    protected UUID approverLevel2;

    @Column(name = "approved_date_level2")
    protected java.time.LocalDateTime approvedDateLevel2;

    @Column(name = "approved_by")
    protected UUID approvedBy;

    @Column(name = "approved_date")
    protected java.time.LocalDateTime approvedDate;

    @Column(length = 1000)
    protected String rejectionReason;

    private String frequencyBand;
    private Double transmitPower;
    private String equipmentType;

    @Column(length = 1000)
    private String locationAddress;

    private String contactPerson;
    private String contactPhone;

    @PrePersist
    protected void onCreate() {
        setDefaultStatus();
    }

    @PreUpdate
    protected void onUpdate() {
    }

    private void setDefaultStatus() {
        // Tạo mới luôn ở "Lưu tạm" — chỉ chuyển sang chờ duyệt khi người dùng gửi phê duyệt
        if (this.status == null) {
            this.status = StationStatus.DRAFT;
        }
        if (this.approvalStatus == null) {
            this.approvalStatus = ApprovalStatus.DRAFT;
        }
    }
}
