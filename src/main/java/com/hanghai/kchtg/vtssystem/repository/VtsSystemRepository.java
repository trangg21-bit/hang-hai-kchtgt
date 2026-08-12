package com.hanghai.kchtg.vtssystem.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface VtsSystemRepository extends JpaRepository<VtsSystem, UUID> {

    @Query("SELECT t FROM VtsSystem t WHERE t.approvalStatus = :approvalStatus AND t.deletedAt IS NULL")
    List<VtsSystem> findByApprovalStatusAndIsDeletedFalse(@Param("approvalStatus") ApprovalStatus approvalStatus);

    @Query("""
        SELECT t FROM VtsSystem t
        WHERE t.deletedAt IS NULL
          AND (:scopeEnabled = false OR t.orgUnitId IN (
                SELECT child.id FROM OrgUnit child
                WHERE ((CAST(:scopePath AS string) IS NOT NULL AND child.path LIKE CONCAT(CAST(:scopePath AS string), '%'))
                    OR (CAST(:scopePath AS string) IS NULL AND child.id = :scopeOrgUnitId))
              ))
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR
            LOWER(t.systemName) LIKE CAST(:keyword AS string) OR
            LOWER(t.code) LIKE CAST(:keyword AS string) OR
            LOWER(t.address) LIKE CAST(:keyword AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus)
        ORDER BY t.createdAt DESC
    """)
    Page<VtsSystem> search(
        @Param("scopeEnabled") boolean scopeEnabled,
        @Param("scopePath") String scopePath,
        @Param("scopeOrgUnitId") UUID scopeOrgUnitId,
        @Param("orgUnitId") UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        Pageable pageable
    );

    @Query("""
        SELECT t FROM VtsSystem t
        WHERE t.deletedAt IS NULL
          AND (:scopeEnabled = false OR t.orgUnitId IN (
                SELECT child.id FROM OrgUnit child
                WHERE ((CAST(:scopePath AS string) IS NOT NULL AND child.path LIKE CONCAT(CAST(:scopePath AS string), '%'))
                    OR (CAST(:scopePath AS string) IS NULL AND child.id = :scopeOrgUnitId))
              ))
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR LOWER(t.systemName) LIKE CAST(:keyword AS string) OR LOWER(t.code) LIKE CAST(:keyword AS string) OR LOWER(t.address) LIKE CAST(:keyword AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus)
          AND (:fromDate IS NULL OR t.createdAt >= :fromDate)
          AND (:toDate IS NULL OR t.createdAt < :toDate)
        ORDER BY t.createdAt DESC
    """)
    Page<VtsSystem> searchByCreatedDateRange(
            @Param("scopeEnabled") boolean scopeEnabled,
            @Param("scopePath") String scopePath,
            @Param("scopeOrgUnitId") UUID scopeOrgUnitId,
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
               t.responsibilityLevel AS responsibilityLevel,
               t.partner AS partner,
               t.orgUnitId AS orgUnitId,
               t.approvalStatus AS approvalStatus,
               t.approverLevel1 AS approverLevel1,
               t.updatedAt AS updatedDate
        FROM VtsSystem t
        WHERE t.deletedAt IS NULL
          AND (:scopeEnabled = false OR t.orgUnitId IN (
                SELECT child.id FROM OrgUnit child
                WHERE ((CAST(:scopePath AS string) IS NOT NULL AND child.path LIKE CONCAT(CAST(:scopePath AS string), '%'))
                    OR (CAST(:scopePath AS string) IS NULL AND child.id = :scopeOrgUnitId))
              ))
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR
            LOWER(t.systemName) LIKE CAST(:keyword AS string) OR
            LOWER(t.code) LIKE CAST(:keyword AS string) OR
            LOWER(t.address) LIKE CAST(:keyword AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus)
        ORDER BY t.createdAt DESC
        """,
        countQuery = """
        SELECT COUNT(t)
        FROM VtsSystem t
        WHERE t.deletedAt IS NULL
          AND (:scopeEnabled = false OR t.orgUnitId IN (
                SELECT child.id FROM OrgUnit child
                WHERE ((CAST(:scopePath AS string) IS NOT NULL AND child.path LIKE CONCAT(CAST(:scopePath AS string), '%'))
                    OR (CAST(:scopePath AS string) IS NULL AND child.id = :scopeOrgUnitId))
              ))
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR
            LOWER(t.systemName) LIKE CAST(:keyword AS string) OR
            LOWER(t.code) LIKE CAST(:keyword AS string) OR
            LOWER(t.address) LIKE CAST(:keyword AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus)
        """)
    Page<VtsSystemListProjection> searchList(
            @Param("scopeEnabled") boolean scopeEnabled,
            @Param("scopePath") String scopePath,
            @Param("scopeOrgUnitId") UUID scopeOrgUnitId,
            @Param("orgUnitId") UUID orgUnitId,
            @Param("keyword") String keyword,
            @Param("conditionStatus") ConditionStatus conditionStatus,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            Pageable pageable
    );

    @Query(value = """
        SELECT t.id AS id,
               t.code AS code,
               t.systemName AS systemName,
               t.address AS address,
               t.conditionStatus AS conditionStatus,
               t.responsibilityLevel AS responsibilityLevel,
               t.partner AS partner,
               t.orgUnitId AS orgUnitId,
               t.approvalStatus AS approvalStatus,
               t.approverLevel1 AS approverLevel1,
               t.updatedAt AS updatedDate
        FROM VtsSystem t
        WHERE t.deletedAt IS NULL
          AND (:scopeEnabled = false OR t.orgUnitId IN (
                SELECT child.id FROM OrgUnit child
                WHERE ((CAST(:scopePath AS string) IS NOT NULL AND child.path LIKE CONCAT(CAST(:scopePath AS string), '%'))
                    OR (CAST(:scopePath AS string) IS NULL AND child.id = :scopeOrgUnitId))
              ))
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR
            LOWER(t.systemName) LIKE CAST(:keyword AS string) OR
            LOWER(t.code) LIKE CAST(:keyword AS string) OR
            LOWER(t.address) LIKE CAST(:keyword AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus)
          AND (:fromDate IS NULL OR t.createdAt >= :fromDate)
          AND (:toDate IS NULL OR t.createdAt < :toDate)
        ORDER BY t.createdAt DESC
        """,
        countQuery = """
        SELECT COUNT(t)
        FROM VtsSystem t
        WHERE t.deletedAt IS NULL
          AND (:scopeEnabled = false OR t.orgUnitId IN (
                SELECT child.id FROM OrgUnit child
                WHERE ((CAST(:scopePath AS string) IS NOT NULL AND child.path LIKE CONCAT(CAST(:scopePath AS string), '%'))
                    OR (CAST(:scopePath AS string) IS NULL AND child.id = :scopeOrgUnitId))
              ))
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR
            LOWER(t.systemName) LIKE CAST(:keyword AS string) OR
            LOWER(t.code) LIKE CAST(:keyword AS string) OR
            LOWER(t.address) LIKE CAST(:keyword AS string))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus)
          AND (:fromDate IS NULL OR t.createdAt >= :fromDate)
          AND (:toDate IS NULL OR t.createdAt < :toDate)
        """)
    Page<VtsSystemListProjection> searchListByCreatedDateRange(
            @Param("scopeEnabled") boolean scopeEnabled,
            @Param("scopePath") String scopePath,
            @Param("scopeOrgUnitId") UUID scopeOrgUnitId,
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
           "(:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId) AND " +
           "(CAST(:search AS string) IS NULL OR LOWER(t.systemName) LIKE CAST(:search AS string) OR LOWER(t.code) LIKE CAST(:search AS string) OR LOWER(t.address) LIKE CAST(:search AS string))")
    List<VtsSystem> searchFiltered(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);

    @Query("""
        SELECT t.approvalStatus, COUNT(t) FROM VtsSystem t
        WHERE t.deletedAt IS NULL
          AND (:scopeEnabled = false OR t.orgUnitId IN (
                SELECT child.id FROM OrgUnit child
                WHERE ((CAST(:scopePath AS string) IS NOT NULL AND child.path LIKE CONCAT(CAST(:scopePath AS string), '%'))
                    OR (CAST(:scopePath AS string) IS NULL AND child.id = :scopeOrgUnitId))
              ))
          AND (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (CAST(:keyword AS string) IS NULL OR (
                LOWER(t.systemName) LIKE CAST(:keyword AS string) OR
                LOWER(t.code) LIKE CAST(:keyword AS string) OR
                LOWER(t.address) LIKE CAST(:keyword AS string)
              ))
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
        GROUP BY t.approvalStatus
    """)
    List<Object[]> countByApprovalStatus(
            @Param("scopeEnabled") boolean scopeEnabled,
            @Param("scopePath") String scopePath,
            @Param("scopeOrgUnitId") UUID scopeOrgUnitId,
            @Param("orgUnitId") UUID orgUnitId,
            @Param("keyword") String keyword,
            @Param("conditionStatus") ConditionStatus conditionStatus
    );

    boolean existsByCode(String code);
}
