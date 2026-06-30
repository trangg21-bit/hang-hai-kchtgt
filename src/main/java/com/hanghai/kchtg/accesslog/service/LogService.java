package com.hanghai.kchtg.accesslog.service;

import com.hanghai.kchtg.accesslog.dto.AccessLogFilterRequest;
import com.hanghai.kchtg.accesslog.dto.AccessLogResponse;
import com.hanghai.kchtg.accesslog.dto.LogAggregateResponse;
import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import com.hanghai.kchtg.accesslog.entity.LogAggregate;
import com.hanghai.kchtg.accesslog.entity.LogRetentionPolicy;
import com.hanghai.kchtg.accesslog.repository.AccessLogRepository;
import com.hanghai.kchtg.accesslog.repository.LogAggregateRepository;
import com.hanghai.kchtg.accesslog.repository.LogRetentionPolicyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import java.io.PrintWriter;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

/**
 * Service cho việc query, xuat CSV (streaming), don gan, canh bao, thong ke aggregate,
 * va quyen duyet retention policy.
 * <p>
 * F-005 changes:
 * - CSV export uses {@code StreamingResponseBody} (not filesystem BufferedWriter)
 * - Alert threshold: >=5 login failures in 1 hour (was 100 failures in 30 min)
 * - Retention policy read from entity (not hardcoded)
 * - Aggregate statistics persisted to LogAggregate entity
 * </p>
 */
@Service
public class LogService {

    private static final Logger log = LoggerFactory.getLogger(LogService.class);

    private static final int ALERT_THRESHOLD = 5;
    private static final long ALERT_WINDOW_HOURS = 1;
    private static final int MAX_EXPORT_ROWS = 10000;

    private final AccessLogService accessLogService;
    private final AccessLogRepository repository;
    private final LogRetentionPolicyRepository retentionPolicyRepository;
    private final LogAggregateRepository aggregateRepository;
    private final String exportDir;

    public LogService(AccessLogService accessLogService,
                      AccessLogRepository repository,
                      LogRetentionPolicyRepository retentionPolicyRepository,
                      LogAggregateRepository aggregateRepository,
                      @Value("${cron.access-log.cleanup:}") String cleanupSchedule,
                      @Value("${export.dir:./logs}") String exportDir) {
        this.accessLogService = accessLogService;
        this.repository = repository;
        this.retentionPolicyRepository = retentionPolicyRepository;
        this.aggregateRepository = aggregateRepository;
        this.exportDir = exportDir;
    }

    // ── Query delegation ─────────────────────────────────────────────

    /** Find one log entry by ID. */
    public AccessLogResponse findById(Long id) {
        return accessLogService.findById(id);
    }

    /** List logs with filter + pagination. */
    public Page<AccessLogResponse> findAll(AccessLogFilterRequest filter, Pageable pageable) {
        return accessLogService.findAll(filter, pageable);
    }

    // ── CSV Export (StreamingResponseBody) — G3 ──────────────────────

    /**
     * Build a StreamingResponseBody for CSV export.
     * Enforces MAX_EXPORT_ROWS limit (BR-027).
     */
    @Transactional(readOnly = true)
    public StreamingResponseBody exportToCsvStreaming(AccessLogFilterRequest filter) {
        return outputStream -> {
            PrintWriter writer = new PrintWriter(
                    new java.io.OutputStreamWriter(outputStream, StandardCharsets.UTF_8));
            try {
                // Header
                writer.println("ID,Username,Action,Type,Severity,TargetResource,RequestPath,ResponseCode,DurationMs,IP,UserAgent,Status,Detail,CreatedAt");

                // Fetch in chunks to avoid OOM
                int totalExported = 0;
                int pageSize = 500;
                int page = 0;

                while (true) {
                    if (totalExported >= MAX_EXPORT_ROWS) {
                        log.warn("CSV export reached {} row limit", MAX_EXPORT_ROWS);
                        break;
                    }

                    Page<AccessLogResponse> pageResult = accessLogService.findAll(filter,
                            PageRequest.of(page, pageSize, Sort.by("createdAt").descending()));

                    for (AccessLogResponse entry : pageResult.getContent()) {
                        if (totalExported >= MAX_EXPORT_ROWS) break;
                        writer.write(escapeCsvRow(entry));
                        totalExported++;
                    }

                    if (!pageResult.hasNext() || totalExported >= MAX_EXPORT_ROWS) {
                        break;
                    }
                    page++;
                }

                writer.flush();
                log.info("Streaming CSV export completed: {} rows", totalExported);

            } catch (Exception e) {
                log.error("Streaming CSV export failed: {}", e.getMessage());
                throw new RuntimeException("Xuất CSV thất bại: " + e.getMessage(), e);
            } finally {
                writer.close();
            }
        };
    }

    /**
     * Escape a single CSV row with proper quoting.
     */
    private String escapeCsvRow(AccessLogResponse entry) {
        StringBuilder sb = new StringBuilder();
        sb.append("\"").append(entry.getId()).append("\"");
        sb.append(",\"").append(csvEscape(entry.getUsername())).append("\"");
        sb.append(",\"").append(csvEscape(entry.getAction())).append("\"");
        sb.append(",\"").append(csvEscape(entry.getType() != null ? entry.getType().getValue() : "")).append("\"");
        sb.append(",\"").append(csvEscape(entry.getSeverity() != null ? entry.getSeverity().getValue() : "")).append("\"");
        sb.append(",\"").append(csvEscape(entry.getTargetResource())).append("\"");
        sb.append(",\"").append(csvEscape(entry.getRequestPath())).append("\"");
        sb.append(",\"").append(entry.getResponseCode() != null ? entry.getResponseCode() : "").append("\"");
        sb.append(",\"").append(entry.getDurationMs() != null ? entry.getDurationMs() : "").append("\"");
        sb.append(",\"").append(csvEscape(entry.getIpAddress())).append("\"");
        sb.append(",\"").append(csvEscape(entry.getUserAgent())).append("\"");
        sb.append(",\"").append(csvEscape(entry.getStatus().name())).append("\"");
        sb.append(",\"").append(csvEscape(entry.getDetail())).append("\"");
        sb.append(",\"").append(csvEscape(entry.getCreatedAt() != null ? entry.getCreatedAt().toString() : "")).append("\"");
        sb.append("\n");
        return sb.toString();
    }

    private String csvEscape(String value) {
        if (value == null) return "";
        return value.replace("\"", "\"\"");
    }

    // ── Alert threshold — G4 ─────────────────────────────────────────

    /**
     * Check for login failure alerts.
     * BR-028: Alert when >=5 login failures (type=login, severity=warning) in 1 hour.
     */
    @Transactional(readOnly = true)
    public int alertOnFailures() {
        LocalDateTime window = LocalDateTime.now().minusHours(ALERT_WINDOW_HOURS);
        long failureCount = repository.countByTypeAndSeverityAndCreatedAtAfter(
                com.hanghai.kchtg.accesslog.enums.LogType.LOGIN,
                com.hanghai.kchtg.accesslog.enums.LogSeverity.WARNING,
                window);

        if (failureCount >= ALERT_THRESHOLD) {
            log.warn("ALERT: {} login failures detected in the last {} hour(s) (threshold: {})",
                    failureCount, ALERT_WINDOW_HOURS, ALERT_THRESHOLD);
        }

        return (int) failureCount;
    }

    /**
     * Alias for checkFailureAlerts().
     */
    @Transactional(readOnly = true)
    public int checkFailureAlerts() {
        return alertOnFailures();
    }

    // ── Retention policy — G5 ────────────────────────────────────────

    /**
     * Get current retention policy.
     */
    @Transactional(readOnly = true)
    public Optional<LogRetentionPolicy> getRetentionPolicy() {
        return retentionPolicyRepository.findActive();
    }

    /**
     * Update retention policy (only system-admin allowed at controller level).
     */
    @Transactional
    public Optional<LogRetentionPolicy> updateRetentionPolicy(LogRetentionPolicy policy) {
        Optional<LogRetentionPolicy> existing = retentionPolicyRepository.findActive();
        if (existing.isPresent()) {
            LogRetentionPolicy current = existing.get();
            current.setRetentionDays(policy.getRetentionDays());
            current.setMaxExportRows(policy.getMaxExportRows());
            current.setCleanupSchedule(policy.getCleanupSchedule());
            current.setIsActive(policy.getIsActive());
            retentionPolicyRepository.save(current);
            log.info("Retention policy updated: retentionDays={}, maxExportRows={}",
                    current.getRetentionDays(), current.getMaxExportRows());
            return Optional.of(current);
        }
        // No existing policy — create a new one
        policy.setIsActive(true);
        retentionPolicyRepository.save(policy);
        log.info("New retention policy created: retentionDays={}", policy.getRetentionDays());
        return Optional.of(policy);
    }

    /**
     * Delete old logs based on retention policy.
     * Uses entity value if available; falls back to 90 days.
     */
    @Transactional
    public void cleanupOldLogs() {
        int retentionDays = getEffectiveRetentionDays();
        LocalDateTime threshold = LocalDateTime.now().minusDays(retentionDays);
        long deleted = repository.deleteByCreatedAtBefore(threshold);
        log.info("Cleaned up {} access logs older than {} days", deleted, retentionDays);
    }

    /**
     * Get effective retention days: entity value → env var → default 90.
     */
    private int getEffectiveRetentionDays() {
        return retentionPolicyRepository.findActive()
                .map(LogRetentionPolicy::getRetentionDays)
                .orElse(90);
    }

    // ── Aggregate statistics — G6 ────────────────────────────────────

    /**
     * Get daily stats for today (legacy method, kept for backward compat).
     */
    @Transactional(readOnly = true)
    public List<Object[]> getDailyStats() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        LocalDateTime endOfDay = LocalDate.now().atTime(LocalTime.MAX);
        return repository.countByStatusGroupedByStatus(startOfDay, endOfDay);
    }

    /**
     * Get total log count.
     */
    @Transactional(readOnly = true)
    public long getTotalCount() {
        return repository.count();
    }

    /**
     * Compute aggregate statistics for a specific date and persist to LogAggregate entity.
     */
    @Transactional
    public LogAggregate computeDailyAggregate(LocalDate date) {
        LocalDateTime startOfDay = date.atStartOfDay();
        LocalDateTime endOfDay = date.plusDays(1).atStartOfDay();

        List<Object[]> stats = repository.aggregateDailyStats(startOfDay, endOfDay);
        long totalAccesses = 0L;
        long uniqueUsers = 0L;
        int avgDuration = 0;

        if (stats != null && !stats.isEmpty()) {
            Object[] row = stats.get(0);
            if (row[0] != null) totalAccesses = ((Number) row[0]).longValue();
            if (row[1] != null) uniqueUsers = ((Number) row[1]).longValue();
            if (row[2] != null) avgDuration = ((Number) row[2]).intValue();
        }

        // Success rate
        long successCount = repository.countByCreatedAtBetweenAndStatus(
                startOfDay, endOfDay, AccessLogStatus.SUCCESS);
        BigDecimal successRate = BigDecimal.ZERO;
        if (totalAccesses > 0) {
            successRate = BigDecimal.valueOf(successCount)
                    .multiply(BigDecimal.valueOf(100))
                    .divide(BigDecimal.valueOf(totalAccesses), 2, BigDecimal.ROUND_HALF_UP);
        }

        // Upsert: update existing or create new
        Optional<LogAggregate> existing = aggregateRepository.findByDate(date);
        LogAggregate aggregate;
        if (existing.isPresent()) {
            aggregate = existing.get();
        } else {
            aggregate = new LogAggregate();
            aggregate.setCreatedAt(LocalDateTime.now());
        }

        aggregate.setDate(date);
        aggregate.setTotalAccesses(totalAccesses);
        aggregate.setUniqueUsers(uniqueUsers);
        aggregate.setSuccessRate(successRate);
        aggregate.setAvgDuration(avgDuration);

        LogAggregate saved = aggregateRepository.save(aggregate);
        log.info("Aggregate computed for {}: total={}, unique={}, successRate={}, avgDuration={}",
                date, totalAccesses, uniqueUsers, successRate, avgDuration);
        return saved;
    }

    /**
     * List all aggregates, optionally filtered by date range.
     */
    @Transactional(readOnly = true)
    public List<LogAggregateResponse> listAggregates(Optional<LocalDate> from, Optional<LocalDate> to) {
        List<LogAggregate> aggregates;
        if (from.isPresent() && to.isPresent()) {
            aggregates = aggregateRepository.findByDateBetween(from.get(), to.get());
        } else if (from.isPresent()) {
            aggregates = aggregateRepository.findByDateAfter(from.get());
        } else if (to.isPresent()) {
            aggregates = aggregateRepository.findByDateBefore(to.get());
        } else {
            aggregates = aggregateRepository.findAll(Sort.by("date").descending());
        }

        return aggregates.stream().map(a -> {
            LogAggregateResponse resp = new LogAggregateResponse();
            resp.setId(a.getId());
            resp.setDate(a.getDate().toString());
            resp.setTotalAccesses(a.getTotalAccesses());
            resp.setUniqueUsers(a.getUniqueUsers());
            resp.setSuccessRate(a.getSuccessRate() != null ? a.getSuccessRate().toString() : "0.00");
            resp.setAvgDuration(a.getAvgDuration());
            resp.setCreatedAt(a.getCreatedAt() != null ? a.getCreatedAt().toString() : null);
            return resp;
        }).toList();
    }
}
