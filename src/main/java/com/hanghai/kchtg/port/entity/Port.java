package com.hanghai.kchtg.port.entity;

import java.util.UUID;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatusConverter;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.ApprovableEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.experimental.FieldNameConstants;

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
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
@org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
public class Port extends BaseEntity implements ApprovableEntity {

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

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

    @Column(name = "operational_status")
    @Convert(converter = OperationalStatusConverter.class)
    private OperationalStatus operationalStatus;

    @Column(name = "approval_status", nullable = false)
    @Enumerated(EnumType.ORDINAL)
    private ApprovalStatus approvalStatus;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    // ── Phê duyệt 2 cấp (approval-2-level-spec §3.2) ────────────────────────
    // Vòng 1 = Cảng vụ/Chi cục, vòng 2 = Cục. Các trường này là bắt buộc để
    // chống tự duyệt (BR-015) và để truy vết ai duyệt lúc nào (BR-007).

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

    @Column(name = "port_group")
    private Integer portGroup;

    @Column(name = "map_symbol_id")
    private UUID mapSymbolId;

    @Column(name = "spatial_id")
    private UUID spatialId;

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

    // ── Child collections ─────────────────────────────────────────────

    @OneToMany(mappedBy = "port", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<PortInfrastructure> infrastructureList = new ArrayList<>();

    @OneToMany(mappedBy = "port", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @Builder.Default
    private List<PortAttachment> attachments = new ArrayList<>();
}
