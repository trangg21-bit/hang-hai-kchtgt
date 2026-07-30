package com.hanghai.kchtg.port.entity;

import com.hanghai.kchtg.common.entity.*;
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

    @Column(name = "operational_status")
    @Convert(converter = OperationalStatusConverter.class)
    private OperationalStatus operationalStatus;

    @Column(name = "approval_status", nullable = false)
    @Convert(converter = ApprovalStatusConverter.class)
    private ApprovalStatus approvalStatus;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "operational_function", length = 255)
    private String operationalFunction;

    @Column(name = "map_symbol_id")
    private UUID mapSymbolId;

    @Column(name = "spatial_id")
    private UUID spatialId;

    // ── Extended fields from hh.csdl legacy Qlkc038Dto ────────────────

    @Column(name = "province_id")
    private Integer provinceId;

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
}
