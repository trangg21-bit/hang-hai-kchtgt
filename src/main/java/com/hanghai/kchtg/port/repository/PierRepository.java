package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.entity.Pier;
import com.hanghai.kchtg.port.entity.PierType;
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

    boolean existsByPierName(String pierName);

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
            "AND (:portId IS NULL OR p.portId = :portId) " +
            "AND (:pierType IS NULL OR p.pierType = :pierType) " +
            "AND (CAST(:province AS string) IS NULL OR LOWER(p.province) LIKE LOWER(CONCAT('%', CAST(:province AS string), '%'))) " +
            "AND (:operationalStatus IS NULL OR p.operationalStatus = :operationalStatus) " +
            "AND (:approvalStatus IS NULL OR p.approvalStatus = :approvalStatus)")
    Page<Pier> searchPiers(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search,
            @Param("berthId") UUID berthId,
            @Param("portId") UUID portId,
            @Param("pierType") PierType pierType,
            @Param("province") String province,
            @Param("operationalStatus") OperationalStatus operationalStatus,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            Pageable pageable);

    /** Backward-compatible overload used by GIS search — no port/province filter. */
    default Page<Pier> searchPiers(UUID orgUnitId, String search, UUID berthId, PierType pierType,
            OperationalStatus operationalStatus, ApprovalStatus approvalStatus, Pageable pageable) {
        return searchPiers(orgUnitId, search, berthId, null, pierType, null, operationalStatus, approvalStatus, pageable);
    }
}
