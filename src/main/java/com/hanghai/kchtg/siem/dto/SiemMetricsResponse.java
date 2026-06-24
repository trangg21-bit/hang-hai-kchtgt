package com.hanghai.kchtg.siem.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
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
