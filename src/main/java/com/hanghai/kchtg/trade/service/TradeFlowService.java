package com.hanghai.kchtg.trade.service;

import com.hanghai.kchtg.trade.dto.TradeFlowChartResponse;
import com.hanghai.kchtg.trade.entity.TradeFlow;
import com.hanghai.kchtg.trade.repository.TradeFlowRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Service for F-105 Biểu đồ trao đổi thương mại.
 * Provides trade flow data and chart-ready responses.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class TradeFlowService {

    private final TradeFlowRepository tradeFlowRepository;

    /**
     * Return all trade flow records (with optional period filter).
     */
    public List<TradeFlow> findAll(String period) {
        List<TradeFlow> flows;
        if (period != null && !period.isBlank()) {
            flows = tradeFlowRepository.findByPeriod(period);
        } else {
            flows = tradeFlowRepository.findAll();
        }
        return flows;
    }

    /**
     * Aggregate total quantity per source port.
     */
    public Map<String, BigDecimal> totalBySourcePort() {
        return aggregateBy("sourcePort");
    }

    /**
     * Aggregate total quantity per destination port.
     */
    public Map<String, BigDecimal> totalByDestPort() {
        return aggregateBy("destPort");
    }

    /**
     * Aggregate total quantity per cargo type.
     */
    public Map<String, BigDecimal> totalByCargoType() {
        return aggregateBy("cargoType");
    }

    /**
     * Build chart-ready response with Sankey links + nodes, heatmap, and bar data.
     */
    public TradeFlowChartResponse buildChartData(String period) {
        List<TradeFlow> flows = (period != null && !period.isBlank())
                ? tradeFlowRepository.findByPeriod(period)
                : tradeFlowRepository.findAll();

        TradeFlowChartResponse chart = TradeFlowChartResponse.builder()
                .sankeyLinks(new ArrayList<>())
                .sankeyNodes(new ArrayList<>())
                .heatmapData(new ArrayList<>())
                .barData(new ArrayList<>())
                .build();

        // --- Sankey ---
        // Collect unique ports
        Set<String> allPorts = new LinkedHashSet<>();
        flows.forEach(f -> {
            allPorts.add(f.getSourcePort());
            allPorts.add(f.getDestPort());
        });
        chart.setSankeyNodes(new ArrayList<>(allPorts));

        // Sankey links: group by (source, dest, cargoType)
        Map<String, BigDecimal> linkMap = new LinkedHashMap<>();
        flows.forEach(f -> {
            String key = f.getSourcePort() + " -> " + f.getDestPort() + "|" + f.getCargoType();
            linkMap.merge(key, f.getQuantity(), BigDecimal::add);
        });

        List<Map<String, Object>> sankeyLinks = new ArrayList<>();
        int portIndex = 0;
        Map<String, Integer> portIdx = new LinkedHashMap<>();
        for (String port : allPorts) {
            portIdx.put(port, portIndex++);
        }

        for (Map.Entry<String, BigDecimal> entry : linkMap.entrySet()) {
            String[] pair = entry.getKey().split("\\|");
            String[] route = pair[0].split(" -> ");
            String cargo = pair[1];
            Map<String, Object> link = new LinkedHashMap<>();
            link.put("source", portIdx.get(route[0]));
            link.put("target", portIdx.get(route[1]));
            link.put("value", entry.getValue().doubleValue());
            link.put("cargoType", cargo);
            sankeyLinks.add(link);
        }
        chart.setSankeyLinks(sankeyLinks);

        // --- Heatmap: cargoType x period -> quantity ---
        Map<String, Map<String, BigDecimal>> heatmap = new LinkedHashMap<>();
        flows.forEach(f -> {
            heatmap.computeIfAbsent(f.getCargoType(), k -> new LinkedHashMap<>())
                    .merge(f.getPeriod(), f.getQuantity(), BigDecimal::add);
        });

        List<Map<String, Object>> heatmapData = new ArrayList<>();
        for (Map.Entry<String, Map<String, BigDecimal>> catEntry : heatmap.entrySet()) {
            for (Map.Entry<String, BigDecimal> periodEntry : catEntry.getValue().entrySet()) {
                Map<String, Object> row = new LinkedHashMap<>();
                row.put("category", catEntry.getKey());
                row.put("period", periodEntry.getKey());
                row.put("quantity", periodEntry.getValue().doubleValue());
                heatmapData.add(row);
            }
        }
        chart.setHeatmapData(heatmapData);

        // --- Bar chart: total quantity per port (source + dest) ---
        Map<String, BigDecimal> barMap = new TreeMap<>(String.CASE_INSENSITIVE_ORDER);
        flows.forEach(f -> {
            barMap.merge(f.getSourcePort(), f.getQuantity(), BigDecimal::add);
            barMap.merge(f.getDestPort(), f.getQuantity(), BigDecimal::add);
        });

        List<Map<String, Object>> barData = new ArrayList<>();
        for (Map.Entry<String, BigDecimal> entry : barMap.entrySet()) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("port", entry.getKey());
            row.put("totalQuantity", entry.getValue().doubleValue());
            barData.add(row);
        }
        chart.setBarData(barData);

        return chart;
    }

    /**
     * Seed demo data for F-105 (used for testing / initial DB population).
     */
    public void seedDemoData() {
        if (tradeFlowRepository.countDistinctSourcePort() == 0) {
            log.info("Seeding demo trade flow data for F-105...");
            List<TradeFlow> demo = new ArrayList<>();

            String[] ports = {"Cảng Hải Phòng", "Cảng Đà Nẵng", "Cảng Cát Lái", "Cảng Sài Gòn", "Cảng Quảng Ninh"};
            String[] cargos = {"Hàng container", "Hàng rời", "Dầu khí", "Than"};
            String[] periods = {"01/2026", "02/2026", "03/2026", "04/2026", "05/2026", "06/2026"};

            int idx = 0;
            for (String source : ports) {
                for (String dest : ports) {
                    if (source.equals(dest)) continue;
                    for (String cargo : cargos) {
                        for (String period : periods) {
                            demo.add(TradeFlow.builder()
                                    .sourcePort(source)
                                    .destPort(dest)
                                    .cargoType(cargo)
                                    .quantity(BigDecimal.valueOf(Math.abs(source.hashCode() + dest.hashCode() + cargo.hashCode()) % 50000 + 1000))
                                    .period(period)
                                    .createdAt(LocalDate.of(2026, 1, 1))
                                    .build());
                            idx++;
                        }
                    }
                }
            }
            tradeFlowRepository.saveAll(demo);
            log.info("Seeded {} demo trade flow records.", demo.size());
        }
    }

    /**
     * Generic aggregation by a field name (sourcePort, destPort, cargoType).
     */
    private Map<String, BigDecimal> aggregateBy(String field) {
        List<TradeFlow> all = tradeFlowRepository.findAll();
        Map<String, BigDecimal> result = new LinkedHashMap<>();
        all.forEach(f -> {
            String key = switch (field) {
                case "sourcePort" -> f.getSourcePort();
                case "destPort" -> f.getDestPort();
                case "cargoType" -> f.getCargoType();
                default -> "unknown";
            };
            result.merge(key, f.getQuantity(), BigDecimal::add);
        });
        return result;
    }
}
