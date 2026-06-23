package com.hanghai.kchtg.integration.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Stores aggregated cargo throughput logs (tonnage, TEUs, vessel counts).
 */
@Entity
@Table(name = "kchtgt_cargo_aggregates")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CargoAggregate extends BaseEntity {

    @Column(name = "port_code", nullable = false, length = 100)
    private String portCode;

    @Column(name = "period_type", nullable = false, length = 50)
    private String periodType; // MONTHLY, ANNUAL

    @Column(name = "period_start", nullable = false)
    private LocalDate periodStart;

    @Column(name = "period_end", nullable = false)
    private LocalDate periodEnd;

    @Column(name = "total_tons", precision = 15, scale = 2)
    private BigDecimal totalTons;

    @Column(name = "total_teus", precision = 10, scale = 2)
    private BigDecimal totalTeus;

    @Column(name = "vessel_count")
    private Integer vesselCount;
}
