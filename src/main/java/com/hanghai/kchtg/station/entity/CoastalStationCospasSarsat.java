package com.hanghai.kchtg.station.entity;

import com.hanghai.kchtg.common.entity.BaseApprovableEntity;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.experimental.FieldNameConstants;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity for Coastal Station Cospas-Sarsat equipment and operational data.
 * Chuẩn hóa kế thừa BaseApprovableEntity theo mẫu VTS và quy trình duyệt 2 cấp M-1006.
 */
@Entity
@Table(name = "coastal_station_cospas_sarsat")
@Data
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@EqualsAndHashCode(callSuper = true)
@SQLRestriction("1=1")
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
public class CoastalStationCospasSarsat extends BaseApprovableEntity {

    @Column(name = "code", length = 50, unique = true)
    private String code;

    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "note", length = 2000)
    private String note;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "condition_status", columnDefinition = "SMALLINT")
    @Builder.Default
    private ConditionStatus conditionStatus = ConditionStatus.OPERATIONAL;

    @Column(name = "operating_org_id")
    private UUID operatingOrgId;

    @Column(name = "owning_org_id")
    private UUID owningOrgId;

    @Column(name = "symbol_id")
    private UUID symbolId;

    @Column(name = "coordinate_reference_system", length = 50)
    private String coordinateReferenceSystem;

    // --- Thuộc tính kỹ thuật & vận hành đặc thù Đài Cospas-Sarsat ---
    @Column(name = "frequency", length = 255)
    private String frequency;

    @Column(name = "coverage_area", length = 1000)
    private String coverageArea;

    @Column(name = "beacon_protocol", length = 255)
    private String beaconProtocol;

    @Column(name = "emergency_channel", length = 255)
    private String emergencyChannel;

    @Column(name = "antenna_type", length = 255)
    private String antennaType;

    @Column(name = "location_address", length = 1000)
    private String locationAddress;

    @Column(name = "contact_person", length = 255)
    private String contactPerson;

    @Column(name = "contact_phone", length = 255)
    private String contactPhone;

    @Column(name = "signal_range")
    private Double signalRange;

    @Column(name = "operating_mode", length = 255)
    private String operatingMode;

    @Column(name = "services_provided", length = 1000)
    private String servicesProvided;

    // --- ALIASES & TƯƠNG THÍCH NGƯỢC ---

    /** Tương thích ngược: services ánh xạ với servicesProvided. */
    public String getServices() {
        return this.servicesProvided;
    }

    public void setServices(String services) {
        this.servicesProvided = services;
    }

    /** Tương thích ngược: unitId ánh xạ trực tiếp vào orgUnitId của BaseApprovableEntity. */
    public UUID getUnitId() {
        return getOrgUnitId();
    }

    public void setUnitId(UUID unitId) {
        setOrgUnitId(unitId);
    }

    /** Tương thích ngược: description ánh xạ với note. */
    public String getDescription() {
        return this.note != null ? this.note : this.description;
    }

    public void setDescription(String description) {
        this.description = description;
        if (this.note == null) {
            this.note = description;
        }
    }

    /** Tương thích ngược: status enum cũ chuyển đổi từ conditionStatus / approvalStatus. */
    public StationStatus getStatus() {
        if (getApprovalStatus() == null) return StationStatus.DRAFT;
        return switch (getApprovalStatus()) {
            case DRAFT, PROPOSED -> StationStatus.DRAFT;
            case PENDING_APPROVAL -> StationStatus.PENDING_APPROVAL;
            case APPROVED_LEVEL1 -> StationStatus.APPROVED_L1;
            case APPROVED, APPROVED_LEVEL2 -> StationStatus.APPROVED_L2;
            case REJECTED, REJECTED_LEVEL1, REJECTED_LEVEL2 -> StationStatus.REJECTED;
            case ARCHIVED -> StationStatus.DELETED;
        };
    }

    public void setStatus(StationStatus status) {
        // Giữ method setter cho tương thích ngược
    }

    /** Tương thích ngược: approvalLevel. */
    public ApprovalLevel getApprovalLevel() {
        if (getApprovalStatus() == null) return ApprovalLevel.LEVEL_0;
        return switch (getApprovalStatus()) {
            case APPROVED_LEVEL1 -> ApprovalLevel.LEVEL_1;
            case APPROVED, APPROVED_LEVEL2 -> ApprovalLevel.LEVEL_2;
            default -> ApprovalLevel.LEVEL_0;
        };
    }

    public void setApprovalLevel(ApprovalLevel level) {
        // Giữ method setter cho tương thích ngược
    }

    public UUID getApprovedBy() {
        return getApproverLevel2() != null ? getApproverLevel2() : getApproverLevel1();
    }

    public void setApprovedBy(UUID approvedBy) {
        setApproverLevel2(approvedBy);
    }

    public LocalDateTime getApprovedDate() {
        return getApprovedDateLevel2() != null ? getApprovedDateLevel2() : getApprovedDateLevel1();
    }

    public void setApprovedDate(LocalDateTime approvedDate) {
        setApprovedDateLevel2(approvedDate);
    }
}
