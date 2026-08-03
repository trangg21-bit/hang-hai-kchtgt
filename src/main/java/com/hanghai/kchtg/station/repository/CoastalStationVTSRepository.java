package com.hanghai.kchtg.station.repository;

import com.hanghai.kchtg.station.entity.CoastalStationVTS;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CoastalStationVTSRepository extends JpaRepository<CoastalStationVTS, UUID> {

    @Query("SELECT c FROM CoastalStationVTS c WHERE c.code = :code AND c.deletedAt IS NULL")
    Optional<CoastalStationVTS> findByCode(@Param("code") String code);

    @Query("SELECT c FROM CoastalStationVTS c WHERE c.deletedAt IS NULL")
    List<CoastalStationVTS> findAllActive();

    @Query("SELECT c FROM CoastalStationVTS c WHERE c.id = :id")
    Optional<CoastalStationVTS> findByIdIgnoreDeleted(@Param("id") UUID id);

    @Query("SELECT c FROM CoastalStationVTS c WHERE c.deletedAt IS NULL AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.code) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<CoastalStationVTS> search(@Param("keyword") String keyword);

    @Query("SELECT c FROM CoastalStationVTS c WHERE " +
            "c.deletedAt IS NULL AND " +
            "c.approvalStatus = StationApprovalStatus.APPROVED_L2 AND " +
            "(:orgUnitId IS NULL OR c.unitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(c.name) LIKE :search OR LOWER(c.code) LIKE :search)")
    List<CoastalStationVTS> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
