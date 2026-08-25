package com.hanghai.kchtg.aissystem.repository;

import com.hanghai.kchtg.aissystem.entity.AisSystem;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface AisSystemRepository extends JpaRepository<AisSystem, UUID>, JpaSpecificationExecutor<AisSystem> {

    Optional<AisSystem> findByIdAndDeletedAtIsNull(UUID id);

    boolean existsByCodeAndDeletedAtIsNull(String code);

    boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, UUID id);

    @Query("""
        SELECT t FROM AisSystem t
        WHERE t.deletedAt IS NULL
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:vtsOperationCenterId IS NULL OR t.vtsOperationCenterId = :vtsOperationCenterId)
          AND (:operatingOrgId IS NULL OR t.operatingOrgId = :operatingOrgId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL 
               OR t.approvalStatus = :approvalStatus
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL2))
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.PENDING_APPROVAL AND t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.PROPOSED)
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED AND t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2))
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
        @Param("operatingOrgId") UUID operatingOrgId,
        @Param("provinceId") Integer provinceId,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("keyword") String keyword,
        Pageable pageable
    );

    @Query("""
        SELECT t.approvalStatus, COUNT(t) FROM AisSystem t
        WHERE t.deletedAt IS NULL
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:vtsOperationCenterId IS NULL OR t.vtsOperationCenterId = :vtsOperationCenterId)
          AND (:operatingOrgId IS NULL OR t.operatingOrgId = :operatingOrgId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
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
        @Param("operatingOrgId") UUID operatingOrgId,
        @Param("provinceId") Integer provinceId,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("keyword") String keyword
    );

    List<AisSystem> findByVtsOperationCenterIdAndDeletedAtIsNull(UUID vtsOperationCenterId);

    List<AisSystem> findByDeletedAtIsNullOrderByCreatedAtDesc();

    List<AisSystem> findByOrgUnitIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID orgUnitId);
}
