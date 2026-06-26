package com.hanghai.kchtg.report.entity;

import jakarta.persistence.*;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.Accessors;
import lombok.experimental.SuperBuilder;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Abstract base entity for all report records.
 * Stores report metadata: type, status, date range, generation info, and output format.
 * Uses JOINED inheritance so concrete report subtypes have dedicated tables.
 */
@Entity
@Table(name = "base_report")
@Inheritance(strategy = InheritanceType.JOINED)
@SuperBuilder
@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
@Accessors(chain = true)
public abstract class BaseReport extends BaseEntity {

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "report_type", nullable = false)
    private ReportType reportType;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "status", nullable = false)
    private ReportStatus status;

    @Column(name = "generated_at")
    private Instant generatedAt;

    @Column(name = "generated_by", length = 36)
    private UUID generatedBy;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "output_format")
    private ReportFormat outputFormat;

    @Column(name = "file_url", length = 1000)
    private String fileUrl;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Lob
    @Column(columnDefinition = "json")
    private String parameters;
}
