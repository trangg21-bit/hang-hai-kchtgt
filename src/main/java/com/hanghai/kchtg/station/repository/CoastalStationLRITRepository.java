package com.hanghai.kchtg.station.repository;

import com.hanghai.kchtg.station.entity.CoastalStationLRIT;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CoastalStationLRITRepository extends JpaRepository<CoastalStationLRIT, UUID> {

    @Query("SELECT c FROM CoastalStationLRIT c WHERE c.terminalId = :terminalId AND c.deletedAt IS NULL")
    Optional<CoastalStationLRIT> findByTerminalId(@Param("terminalId") String terminalId);

    @Query("SELECT c FROM CoastalStationLRIT c WHERE c.imoNumber = :imoNumber AND c.deletedAt IS NULL")
    Optional<CoastalStationLRIT> findByImoNumber(@Param("imoNumber") String imoNumber);

    @Query("SELECT c FROM CoastalStationLRIT c WHERE c.deletedAt IS NULL")
    List<CoastalStationLRIT> findAllActive();

    @Query("SELECT c FROM CoastalStationLRIT c WHERE c.deletedAt IS NULL AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.terminalId) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<CoastalStationLRIT> search(@Param("keyword") String keyword);

    @Query("SELECT c FROM CoastalStationLRIT c WHERE c.deletedAt IS NULL")
    List<CoastalStationLRIT> findByDeletedAtIsNull();

    @Query("SELECT c FROM CoastalStationLRIT c WHERE " +
            "c.deletedAt IS NULL AND " +
            "c.approvalStatus = ApprovalStatus.APPROVED_LEVEL2 AND " +
            "(:orgUnitId IS NULL OR c.unitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(c.name) LIKE :search OR LOWER(c.code) LIKE :search)")
    List<CoastalStationLRIT> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
