package com.hanghai.kchtg.statistics.dto;

import jakarta.validation.constraints.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for creating / updating a statistics form (Biểu).
 * Fields are mapped to StatisticsForm entity during service layer processing.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsFormRequest {

    /** Auto-generated form code (e.g. "F01N-2026-06"), omitted when server generates. */
    private String formCode;

    @NotBlank(message = "formType không được để trống")
    private String formType;  // matches StatFormType enum values

    @NotBlank(message = "reportingPeriod không được để trống")
    private String reportingPeriod;

    private String periodType;  // MONTHLY, QUARTERLY, ANNUAL

    private LocalDate startDate;
    private LocalDate endDate;

    private BigDecimal totalValue;
    private Long totalUnits;
    private Integer portsCount;
    private Integer vesselsCount;

    /** JSON-serialized type-specific parameters. */
    private String parameters;

    private String approvedBy;
    private LocalDate approvedAt;
    private String notes;
}
