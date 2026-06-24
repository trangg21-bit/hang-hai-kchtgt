package com.hanghai.kchtg.integration.dto;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

/**
 * Summary containing global system assets, connection counts, and connection health metrics.
 */
@Data
@Builder
public class ComprehensiveInfoDto {

    private long totalAssets;
    private long totalDataConnections;
    private Map<String, Long> connectionsByStatus;
    private long totalSyncJobsRun;
    private Map<String, Long> syncJobsByStatus;
    private java.time.LocalDateTime systemTime;
}