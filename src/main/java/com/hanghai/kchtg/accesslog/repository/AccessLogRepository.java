package com.hanghai.kchtg.accesslog.repository;

import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import com.hanghai.kchtg.accesslog.enums.LogSeverity;
import com.hanghai.kchtg.accesslog.enums.LogType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Data access for {@link AccessLog} entities.
 */
public interface AccessLogRepository extends JpaRepository<AccessLog, UUID>,
        JpaSpecificationExecutor<AccessLog> {

    List<AccessLog> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<AccessLog> findByModuleOrderByCreatedAtDesc(String module);

    List<AccessLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime from, LocalDateTime to);

    @Modifying
    @Query("DELETE FROM AccessLog a WHERE a.createdAt < :threshold")
    long deleteByCreatedAtBefore(@Param("threshold") LocalDateTime threshold);

    long countByTypeAndSeverityAndCreatedAtAfter(
            @Param("type") LogType type,
            @Param("severity") LogSeverity severity,
            @Param("after") LocalDateTime after);

    @Query("SELECT a.status, COUNT(a) FROM AccessLog a WHERE a.createdAt BETWEEN :start AND :end GROUP BY a.status")
    List<Object[]> countByStatusGroupedByStatus(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    long countByCreatedAtAfter(LocalDateTime since);

    long countByStatus(AccessLogStatus status);

    long countByStatusAndCreatedAtAfter(
            @Param("status") AccessLogStatus status,
            @Param("since") LocalDateTime since);

    @Query("""
            SELECT COUNT(a), COUNT(DISTINCT a.userId),
                   CASE WHEN COUNT(a) > 0 THEN CAST(SUM(a.durationMs) AS INTEGER) / COUNT(a) ELSE 0 END
            FROM AccessLog a
            WHERE a.createdAt >= :startOfDay AND a.createdAt < :endOfDay
            """)
    List<Object[]> aggregateDailyStats(
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay);

    long countByCreatedAtBetweenAndStatus(
            LocalDateTime start, LocalDateTime end,
            AccessLogStatus status);
}
