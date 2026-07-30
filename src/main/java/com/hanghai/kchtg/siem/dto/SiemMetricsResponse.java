package com.hanghai.kchtg.siem.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SiemMetricsResponse {
    private long totalEventsCount;
    private double eventsPerSecond;
    private double failureRate;
    private int activeAlertsCount;
    private long accessLogsCount;
    private long loginAttemptsCount;
    private long securityAlertsCount;
}
