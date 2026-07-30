package com.hanghai.kchtg.station.repository;

import com.hanghai.kchtg.station.entity.CoastalStationHaiphong;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CoastalStationHaiphongRepository extends JpaRepository<CoastalStationHaiphong, UUID> {

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE c.code = :code AND c.deletedAt IS NULL")
    Optional<CoastalStationHaiphong> findByCode(@Param("code") String code);

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE c.portName = :portName AND c.deletedAt IS NULL")
    List<CoastalStationHaiphong> findByPortName(@Param("portName") String portName);

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE c.deletedAt IS NULL")
    List<CoastalStationHaiphong> findAllActive();

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE c.deletedAt IS NULL AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.portName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<CoastalStationHaiphong> search(@Param("keyword") String keyword);

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE c.deletedAt IS NULL")
    List<CoastalStationHaiphong> findByDeletedAtIsNull();

    @Query("SELECT c FROM CoastalStationHaiphong c WHERE " +
            "c.deletedAt IS NULL AND " +
            "c.approvalStatus = StationApprovalStatus.APPROVED_L2 AND " +
            "(:orgUnitId IS NULL OR c.unitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(c.name) LIKE :search OR LOWER(c.code) LIKE :search)")
    List<CoastalStationHaiphong> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
