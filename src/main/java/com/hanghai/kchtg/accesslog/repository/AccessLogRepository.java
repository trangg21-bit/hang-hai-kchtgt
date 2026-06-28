package com.hanghai.kchtg.accesslog.repository;

import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.enums.LogSeverity;
import com.hanghai.kchtg.accesslog.enums.LogType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Data access for {@link AccessLog} entities.
 * <p>
 * Exposes custom query methods for filtering by new F-005 fields
 * (type, severity, keyword) plus the original dimension queries.
 * </p>
 */
public interface AccessLogRepository extends JpaRepository<AccessLog, Long>,
        JpaSpecificationExecutor<AccessLog> {

    // ── Original queries (unchanged) ──────────────────────────────────

    /** Find all log entries for a given user, ordered newest-first. */
    List<AccessLog> findByUserIdOrderByCreatedAtDesc(Long userId);

    /** Find all log entries for a given module, ordered newest-first. */
    List<AccessLog> findByModuleOrderByCreatedAtDesc(String module);

    /** Find all log entries created within a date/time range (inclusive). */
    List<AccessLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime from, LocalDateTime to);

    /** Delete all logs created before the given threshold. */
    @Modifying
    @Query("DELETE FROM AccessLog a WHERE a.createdAt < :threshold")
    long deleteByCreatedAtBefore(@Param("threshold") LocalDateTime threshold);

    // ── F-005 new query methods ───────────────────────────────────────

    /**
     * Count login failures (type=login, severity=warning) in the given window.
     * Used by BR-028 alert logic.
     */
    long countByTypeAndSeverityAndCreatedAtAfter(
            @Param("type") LogType type,
            @Param("severity") LogSeverity severity,
            @Param("after") LocalDateTime after);

    /**
     * Count all log entries grouped by status in a time range.
     */
    @Query("SELECT a.status, COUNT(a) FROM AccessLog a WHERE a.createdAt BETWEEN :start AND :end GROUP BY a.status")
    List<Object[]> countByStatusGroupedByStatus(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /** Count all log entries created after a specific time. */
    long countByCreatedAtAfter(LocalDateTime since);

    /** Count all log entries by status. */
    long countByStatus(com.hanghai.kchtg.accesslog.entity.AccessLogStatus status);

    // ── Aggregation helpers for LogAggregate ──────────────────────────

    /**
     * Aggregate daily stats for a given date.
     * Returns: [totalAccesses, uniqueUsers, avgDuration]
     */
    @Query("""
            SELECT COUNT(a), COUNT(DISTINCT a.userId),
                   CASE WHEN COUNT(a) > 0 THEN CAST(SUM(a.durationMs) AS INTEGER) / COUNT(a) ELSE 0 END
            FROM AccessLog a
            WHERE a.createdAt >= :startOfDay AND a.createdAt < :endOfDay
            """)
    List<Object[]> aggregateDailyStats(
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay);

    /**
     * Count successful accesses in a date range.
     */
    long countByCreatedAtBetweenAndStatus(
            LocalDateTime start, LocalDateTime end,
            com.hanghai.kchtg.accesslog.entity.AccessLogStatus status);
}
