package com.hanghai.kchtg.station.entity;

import com.hanghai.kchtg.common.entity.ApprovableEntity;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.SQLRestriction;

import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * LRIT (Long Range Identification and Tracking) coastal station entity.
 * Kế thừa BaseEntity và implements ApprovableEntity (Quy trình duyệt 2 cấp C1/C2).
 */
@Entity
@Table(name = "coastal_station_lrit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@FieldNameConstants
@SQLRestriction("deleted_at IS NULL")
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
public class CoastalStationLRIT extends BaseEntity implements ApprovableEntity {

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "operating_org_id")
    private UUID operatingOrgId;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "code", length = 50)
    protected String code;

    @Column(name = "name", length = 255)
    protected String name;

    @Column(name = "description", length = 1000)
    protected String description;

    @Column(name = "location_address", length = 1000)
    private String locationAddress;

    @Column(name = "spatial_id")
    protected UUID spatialId;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "condition_status", columnDefinition = "SMALLINT")
    private ConditionStatus conditionStatus = ConditionStatus.OPERATIONAL;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "status", columnDefinition = "smallint default 0")
    protected StationStatus status = StationStatus.DRAFT;

    // --- Thông số đặc thù LRIT ---
    @Column(name = "terminal_id")
    private String terminalId;

    @Column(name = "imo_number")
    private String imoNumber;

    @Column(name = "reporting_interval")
    private Integer reportingInterval;

    @Column(name = "antenna_height")
    private Double antennaHeight;

    @Column(name = "power_output")
    private Double powerOutput;

    @Column(name = "antenna_type")
    private String antennaType;

    @Column(name = "contact_person")
    private String contactPerson;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "data_format")
    private String dataFormat;

    @Column(name = "communication_channel")
    private String communicationChannel;

    @Column(name = "coverage_area")
    private String coverageArea;

    @Column(name = "services_provided", length = 1000)
    private String servicesProvided;

    // --- Thông tin GIS tập trung (liên kết qua spatial_id và symbol_id theo chuẩn VTS Operation Center / Inmarsat) ---
    @Column(name = "symbol_id")
    private UUID symbolId;

    @Transient
    private BigDecimal latitude;

    @Transient
    private BigDecimal longitude;

    @Transient
    private String geometryType;

    @Transient
    private String objectType;

    // --- Backward compatibility helpers ---
    public String getGeometryType() { return this.geometryType != null ? this.geometryType : "POINT"; }
    public void setGeometryType(String geometryType) { this.geometryType = geometryType; }
    public String getObjectType() { return this.objectType != null ? this.objectType : (this.geometryType != null ? this.geometryType : "POINT"); }
    public void setObjectType(String objectType) { this.objectType = objectType; }
    public String getCoordinateSystem() { return "WGS84"; }
    public void setCoordinateSystem(String coordinateSystem) { /* no-op backward compatibility */ }
    public String getDisplayRule() { return "Độ, phút, giây (DMS)"; }
    public void setDisplayRule(String displayRule) { /* no-op backward compatibility */ }
    public String getSymbol() { return this.symbolId != null ? this.symbolId.toString() : null; }
    public void setSymbol(String symbol) {
        if (symbol != null && !symbol.isBlank()) {
            try {
                this.symbolId = UUID.fromString(symbol.trim());
            } catch (IllegalArgumentException ignored) {
                // Not a pure UUID
            }
        } else {
            this.symbolId = null;
        }
    }

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

    @Column(name = "level1_approval_content", length = 2000)
    private String level1ApprovalContent;

    @Column(name = "level2_approval_content", length = 2000)
    private String level2ApprovalContent;

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
        return this.orgUnitId;
    }

    public UUID getUnitId() {
        return this.orgUnitId;
    }

    public void setUnitId(UUID unitId) {
        this.orgUnitId = unitId;
    }

    public String getStationCode() {
        return this.code;
    }

    public void setStationCode(String stationCode) {
        this.code = stationCode;
    }

    public String getStationName() {
        return this.name;
    }

    public void setStationName(String stationName) {
        this.name = stationName;
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
            this.conditionStatus = ConditionStatus.OPERATIONAL;
        }
    }
}
