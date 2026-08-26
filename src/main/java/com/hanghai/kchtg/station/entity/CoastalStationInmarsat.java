package com.hanghai.kchtg.station.entity;

import com.hanghai.kchtg.common.entity.ApprovableEntity;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.SQLRestriction;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity cho Đài thông tin vệ tinh mặt đất Inmarsat (Coastal Station Inmarsat).
 * Kế thừa BaseEntity và implements ApprovableEntity (Quy trình duyệt 2 cấp M-1006).
 */
@Entity
@Table(name = "coastal_station_inmarsat")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
@SQLRestriction("deleted_at IS NULL")
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
@org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
public class CoastalStationInmarsat extends BaseEntity implements ApprovableEntity {

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "unit_id")
    private UUID unitId;

    @Column(name = "operating_org_id")
    private UUID operatingOrgId;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "code", length = 50)
    private String code;

    @Column(name = "device_code", length = 50)
    private String deviceCode;

    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "station_name", length = 255)
    private String stationName;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "location_address", length = 1000)
    private String locationAddress;

    @Column(name = "location_detail", columnDefinition = "TEXT")
    private String locationDetail;

    @Column(name = "condition_status", length = 50)
    private String conditionStatus = "OPERATIONAL";

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "status", columnDefinition = "smallint default 0")
    private StationStatus status = StationStatus.DRAFT;

    @Column(name = "is_active")
    private Boolean isActive = true;

    // --- Thông tin đặc thù Inmarsat ---
    @Column(name = "coverage_zone", length = 1000)
    private String coverageZone;

    @Column(name = "coverage_area", length = 1000)
    private String coverageArea;

    @Column(name = "services", length = 1000)
    private String services;

    @Column(name = "frequency", length = 500)
    private String frequency;

    @Column(name = "modem_type", length = 500)
    private String modemType;

    @Column(name = "sar_code", length = 500)
    private String sarCode;

    @Column(name = "satellite_system", length = 500)
    private String satelliteSystem;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "contact_person", length = 500)
    private String contactPerson;

    @Column(name = "contact_phone", length = 500)
    private String contactPhone;

    // --- Thông tin GIS ---
    @Column(name = "spatial_id")
    private UUID spatialId;

    @Column(name = "object_type", length = 50)
    private String objectType;

    @Column(name = "symbol", length = 100)
    private String symbol;

    @Column(name = "coordinate_system", length = 50)
    private String coordinateSystem = "WGS84";

    @Column(name = "display_rule", length = 500)
    private String displayRule;

    @Column(name = "latitude", precision = 10, scale = 6)
    private BigDecimal latitude;

    @Column(name = "longitude", precision = 10, scale = 6)
    private BigDecimal longitude;

    // --- Quy trình phê duyệt 2 cấp chuẩn (M-1006) ---
    @Enumerated(EnumType.ORDINAL)
    @Column(name = "approval_status", nullable = false, columnDefinition = "SMALLINT DEFAULT 0")
    private ApprovalStatus approvalStatus = ApprovalStatus.DRAFT;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "approval_level")
    private ApprovalLevel approvalLevel;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "submitted_by")
    private UUID submittedBy;

    @Column(name = "approver_level1")
    private UUID approverLevel1;

    @Column(name = "approved_date_level1")
    private LocalDateTime approvedDateLevel1;

    @Column(name = "approver_level2")
    private UUID approverLevel2;

    @Column(name = "approved_date_level2")
    private LocalDateTime approvedDateLevel2;

    @Column(name = "approved_by")
    private UUID approvedBy;

    @Column(name = "approved_date")
    private LocalDateTime approvedDate;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Override
    public void setApproverLevel1(UUID userId) {
        this.approverLevel1 = userId;
    }

    @Override
    public void setApproverLevel2(UUID userId) {
        this.approverLevel2 = userId;
    }

    @Override
    public void setApprovedDateLevel1(LocalDateTime date) {
        this.approvedDateLevel1 = date;
    }

    @Override
    public void setApprovedDateLevel2(LocalDateTime date) {
        this.approvedDateLevel2 = date;
    }

    @Override
    public UUID getOrgUnitId() {
        return this.orgUnitId != null ? this.orgUnitId : this.unitId;
    }

    @PrePersist
    protected void onCreate() {
        if (this.approvalStatus == null) {
            this.approvalStatus = ApprovalStatus.DRAFT;
        }
        if (this.status == null) {
            this.status = StationStatus.DRAFT;
        }
        if (this.securityLevel == null) {
            this.securityLevel = RecordSecurityLevel.NORMAL;
        }
        if (this.conditionStatus == null) {
            this.conditionStatus = "OPERATIONAL";
        }
        if (this.code != null && this.deviceCode == null) {
            this.deviceCode = this.code;
        } else if (this.deviceCode != null && this.code == null) {
            this.code = this.deviceCode;
        }
        if (this.name != null && this.stationName == null) {
            this.stationName = this.name;
        } else if (this.stationName != null && this.name == null) {
            this.name = this.stationName;
        }
        if (this.orgUnitId != null && this.unitId == null) {
            this.unitId = this.orgUnitId;
        } else if (this.unitId != null && this.orgUnitId == null) {
            this.orgUnitId = this.unitId;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        if (this.code != null) this.deviceCode = this.code;
        if (this.name != null) this.stationName = this.name;
        if (this.orgUnitId != null) this.unitId = this.orgUnitId;
    }
}
