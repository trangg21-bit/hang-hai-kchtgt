package com.hanghai.kchtg.report.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

/**
 * Concrete report entity for KCHTGT summary reports.
 * Stores aggregation totals (assets, value, ports, maintenance, navigation signals).
 */
@Entity
@Table(name = "report_kchtg")
@SuperBuilder
@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
public class ReportEntity extends BaseReport {

    @Column(name = "total_assets")
    private Long totalAssets;

    @Column(name = "total_value", precision = 18, scale = 4)
    private BigDecimal totalValue;

    @Column(name = "ports_count")
    private Integer portsCount;

    @Column(name = "maintenance_count")
    private Integer maintenanceCount;

    @Column(name = "navigation_signals_count")
    private Integer navigationSignalsCount;
}
