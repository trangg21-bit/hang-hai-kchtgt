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
import java.time.LocalDateTime;
import java.util.UUID;

import com.hanghai.kchtg.security.RecordSecurityLevel;
import lombok.Builder;
import lombok.experimental.FieldNameConstants;

/**
 * Entity representing a water zone (Vùng nước) — child of Port.
 * Corresponds to table: water_zones (renamed from vung_nuoc).
 * FK: port_id → ports.id (NOT NULL)
 */
@Entity
@Table(name = "water_zones",
        uniqueConstraints = @UniqueConstraint(columnNames = "water_zone_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@FieldNameConstants
@org.hibernate.annotations.Filter(name = "orgUnitFilter", condition = "org_unit_id IN (:orgUnitIds)")
@org.hibernate.annotations.Filter(name = "recordSecurityLevelFilter", condition = "security_level <= :maxSecurityLevel")
public class WaterZone extends BaseEntity implements ApprovableEntity {

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "security_level", nullable = false, columnDefinition = "SMALLINT")
    @Builder.Default
    private RecordSecurityLevel securityLevel = RecordSecurityLevel.NORMAL;

    @Column(name = "province_id")
    private Integer provinceId;


    @Column(name = "water_zone_code", nullable = false, unique = true, length = 50)
    private String waterZoneCode;

    @Column(name = "water_zone_name", nullable = false, length = 255)
    private String waterZoneName;

    @Column(name = "port_id", nullable = false)
    private UUID portId;

    @Column(name = "area", precision = 15, scale = 2)
    private BigDecimal area;

    @Column(name = "max_depth", precision = 10, scale = 2)
    private BigDecimal maxDepth;

    @Column(name = "avg_depth", precision = 10, scale = 2)
    private BigDecimal avgDepth;

    @Column(name = "water_zone_type")
    @Convert(converter = WaterZoneTypeConverter.class)
    private WaterZoneType waterZoneType;

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
}
