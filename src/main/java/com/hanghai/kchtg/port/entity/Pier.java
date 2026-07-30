package com.hanghai.kchtg.port.entity;

import com.hanghai.kchtg.common.entity.*;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entity representing a pier (Cầu cảng) — child of Berth.
 * Corresponds to table: piers (renamed from cau_cang).
 * FK: berth_id → berths.id (NOT NULL)
 */
@Entity
@Table(name = "piers",
        uniqueConstraints = @UniqueConstraint(columnNames = "pier_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class Pier extends BaseEntity {
    @Column(name = "province_id")
    private Integer provinceId;


    @Column(name = "pier_code", nullable = false, unique = true, length = 50)
    private String pierCode;

    @Column(name = "pier_name", nullable = false, length = 255)
    private String pierName;

    @Column(name = "berth_id", nullable = false)
    private UUID berthId;

    @Column(name = "length", precision = 15, scale = 2)
    private BigDecimal length;

    @Column(name = "design_load", precision = 15, scale = 2)
    private BigDecimal designLoad;

    @Column(name = "pier_type")
    @Convert(converter = PierTypeConverter.class)
    private PierType pierType;

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
}
