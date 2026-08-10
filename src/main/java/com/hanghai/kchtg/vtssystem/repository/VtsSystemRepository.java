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
        WHERE (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:keyword IS NULL OR
            LOWER(t.systemName) LIKE :keyword OR
            LOWER(t.location) LIKE :keyword)
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus)
        ORDER BY t.createdAt DESC
    """)
    Page<VtsSystem> search(
        @Param("orgUnitId") UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("conditionStatus") ConditionStatus conditionStatus,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        Pageable pageable
    );

    @Query("""
        SELECT t FROM VtsSystem t
        WHERE (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:keyword IS NULL OR LOWER(t.systemName) LIKE :keyword OR LOWER(t.location) LIKE :keyword)
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus)
          AND (:fromDate IS NULL OR t.createdAt >= :fromDate)
          AND (:toDate IS NULL OR t.createdAt < :toDate)
        ORDER BY t.createdAt DESC
    """)
    Page<VtsSystem> searchByCreatedDateRange(
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
           "(:search IS NULL OR LOWER(t.systemName) LIKE :search OR LOWER(t.location) LIKE :search)")
    List<VtsSystem> searchFiltered(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);

    @Query("SELECT t.approvalStatus, COUNT(t) FROM VtsSystem t WHERE t.deletedAt IS NULL GROUP BY t.approvalStatus")
    List<Object[]> countByApprovalStatus();
}
