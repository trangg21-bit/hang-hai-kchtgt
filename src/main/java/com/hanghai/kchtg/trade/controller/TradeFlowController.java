package com.hanghai.kchtg.trade.controller;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.trade.dto.TradeFlowChartResponse;
import com.hanghai.kchtg.trade.entity.TradeFlow;
import com.hanghai.kchtg.trade.service.TradeFlowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST controller for F-105 Biểu đồ trao đổi thương mại.
 *
 * Endpoints:
 *   GET /api/v1/trade-flows           — list all trade flow records
 *   GET /api/v1/trade-flows/{id}      — get a single trade flow
 *   GET /api/v1/trade-flows/charts    — chart-ready data (Sankey, heatmap, bar)
 */
@RestController
@RequestMapping("/api/v1/trade-flows")
@RequiredArgsConstructor
public class TradeFlowController {

    private final TradeFlowService tradeFlowService;

    /**
     * GET /api/v1/trade-flows
     * Returns all trade flow records, optionally filtered by period.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<TradeFlow>>> listTradeFlows(
            @RequestParam(name = "period", required = false) String period) {
        List<TradeFlow> flows = tradeFlowService.findAll(period);
        return ResponseEntity.ok(ApiResponse.success(flows));
    }

    /**
     * GET /api/v1/trade-flows/charts
     * Returns chart-ready data for F-105 (Sankey links + nodes, heatmap, bar).
     */
    @GetMapping("/charts")
    public ResponseEntity<ApiResponse<TradeFlowChartResponse>> getChartData(
            @RequestParam(name = "period", required = false) String period) {
        TradeFlowChartResponse chart = tradeFlowService.buildChartData(period);
        return ResponseEntity.ok(ApiResponse.success(chart));
    }
}
