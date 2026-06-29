package com.hanghai.kchtg.station.repository;
import java.util.UUID;

import com.hanghai.kchtg.station.entity.CoastalStationCospasSarsat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository for CoastalStationCospasSarsat entity (F-105).
 */
@Repository
public interface CoastalStationCospasSarsatRepository extends JpaRepository<CoastalStationCospasSarsat, UUID> {

    @Query("SELECT c FROM CoastalStationCospasSarsat c WHERE c.code = :code AND c.deletedAt IS NULL")
    Optional<CoastalStationCospasSarsat> findByCode(@Param("code") String code);

    @Query("SELECT c FROM CoastalStationCospasSarsat c WHERE c.deletedAt IS NULL")
    List<CoastalStationCospasSarsat> findAllActive();

    @Query("SELECT c FROM CoastalStationCospasSarsat c WHERE c.deletedAt IS NULL AND " +
            "(LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.code) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<CoastalStationCospasSarsat> search(@Param("keyword") String keyword);

    @Query("SELECT c FROM CoastalStationCospasSarsat c WHERE c.deletedAt IS NULL")
    List<CoastalStationCospasSarsat> findByDeletedAtIsNull();
}
