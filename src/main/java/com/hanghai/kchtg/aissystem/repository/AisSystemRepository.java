package com.hanghai.kchtg.aissystem.repository;

import com.hanghai.kchtg.aissystem.dto.AisSystemOptionResponse;
import com.hanghai.kchtg.aissystem.entity.AisSystem;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AisSystemRepository extends JpaRepository<AisSystem, UUID> {

    Optional<AisSystem> findByIdAndDeletedAtIsNull(UUID id);

    boolean existsByCodeAndDeletedAtIsNull(String code);

    boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, UUID id);

    @Query("""
        SELECT t FROM AisSystem t
        WHERE t.deletedAt IS NULL
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:vtsOperationCenterId IS NULL OR t.vtsOperationCenterId = :vtsOperationCenterId)
          AND (:radarStationId IS NULL OR t.radarStationId = :radarStationId)
          AND (:operatingOrgId IS NULL OR t.operatingOrgId = :operatingOrgId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:commissioningYear IS NULL OR t.commissioningYear = :commissioningYear)
          AND (:approvalStatus IS NULL 
               OR t.approvalStatus = :approvalStatus
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL2)))
          AND (CAST(:updatedFrom AS timestamp) IS NULL OR t.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS timestamp) IS NULL OR t.updatedAt <= :updatedTo)
          AND (CAST(:name AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(t.name)) AS string) LIKE CAST(:name AS string))
          AND (CAST(:code AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:code AS string))
          AND (CAST(:keyword AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.name)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.model)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.manufacturer)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.detailedLocation)) AS string) LIKE CAST(:keyword AS string))
        ORDER BY t.createdAt DESC
    """)
    Page<AisSystem> search(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("vtsOperationCenterId") UUID vtsOperationCenterId,
        @Param("radarStationId") UUID radarStationId,
        @Param("operatingOrgId") UUID operatingOrgId,
        @Param("provinceId") Integer provinceId,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("commissioningYear") Integer commissioningYear,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("keyword") String keyword,
        @Param("name") String name,
        @Param("code") String code,
        @Param("updatedFrom") LocalDateTime updatedFrom,
        @Param("updatedTo") LocalDateTime updatedTo,
        Pageable pageable
    );

    default Page<AisSystem> search(
        boolean scopeEnabled,
        List<UUID> scopeOrgUnitIds,
        UUID orgUnitId,
        UUID vtsOperationCenterId,
        UUID operatingOrgId,
        Integer provinceId,
        ConditionStatus conditionStatus,
        ApprovalStatus approvalStatus,
        String keyword,
        Pageable pageable
    ) {
        return search(scopeEnabled, scopeOrgUnitIds, orgUnitId, vtsOperationCenterId, null, operatingOrgId, provinceId, conditionStatus, null, approvalStatus, keyword, null, null, null, null, pageable);
    }

    default Page<AisSystem> searchWithYear(
        boolean scopeEnabled,
        List<UUID> scopeOrgUnitIds,
        UUID orgUnitId,
        UUID vtsOperationCenterId,
        UUID operatingOrgId,
        Integer provinceId,
        ConditionStatus conditionStatus,
        Integer commissioningYear,
        ApprovalStatus approvalStatus,
        String keyword,
        Pageable pageable
    ) {
        return search(scopeEnabled, scopeOrgUnitIds, orgUnitId, vtsOperationCenterId, null, operatingOrgId, provinceId, conditionStatus, commissioningYear, approvalStatus, keyword, null, null, null, null, pageable);
    }

    @Query("""
        SELECT t.approvalStatus, COUNT(t) FROM AisSystem t
        WHERE t.deletedAt IS NULL
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:vtsOperationCenterId IS NULL OR t.vtsOperationCenterId = :vtsOperationCenterId)
          AND (:radarStationId IS NULL OR t.radarStationId = :radarStationId)
          AND (:operatingOrgId IS NULL OR t.operatingOrgId = :operatingOrgId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:commissioningYear IS NULL OR t.commissioningYear = :commissioningYear)
          AND (CAST(:updatedFrom AS timestamp) IS NULL OR t.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS timestamp) IS NULL OR t.updatedAt <= :updatedTo)
          AND (CAST(:name AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(t.name)) AS string) LIKE CAST(:name AS string))
          AND (CAST(:code AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:code AS string))
          AND (CAST(:keyword AS string) IS NULL OR (
                CAST(function('immutable_unaccent', LOWER(t.name)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.model)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.manufacturer)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.detailedLocation)) AS string) LIKE CAST(:keyword AS string)
              ))
        GROUP BY t.approvalStatus
    """)
    List<Object[]> countByApprovalStatus(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("vtsOperationCenterId") UUID vtsOperationCenterId,
        @Param("radarStationId") UUID radarStationId,
        @Param("operatingOrgId") UUID operatingOrgId,
        @Param("provinceId") Integer provinceId,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("commissioningYear") Integer commissioningYear,
        @Param("keyword") String keyword,
        @Param("name") String name,
        @Param("code") String code,
        @Param("updatedFrom") LocalDateTime updatedFrom,
        @Param("updatedTo") LocalDateTime updatedTo
    );

    default List<Object[]> countByApprovalStatus(
        boolean scopeEnabled,
        List<UUID> scopeOrgUnitIds,
        UUID orgUnitId,
        UUID vtsOperationCenterId,
        UUID operatingOrgId,
        Integer provinceId,
        ConditionStatus conditionStatus,
        String keyword
    ) {
        return countByApprovalStatus(scopeEnabled, scopeOrgUnitIds, orgUnitId, vtsOperationCenterId, null, operatingOrgId, provinceId, conditionStatus, null, keyword, null, null, null, null);
    }

    default List<Object[]> countByApprovalStatusWithYear(
        boolean scopeEnabled,
        List<UUID> scopeOrgUnitIds,
        UUID orgUnitId,
        UUID vtsOperationCenterId,
        UUID operatingOrgId,
        Integer provinceId,
        ConditionStatus conditionStatus,
        Integer commissioningYear,
        String keyword
    ) {
        return countByApprovalStatus(scopeEnabled, scopeOrgUnitIds, orgUnitId, vtsOperationCenterId, null, operatingOrgId, provinceId, conditionStatus, commissioningYear, keyword, null, null, null, null);
    }

    List<AisSystem> findByVtsOperationCenterIdAndDeletedAtIsNull(UUID vtsOperationCenterId);

    List<AisSystem> findByRadarStationIdAndDeletedAtIsNull(UUID radarStationId);

    List<AisSystem> findByDeletedAtIsNullOrderByCreatedAtDesc();

    List<AisSystem> findByOrgUnitIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID orgUnitId);

    @Query("""
        SELECT new com.hanghai.kchtg.aissystem.dto.AisSystemOptionResponse(
            t.id, t.code, t.name, t.orgUnitId, t.vtsOperationCenterId, t.radarStationId
        )
        FROM AisSystem t
        WHERE t.deletedAt IS NULL
          AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2)
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgFiltered = false OR t.orgUnitId IN :targetOrgUnitIds)
        ORDER BY t.name ASC
    """)
    List<com.hanghai.kchtg.aissystem.dto.AisSystemOptionResponse> findOptions(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgFiltered") boolean orgFiltered,
        @Param("targetOrgUnitIds") List<UUID> targetOrgUnitIds
    );
}
