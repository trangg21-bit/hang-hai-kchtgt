package com.hanghai.kchtg.cangben.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDongConverter;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.ApprovalStatusConverter;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entity representing a water zone (VÃ¹ng nÆ°á»›c) â€” child of Port.
 * Corresponds to table: water_zones (renamed from vung_nuoc).
 * FK: port_id â†’ ports.id (NOT NULL)
 */
@Entity
@Table(name = "water_zones",
        uniqueConstraints = @UniqueConstraint(columnNames = "water_zone_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class WaterZone extends BaseEntity {

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
    @Convert(converter = LoaiVungNuocConverter.class)
    private LoaiVungNuoc waterZoneType;

    @Column(name = "operational_status")
    @Convert(converter = TrangThaiHoatDongConverter.class)
    private TrangThaiHoatDong operationalStatus;

    @Column(name = "approval_status", nullable = false)
    @Convert(converter = ApprovalStatusConverter.class)
    private ApprovalStatus approvalStatus;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "map_symbol_id")
    private java.util.UUID mapSymbolId;

    @Column(name = "spatial_id")
    private java.util.UUID spatialId;
}
