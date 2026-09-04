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
import java.time.LocalDateTime;
import java.util.UUID;


/**
 * Entity representing a storm shelter area (Khu tránh, trú bão) — child of Port.
 * Corresponds to table: storm_shelter_areas.
 * FK: port_id → ports.id (NOT NULL)
 * <p>
 * Uses BaseEntity for UUID PK, soft-delete, and JPA auditing.
 * The code (stormShelterCode) is immutable after creation, auto-generated as
 * {portCode}-TTB-{seq}.
 * </p>
 */
@Entity
@Table(name = "storm_shelter_areas",
        uniqueConstraints = @UniqueConstraint(columnNames = "storm_shelter_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
// @org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
public class StormShelterArea extends BaseEntity {

    // @Enumerated(EnumType.ORDINAL)
    // @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    // @Builder.Default
    // private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

    @Column(name = "storm_shelter_code", nullable = false, unique = true, length = 50)
    private String stormShelterCode;

    @Column(name = "storm_shelter_name", nullable = false, length = 255)
    private String stormShelterName;

    @Column(name = "port_id", nullable = false)
    private UUID portId;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "navigation_channel_id")
    private UUID navigationChannelId;

    @Column(name = "buoy_station_id")
    private UUID buoyStationId;

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

    // ── Technical fields ───────────────────────────────────────────────

    @Column(name = "shape_description", columnDefinition = "TEXT")
    private String shapeDescription;

    @Column(name = "area", precision = 15, scale = 2)
    private BigDecimal area;

    @Column(name = "design_water_depth", precision = 10, scale = 2)
    private BigDecimal designWaterDepth;

    @Column(name = "current_water_depth", precision = 10, scale = 2)
    private BigDecimal currentWaterDepth;

    @Column(name = "bottom_elevation_design", precision = 10, scale = 2)
    private BigDecimal bottomElevationDesign;

    @Column(name = "max_vessel_dwt", precision = 15, scale = 2)
    private BigDecimal maxVesselDWT;

    @Column(name = "active_storm_shelter_count")
    private Integer activeStormShelterCount;

    @Column(name = "published_storm_shelter_count")
    private Integer publishedStormShelterCount;

    @Column(name = "under_investment_storm_shelter_count")
    private Integer underInvestmentStormShelterCount;

    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;

    // ── GIS fields (parity với Anchorage) ──────────────────────────────
    @Column(name = "map_symbol_id")
    private UUID mapSymbolId;

    @Column(name = "coordinate_system")
    private Integer coordinateSystem;

    @Column(name = "display_rule")
    private Integer displayRule;

    @Column(name = "spatial_id")
    private UUID spatialId;

    // ── Publication fields ─────────────────────────────────────────────

    @Column(name = "opening_announcement_date")
    private LocalDateTime openingAnnouncementDate;

    @Column(name = "public_decision", length = 500)
    private String publicDecision;

    @Column(name = "investment_agreement", columnDefinition = "TEXT")
    private String investmentAgreement;

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
