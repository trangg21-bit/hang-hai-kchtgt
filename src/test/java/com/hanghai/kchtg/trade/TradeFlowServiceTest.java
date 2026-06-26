package com.hanghai.kchtg.trade;

import com.hanghai.kchtg.trade.dto.TradeFlowChartResponse;
import com.hanghai.kchtg.trade.entity.TradeFlow;
import com.hanghai.kchtg.trade.repository.TradeFlowRepository;
import com.hanghai.kchtg.trade.service.TradeFlowService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@DisplayName("TradeFlowService Unit Tests")
class TradeFlowServiceTest {

    private TradeFlowRepository tradeFlowRepository;
    private TradeFlowService tradeFlowService;

    @BeforeEach
    void setUp() {
        tradeFlowRepository = Mockito.mock(TradeFlowRepository.class);
        tradeFlowService = new TradeFlowService(tradeFlowRepository);
    }

    @Nested
    @DisplayName("findAll — list trade flows")
    class FindAllTests {

        @Test
        @DisplayName("Should return all trade flows when period is null")
        void findAll_returnsAllWhenPeriodNull() {
            TradeFlow f1 = buildFlow("Cảng Hải Phòng", "Cảng Đà Nẵng", "Hàng container", 15000, "01/2026");
            TradeFlow f2 = buildFlow("Cảng Cát Lái", "Cảng Hải Phòng", "Than", 30000, "01/2026");
            when(tradeFlowRepository.findAll()).thenReturn(Arrays.asList(f1, f2));

            List<TradeFlow> result = tradeFlowService.findAll(null);

            assertEquals(2, result.size());
            assertEquals("Cảng Hải Phòng", result.get(0).getSourcePort());
        }

        @Test
        @DisplayName("Should return filtered flows by period")
        void findAll_filtersByPeriod() {
            TradeFlow f1 = buildFlow("Cảng Hải Phòng", "Cảng Đà Nẵng", "Hàng container", 15000, "01/2026");
            TradeFlow f2 = buildFlow("Cảng Cát Lái", "Cảng Hải Phòng", "Than", 30000, "02/2026");
            when(tradeFlowRepository.findByPeriod("01/2026")).thenReturn(Collections.singletonList(f1));

            List<TradeFlow> result = tradeFlowService.findAll("01/2026");

            assertEquals(1, result.size());
            assertEquals("Hàng container", result.get(0).getCargoType());
        }

        @Test
        @DisplayName("Should return empty list when no flows found")
        void findAll_returnsEmptyListWhenNoFlows() {
            when(tradeFlowRepository.findAll()).thenReturn(Collections.emptyList());

            List<TradeFlow> result = tradeFlowService.findAll(null);

            assertNotNull(result);
            assertTrue(result.isEmpty());
        }
    }

    @Nested
    @DisplayName("buildChartData — chart-ready data")
    class BuildChartDataTests {

        @Test
        @DisplayName("Should produce valid Sankey links with unique ports")
        void buildChartData_producesSankeyLinks() {
            TradeFlow f1 = buildFlow("Cảng Hải Phòng", "Cảng Đà Nẵng", "Hàng container", 15000, "01/2026");
            TradeFlow f2 = buildFlow("Cảng Hải Phòng", "Cảng Sài Gòn", "Hàng container", 10000, "01/2026");
            when(tradeFlowRepository.findAll()).thenReturn(Arrays.asList(f1, f2));

            TradeFlowChartResponse chart = tradeFlowService.buildChartData(null);

            assertNotNull(chart);
            assertNotNull(chart.getSankeyLinks());
            assertFalse(chart.getSankeyLinks().isEmpty());
            // 2 links
            assertEquals(2, chart.getSankeyLinks().size());
            // 3 unique ports
            assertEquals(3, chart.getSankeyNodes().size());
        }

        @Test
        @DisplayName("Should produce heatmap data grouped by cargoType x period")
        void buildChartData_producesHeatmap() {
            TradeFlow f1 = buildFlow("A", "B", "Hàng container", 10000, "01/2026");
            TradeFlow f2 = buildFlow("A", "C", "Than", 5000, "01/2026");
            TradeFlow f3 = buildFlow("B", "C", "Hàng container", 8000, "02/2026");
            when(tradeFlowRepository.findAll()).thenReturn(Arrays.asList(f1, f2, f3));

            TradeFlowChartResponse chart = tradeFlowService.buildChartData(null);

            assertNotNull(chart);
            assertNotNull(chart.getHeatmapData());
            assertFalse(chart.getHeatmapData().isEmpty());
            // 3 distinct (cargoType, period) combos
            assertEquals(3, chart.getHeatmapData().size());
            // Verify heatmap entries have expected keys
            Map<String, Object> first = chart.getHeatmapData().get(0);
            assertTrue(first.containsKey("category"));
            assertTrue(first.containsKey("period"));
            assertTrue(first.containsKey("quantity"));
        }

        @Test
        @DisplayName("Should produce bar data aggregated by port name")
        void buildChartData_producesBarData() {
            TradeFlow f1 = buildFlow("Cảng Hải Phòng", "Cảng Đà Nẵng", "Hàng container", 15000, "01/2026");
            when(tradeFlowRepository.findAll()).thenReturn(Collections.singletonList(f1));

            TradeFlowChartResponse chart = tradeFlowService.buildChartData(null);

            assertNotNull(chart);
            assertNotNull(chart.getBarData());
            // 2 ports total (source + dest)
            assertEquals(2, chart.getBarData().size());
            // Verify bar entries have expected keys
            Map<String, Object> first = chart.getBarData().get(0);
            assertTrue(first.containsKey("port"));
            assertTrue(first.containsKey("totalQuantity"));
        }

        @Test
        @DisplayName("Should aggregate Sankey link values for same source-dest-cargo combination")
        void buildChartData_aggregatesDuplicateLinks() {
            TradeFlow f1 = buildFlow("Cảng Hải Phòng", "Cảng Đà Nẵng", "Hàng container", 15000, "01/2026");
            TradeFlow f2 = buildFlow("Cảng Hải Phòng", "Cảng Đà Nẵng", "Hàng container", 5000, "02/2026");
            when(tradeFlowRepository.findAll()).thenReturn(Arrays.asList(f1, f2));

            TradeFlowChartResponse chart = tradeFlowService.buildChartData(null);

            assertNotNull(chart);
            // Should have 1 aggregated link
            assertEquals(1, chart.getSankeyLinks().size());
            // Value should be 15000 + 5000 = 20000
            Map<String, Object> link = chart.getSankeyLinks().get(0);
            assertEquals(20000.0, link.get("value"));
        }
    }

    protected static TradeFlow buildFlow(String sourcePort, String destPort, String cargoType, int quantity, String period) {
        return TradeFlow.builder()
                .sourcePort(sourcePort)
                .destPort(destPort)
                .cargoType(cargoType)
                .quantity(BigDecimal.valueOf(quantity))
                .period(period)
                .createdAt(LocalDate.of(2026, 1, 1))
                .build();
    }
}
