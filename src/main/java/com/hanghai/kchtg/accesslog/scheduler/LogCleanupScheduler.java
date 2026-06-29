package com.hanghai.kchtg.accesslog.scheduler;

import com.hanghai.kchtg.accesslog.service.LogService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduler để tự động xóa log cũ theo chính sách retention (BR-005-03, BR-026).
 * Chạy theo cron cấu hình từ {@code LOG_CLEANUP_CRON} (default: 0 2 * * ? — 2 AM mỗi ngày).
 * <p>
 * F-005 changes:
 * - Reads retentionDays from {@code LogRetentionPolicy} entity (not hardcoded)
 * - Retries on failure: logs error but does not stop the scheduler
 * </p>
 */
@Component("accessLogCleanupScheduler")
public class LogCleanupScheduler {

    private static final Logger log = LoggerFactory.getLogger(LogCleanupScheduler.class);

    private final LogService logService;

    public LogCleanupScheduler(LogService logService) {
        this.logService = logService;
    }

    /**
     * Cleanup old logs based on configured retention policy.
     * Runs daily at the schedule defined by {@code LOG_CLEANUP_CRON}.
     */
    @Scheduled(cron = "${LOG_CLEANUP_CRON:0 0 2 * * ?}")
    public void cleanupOldLogs() {
        try {
            log.info("Starting scheduled log cleanup (retention policy from entity)");
            logService.cleanupOldLogs();
        } catch (Exception e) {
            log.error("Failed to cleanup old logs: {}", e.getMessage());
            // Don't fail the scheduler — log error and continue
        }
    }
}
