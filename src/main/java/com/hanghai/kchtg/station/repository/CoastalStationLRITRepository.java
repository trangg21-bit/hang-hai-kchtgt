package com.hanghai.kchtg.station.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.station.entity.CoastalStationLRIT;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CoastalStationLRITRepository extends JpaRepository<CoastalStationLRIT, UUID>, JpaSpecificationExecutor<CoastalStationLRIT> {

    @Query("SELECT c FROM CoastalStationLRIT c WHERE c.terminalId = :terminalId AND c.deletedAt IS NULL")
    Optional<CoastalStationLRIT> findByTerminalId(@Param("terminalId") String terminalId);

    @Query("SELECT c FROM CoastalStationLRIT c WHERE c.imoNumber = :imoNumber AND c.deletedAt IS NULL")
    Optional<CoastalStationLRIT> findByImoNumber(@Param("imoNumber") String imoNumber);

    @Query("SELECT c FROM CoastalStationLRIT c WHERE (c.stationCode = :code OR c.code = :code) AND c.deletedAt IS NULL")
    Optional<CoastalStationLRIT> findByCode(@Param("code") String code);

    boolean existsByCodeAndDeletedAtIsNull(String code);

    boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, UUID id);

    @Query("SELECT c FROM CoastalStationLRIT c WHERE c.deletedAt IS NULL")
    List<CoastalStationLRIT> findAllActive();

    @Query("SELECT c FROM CoastalStationLRIT c WHERE c.deletedAt IS NULL AND (LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.code) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(c.terminalId) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<CoastalStationLRIT> search(@Param("keyword") String keyword);

    @Query("SELECT c FROM CoastalStationLRIT c WHERE c.deletedAt IS NULL")
    List<CoastalStationLRIT> findByDeletedAtIsNull();

    @Query("""
        SELECT t FROM CoastalStationLRIT t
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds OR t.unitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId OR t.unitId = :orgUnitId)
          AND (:operatingOrgId IS NULL OR t.operatingOrgId = :operatingOrgId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (CAST(:keyword AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(t.name, t.stationName, ''))) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(t.code, t.stationCode, ''))) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(t.locationAddress, ''))) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(t.terminalId, ''))) AS string) LIKE CAST(:keyword AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED AND t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2)
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.PENDING_APPROVAL AND t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.PROPOSED))
          AND (:updatedBy IS NULL OR t.updatedBy = :updatedBy)
          AND (CAST(:updatedFrom AS timestamp) IS NULL OR t.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS timestamp) IS NULL OR t.updatedAt <= :updatedTo)
        ORDER BY t.createdAt DESC
    """)
    Page<CoastalStationLRIT> searchPaged(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("operatingOrgId") UUID operatingOrgId,
        @Param("provinceId") Integer provinceId,
        @Param("conditionStatus") String conditionStatus,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("updatedBy") UUID updatedBy,
        @Param("updatedFrom") LocalDateTime updatedFrom,
        @Param("updatedTo") LocalDateTime updatedTo,
        Pageable pageable
    );

    @Query("""
        SELECT t.approvalStatus, COUNT(t) FROM CoastalStationLRIT t
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds OR t.unitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId OR t.unitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR (
                CAST(function('immutable_unaccent', LOWER(COALESCE(t.name, t.stationName, ''))) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(COALESCE(t.code, t.stationCode, ''))) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(COALESCE(t.locationAddress, ''))) AS string) LIKE CAST(:keyword AS string)
              ))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
        GROUP BY t.approvalStatus
    """)
    List<Object[]> countByApprovalStatus(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("conditionStatus") String conditionStatus
    );

    @Query("""
        SELECT t FROM CoastalStationLRIT t
        WHERE t.deletedAt IS NULL
          AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2)
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds OR t.unitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId OR t.unitId = :orgUnitId)
        ORDER BY LOWER(t.name) ASC
    """)
    List<CoastalStationLRIT> findApprovedOptions(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId
    );

    @Query("SELECT c FROM CoastalStationLRIT c WHERE " +
            "c.deletedAt IS NULL AND " +
            "(c.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED OR c.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2) AND " +
            "(:orgUnitId IS NULL OR c.unitId = :orgUnitId OR c.orgUnitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(c.name) LIKE :search OR LOWER(c.code) LIKE :search)")
    List<CoastalStationLRIT> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
