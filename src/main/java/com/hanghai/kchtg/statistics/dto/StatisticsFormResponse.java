package com.hanghai.kchtg.statistics.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;

/**
 * Response DTO for a statistics form, containing full metadata plus
 * system-generated fields (code, name, createdBy, updatedBy, etc.).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsFormResponse {

    private Long id;

    /** Auto-assigned unique identifier (BaseEntity.code). */
    private String code;

    /** Human-readable name assigned by user. */
    private String name;

    /** Business code (e.g. "F01N-2026-06"), distinct from the system code. */
    private String formCode;

    private String formType;
    private String formStatus;

    private String reportingPeriod;
    private String periodType;
    private LocalDate startDate;
    private LocalDate endDate;

    private BigDecimal totalValue;
    private Long totalUnits;
    private Integer portsCount;
    private Integer vesselsCount;

    private String fileUrl;
    private String approvedBy;
    private LocalDate approvedAt;
    private String notes;

    private String createdBy;
    private String updatedBy;
    private Instant createdAt;
    private Instant updatedAt;
}
