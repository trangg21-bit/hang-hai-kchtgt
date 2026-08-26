package com.hanghai.kchtg.port.entity;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.entity.ApprovableEntity;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatusConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.Builder;
import lombok.experimental.FieldNameConstants;

/**
 * Entity representing an inland port / dry port (Cảng cạn) — independent, no
 * parent FK.
 * Corresponds to table: dry_ports (renamed from cang_can).
 */
@Entity
@Table(name = "dry_ports", uniqueConstraints = @UniqueConstraint(columnNames = "dry_port_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
@org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
public class DryPort extends BaseEntity implements ApprovableEntity {

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

    @Column(name = "dry_port_code", nullable = false, unique = true, length = 50)
    private String dryPortCode;

    @Column(name = "dry_port_name", nullable = false, length = 255)
    private String dryPortName;

    @Column(name = "province_id")
    private Integer provinceId;

    @Column(name = "area", precision = 15, scale = 2)
    private BigDecimal area;

    @Column(name = "teu_capacity", precision = 15, scale = 2)
    private BigDecimal teuCapacity;

    @Column(name = "operational_status")
    @Convert(converter = OperationalStatusConverter.class)
    private OperationalStatus operationalStatus;

    @Column(name = "approval_status", nullable = false)
    @Enumerated(EnumType.ORDINAL)
    private ApprovalStatus approvalStatus;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    // -- Phe duyet 2 cap (approval-2-level-spec 3.2) --
    // Vong 1 = Cang vu/Chi cuc, vong 2 = Cuc. Cac truong nay bat buoc de chong
    // tu duyet (BR-015) va truy vet ai duyet luc nao (BR-007).

    @Column(name = "approver_level1")
    private UUID approverLevel1;

    @Column(name = "approved_date_level1")
    private LocalDateTime approvedDateLevel1;

    @Column(name = "approver_level2")
    private UUID approverLevel2;

    @Column(name = "approved_date_level2")
    private LocalDateTime approvedDateLevel2;

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "map_symbol_id")
    private UUID mapSymbolId;

    @Column(name = "spatial_id")
    private UUID spatialId;

    // ── Extended fields (V113 — from F-026 feature brief) ──────────────

    // General info
    @Column(name = "operating_unit", length = 255)
    private String operatingUnit;

    @Column(name = "region", length = 255)
    private String region;

    @Column(name = "detailed_location", length = 500)
    private String detailedLocation;

    @Column(name = "transport_corridor", length = 255)
    private String transportCorridor;

    @Column(name = "warehouse_area", precision = 15, scale = 2)
    private BigDecimal warehouseArea;

    @Column(name = "yard_area", precision = 15, scale = 2)
    private BigDecimal yardArea;

    @Column(name = "connection_mode", length = 500)
    private String connectionMode;

    @Column(name = "port_status", nullable = false)
    private Integer portStatus;

    @Column(name = "remarks", length = 1000)
    private String remarks;

    // Announcement
    @Column(name = "announcement_time")
    private LocalDateTime announcementTime;

    @Column(name = "announcement_decision_number", length = 100)
    private String announcementDecisionNumber;

    @Column(name = "announcement_decision_date")
    private LocalDate announcementDecisionDate;

    @Column(name = "announcement_org", length = 255)
    private String announcementOrg;

    // GIS (coordinates + geometry_type managed by gis_spatial_objects via
    // spatial_id)
    @Column(name = "coordinate_system")
    private Integer coordinateSystem;

    @Column(name = "display_rule")
    private Integer displayRule;
}
