package com.hanghai.kchtg.statistics.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

/**
 * Main entity for all 28 statistical forms (Biểu) in the chuyên đề module.
 * Uses JPA single-table inheritance via discriminator column.
 *
 * Supported form types: PORT_THROUGHPUT, DOCK_CAPACITY, CARGO_VOLUME,
 * SHIP_MOVEMENT, BERTH_ANCHORAGE, LIGHTING_SYSTEM, BUOY_SYSTEM,
 * VTS_SYSTEM, COASTAL_INFO_SYSTEM, DIKE_BREAKWATER, CREW_STATISTICS,
 * REPAIR_DAMAGE, OTHER.
 */
@Entity
@Table(name = "statistics_forms")
@DiscriminatorValue("STAT_FORM")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class StatisticsForm extends BaseEntity {

    /** Unique form identifier, e.g. "F01N-2026-06" */
    @Column(name = "form_code")
    private String formCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "form_type")
    private StatFormType formType;

    @Enumerated(EnumType.STRING)
    @Column(name = "form_status")
    private StatFormStatus formStatus;

    /** Reporting period, e.g. "2026-06" or "2026-Q2" */
    @Column(name = "reporting_period")
    private String reportingPeriod;

    /** MONTHLY, QUARTERLY, ANNUAL */
    @Column(name = "period_type")
    private String periodType;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "total_value")
    private BigDecimal totalValue;

    @Column(name = "total_units")
    private Long totalUnits;

    @Column(name = "ports_count")
    private Integer portsCount;

    @Column(name = "vessels_count")
    private Integer vesselsCount;

    /** JSON-serialized parameters for type-specific fields */
    @Column(name = "parameters", columnDefinition = "TEXT")
    private String parameters;

    /** URL to attached export file (PDF/Excel) */
    @Column(name = "file_url")
    private String fileUrl;

    @Column(name = "approved_by")
    private String approvedBy;

    @Column(name = "approved_at")
    private LocalDate approvedAt;

    @Column(name = "notes")
    private String notes;
}
