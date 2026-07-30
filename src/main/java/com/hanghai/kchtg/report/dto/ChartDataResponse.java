package com.hanghai.kchtg.report.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO for chart rendering (F-102: Biểu thống kê hàng hải).
 * Provides structured chart data compatible with Chart.js / ECharts.
 */
@Data
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
