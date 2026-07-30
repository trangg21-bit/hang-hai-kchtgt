package com.hanghai.kchtg.integration.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.Map;

/**
 * Summary statistics of GIS assets grouped by object type and status.
 */
@Getter
@Setter
@Builder
public class AssetStatusDto {

    /** Total KCHT entities in the selected dashboard scope. */
    private long totalAssets;

    /** Operating summary used by the KCHT KPI and ring chart. */
    private Map<String, Long> assetsByStatus;

    /** Approval summary dùng chung payload với số liệu vận hành KCHT. */
    private Map<String, Long> approvalStats;

    /** Per-entity 4-column breakdown (type, total, pending, operating, suspended). */
    private List<Map<String, Object>> breakdown;
}
