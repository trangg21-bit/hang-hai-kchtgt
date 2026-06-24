package com.hanghai.kchtg.common.entity;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for {@link AuditLog} entities.
 */
public interface AuditLogRepository extends JpaRepository<AuditLog, UUID> {

    /**
     * Finds audit logs for a specific user, ordered by most recent first.
     */
    @Query("SELECT a FROM AuditLog a WHERE a.userId = :userId ORDER BY a.createdAt DESC")
    List<AuditLog> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * Finds audit logs within a time range.
     */
    @Query("SELECT a FROM AuditLog a WHERE a.createdAt BETWEEN :start AND :end ORDER BY a.createdAt DESC")
    List<AuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

    /**
     * Finds audit logs for a specific action.
     */
    @Query("SELECT a FROM AuditLog a WHERE a.action = :action ORDER BY a.createdAt DESC")
    List<AuditLog> findByAction(String action);

    /**
     * Counts audit logs for a specific action.
     */
    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.action = :action")
    long countByAction(String action);
}