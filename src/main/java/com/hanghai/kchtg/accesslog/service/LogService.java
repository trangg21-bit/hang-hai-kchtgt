package com.hanghai.kchtg.accesslog.service;

import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;

import java.io.BufferedWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Service quan ly access logs — bao gom query, xuat CSV, don gan lich su và canh bao khi có loi.
 * <p>
 * Ket hop logic từ {@link AccessLogService} (query read-only) và các tinh nang moi:
 * {@code exportToCsv()}, {@code cleanupOldLogs()}, và {@code alertOnFailures()}.
 * </p>
 */
@Service
public class LogService {

    private static final Logger log = LoggerFactory.getLogger(LogService.class);

    private final AccessLogService accessLogService;
    private final AccessLogRepository repository;
    private final int retentionDays;
    private final String exportDir;

    public LogService(AccessLogService accessLogService,
                      AccessLogRepository repository,
                      @Value("${cron.access-log.cleanup:}") String cleanupSchedule,
                      @Value("${export.dir:./logs}") String exportDir) {
        this.accessLogService = accessLogService;
        this.repository = repository;
        this.retentionDays = 90;
        this.exportDir = exportDir;
    }

    /**
     * Tim mot log entry duy nhat.
     */
    public com.hanghai.kchtg.accesslog.dto.AccessLogResponse findById(UUID id) {
        return accessLogService.findById(id);
    }

    /**
     * List logs voi filter + pagination.
     */
    public Page<com.hanghai.kchtg.accesslog.dto.AccessLogResponse> findAll(
            com.hanghai.kchtg.accesslog.dto.AccessLogFilterRequest filter, Pageable pageable) {
        return accessLogService.findAll(filter, pageable);
    }

    // ── CSV Export ─────────────────────────────────────────────────────

    /**
     * Xuat access logs thanh file CSV.
     *
     * @param filter   bo loc (co the null)
     * @param pageable pagination
     * @return duong dan file CSV da duoc tao
     */
    @Transactional(readOnly = true)
    public String exportToCsv(com.hanghai.kchtg.accesslog.dto.AccessLogFilterRequest filter, Pageable pageable) {
        Page<com.hanghai.kchtg.accesslog.dto.AccessLogResponse> page = findAll(filter, pageable);

        String fileName = "access_logs_" + LocalDate.now() + ".csv";
        Path filePath = Path.of(exportDir, fileName);

        try {
            Files.createDirectories(filePath.getParent());
            try (BufferedWriter writer = Files.newBufferedWriter(filePath)) {
                // Header
                writer.write("ID,Username,Action,Module,IP Address,User Agent,Status,Detail,CreatedAt\n");

                // Data rows
                for (var entry : page.getContent()) {
                    writer.write(String.format("\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\",\"%s\"\n",
                            entry.getId(),
                            entry.getUsername(),
                            entry.getAction(),
                            entry.getModule(),
                            entry.getIpAddress(),
                            entry.getUserAgent() != null ? entry.getUserAgent().replace("\"", "\"\"") : "",
                            entry.getStatus(),
                            entry.getDetail() != null ? entry.getDetail().replace("\"", "\"\"") : "",
                            entry.getCreatedAt()));
                }
            }
            log.info("CSV export completed: {} ({} rows)", fileName, page.getTotalElements());
            return filePath.toString();
        } catch (Exception e) {
            log.error("CSV export failed: {}", e.getMessage());
            throw new RuntimeException("Xuat CSV that bai: " + e.getMessage(), e);
        }
    }

    // ── Alert on Failures ────────────────────────────────────────────

    /**
     * Kiem tra và canh bao neu co quá nhieu log FAILED trong khoang thoi gian gan day.
     */
    public int alertOnFailures(int threshold) {
        LocalDateTime window = LocalDateTime.now().minusMinutes(30);
        long failureCount = repository.countByStatusAndCreatedAtAfter(AccessLogStatus.FAILED, window);

        if (failureCount >= threshold) {
            log.warn("ALERT: {} failures detected in the last 30 minutes (threshold: {})",
                    failureCount, threshold);
            // TODO: trigger notification (email, Slack, etc.)
        }

        return (int) failureCount;
    }

    /**
     * Alias voi threshold mac dinh (100 failures/30min).
     */
    @Transactional(readOnly = true)
    public int checkFailureAlerts() {
        return alertOnFailures(100);
    }

    // ── Scheduled Cleanup ────────────────────────────────────────────

    /**
     * Xoa các access logs cu hon retentionDays.
     * Chay tu dong theo cron schedule (xem {@link com.hanghai.kchtg.common.scheduler.LogCleanupScheduler}).
     */
    @Transactional
    public void cleanupOldLogs() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(retentionDays);
        long deleted = repository.deleteByCreatedAtBefore(threshold);
        log.info("Cleaned up {} access logs older than {} days", deleted, retentionDays);
    }

    // ── Statistics ─────────────────────────────────────────────────────

    /**
     * Thong ke so luong logs theo status trong ngay.
     */
    @Transactional(readOnly = true)
    public List<Object[]> getDailyStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        return repository.countByStatusGroupedByStatus(startOfDay, endOfDay);
    }

    /**
     * Tong so logs trong he thong.
     */
    @Transactional(readOnly = true)
    public long getTotalCount() {
        return repository.count();
    }
}
