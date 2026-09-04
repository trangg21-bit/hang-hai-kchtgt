package com.hanghai.kchtg.station.entity;

import com.hanghai.kchtg.common.entity.ApprovableEntity;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;
import org.hibernate.annotations.Filter;
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
@Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
public class CoastalStationHaiphong extends BaseEntity implements ApprovableEntity {

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

    @Column(name = "symbol_id")
    private UUID symbolId;

    @Transient
    private BigDecimal latitude;

    @Transient
    private BigDecimal longitude;

    @Transient
    private String objectType;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "condition_status", nullable = false, columnDefinition = "SMALLINT")
    private ConditionStatus conditionStatus = ConditionStatus.OPERATIONAL;

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

    @Column(name = "level1_approval_content", length = 2000)
    private String level1ApprovalContent;

    @Column(name = "level2_approval_content", length = 2000)
    private String level2ApprovalContent;

    // Alias tương thích ngược
    public String getStationCode() { return this.code; }
    public void setStationCode(String stationCode) { this.code = stationCode; }
    public String getStationName() { return this.name; }
    public void setStationName(String stationName) { this.name = stationName; }

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

    @PrePersist
    protected void onCreate() {
        if (this.approvalStatus == null) {
            this.approvalStatus = ApprovalStatus.DRAFT;
        }
        if (this.conditionStatus == null) {
            this.conditionStatus = ConditionStatus.OPERATIONAL;
        }
    }

    public String getSymbol() {
        return this.symbolId != null ? this.symbolId.toString() : null;
    }

    public void setSymbol(String symbol) {
        if (symbol != null && !symbol.isBlank()) {
            try {
                this.symbolId = UUID.fromString(symbol.trim());
            } catch (IllegalArgumentException ignored) {
            }
        } else {
            this.symbolId = null;
        }
    }
}
