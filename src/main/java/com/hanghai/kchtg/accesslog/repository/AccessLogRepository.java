package com.hanghai.kchtg.accesslog.repository;

import com.hanghai.kchtg.accesslog.entity.AccessLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

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
@Repository
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
}
