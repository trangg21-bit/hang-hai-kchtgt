package com.hanghai.kchtg.document.dto;

import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MaintenanceReportResponse {

    private UUID id;
    private String reportType;
    private LocalDate periodStart;
    private LocalDate periodEnd;
    private BigDecimal totalCost;
    private String filePath;
    private java.util.UUID createdBy;
    private LocalDateTime createdAt;
}
