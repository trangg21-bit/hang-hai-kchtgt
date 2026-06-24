package com.hanghai.kchtg.common.scheduler;

import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Scheduled task ve don dep access logs cu tu dong.
 * <p>
 * Chay hang ngay luc 2:00 AM (theo cron: {@code 0 0 2 * * ?})
 * de xoa cac logs cu hon 90 ngay.
 * </p>
 */
@Component
public class LogCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(LogCleanupScheduler.class);

    private static final int RETENTION_DAYS = 90;

    private final AccessLogRepository repository;

    public LogCleanupScheduler(AccessLogRepository repository) {
        this.repository = repository;
    }

    /**
     * Xoa access logs cu hon retention days.
     * Chay moi ngay luc 2:00 AM.
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void cleanupOldAccessLogs() {
        log.info("Starting access log cleanup...");
        LocalDateTime threshold = LocalDateTime.now().minusDays(RETENTION_DAYS);
        long deleted = repository.deleteByCreatedAtBefore(threshold);
        log.info("Access log cleanup completed: {} old logs deleted (threshold: {})",
                deleted, threshold);
    }
}