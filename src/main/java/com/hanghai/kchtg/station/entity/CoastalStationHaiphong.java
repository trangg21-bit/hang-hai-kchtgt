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
 * CoastalStationHaiphong / TTXLTT Hà Nội coastal station entity.
 * Kế thừa BaseEntity và implements ApprovableEntity (Quy trình duyệt 2 cấp C1/C2).
 */
@Entity
@Table(name = "coastal_station_haiphong")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
@SQLRestriction("deleted_at IS NULL")
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
public class CoastalStationHaiphong extends BaseEntity implements ApprovableEntity {

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "unit_id")
    private UUID unitId;

    @Column(name = "operating_org_id")
    private UUID operatingOrgId;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "code", length = 50)
    protected String code;

    @Column(name = "station_code", length = 50)
    private String stationCode;

    @Column(name = "name", length = 255)
    protected String name;

    @Column(name = "station_name", length = 255)
    private String stationName;

    @Column(name = "description", length = 1000)
    protected String description;

    @Column(name = "location_address", length = 1000)
    private String locationAddress;

    @Column(name = "spatial_id")
    protected UUID spatialId;

    @Column(name = "is_active")
    protected Boolean isActive = true;

    @Column(name = "condition_status", length = 50)
    private String conditionStatus = "OPERATIONAL";

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "status", columnDefinition = "smallint default 0")
    protected StationStatus status = StationStatus.DRAFT;

    // --- Thông số đặc thù TTXLTT Hà Nội / Hải Phòng ---
    @Column(name = "port_name")
    private String portName;

    @Column(name = "district")
    private String district;

    @Column(name = "ward")
    private String ward;

    @Column(name = "operational_license")
    private String operationalLicense;

    @Column(name = "license_expiry")
    private String licenseExpiry;

    @Column(name = "inspector_name")
    private String inspectorName;

    @Column(name = "inspector_phone")
    private String inspectorPhone;

    @Column(name = "last_inspection_date")
    private String lastInspectionDate;

    @Column(name = "next_inspection_date")
    private String nextInspectionDate;

    @Column(name = "coverage_area")
    private String coverageArea;

    @Column(name = "equipment_type")
    private String equipmentType;

    @Column(name = "communication_frequency")
    private String communicationFrequency;

    @Column(name = "contact_person")
    private String contactPerson;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "services_provided", length = 1000)
    private String servicesProvided;

    // --- GIS Coordinates ---
    @Column(name = "geometry_type", length = 50)
    private String geometryType = "POINT";

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

    // --- Quy trình phê duyệt 2 cấp chuẩn (C1/C2) ---
    @Enumerated(EnumType.ORDINAL)
    @Column(name = "approval_status", nullable = false, columnDefinition = "SMALLINT DEFAULT 0")
    protected ApprovalStatus approvalStatus = ApprovalStatus.DRAFT;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "approval_level")
    protected ApprovalLevel approvalLevel;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "submitted_by")
    private UUID submittedBy;

    @Column(name = "approver_level1")
    protected UUID approverLevel1;

    @Column(name = "approved_date_level1")
    protected LocalDateTime approvedDateLevel1;

    @Column(name = "approver_level2")
    protected UUID approverLevel2;

    @Column(name = "approved_date_level2")
    protected LocalDateTime approvedDateLevel2;

    @Column(name = "approved_by")
    protected UUID approvedBy;

    @Column(name = "approved_date")
    protected LocalDateTime approvedDate;

    @Column(name = "rejection_reason", length = 1000)
    protected String rejectionReason;

    @Override
    public void setSubmittedBy(UUID submittedBy) {
        this.submittedBy = submittedBy;
    }

    @Override
    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    @Override
    public void setRejectionReason(String rejectionReason) {
        this.rejectionReason = rejectionReason;
    }

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
        if (this.conditionStatus == null) {
            this.conditionStatus = "OPERATIONAL";
        }
        if (this.code != null && this.stationCode == null) {
            this.stationCode = this.code;
        } else if (this.stationCode != null && this.code == null) {
            this.code = this.stationCode;
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
        if (this.code != null) this.stationCode = this.code;
        if (this.name != null) this.stationName = this.name;
        if (this.orgUnitId != null) this.unitId = this.orgUnitId;
    }
}
