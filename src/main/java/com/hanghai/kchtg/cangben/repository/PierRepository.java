package com.hanghai.kchtg.cangben.repository;

import com.hanghai.kchtg.cangben.entity.Pier;
import com.hanghai.kchtg.cangben.entity.LoaiCau;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface PierRepository extends JpaRepository<Pier, UUID> {

    Optional<Pier> findByPierCode(String pierCode);

    boolean existsByPierCode(String pierCode);

    @Query("SELECT p FROM Pier p WHERE p.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR p.orgUnitId = :orgUnitId)")
    Page<Pier> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    @Query("SELECT p FROM Pier p WHERE p.deletedAt IS NULL AND p.berthId = :berthId")
    List<Pier> findByBerthIdAndDeletedAtIsNull(@Param("berthId") UUID berthId);

    @Query("SELECT COUNT(p) FROM Pier p WHERE p.deletedAt IS NULL AND p.berthId = :berthId")
    long countByBerthIdAndDeletedAtIsNull(@Param("berthId") UUID berthId);

    @Query("SELECT p FROM Pier p WHERE p.deletedAt IS NULL AND p.berthId = :berthId")
    Page<Pier> findByBerthId(@Param("berthId") UUID berthId, Pageable pageable);

    long countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus approvalStatus);

    @Query("SELECT p FROM Pier p WHERE p.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR p.orgUnitId = :orgUnitId) " +
            "AND (CAST(:search AS string) IS NULL OR (LOWER(p.pierCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(p.pierName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))) " +
            "AND (:berthId IS NULL OR p.berthId = :berthId) " +
            "AND (:pierType IS NULL OR p.pierType = :pierType) " +
            "AND (:operationalStatus IS NULL OR p.operationalStatus = :operationalStatus) " +
            "AND (:approvalStatus IS NULL OR p.approvalStatus = :approvalStatus)")
    Page<Pier> searchPiers(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search,
            @Param("berthId") UUID berthId,
            @Param("pierType") LoaiCau pierType,
            @Param("operationalStatus") TrangThaiHoatDong operationalStatus,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            Pageable pageable);
}
