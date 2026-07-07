package com.hanghai.kchtg.cangben.repository;

import com.hanghai.kchtg.cangben.entity.LichSuThayDoi;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Repository for LichSuThayDoi (Change History) audit records.
 * INSERT-only; no UPDATE or DELETE operations.
 */
@Repository
public interface LichSuThayDoiRepository extends JpaRepository<LichSuThayDoi, UUID> {

    /**
     * Find all change history records for a specific entity,
     * ordered by changed_at DESC (most recent first).
     *
     * @param entityType  entity type (e.g. "BenCang", "CangBien")
     * @param entityId    entity UUID as string
     * @return list of LichSuThayDoi records in reverse chronological order
     */
    @Query("SELECT l FROM LichSuThayDoi l WHERE l.entityType = :entityType AND l.entityId = :entityId ORDER BY l.changedAt DESC")
    List<LichSuThayDoi> findByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") String entityId);

    /**
     * Find change history records by entity type and entity ID
     * within a date range, ordered by changed_at DESC.
     *
     * @param entityType  entity type
     * @param entityId    entity UUID as string
     * @param startDate   start of date range (inclusive)
     * @param endDate     end of date range (inclusive)
     * @return list of LichSuThayDoi records matching the criteria
     */
    @Query("SELECT l FROM LichSuThayDoi l WHERE l.entityType = :entityType AND l.entityId = :entityId " +
            "AND l.changedAt >= :startDate AND l.changedAt <= :endDate ORDER BY l.changedAt DESC")
    List<LichSuThayDoi> findByEntityTypeAndEntityIdAndDateRange(
            @Param("entityType") String entityType,
            @Param("entityId") String entityId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    /**
     * Find all change records for a specific entity type,
     * ordered by changed_at DESC.
     *
     * @param entityType entity type
     * @return list of LichSuThayDoi records
     */
    @Query("SELECT l FROM LichSuThayDoi l WHERE l.entityType = :entityType ORDER BY l.changedAt DESC")
    List<LichSuThayDoi> findByEntityType(@Param("entityType") String entityType);

    /**
     * Find all change records created by a specific user,
     * ordered by changed_at DESC.
     *
     * @param changedBy user UUID
     * @return list of LichSuThayDoi records
     */
    @Query("SELECT l FROM LichSuThayDoi l WHERE l.changedBy = :changedBy ORDER BY l.changedAt DESC")
    List<LichSuThayDoi> findByChangedBy(@Param("changedBy") String changedBy);
}
