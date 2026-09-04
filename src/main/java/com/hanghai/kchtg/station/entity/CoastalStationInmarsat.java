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
public class CoastalStationInmarsat extends BaseEntity implements ApprovableEntity {

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "operating_org_id")
    private UUID operatingOrgId;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "code", length = 50)
    private String code;

    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "location_address", length = 1000)
    private String locationAddress;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "condition_status", columnDefinition = "SMALLINT")
    private ConditionStatus conditionStatus = ConditionStatus.OPERATIONAL;

    // --- Thông tin đặc thù Inmarsat ---
    @Column(name = "coverage_area", length = 1000)
    private String coverageArea;

    @Column(name = "services", length = 1000)
    private String services;

    @Column(name = "frequency", length = 500)
    private String frequency;

    @Column(name = "notes", length = 2000)
    private String notes;

    // --- Thông tin GIS tập trung (liên kết qua spatial_id và symbol_id) ---
    @Column(name = "spatial_id")
    private UUID spatialId;

    @Column(name = "symbol_id")
    private UUID symbolId;

    @Transient
    private BigDecimal latitude;

    @Transient
    private BigDecimal longitude;

    @Transient
    private String objectType;

    // Alias tương thích chuẩn note
    public String getNote() { return this.notes; }
    public void setNote(String note) { this.notes = note; }

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

    @Column(name = "level1_approval_content", length = 2000)
    private String level1ApprovalContent;

    @Column(name = "level2_approval_content", length = 2000)
    private String level2ApprovalContent;

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

    // --- Backward compatibility aliases ---
    public String getDeviceCode() { return this.code; }
    public void setDeviceCode(String code) { this.code = code; }
    public String getStationName() { return this.name; }
    public void setStationName(String name) { this.name = name; }
    public String getDescription() { return this.notes; }
    public void setDescription(String description) { this.notes = description; }
    public String getCoverageZone() { return this.coverageArea; }
    public void setCoverageZone(String zone) { this.coverageArea = zone; }
    public UUID getUnitId() { return this.orgUnitId; }
    public void setUnitId(UUID unitId) { this.orgUnitId = unitId; }
    public Boolean getIsActive() { return Boolean.TRUE; }
    public void setIsActive(Boolean isActive) { /* no-op backward compatibility */ }
    public String getLocationDetail() { return this.locationAddress; }
    public void setLocationDetail(String detail) { this.locationAddress = detail; }
    public String getObjectType() { return this.objectType != null ? this.objectType : "POINT"; }
    public void setObjectType(String objectType) { this.objectType = objectType; }
    public String getCoordinateSystem() { return "WGS84"; }
    public void setCoordinateSystem(String coordinateSystem) { /* no-op */ }
    public String getDisplayRule() { return "Độ, phút, giây (DMS)"; }
    public void setDisplayRule(String displayRule) { /* no-op */ }
    public String getSymbol() { return this.symbolId != null ? this.symbolId.toString() : null; }
    public void setSymbol(String symbol) {
        if (symbol != null && !symbol.isBlank()) {
            try {
                this.symbolId = UUID.fromString(symbol.trim());
            } catch (IllegalArgumentException ignored) {
                // Not a pure UUID; service will resolve code to UUID
            }
        } else {
            this.symbolId = null;
        }
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
}
