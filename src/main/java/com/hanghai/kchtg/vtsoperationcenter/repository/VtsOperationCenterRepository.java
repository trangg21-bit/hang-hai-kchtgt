package com.hanghai.kchtg.vtsoperationcenter.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtsoperationcenter.entity.VtsOperationCenter;
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
public interface VtsOperationCenterRepository extends JpaRepository<VtsOperationCenter, UUID>, JpaSpecificationExecutor<VtsOperationCenter> {

    Optional<VtsOperationCenter> findByIdAndDeletedAtIsNull(UUID id);

    boolean existsByCodeAndDeletedAtIsNull(String code);

    boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, UUID id);

    @Query("""
        SELECT t FROM VtsOperationCenter t
        WHERE t.deletedAt IS NULL
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:vtsSystemId IS NULL OR t.vtsSystemId = :vtsSystemId)
          AND (:portId IS NULL OR t.portId = :portId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus)
          AND (CAST(:keyword AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.name)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.detailedLocation)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.coverage)) AS string) LIKE CAST(:keyword AS string))
        ORDER BY t.createdAt DESC
    """)
    Page<VtsOperationCenter> search(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("vtsSystemId") UUID vtsSystemId,
        @Param("portId") UUID portId,
        @Param("provinceId") Integer provinceId,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("keyword") String keyword,
        Pageable pageable
    );

    @Query("""
        SELECT t.approvalStatus, COUNT(t) FROM VtsOperationCenter t
        WHERE t.deletedAt IS NULL
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:vtsSystemId IS NULL OR t.vtsSystemId = :vtsSystemId)
          AND (:portId IS NULL OR t.portId = :portId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (CAST(:keyword AS string) IS NULL OR (
                CAST(function('immutable_unaccent', LOWER(t.name)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.detailedLocation)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.coverage)) AS string) LIKE CAST(:keyword AS string)
              ))
        GROUP BY t.approvalStatus
    """)
    List<Object[]> countByApprovalStatus(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("vtsSystemId") UUID vtsSystemId,
        @Param("portId") UUID portId,
        @Param("provinceId") Integer provinceId,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("keyword") String keyword
    );

    List<VtsOperationCenter> findByVtsSystemIdAndDeletedAtIsNull(UUID vtsSystemId);

    List<VtsOperationCenter> findByDeletedAtIsNullOrderByCreatedAtDesc();

    List<VtsOperationCenter> findByOrgUnitIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID orgUnitId);
}
