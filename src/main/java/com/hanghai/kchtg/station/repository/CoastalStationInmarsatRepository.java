package com.hanghai.kchtg.station.repository;
import java.util.UUID;

import com.hanghai.kchtg.station.entity.CoastalStationInmarsat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for CoastalStationInmarsat entity (F-099).
 */
@Repository
public interface CoastalStationInmarsatRepository extends JpaRepository<CoastalStationInmarsat, UUID> {

    @Query("SELECT c FROM CoastalStationInmarsat c WHERE c.deviceCode = :deviceCode AND c.deletedAt IS NULL")
    Optional<CoastalStationInmarsat> findByDeviceCode(@Param("deviceCode") String deviceCode);

    @Query("SELECT c FROM CoastalStationInmarsat c WHERE c.deletedAt IS NULL")
    List<CoastalStationInmarsat> findAllActive();

    @Query("SELECT c FROM CoastalStationInmarsat c WHERE c.deletedAt IS NULL AND " +
            "(LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.deviceCode) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.code) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<CoastalStationInmarsat> search(@Param("keyword") String keyword);

    @Query("SELECT c FROM CoastalStationInmarsat c WHERE c.deletedAt IS NULL")
    List<CoastalStationInmarsat> findByDeletedAtIsNull();
}
