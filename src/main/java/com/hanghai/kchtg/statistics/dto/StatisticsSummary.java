package com.hanghai.kchtg.statistics.dto;

import lombok.*;

import java.math.BigDecimal;

/**
 * Aggregated summary of statistics forms, used for dashboard views.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StatisticsSummary {

    private String formType;
    private String formTypeName;
    private Long totalForms;
    private Long approvedForms;
    private Long pendingForms;
    private BigDecimal totalValue;
    private Integer totalPorts;
    private Integer totalVessels;
}
