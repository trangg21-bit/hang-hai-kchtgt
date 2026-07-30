package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.port.entity.ApprovalLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for ApprovalLog (Approval Decision Log) audit records.
 * INSERT-only; no UPDATE or DELETE operations.
 */
@Repository
public interface ApprovalLogRepository extends JpaRepository<ApprovalLog, UUID> {

    @Query("SELECT a FROM ApprovalLog a WHERE a.entityType = :entityType AND a.entityId = :entityId ORDER BY a.decidedAt DESC")
    List<ApprovalLog> findByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") String entityId);

    @Query("SELECT a FROM ApprovalLog a WHERE a.entityType = :entityType AND a.entityId = :entityId " +
            "AND a.decidedAt >= :startDate AND a.decidedAt <= :endDate ORDER BY a.decidedAt DESC")
    List<ApprovalLog> findByEntityTypeAndEntityIdAndDateRange(
            @Param("entityType") String entityType,
            @Param("entityId") String entityId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("SELECT a FROM ApprovalLog a WHERE a.entityType = :entityType ORDER BY a.decidedAt DESC")
    List<ApprovalLog> findByEntityType(@Param("entityType") String entityType);

    @Query("SELECT a FROM ApprovalLog a WHERE a.decidedBy = :decidedBy ORDER BY a.decidedAt DESC")
    List<ApprovalLog> findByDecidedBy(@Param("decidedBy") String decidedBy);

    @Query("SELECT a FROM ApprovalLog a WHERE a.entityType = :entityType AND a.entityId = :entityId " +
            "ORDER BY a.decidedAt DESC LIMIT 1")
    List<ApprovalLog> findMostRecentByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") String entityId);
}
