package com.hanghai.kchtg.station.repository;

import com.hanghai.kchtg.station.entity.StationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface StationHistoryRepository extends JpaRepository<StationHistory, UUID> {
    Page<StationHistory> findByEntityIdAndTramType(UUID entityId, String tramType, Pageable pageable);

    Page<StationHistory> findByEntityIdAndTramTypeAndActionType(
            UUID entityId, String tramType, String actionType, Pageable pageable);

    @Query("SELECT h FROM StationHistory h WHERE h.entityId = :entityId AND h.tramType = :tramType AND h.changedAt BETWEEN :from AND :to")
    Page<StationHistory> findByDateRange(
            @Param("entityId") UUID entityId,
            @Param("tramType") String tramType,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    Page<StationHistory> findByTramTypeAndActionType(String tramType, String actionType, Pageable pageable);

    @Query("SELECT h FROM StationHistory h WHERE h.tramType = :tramType AND h.changedAt BETWEEN :from AND :to")
    Page<StationHistory> findByTramTypeAndDateRange(
            @Param("tramType") String tramType,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    Page<StationHistory> findByTramType(String tramType, Pageable pageable);
}
