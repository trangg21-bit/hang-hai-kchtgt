package com.hanghai.kchtg.accesslog.repository;

import com.hanghai.kchtg.accesslog.entity.AccessLog;
import com.hanghai.kchtg.accesslog.entity.AccessLogStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Data access for {@link AccessLog} entities.
 * <p>
 * Exposes custom query methods for the common filter dimensions in the
 * read-only API. Complex multi-field filtering at runtime is delegated to
 * {@link JpaSpecificationExecutor}.
 * </p>
 */
public interface AccessLogRepository extends JpaRepository<AccessLog, UUID>,
        JpaSpecificationExecutor<AccessLog> {

    /**
     * Find all log entries for a given user, ordered newest-first.
     */
    List<AccessLog> findByUserIdOrderByCreatedAtDesc(UUID userId);

    /**
     * Find all log entries for a given module, ordered newest-first.
     */
    List<AccessLog> findByModuleOrderByCreatedAtDesc(String module);

    /**
     * Find all log entries created within a date/time range (inclusive).
     */
    List<AccessLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime from, LocalDateTime to);

    /**
     * Delete all logs created before the given threshold.
     */
    long deleteByCreatedAtBefore(LocalDateTime createdAtBefore);

    /**
     * Count logs by status within a time range.
     */
    long countByStatusAndCreatedAtAfter(AccessLogStatus status, LocalDateTime after);

    /**
     * Count logs grouped by status in a time range (returns [{status, count}]).
     */
    @Query("SELECT a.status, COUNT(a) FROM AccessLog a WHERE a.createdAt BETWEEN :start AND :end GROUP BY a.status")
    List<Object[]> countByStatusGroupedByStatus(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    /**
     * Count logs created after a specific time.
     */
    long countByCreatedAtAfter(LocalDateTime since);

    /**
     * Count logs by status.
     */
    long countByStatus(AccessLogStatus status);
}