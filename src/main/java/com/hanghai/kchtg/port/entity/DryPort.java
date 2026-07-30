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
 * Entity representing an inland port / dry port (Cảng cạn) — independent, no parent FK.
 * Corresponds to table: dry_ports (renamed from cang_can).
 */
@Entity
@Table(name = "dry_ports",
        uniqueConstraints = @UniqueConstraint(columnNames = "dry_port_code"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DryPort extends BaseEntity {

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
    @Convert(converter = ApprovalStatusConverter.class)
    private ApprovalStatus approvalStatus;

    @Column(name = "org_unit_id")
    private UUID orgUnitId;

    @Column(name = "map_symbol_id")
    private UUID mapSymbolId;

    @Column(name = "spatial_id")
    private UUID spatialId;
}
