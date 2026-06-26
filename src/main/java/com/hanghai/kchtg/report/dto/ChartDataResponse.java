package com.hanghai.kchtg.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

/**
 * DTO for chart rendering (F-102: Biểu thống kê hàng hải).
 * Provides structured chart data compatible with Chart.js / ECharts.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChartDataResponse {

    @Builder.Default
    private List<String> categories = List.of();

    @Builder.Default
    private List<Map<String, Number>> series = List.of();

    @Builder.Default
    private String chartType = "bar";
}
