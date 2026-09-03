package com.hanghai.kchtg.port.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatusConverter;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import lombok.experimental.FieldNameConstants;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;


/**
 * Entity representing a buoy berth (Bến phao) — child of Port.
 * Corresponds to table: buoy_berths.
 * FK: port_id → ports.id (NOT NULL)
 * <p>
 * The code (buoyBerthCode) is immutable after creation, auto-generated as
 * {portCode}-BP-{seq}.
 * </p>
 */
@Entity
@Table(name = "buoy_berths",
        uniqueConstraints = @UniqueConstraint(columnNames = "buoy_berth_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
// @org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
public class BuoyBerth extends BaseEntity {

    // @Enumerated(EnumType.ORDINAL)
    // @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    // @Builder.Default
    // private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

    @Column(name = "buoy_berth_code", nullable = false, unique = true, length = 50)
    private String buoyBerthCode;

    @Column(name = "buoy_berth_name", nullable = false, length = 255)
    private String buoyBerthName;

    @Column(name = "port_id", nullable = false)
    private UUID portId;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "waterway_id")
    private UUID waterwayId;

    @Column(name = "classification", length = 100)
    private String classification;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "detailed_location", length = 500)
    private String detailedLocation;

    @Column(name = "operational_status")
    @Convert(converter = OperationalStatusConverter.class)
    private OperationalStatus operationalStatus;

    @Column(name = "approval_status", nullable = false)
    @Enumerated(EnumType.ORDINAL)
    private ApprovalStatus approvalStatus;

    @Column(name = "operating_org_id")
    private UUID operatingOrgId;

    // ── Technical & survey (đăng kiểm) fields ─────────────────────────

    @Column(name = "current_water_depth", precision = 10, scale = 2)
    private BigDecimal currentWaterDepth;

    @Column(name = "bottom_elevation_design", precision = 10, scale = 2)
    private BigDecimal bottomElevationDesign;

    @Column(name = "max_vessel_dwt", precision = 15, scale = 2)
    private BigDecimal maxVesselDWT;

    @Column(name = "planned_vessel_dwt", precision = 15, scale = 2)
    private BigDecimal plannedVesselDWT;

    @Column(name = "last_inspection_date")
    private LocalDate lastInspectionDate;

    @Column(name = "next_inspection_date")
    private LocalDate nextInspectionDate;

    @Column(name = "operation_expiry_date")
    private LocalDate operationExpiryDate;

    @Column(name = "design_capacity", precision = 15, scale = 2)
    private BigDecimal designCapacity;

    @Column(name = "active_buoy_berth_count")
    private Integer activeBuoyBerthCount;

    @Column(name = "published_buoy_berth_count")
    private Integer publishedBuoyBerthCount;

    @Column(name = "under_investment_buoy_berth_count")
    private Integer underInvestmentBuoyBerthCount;

    @Column(name = "cargo_throughput", precision = 15, scale = 2)
    private BigDecimal cargoThroughput;

    // ── Publication fields ─────────────────────────────────────────────

    @Column(name = "opening_announcement_date")
    private LocalDateTime openingAnnouncementDate;

    @Column(name = "public_decision", length = 500)
    private String publicDecision;

    @Column(name = "investment_agreement", columnDefinition = "TEXT")
    private String investmentAgreement;

    @Column(name = "mooring_water_area_scope", length = 1000)
    private String mooringWaterAreaScope;

    // ── GIS fields ─────────────────────────────────────────────────────
    @Column(name = "map_symbol_id")
    private UUID mapSymbolId;

    @Column(name = "coordinate_system")
    private Integer coordinateSystem;

    @Column(name = "display_rule")
    private Integer displayRule;

    @Column(name = "spatial_id")
    private UUID spatialId;

    // ── Two-level approval tracking fields ─────────────────────────────

    @Column(name = "submitted_for_approval_at")
    private LocalDateTime submittedForApprovalAt;

    @Column(name = "submitted_for_approval_by", length = 100)
    private String submittedForApprovalBy;

    @Column(name = "port_authority_approved_at")
    private LocalDateTime portAuthorityApprovedAt;

    @Column(name = "port_authority_approved_by", length = 100)
    private String portAuthorityApprovedBy;

    @Size(max = 1000)
    @Column(name = "port_authority_approval_content")
    private String portAuthorityApprovalContent;

    @Column(name = "department_approved_at")
    private LocalDateTime departmentApprovedAt;

    @Column(name = "department_approved_by", length = 100)
    private String departmentApprovedBy;

    @Size(max = 1000)
    @Column(name = "department_approval_content")
    private String departmentApprovalContent;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;
}
