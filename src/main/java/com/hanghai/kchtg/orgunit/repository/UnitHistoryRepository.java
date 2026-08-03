package com.hanghai.kchtg.orgunit.repository;

import com.hanghai.kchtg.orgunit.entity.UnitHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for {@link UnitHistory} audit trail queries.
 */
@Repository
public interface UnitHistoryRepository extends JpaRepository<UnitHistory, UUID> {

    /**
     * Find all history records for a specific unit, ordered by performedAt descending.
     */
    List<UnitHistory> findByUnitIdOrderByPerformedAtDesc(UUID unitId);

    /**
     * Paginated history for a specific unit.
     */
    Page<UnitHistory> findByUnitIdOrderByPerformedAtDesc(UUID unitId, Pageable pageable);

    /**
     * Find all history records for a unit filtered by action type.
     */
    @Query("SELECT h FROM UnitHistory h WHERE h.unitId = :unitId AND h.action = :action ORDER BY h.performedAt DESC")
    List<UnitHistory> findByUnitIdAndActionOrderByPerformedAtDesc(
            @Param("unitId") UUID unitId,
            @Param("action") String action);

    /**
     * Count history records for a unit.
     */
    long countByUnitId(UUID unitId);
}
