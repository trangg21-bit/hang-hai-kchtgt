package com.hanghai.kchtg.beacon.repository;

import com.hanghai.kchtg.beacon.entity.BeaconHistory;
import com.hanghai.kchtg.beacon.entity.BeaconHistoryActionType;
import com.hanghai.kchtg.beacon.entity.BeaconType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.UUID;

public interface BeaconHistoryRepository extends JpaRepository<BeaconHistory, UUID> {

    Page<BeaconHistory> findByEntityIdAndBeaconType(
        UUID entityId, BeaconType beaconType, Pageable pageable);

    Page<BeaconHistory> findByEntityIdAndBeaconTypeAndActionType(
        UUID entityId, BeaconType beaconType, BeaconHistoryActionType actionType, Pageable pageable);

    @Query("SELECT h FROM BeaconHistory h WHERE h.entityId = :entityId " +
           "AND h.beaconType = :beaconType " +
           "AND h.changedAt BETWEEN :from AND :to ORDER BY h.changedAt DESC")
    Page<BeaconHistory> findByDateRange(
        @Param("entityId") UUID entityId,
        @Param("beaconType") BeaconType beaconType,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to,
        Pageable pageable
    );

    Page<BeaconHistory> findByBeaconType(
        BeaconType beaconType, Pageable pageable);

    Page<BeaconHistory> findByBeaconTypeAndActionType(
        BeaconType beaconType, BeaconHistoryActionType actionType, Pageable pageable);

    @Query("SELECT h FROM BeaconHistory h WHERE h.beaconType = :beaconType " +
           "AND h.changedAt BETWEEN :from AND :to ORDER BY h.changedAt DESC")
    Page<BeaconHistory> findByBeaconTypeAndDateRange(
        @Param("beaconType") BeaconType beaconType,
        @Param("from") LocalDateTime from,
        @Param("to") LocalDateTime to,
        Pageable pageable
    );

    long countByEntityIdAndBeaconType(UUID entityId, BeaconType beaconType);
}
