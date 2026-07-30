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
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing a berth (Bến cảng) — child of Port.
 * Corresponds to table: berths (renamed from ben_cang).
 * FK: port_id → ports.id (NOT NULL)
 */
@Entity
@Table(name = "berths",
        uniqueConstraints = @UniqueConstraint(columnNames = "berth_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Berth extends BaseEntity {

    @Column(name = "berth_code", nullable = false, unique = true, length = 50)
    private String berthCode;

    @Column(name = "berth_name", nullable = false, length = 255)
    private String berthName;

    @Column(name = "port_id", nullable = false)
    private UUID portId;

    @Column(name = "waterway", length = 255)
    private String waterway;

    @Column(name = "length", precision = 15, scale = 2)
    private BigDecimal length;

    @Column(name = "width", precision = 15, scale = 2)
    private BigDecimal width;

    @Column(name = "berth_type")
    @Convert(converter = BerthTypeConverter.class)
    private BerthType berthType;

    @Column(name = "channel_depth", precision = 10, scale = 2)
    private BigDecimal channelDepth;

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

    @Column(name = "operational_function", length = 255)
    private String operationalFunction;

    @Column(name = "map_symbol_id")
    private UUID mapSymbolId;

    @Column(name = "spatial_id")
    private UUID spatialId;

    // ── Extended fields from hh.csdl legacy Qlkc038Dto ────────────────

    @Column(name = "location_code", length = 100)
    private String locationCode;

    @Column(name = "detailed_location", length = 500)
    private String detailedLocation;

    @Column(name = "coordinate_system")
    private Integer coordinateSystem;

    @Column(name = "display_rule")
    private Integer displayRule;

    @Column(name = "operator", length = 255)
    private String operator;

    @Column(name = "total_area", precision = 19, scale = 4)
    private BigDecimal totalArea;

    @Column(name = "design_throughput", precision = 19, scale = 4)
    private BigDecimal designThroughput;

    @Column(name = "current_throughput", precision = 19, scale = 4)
    private BigDecimal currentThroughput;

    @Column(name = "max_vessel_size", precision = 19, scale = 4)
    private BigDecimal maxVesselSize;

    @Column(name = "planned_throughput", precision = 19, scale = 4)
    private BigDecimal plannedThroughput;

    @Column(name = "latest_cargo_volume", precision = 19, scale = 4)
    private BigDecimal latestCargoVolume;

    @Column(name = "opening_announcement_date")
    private LocalDateTime openingAnnouncementDate;

    @Column(name = "opening_decision", length = 500)
    private String openingDecision;

    @Column(name = "investment_agreement", length = 2000)
    private String investmentAgreement;

    @Column(name = "structure_type")
    private Integer structureType;

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
