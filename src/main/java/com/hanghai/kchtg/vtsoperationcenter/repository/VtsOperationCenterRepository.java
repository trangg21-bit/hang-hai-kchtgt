package com.hanghai.kchtg.vtsoperationcenter.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtsoperationcenter.dto.VtsOperationCenterOptionResponse;
import com.hanghai.kchtg.vtsoperationcenter.entity.VtsOperationCenter;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface VtsOperationCenterRepository extends JpaRepository<VtsOperationCenter, UUID>, JpaSpecificationExecutor<VtsOperationCenter> {

    @Query("""
        SELECT new com.hanghai.kchtg.vtsoperationcenter.dto.VtsOperationCenterOptionResponse(t.id, t.code, t.name, t.orgUnitId, t.vtsSystemId)
        FROM VtsOperationCenter t
        WHERE t.deletedAt IS NULL
          AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED_LEVEL2)
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgFiltered = false OR t.orgUnitId IS NULL OR t.orgUnitId IN :targetOrgUnitIds)
        ORDER BY LOWER(t.name) ASC
    """)
    List<VtsOperationCenterOptionResponse> findOptions(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") Collection<UUID> scopeOrgUnitIds,
        @Param("orgFiltered") boolean orgFiltered,
        @Param("targetOrgUnitIds") Collection<UUID> targetOrgUnitIds
    );

    Optional<VtsOperationCenter> findByIdAndDeletedAtIsNull(UUID id);

    boolean existsByCodeAndDeletedAtIsNull(String code);

    boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, UUID id);

    /**
     * Danh sách trung tâm điều hành VTS.
     *
     * KHÔNG đặt ORDER BY cố định ở đây: JPA nối ORDER BY của {@link Pageable} vào
     * SAU mệnh đề có sẵn, nên nếu cố định thì cột người dùng chọn chỉ còn tác dụng
     * phá hòa giữa các bản ghi trùng createdAt — tức là bấm sắp xếp gần như không
     * đổi gì. Thứ tự mặc định (createdAt DESC) do controller đưa vào Pageable.
     *
     * Các join bên dưới chỉ phục vụ sắp xếp theo tên hiển thị (đơn vị quản lý,
     * cảng biển, hệ thống VTS, cán bộ cập nhật) — đều là join 1-1 theo khóa chính
     * nên không nhân bản dòng.
     */
    @Query("""
        SELECT t FROM VtsOperationCenter t
        LEFT JOIN OrgUnit o ON o.id = t.orgUnitId
        LEFT JOIN Port p ON p.id = t.portId
        LEFT JOIN VtsSystem vs ON vs.id = t.vtsSystemId
        LEFT JOIN User u ON u.id = t.updatedBy
        WHERE t.deletedAt IS NULL
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:vtsSystemId IS NULL OR t.vtsSystemId = :vtsSystemId)
          AND (:portId IS NULL OR t.portId = :portId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL
               OR t.approvalStatus = :approvalStatus
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL2 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED)))
          AND (CAST(:updatedFrom AS timestamp) IS NULL OR t.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS timestamp) IS NULL OR t.updatedAt <= :updatedTo)
          AND (CAST(:keyword AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.name)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.detailedLocation)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.coverage)) AS string) LIKE CAST(:keyword AS string))
          AND (CAST(:name AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.name)) AS string) LIKE CAST(:name AS string))
          AND (CAST(:code AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:code AS string))
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
        @Param("name") String name,
        @Param("code") String code,
        @Param("updatedFrom") LocalDateTime updatedFrom,
        @Param("updatedTo") LocalDateTime updatedTo,
        Pageable pageable
    );

    default Page<VtsOperationCenter> search(
            boolean scopeEnabled,
            List<UUID> scopeOrgUnitIds,
        UUID orgUnitId,
        UUID vtsSystemId,
        UUID portId,
        Integer provinceId,
        ConditionStatus conditionStatus,
        ApprovalStatus approvalStatus,
        String keyword,
        Pageable pageable
    ) {
        return search(scopeEnabled, scopeOrgUnitIds, orgUnitId, vtsSystemId, portId, provinceId, conditionStatus,
                approvalStatus, keyword, null, null, null, null, pageable);
    }

    default Page<VtsOperationCenter> search(
            boolean scopeEnabled,
            List<UUID> scopeOrgUnitIds,
            UUID orgUnitId,
            UUID vtsSystemId,
            UUID portId,
            Integer provinceId,
            ConditionStatus conditionStatus,
            ApprovalStatus approvalStatus,
            String keyword,
            LocalDateTime updatedFrom,
            LocalDateTime updatedTo,
            Pageable pageable
    ) {
        return search(scopeEnabled, scopeOrgUnitIds, orgUnitId, vtsSystemId, portId, provinceId, conditionStatus,
                approvalStatus, keyword, null, null, updatedFrom, updatedTo, pageable);
    }

    @Query("""
        SELECT t.approvalStatus, COUNT(t) FROM VtsOperationCenter t
        WHERE t.deletedAt IS NULL
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:vtsSystemId IS NULL OR t.vtsSystemId = :vtsSystemId)
          AND (:portId IS NULL OR t.portId = :portId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (CAST(:updatedFrom AS timestamp) IS NULL OR t.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS timestamp) IS NULL OR t.updatedAt <= :updatedTo)
          AND (CAST(:keyword AS string) IS NULL OR (
                CAST(function('immutable_unaccent', LOWER(t.name)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.detailedLocation)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.coverage)) AS string) LIKE CAST(:keyword AS string)
              ))
          AND (CAST(:name AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.name)) AS string) LIKE CAST(:name AS string))
          AND (CAST(:code AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:code AS string))
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
            UUID vtsSystemId,
            UUID portId,
            Integer provinceId,
            ConditionStatus conditionStatus,
            String keyword,
            LocalDateTime updatedFrom,
            LocalDateTime updatedTo
    ) {
        return countByApprovalStatus(scopeEnabled, scopeOrgUnitIds, orgUnitId, vtsSystemId, portId, provinceId,
                conditionStatus, keyword, null, null, updatedFrom, updatedTo);
    }

    List<VtsOperationCenter> findByVtsSystemIdAndDeletedAtIsNull(UUID vtsSystemId);

    List<VtsOperationCenter> findByDeletedAtIsNullOrderByCreatedAtDesc();

    List<VtsOperationCenter> findByOrgUnitIdAndDeletedAtIsNullOrderByCreatedAtDesc(UUID orgUnitId);
}
