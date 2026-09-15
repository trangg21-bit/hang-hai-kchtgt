package com.hanghai.kchtg.coastalstationasset.repository;

import com.hanghai.kchtg.coastalstationasset.entity.CoastalStationAsset;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CoastalStationAssetRepository extends JpaRepository<CoastalStationAsset, UUID>, JpaSpecificationExecutor<CoastalStationAsset> {
    Optional<CoastalStationAsset> findByAssetCode(String assetCode);

    @Query("""
            SELECT CASE
                     WHEN a.deletedAt IS NOT NULL OR a.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
                     THEN com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
                     ELSE a.approvalStatus
                   END,
                   COUNT(a)
            FROM CoastalStationAsset a
            WHERE (:assetCode IS NULL OR LOWER(a.assetCode) LIKE LOWER(CONCAT('%', :assetCode, '%')))
              AND (:assetName IS NULL OR LOWER(a.assetName) LIKE LOWER(CONCAT('%', :assetName, '%')))
              AND (:parentOrgUnitId IS NULL OR a.parentOrgUnitId = :parentOrgUnitId)
              AND (:orgUnitId IS NULL OR a.orgUnitId = :orgUnitId)
              AND (:usingOrgUnitId IS NULL OR a.usingOrgUnitId = :usingOrgUnitId)
              AND (:stationId IS NULL OR a.stationId = :stationId OR a.daiTtdhId = :stationId OR a.inmarsatId = :stationId)
              AND (:assetCondition IS NULL OR a.assetCondition = :assetCondition)
              AND (:assetType IS NULL OR a.assetType = :assetType)
              AND (:updatedFrom IS NULL OR a.updatedAt >= :updatedFrom)
              AND (:updatedTo IS NULL OR a.updatedAt < :updatedTo)
            GROUP BY CASE
                       WHEN a.deletedAt IS NOT NULL OR a.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
                       THEN com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
                       ELSE a.approvalStatus
                     END
            """)
    List<Object[]> countByApprovalStatus(
            @Param("assetCode") String assetCode,
            @Param("assetName") String assetName,
            @Param("parentOrgUnitId") UUID parentOrgUnitId,
            @Param("orgUnitId") UUID orgUnitId,
            @Param("usingOrgUnitId") UUID usingOrgUnitId,
            @Param("stationId") UUID stationId,
            @Param("assetCondition") String assetCondition,
            @Param("assetType") String assetType,
            @Param("updatedFrom") LocalDateTime updatedFrom,
            @Param("updatedTo") LocalDateTime updatedTo);
}
