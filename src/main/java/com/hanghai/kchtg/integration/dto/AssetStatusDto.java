package com.hanghai.kchtg.integration.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

/**
 * Summary statistics of GIS assets grouped by object type and status.
 */
@Data
@Builder
public class AssetStatusDto {

    private long totalPoints;
    private long totalLines;
    private long totalPolygons;
    private long totalAssets;

    private Map<String, Long> pointsByType;
    private Map<String, Long> linesByType;
    private Map<String, Long> polygonsByType;

    private Map<String, Long> assetsByStatus;
}
