package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.ChangeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for ChangeLog (Change History) audit records.
 * INSERT-only; no UPDATE or DELETE operations.
 */
@Repository
public interface ChangeLogRepository extends JpaRepository<ChangeLog, UUID> {

    @Query("SELECT c FROM ChangeLog c WHERE c.entityType = :entityType AND c.entityId = :entityId ORDER BY c.changedAt DESC")
    List<ChangeLog> findByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") String entityId);

    @Query("SELECT c FROM ChangeLog c WHERE c.entityType = :entityType AND c.entityId = :entityId " +
            "AND c.changedAt >= :startDate AND c.changedAt <= :endDate ORDER BY c.changedAt DESC")
    List<ChangeLog> findByEntityTypeAndEntityIdAndDateRange(
            @Param("entityType") String entityType,
            @Param("entityId") String entityId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT c FROM ChangeLog c WHERE c.entityType = :entityType ORDER BY c.changedAt DESC")
    List<ChangeLog> findByEntityType(@Param("entityType") String entityType);

    @Query("SELECT c FROM ChangeLog c WHERE c.changedBy = :changedBy ORDER BY c.changedAt DESC")
    List<ChangeLog> findByChangedBy(@Param("changedBy") String changedBy);
}
