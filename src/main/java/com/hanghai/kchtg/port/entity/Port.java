package com.hanghai.kchtg.port.entity;

import java.util.UUID;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.ApprovalStatusConverter;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatusConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entity representing a port (Cảng biển) — M-002 root entity.
 * Corresponds to table: ports (renamed from cang_bien).
 * <p>
 * Uses BaseEntity for UUID PK, soft-delete, and JPA auditing.
 * The code (portCode) is immutable after creation.
 * </p>
 */
@Entity
@Table(name = "ports",
        uniqueConstraints = @UniqueConstraint(columnNames = "port_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Port extends BaseEntity {

    @Column(name = "port_code", nullable = false, unique = true, length = 50)
    private String portCode;

    @Column(name = "port_name", nullable = false, length = 255)
    private String portName;

    @Column(name = "province", length = 100)
    private String province;

    @Column(name = "area", precision = 15, scale = 2)
    private BigDecimal area;

    @Column(name = "max_vessel_capacity", precision = 15, scale = 2)
    private BigDecimal maxVesselCapacity;

    // ── Legacy DB columns (exist in remote DB vmd_csdl_v2) ──────────

    @Column(name = "operational_status")
    @Convert(converter = OperationalStatusConverter.class)
    private OperationalStatus operationalStatus;

    @Column(name = "approval_status", nullable = false)
    @Convert(converter = ApprovalStatusConverter.class)
    private ApprovalStatus approvalStatus;

    // ── Unified status — DERIVED from legacy columns, NOT a DB column ──

    @Transient
    private PortStatus portStatus;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "port_group")
    private Integer portGroup;

    @Column(name = "map_symbol_id")
    private UUID mapSymbolId;

    @Column(name = "spatial_id")
    private UUID spatialId;

    // ── Managing unit (Đơn vị quản lý) ───────────────────────────

    @Column(name = "managing_unit_id")
    private UUID managingUnitId;

    @Column(name = "notes", length = 2000)
    private String notes;

    // ── Extended fields (V53 — from hh.csdl Qlkc037Dto) ──────────────

    @Column(name = "detailed_location", length = 500)
    private String detailedLocation;

    @Column(name = "port_class")
    private Integer portClass;

    @Column(name = "coordinate_system")
    private Integer coordinateSystem;

    @Column(name = "display_rule")
    private Integer displayRule;

    // ── zobjDataSub fields ───────────────────────────────────────────

    @Column(name = "water_area_scope", length = 2000)
    private String waterAreaScope;

    @Column(name = "total_berths")
    private Integer totalBerths;

    @Column(name = "total_anchorages_transshipment")
    private Integer totalAnchoragesTransshipment;

    @Column(name = "total_public_channels")
    private Integer totalPublicChannels;

    @Column(name = "total_dedicated_channels")
    private Integer totalDedicatedChannels;

    @Column(name = "total_public_channel_length", precision = 19, scale = 4)
    private BigDecimal totalPublicChannelLength;

    @Column(name = "total_dedicated_channel_length", precision = 19, scale = 4)
    private BigDecimal totalDedicatedChannelLength;

    @Column(name = "total_buoys_beacons")
    private Integer totalBuoysBeacons;

    @Column(name = "total_dikes")
    private Integer totalDikes;

    @Column(name = "total_dike_length", precision = 19, scale = 4)
    private BigDecimal totalDikeLength;

    @Column(name = "total_lighthouses")
    private Integer totalLighthouses;

    @Column(name = "buoy_berth_count")
    private Integer buoyBerthCount;

    @Column(name = "anchorage_count")
    private Integer anchorageCount;

    @Column(name = "transshipment_count")
    private Integer transshipmentCount;

    @Column(name = "other_water_areas", length = 2000)
    private String otherWaterAreas;

    @Column(name = "remarks", length = 2000)
    private String remarks;

    // ── Lifecycle: derive unified portStatus from legacy columns ──────

    @PostLoad
    private void derivePortStatus() {
        if (getDeletedAt() != null) {
            this.portStatus = PortStatus.DA_XOA;
        } else if (approvalStatus == ApprovalStatus.REJECTED) {
            this.portStatus = PortStatus.TU_CHOI;
        } else if (approvalStatus == ApprovalStatus.APPROVED) {
            this.portStatus = (operationalStatus == OperationalStatus.TAM_NGUNG)
                ? PortStatus.TAM_NGUNG : PortStatus.DA_PHE_DUYET;
        } else if (approvalStatus == ApprovalStatus.PENDING) {
            this.portStatus = (operationalStatus == OperationalStatus.HIEN_HANH)
                ? PortStatus.CHO_PHE_DUYET : PortStatus.NHAP;
        } else {
            this.portStatus = PortStatus.NHAP;
        }
    }

    /**
     * Sync the legacy DB columns (operationalStatus, approvalStatus) from the
     * unified portStatus. Call this in the service layer before save.
     */
    public void syncOldFieldsFromPortStatus() {
        if (this.portStatus == null) return;
        switch (this.portStatus) {
            case NHAP:
                this.approvalStatus = ApprovalStatus.PENDING;
                this.operationalStatus = null;
                break;
            case CHO_PHE_DUYET:
                this.approvalStatus = ApprovalStatus.PENDING;
                this.operationalStatus = OperationalStatus.HIEN_HANH;
                break;
            case DA_PHE_DUYET:
                this.approvalStatus = ApprovalStatus.APPROVED;
                this.operationalStatus = OperationalStatus.HIEN_HANH;
                break;
            case TU_CHOI:
                this.approvalStatus = ApprovalStatus.REJECTED;
                this.operationalStatus = OperationalStatus.HIEN_HANH;
                break;
            case TAM_NGUNG:
                this.approvalStatus = ApprovalStatus.APPROVED;
                this.operationalStatus = OperationalStatus.TAM_NGUNG;
                break;
            case DA_XOA:
                this.approvalStatus = ApprovalStatus.APPROVED;
                this.operationalStatus = OperationalStatus.TAM_NGUNG;
                break;
        }
    }
}
