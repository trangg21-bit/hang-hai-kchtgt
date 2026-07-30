package com.hanghai.kchtg.document.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

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
    private UUID createdBy;
    private LocalDateTime createdAt;
}
