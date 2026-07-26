package com.hanghai.kchtg.station.repository;

import java.util.UUID;
import java.util.UUID;

import com.hanghai.kchtg.station.entity.CoastalStationCospasSarsat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import com.hanghai.kchtg.station.entity.StationApprovalStatus;

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

    @Query("SELECT c FROM CoastalStationCospasSarsat c WHERE " +
            "c.deletedAt IS NULL AND " +
            "c.approvalStatus = StationApprovalStatus.APPROVED_L2 AND " +
            "(:orgUnitId IS NULL OR c.unitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(c.name) LIKE :search OR LOWER(c.code) LIKE :search)")
    List<CoastalStationCospasSarsat> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
