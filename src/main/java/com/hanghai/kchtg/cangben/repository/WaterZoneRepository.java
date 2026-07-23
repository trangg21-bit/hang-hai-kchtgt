package com.hanghai.kchtg.cangben.repository;

import com.hanghai.kchtg.cangben.entity.WaterZone;
import com.hanghai.kchtg.cangben.entity.LoaiVungNuoc;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WaterZoneRepository extends JpaRepository<WaterZone, UUID> {

    Optional<WaterZone> findByWaterZoneCode(String waterZoneCode);

    boolean existsByWaterZoneCode(String waterZoneCode);

    @Query("SELECT w FROM WaterZone w WHERE w.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR w.orgUnitId = :orgUnitId)")
    Page<WaterZone> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    @Query("SELECT w FROM WaterZone w WHERE w.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR w.orgUnitId = :orgUnitId) " +
            "AND (:portId IS NULL OR w.portId = :portId)")
    Page<WaterZone> findAllActive(@Param("orgUnitId") UUID orgUnitId,
                                  @Param("portId") UUID portId,
                                  Pageable pageable);

    @Query("SELECT w FROM WaterZone w WHERE w.deletedAt IS NULL AND w.portId = :portId")
    List<WaterZone> findByPortIdAndDeletedAtIsNull(@Param("portId") UUID portId);

    @Query("SELECT COUNT(w) FROM WaterZone w WHERE w.deletedAt IS NULL AND w.portId = :portId")
    long countByPortIdAndDeletedAtIsNull(@Param("portId") UUID portId);

    long countByApprovalStatusAndDeletedAtIsNull(TrangThaiPheDuyet approvalStatus);

    @Query("SELECT w FROM WaterZone w WHERE w.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR w.orgUnitId = :orgUnitId) " +
            "AND (:portId IS NULL OR w.portId = :portId) " +
            "AND (CAST(:search AS string) IS NULL OR (LOWER(w.waterZoneCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(w.waterZoneName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))) " +
            "AND (:waterZoneType IS NULL OR w.waterZoneType = :waterZoneType) " +
            "AND (:operationalStatus IS NULL OR w.operationalStatus = :operationalStatus) " +
            "AND (:approvalStatus IS NULL OR w.approvalStatus = :approvalStatus)")
    Page<WaterZone> searchWaterZones(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("portId") UUID portId,
            @Param("search") String search,
            @Param("waterZoneType") LoaiVungNuoc waterZoneType,
            @Param("operationalStatus") TrangThaiHoatDong operationalStatus,
            @Param("approvalStatus") TrangThaiPheDuyet approvalStatus,
            Pageable pageable);
}
