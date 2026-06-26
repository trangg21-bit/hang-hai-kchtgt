package com.hanghai.kchtg.trade.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * Response body for Sankey / heatmap / bar chart data used by F-105.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TradeFlowChartResponse {

    /** Sankey links: {source, target, value} */
    private List<Map<String, Object>> sankeyLinks;

    /** Sankey nodes: unique port names */
    private List<String> sankeyNodes;

    /** Heatmap: matrix {category, period, quantity} */
    private List<Map<String, Object>> heatmapData;

    /** Bar chart: {port, totalQuantity} */
    private List<Map<String, Object>> barData;
}
