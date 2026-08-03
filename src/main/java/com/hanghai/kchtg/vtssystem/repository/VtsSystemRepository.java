package com.hanghai.kchtg.vtssystem.repository;

import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface VtsSystemRepository extends JpaRepository<VtsSystem, UUID> {

    List<VtsSystem> findByApprovalStatusAndIsDeletedFalse(String approvalStatus);

    @Query("""
        SELECT t FROM VtsSystem t
        WHERE (:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId)
          AND (:keyword IS NULL OR
            LOWER(t.systemName) LIKE :keyword OR
            LOWER(t.location) LIKE :keyword)
          AND (:conditionStatus IS NULL OR t.conditionStatus = :conditionStatus)
          AND (:approvalStatus IS NULL OR t.approvalStatus = :approvalStatus)
        ORDER BY t.createdDate DESC
    """)
    Page<VtsSystem> search(
        @Param("orgUnitId") UUID orgUnitId,
        @Param("keyword") String keyword,
        @Param("conditionStatus") String conditionStatus,
        @Param("approvalStatus") String approvalStatus,
        Pageable pageable
    );
    @Query("SELECT t FROM VtsSystem t WHERE " +
           "t.isDeleted = false AND " +
           "(:orgUnitId IS NULL OR t.orgUnitId = :orgUnitId) AND " +
           "(:search IS NULL OR LOWER(t.systemName) LIKE :search OR LOWER(t.location) LIKE :search)")
    List<VtsSystem> searchFiltered(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
