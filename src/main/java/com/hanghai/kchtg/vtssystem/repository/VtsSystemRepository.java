package com.hanghai.kchtg.vtssystem.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.dto.OperatingOrganizationOptionResponse;
import com.hanghai.kchtg.common.entity.OperatingOrganization;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.vtssystem.dto.VtsSystemOptionResponse;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface VtsSystemRepository extends JpaRepository<VtsSystem, UUID> {

    @Query("""
        SELECT new com.hanghai.kchtg.vtssystem.dto.VtsSystemOptionResponse(v.id, v.code, v.systemName, v.orgUnitId)
        FROM VtsSystem v
        WHERE v.deletedAt IS NULL
          AND (:scopeEnabled = false OR v.orgUnitId IS NULL OR v.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgFiltered = false OR v.orgUnitId IS NULL OR v.orgUnitId IN :targetOrgUnitIds)
        ORDER BY LOWER(v.systemName) ASC
    """)
    List<VtsSystemOptionResponse> findOptions(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") Collection<UUID> scopeOrgUnitIds,
        @Param("orgFiltered") boolean orgFiltered,
        @Param("targetOrgUnitIds") Collection<UUID> targetOrgUnitIds
    );

    @Query("SELECT t FROM VtsSystem t WHERE t.approvalStatus = :approvalStatus AND t.deletedAt IS NULL")
    List<VtsSystem> findByApprovalStatusAndIsDeletedFalse(@Param("approvalStatus") ApprovalStatus approvalStatus);

    @Query("""
        SELECT t FROM VtsSystem t
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.systemName)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.address)) AS string) LIKE CAST(:keyword AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL 
               OR t.approvalStatus = :approvalStatus
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL2 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED)))
        ORDER BY t.createdAt DESC
    """)
    Page<VtsSystem> search(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        Pageable pageable
    );

    @Query("""
        SELECT t FROM VtsSystem t
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.systemName)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.address)) AS string) LIKE CAST(:keyword AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL 
               OR t.approvalStatus = :approvalStatus
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL2 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED)))
          AND (CAST(:fromDate AS java.time.LocalDate) IS NULL OR t.operationStartDate >= :fromDate)
          AND (CAST(:toDate AS java.time.LocalDate) IS NULL OR t.operationStartDate < :toDate)
        ORDER BY t.createdAt DESC
    """)
    Page<VtsSystem> searchByDateRange(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("fromDate") LocalDate fromDate,
        @Param("toDate") LocalDate toDate,
        Pageable pageable
    );

    default Page<VtsSystem> search(
        boolean scopeEnabled,
        List<UUID> scopeOrgUnitIds,
        UUID orgUnitId,
        String keyword,
        ConditionStatus conditionStatus,
        ApprovalStatus approvalStatus,
        LocalDate fromDate,
        LocalDate toDate,
        Pageable pageable
    ) {
        return searchByDateRange(scopeEnabled, scopeOrgUnitIds, orgUnitId, keyword, conditionStatus, approvalStatus, fromDate, toDate, pageable);
    }

    @Query("""
        SELECT t FROM VtsSystem t
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.systemName)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.address)) AS string) LIKE CAST(:keyword AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL 
               OR t.approvalStatus = :approvalStatus
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL2 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED)))
          AND (CAST(:fromDate AS java.time.LocalDateTime) IS NULL OR t.createdAt >= :fromDate)
          AND (CAST(:toDate AS java.time.LocalDateTime) IS NULL OR t.createdAt < :toDate)
        ORDER BY t.createdAt DESC
    """)
    Page<VtsSystem> searchByCreatedDateRange(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("fromDate") LocalDateTime fromDate,
        @Param("toDate") LocalDateTime toDate,
        Pageable pageable
    );

    @Query(value = """
        SELECT t.id AS id,
               t.code AS code,
               t.systemName AS systemName,
               t.address AS address,
               t.conditionStatus AS conditionStatus,
               t.orgUnitId AS orgUnitId,
               t.approvalStatus AS approvalStatus,
               t.rejectionReason AS rejectionReason,
               t.approverLevel1 AS approverLevel1,
               t.createdBy AS createdBy,
               t.updatedAt AS updatedDate,
               t.updatedBy AS updatedBy,
               t.owningOrgId AS owningOrgId,
               t.operatingOrgId AS operatingOrgId,
               op.name AS operatingOrgName,
               t.portId AS portId,
               t.provinceId AS provinceId,
               t.operationStartDate AS operationStartDate
        FROM VtsSystem t
        LEFT JOIN OperatingOrganization op ON op.id = t.operatingOrgId
        LEFT JOIN OrgUnit o ON o.id = t.orgUnitId
        LEFT JOIN OrgUnit own ON own.id = t.owningOrgId
        LEFT JOIN Port p ON p.id = t.portId
        LEFT JOIN User u ON u.id = t.updatedBy
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:portId IS NULL OR t.portId = :portId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (CAST(:keyword AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.systemName)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.address)) AS string) LIKE CAST(:keyword AS string))
          AND (CAST(:systemName AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.systemName)) AS string) LIKE CAST(:systemName AS string))
          AND (CAST(:code AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:code AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL
               OR t.approvalStatus = :approvalStatus
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL2 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED)))
          AND (CAST(:fromDate AS java.time.LocalDate) IS NULL OR t.operationStartDate >= :fromDate)
          AND (CAST(:toDate AS java.time.LocalDate) IS NULL OR t.operationStartDate <= :toDate)
          AND (CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR t.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR t.updatedAt <= :updatedTo)
        """,
        countQuery = """
        SELECT COUNT(t)
        FROM VtsSystem t
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:portId IS NULL OR t.portId = :portId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (CAST(:keyword AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.systemName)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.address)) AS string) LIKE CAST(:keyword AS string))
          AND (CAST(:systemName AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.systemName)) AS string) LIKE CAST(:systemName AS string))
          AND (CAST(:code AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:code AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL
               OR t.approvalStatus = :approvalStatus
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL2 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED)))
          AND (CAST(:fromDate AS java.time.LocalDate) IS NULL OR t.operationStartDate >= :fromDate)
          AND (CAST(:toDate AS java.time.LocalDate) IS NULL OR t.operationStartDate <= :toDate)
          AND (CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR t.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR t.updatedAt <= :updatedTo)
        """)
    /**
     * Thứ tự sắp xếp lấy từ {@link Pageable} (mặc định createdAt DESC) chứ không
     * cố định trong câu truy vấn: JPA nối ORDER BY của Pageable vào SAU mệnh đề
     * ORDER BY có sẵn, nên nếu cố định ở đây thì cột người dùng chọn sẽ vô hiệu.
     */
    Page<VtsSystemListProjection> searchList(
            @Param("scopeEnabled") boolean scopeEnabled,
            @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
            @Param("orgUnitId") UUID orgUnitId,
            @Param("portId") UUID portId,
            @Param("provinceId") Integer provinceId,
            @Param("keyword") String keyword,
            @Param("systemName") String systemName,
            @Param("code") String code,
            @Param("conditionStatus") ConditionStatus conditionStatus,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("updatedFrom") LocalDateTime updatedFrom,
            @Param("updatedTo") LocalDateTime updatedTo,
            Pageable pageable
    );

    default Page<VtsSystemListProjection> searchList(
            boolean scopeEnabled,
            List<UUID> scopeOrgUnitIds,
            UUID orgUnitId,
            String keyword,
            ConditionStatus conditionStatus,
            ApprovalStatus approvalStatus,
            LocalDate fromDate,
            LocalDate toDate,
            Pageable pageable
    ) {
        return searchList(scopeEnabled, scopeOrgUnitIds, orgUnitId, null, null, keyword, null, null,
                conditionStatus, approvalStatus, fromDate, toDate, null, null, pageable);
    }

    @Query(value = """
        SELECT t.id AS id,
               t.code AS code,
               t.systemName AS systemName,
               t.address AS address,
               t.conditionStatus AS conditionStatus,
               t.orgUnitId AS orgUnitId,
               t.approvalStatus AS approvalStatus,
               t.approverLevel1 AS approverLevel1,
               t.updatedAt AS updatedDate,
               t.updatedBy AS updatedBy,
               t.owningOrgId AS owningOrgId,
               t.operatingOrgId AS operatingOrgId,
               t.portId AS portId,
               t.provinceId AS provinceId,
               t.operationStartDate AS operationStartDate
        FROM VtsSystem t
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.systemName)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.address)) AS string) LIKE CAST(:keyword AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL 
               OR t.approvalStatus = :approvalStatus
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL2 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED)))
          AND (CAST(:fromDate AS java.time.LocalDateTime) IS NULL OR t.createdAt >= :fromDate)
          AND (CAST(:toDate AS java.time.LocalDateTime) IS NULL OR t.createdAt < :toDate)
        ORDER BY t.createdAt DESC
        """,
        countQuery = """
        SELECT COUNT(t)
        FROM VtsSystem t
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.systemName)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
            CAST(function('immutable_unaccent', LOWER(t.address)) AS string) LIKE CAST(:keyword AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL 
               OR t.approvalStatus = :approvalStatus
               OR (:approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 AND (t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL1 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED_LEVEL2 OR t.approvalStatus = com.hanghai.kchtg.common.entity.ApprovalStatus.REJECTED)))
          AND (CAST(:fromDate AS java.time.LocalDateTime) IS NULL OR t.createdAt >= :fromDate)
          AND (CAST(:toDate AS java.time.LocalDateTime) IS NULL OR t.createdAt < :toDate)
        """)
    Page<VtsSystemListProjection> searchListByCreatedDateRange(
            @Param("scopeEnabled") boolean scopeEnabled,
            @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
            @Param("orgUnitId") UUID orgUnitId,
            @Param("keyword") String keyword,
            @Param("conditionStatus") ConditionStatus conditionStatus,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );

    @Query("SELECT t FROM VtsSystem t WHERE " +
           "t.deletedAt IS NULL AND " +
           "t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED AND " +
           "(:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId) AND " +
           "(CAST(:search AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(t.systemName)) AS string) LIKE CAST(:search AS string) OR CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:search AS string) OR CAST(function('immutable_unaccent', LOWER(t.address)) AS string) LIKE CAST(:search AS string))")
    List<VtsSystem> searchFiltered(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);

    @Query("""
        SELECT t.approvalStatus, COUNT(t) FROM VtsSystem t
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR (
                CAST(function('immutable_unaccent', LOWER(t.systemName)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.address)) AS string) LIKE CAST(:keyword AS string)
              ))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
        GROUP BY t.approvalStatus
        """)
    List<Object[]> countByApprovalStatus(
            @Param("scopeEnabled") boolean scopeEnabled,
            @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
            @Param("orgUnitId") UUID orgUnitId,
            @Param("keyword") String keyword,
            @Param("conditionStatus") ConditionStatus conditionStatus
    );

    @Query("""
        SELECT t.approvalStatus, COUNT(t) FROM VtsSystem t
        WHERE t.deletedAt IS NULL
          AND t.approvalStatus != com.hanghai.kchtg.common.entity.ApprovalStatus.ARCHIVED
          AND (:scopeEnabled = false OR t.orgUnitId IN :scopeOrgUnitIds)
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:portId IS NULL OR t.portId = :portId)
          AND (:provinceId IS NULL OR t.provinceId = :provinceId)
          AND (CAST(:keyword AS string) IS NULL OR (
                CAST(function('immutable_unaccent', LOWER(t.systemName)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:keyword AS string) OR
                CAST(function('immutable_unaccent', LOWER(t.address)) AS string) LIKE CAST(:keyword AS string)
              ))
          AND (CAST(:systemName AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.systemName)) AS string) LIKE CAST(:systemName AS string))
          AND (CAST(:code AS string) IS NULL OR
            CAST(function('immutable_unaccent', LOWER(t.code)) AS string) LIKE CAST(:code AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (CAST(:fromDate AS java.time.LocalDate) IS NULL OR t.operationStartDate >= :fromDate)
          AND (CAST(:toDate AS java.time.LocalDate) IS NULL OR t.operationStartDate <= :toDate)
          AND (CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR t.updatedAt >= :updatedFrom)
          AND (CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR t.updatedAt <= :updatedTo)
        GROUP BY t.approvalStatus
        """)
    List<Object[]> countByApprovalStatus(
            @Param("scopeEnabled") boolean scopeEnabled,
            @Param("scopeOrgUnitIds") List<UUID> scopeOrgUnitIds,
            @Param("orgUnitId") UUID orgUnitId,
            @Param("portId") UUID portId,
            @Param("provinceId") Integer provinceId,
            @Param("keyword") String keyword,
            @Param("systemName") String systemName,
            @Param("code") String code,
            @Param("conditionStatus") ConditionStatus conditionStatus,
            @Param("fromDate") LocalDate fromDate,
            @Param("toDate") LocalDate toDate,
            @Param("updatedFrom") LocalDateTime updatedFrom,
            @Param("updatedTo") LocalDateTime updatedTo
    );

    @Query("SELECT COUNT(t) > 0 FROM VtsSystem t WHERE LOWER(t.code) = LOWER(:code) AND t.deletedAt IS NULL")
    boolean existsByCode(@Param("code") String code);

    /**
     * Mã tự sinh lớn nhất đang dùng, tính trên MỌI bản ghi (kể cả đã xóa mềm) để
     * mã mới không đụng bản ghi cũ. Phần số được đệm 0 đủ 6 chữ số nên so sánh
     * chuỗi cho ra đúng giá trị lớn nhất về số — không cần CAST, giữ được tính
     * tương thích giữa PostgreSQL và H2.
     */
    @Query("SELECT MAX(t.code) FROM VtsSystem t WHERE t.code LIKE 'VTS-%'")
    String findMaxGeneratedCode();

    @Query("SELECT COUNT(t) > 0 FROM VtsSystem t WHERE LOWER(t.code) = LOWER(:code) AND t.id <> :id AND t.deletedAt IS NULL")
    boolean existsByCodeAndIdNot(@Param("code") String code, @Param("id") UUID id);
}
