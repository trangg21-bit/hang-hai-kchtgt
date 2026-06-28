package com.hanghai.kchtg.accesslog.scheduler;

import com.hanghai.kchtg.accesslog.entity.LogAggregate;
import com.hanghai.kchtg.accesslog.service.LogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

/**
 * Scheduler để tính toán thống kê aggregate hàng ngày.
 * Chạy lúc 03:00 mỗi ngày theo {@code LOG_STATS_CRON} (default: 0 3 * * ?).
 */
@Component
public class LogStatsScheduler {

    private static final Logger log = LoggerFactory.getLogger(LogStatsScheduler.class);

    private final LogService logService;

    public LogStatsScheduler(LogService logService) {
        this.logService = logService;
    }

    /**
     * Compute aggregate stats for yesterday at 3 AM daily.
     * Uses @Value("${LOG_STATS_CRON:0 3 * * ?}") for configurable cron expression.
     */
    @Scheduled(cron = "${LOG_STATS_CRON:0 3 * * ?}")
    public void computeDailyAggregate() {
        try {
            LocalDate yesterday = LocalDate.now().minusDays(1);
            log.info("Computing daily aggregate for: {}", yesterday);
            LogAggregate aggregate = logService.computeDailyAggregate(yesterday);
            log.info("Aggregate computed: total={}, unique={}, successRate={}",
                    aggregate.getTotalAccesses(), aggregate.getUniqueUsers(),
                    aggregate.getSuccessRate());
        } catch (Exception e) {
            log.error("Failed to compute daily aggregate: {}", e.getMessage());
            // Don't fail the scheduler — log error and continue
        }
    }
}
