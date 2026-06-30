package com.hanghai.kchtg.cangben.repository;

import com.hanghai.kchtg.cangben.entity.PheDuyetLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for PheDuyetLog (Approval Decision Log) audit records.
 * INSERT-only; no UPDATE or DELETE operations.
 */
@Repository
public interface PheDuyetLogRepository extends JpaRepository<PheDuyetLog, UUID> {

    /**
     * Find all approval decision records for a specific entity,
     * ordered by decided_at DESC (most recent first).
     *
     * @param entityType  entity type (e.g. "BenCang", "CangBien")
     * @param entityId    entity UUID as string
     * @return list of PheDuyetLog records in reverse chronological order
     */
    @Query("SELECT p FROM PheDuyetLog p WHERE p.entityType = :entityType AND p.entityId = :entityId ORDER BY p.decidedAt DESC")
    List<PheDuyetLog> findByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") String entityId);

    /**
     * Find approval decision records by entity type and entity ID
     * within a date range, ordered by decided_at DESC.
     *
     * @param entityType  entity type
     * @param entityId    entity UUID as string
     * @param startDate   start of date range (inclusive)
     * @param endDate     end of date range (inclusive)
     * @return list of PheDuyetLog records matching the criteria
     */
    @Query("SELECT p FROM PheDuyetLog p WHERE p.entityType = :entityType AND p.entityId = :entityId " +
            "AND p.decidedAt >= :startDate AND p.decidedAt <= :endDate ORDER BY p.decidedAt DESC")
    List<PheDuyetLog> findByEntityTypeAndEntityIdAndDateRange(
            @Param("entityType") String entityType,
            @Param("entityId") String entityId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Find all approval decisions by entity type,
     * ordered by decided_at DESC.
     *
     * @param entityType entity type
     * @return list of PheDuyetLog records
     */
    @Query("SELECT p FROM PheDuyetLog p WHERE p.entityType = :entityType ORDER BY p.decidedAt DESC")
    List<PheDuyetLog> findByEntityType(@Param("entityType") String entityType);

    /**
     * Find all approval decisions made by a specific user,
     * ordered by decided_at DESC.
     *
     * @param decidedBy user UUID
     * @return list of PheDuyetLog records
     */
    @Query("SELECT p FROM PheDuyetLog p WHERE p.decidedBy = :decidedBy ORDER BY p.decidedAt DESC")
    List<PheDuyetLog> findByDecidedBy(@Param("decidedBy") String decidedBy);

    /**
     * Find the most recent approval decision for an entity.
     *
     * @param entityType entity type
     * @param entityId   entity UUID as string
     * @return the most recent PheDuyetLog record, or empty if none exist
     */
    @Query("SELECT p FROM PheDuyetLog p WHERE p.entityType = :entityType AND p.entityId = :entityId " +
            "ORDER BY p.decidedAt DESC LIMIT 1")
    List<PheDuyetLog> findMostRecentByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") String entityId);
}
