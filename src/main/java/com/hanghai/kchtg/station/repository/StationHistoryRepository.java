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
    Page<StationHistory> findByEntityIdAndStationType(UUID entityId, String stationType, Pageable pageable);

    Page<StationHistory> findByEntityIdAndStationTypeAndActionType(
            UUID entityId, String stationType, String actionType, Pageable pageable);

    @Query("SELECT h FROM StationHistory h WHERE h.entityId = :entityId AND h.stationType = :stationType AND h.changedAt BETWEEN :from AND :to")
    Page<StationHistory> findByDateRange(
            @Param("entityId") UUID entityId,
            @Param("stationType") String stationType,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    Page<StationHistory> findByStationTypeAndActionType(String stationType, String actionType, Pageable pageable);

    @Query("SELECT h FROM StationHistory h WHERE h.stationType = :stationType AND h.changedAt BETWEEN :from AND :to")
    Page<StationHistory> findByStationTypeAndDateRange(
            @Param("stationType") String stationType,
            @Param("from") LocalDateTime from,
            @Param("to") LocalDateTime to,
            Pageable pageable);

    Page<StationHistory> findByStationType(String stationType, Pageable pageable);
}
