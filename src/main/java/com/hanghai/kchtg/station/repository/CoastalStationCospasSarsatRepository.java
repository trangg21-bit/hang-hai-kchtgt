package com.hanghai.kchtg.station.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.station.dto.cospas.CoastalStationCospasSarsatOptionResponse;
import com.hanghai.kchtg.station.entity.CoastalStationCospasSarsat;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository for CoastalStationCospasSarsat entity (F-105).
 * Chuẩn hóa theo mẫu VTS (DataScope, unaccent, phân trang, options và statusCounts).
 */
@Repository
public interface CoastalStationCospasSarsatRepository extends JpaRepository<CoastalStationCospasSarsat, UUID>, JpaSpecificationExecutor<CoastalStationCospasSarsat> {

    @Query("SELECT c FROM CoastalStationCospasSarsat c WHERE c.code = :code AND c.deletedAt IS NULL")
    Optional<CoastalStationCospasSarsat> findByCode(@Param("code") String code);

    @Query("SELECT c FROM CoastalStationCospasSarsat c WHERE c.deletedAt IS NULL ORDER BY c.createdAt DESC")
    List<CoastalStationCospasSarsat> findAllActive();

    @Query("SELECT c FROM CoastalStationCospasSarsat c WHERE c.deletedAt IS NULL ORDER BY c.createdAt DESC")
    List<CoastalStationCospasSarsat> findByDeletedAtIsNull();

    @Query("""
        SELECT new com.hanghai.kchtg.station.dto.cospas.CoastalStationCospasSarsatOptionResponse(c.id, c.code, c.name, c.orgUnitId)
        FROM CoastalStationCospasSarsat c
        WHERE c.deletedAt IS NULL
          AND (c.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED OR c.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2)
          AND c.conditionStatus = com.hanghai.kchtg.vtssystem.entity.ConditionStatus.OPERATIONAL
          AND (:scopeEnabled = false OR c.orgUnitId IS NULL OR c.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgFiltered = false OR c.orgUnitId IS NULL OR c.orgUnitId IN :targetOrgUnitIds)
        ORDER BY LOWER(c.name) ASC
    """)
    List<CoastalStationCospasSarsatOptionResponse> findOptions(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") Collection<UUID> scopeOrgUnitIds,
        @Param("orgFiltered") boolean orgFiltered,
        @Param("targetOrgUnitIds") Collection<UUID> targetOrgUnitIds
    );

    @Query("SELECT c FROM CoastalStationCospasSarsat c WHERE c.deletedAt IS NULL AND (:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId) ORDER BY c.name ASC")
    List<CoastalStationCospasSarsat> findOptions(@Param("orgUnitId") UUID orgUnitId);

    @Query("""
        SELECT c FROM CoastalStationCospasSarsat c
        WHERE c.deletedAt IS NULL
          AND c.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR c.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId)
          AND (:provinceId IS NULL OR c.provinceId = :provinceId)
          AND (:conditionStatus IS NULL OR c.conditionStatus = :conditionStatus
               OR (:conditionStatus = com.hanghai.kchtg.vtssystem.entity.ConditionStatus.SUSPENDED AND c.conditionStatus = com.hanghai.kchtg.vtssystem.entity.ConditionStatus.STOPPED)
               OR (:conditionStatus = com.hanghai.kchtg.vtssystem.entity.ConditionStatus.NOT_YET_OPERATIONAL AND c.conditionStatus = com.hanghai.kchtg.vtssystem.entity.ConditionStatus.UNDER_CONSTRUCTION))
          AND ((:approvalStatus IS NULL AND c.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED)
               OR (:approvalStatus IS NOT NULL AND (
                    c.approvalStatus = :approvalStatus
                    OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED AND c.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2)
                    OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.PENDING_APPROVAL AND c.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.PROPOSED)
                    OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (c.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR c.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL2 OR c.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED))
               )))
          AND (CAST(:keyword AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(c.name)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(c.code)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(c.locationAddress, ''))) AS string) LIKE CAST(:keyword AS string))
          AND (CAST(:updatedFrom AS timestamp) IS NULL OR c.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS timestamp) IS NULL OR c.updatedAt <= :updatedTo)
    """)
    Page<CoastalStationCospasSarsat> search(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") Collection<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("provinceId") Integer provinceId,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("keyword") String keyword,
        @Param("updatedFrom") LocalDateTime updatedFrom,
        @Param("updatedTo") LocalDateTime updatedTo,
        Pageable pageable
    );

    @Query("""
        SELECT c.approvalStatus, COUNT(c)
        FROM CoastalStationCospasSarsat c
        WHERE c.deletedAt IS NULL
          AND c.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR c.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId)
          AND (:provinceId IS NULL OR c.provinceId = :provinceId)
          AND (:conditionStatus IS NULL OR c.conditionStatus = :conditionStatus
               OR (:conditionStatus = com.hanghai.kchtg.vtssystem.entity.ConditionStatus.SUSPENDED AND c.conditionStatus = com.hanghai.kchtg.vtssystem.entity.ConditionStatus.STOPPED)
               OR (:conditionStatus = com.hanghai.kchtg.vtssystem.entity.ConditionStatus.NOT_YET_OPERATIONAL AND c.conditionStatus = com.hanghai.kchtg.vtssystem.entity.ConditionStatus.UNDER_CONSTRUCTION))
          AND (CAST(:keyword AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(c.name)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(c.code)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(COALESCE(c.locationAddress, ''))) AS string) LIKE CAST(:keyword AS string))
          AND (CAST(:updatedFrom AS timestamp) IS NULL OR c.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS timestamp) IS NULL OR c.updatedAt <= :updatedTo)
        GROUP BY c.approvalStatus
    """)
    List<Object[]> countByApprovalStatus(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") Collection<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("provinceId") Integer provinceId,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("keyword") String keyword,
        @Param("updatedFrom") LocalDateTime updatedFrom,
        @Param("updatedTo") LocalDateTime updatedTo
    );

    @Query("SELECT c FROM CoastalStationCospasSarsat c WHERE c.deletedAt IS NULL AND " +
            "(LOWER(c.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(c.code) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    List<CoastalStationCospasSarsat> search(@Param("keyword") String keyword);

    @Query("SELECT c FROM CoastalStationCospasSarsat c WHERE " +
            "c.deletedAt IS NULL AND " +
            "(c.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED OR c.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2) AND " +
            "(:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(c.name) LIKE :search OR LOWER(c.code) LIKE :search)")
    List<CoastalStationCospasSarsat> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
