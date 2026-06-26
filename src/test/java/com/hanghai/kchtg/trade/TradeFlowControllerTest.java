package com.hanghai.kchtg.trade;

import com.hanghai.kchtg.common.dto.ApiResponse;
import com.hanghai.kchtg.trade.dto.TradeFlowChartResponse;
import com.hanghai.kchtg.trade.entity.TradeFlow;
import com.hanghai.kchtg.trade.controller.TradeFlowController;
import com.hanghai.kchtg.trade.service.TradeFlowService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.verify;

@DisplayName("TradeFlowController Unit Tests")
class TradeFlowControllerTest {

    private TradeFlowService tradeFlowService;
    private TradeFlowController controller;
    private TradeFlow sampleFlow;

    @BeforeEach
    void setUp() {
        tradeFlowService = Mockito.mock(TradeFlowService.class);
        controller = new TradeFlowController(tradeFlowService);
        sampleFlow = TradeFlow.builder()
                .id(1L)
                .sourcePort("Cảng Hải Phòng")
                .destPort("Cảng Đà Nẵng")
                .cargoType("Hàng container")
                .quantity(BigDecimal.valueOf(15000))
                .period("01/2026")
                .createdAt(LocalDate.of(2026, 1, 1))
                .build();
    }

    @Nested
    @DisplayName("GET /api/v1/trade-flows Endpoint")
    class ListTradeFlowsEndpoint {

        @Test
        @DisplayName("Should return 200 OK with all trade flows")
        void listTradeFlows_returns200WithAllFlows() {
            when(tradeFlowService.findAll(null)).thenReturn(Collections.singletonList(sampleFlow));

            ResponseEntity<ApiResponse<List<TradeFlow>>> response = controller.listTradeFlows(null);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertEquals(1, response.getBody().getData().size());
            assertEquals("Cảng Hải Phòng", response.getBody().getData().get(0).getSourcePort());
            verify(tradeFlowService).findAll(null);
        }

        @Test
        @DisplayName("Should return filtered flows by period parameter")
        void listTradeFlows_filtersByPeriod() {
            when(tradeFlowService.findAll("06/2026")).thenReturn(Collections.emptyList());

            ResponseEntity<ApiResponse<List<TradeFlow>>> response = controller.listTradeFlows("06/2026");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertTrue(response.getBody().getData().isEmpty());
            verify(tradeFlowService).findAll("06/2026");
        }
    }

    @Nested
    @DisplayName("GET /api/v1/trade-flows/charts Endpoint")
    class GetChartDataEndpoint {

        @Test
        @DisplayName("Should return 200 OK with chart data")
        void getChartData_returns200WithChartResponse() {
            TradeFlowChartResponse chart = TradeFlowChartResponse.builder()
                    .sankeyLinks(Collections.singletonList(Map.of("source", 0, "target", 1, "value", 15000.0)))
                    .sankeyNodes(Arrays.asList("Cảng Hải Phòng", "Cảng Đà Nẵng"))
                    .heatmapData(Collections.emptyList())
                    .barData(Collections.emptyList())
                    .build();
            when(tradeFlowService.buildChartData(null)).thenReturn(chart);

            ResponseEntity<ApiResponse<TradeFlowChartResponse>> response = controller.getChartData(null);

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            assertNotNull(response.getBody().getData());
            assertEquals(2, response.getBody().getData().getSankeyNodes().size());
            verify(tradeFlowService).buildChartData(null);
        }

        @Test
        @DisplayName("Should return chart data filtered by period")
        void getChartData_filtersByPeriod() {
            TradeFlowChartResponse chart = TradeFlowChartResponse.builder()
                    .sankeyLinks(Collections.emptyList())
                    .sankeyNodes(Collections.emptyList())
                    .heatmapData(Collections.emptyList())
                    .barData(Collections.emptyList())
                    .build();
            when(tradeFlowService.buildChartData("06/2026")).thenReturn(chart);

            ResponseEntity<ApiResponse<TradeFlowChartResponse>> response = controller.getChartData("06/2026");

            assertEquals(HttpStatus.OK, response.getStatusCode());
            assertNotNull(response.getBody());
            assertTrue(response.getBody().isSuccess());
            verify(tradeFlowService).buildChartData("06/2026");
        }
    }
}
