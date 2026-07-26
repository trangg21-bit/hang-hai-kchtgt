package com.hanghai.kchtg.port.repository;

import java.util.UUID;

import com.hanghai.kchtg.port.entity.Berth;
import com.hanghai.kchtg.port.entity.BerthType;
import com.hanghai.kchtg.common.entity.OperationalStatus;
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
public interface BerthRepository extends JpaRepository<Berth, UUID> {

    Optional<Berth> findByBerthCode(String berthCode);

    boolean existsByBerthCode(String berthCode);

    @Query("SELECT b FROM Berth b WHERE b.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR b.orgUnitId = :orgUnitId)")
    Page<Berth> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    @Query("SELECT b FROM Berth b WHERE b.deletedAt IS NULL AND b.portId = :portId")
    List<Berth> findByPortIdAndDeletedAtIsNull(@Param("portId") UUID portId);

    @Query("SELECT COUNT(b) FROM Berth b WHERE b.deletedAt IS NULL AND b.portId = :portId")
    long countByPortIdAndDeletedAtIsNull(@Param("portId") UUID portId);

    @Query("SELECT b FROM Berth b WHERE b.deletedAt IS NULL AND b.portId = :portId")
    Page<Berth> findByPortId(@Param("portId") UUID portId, Pageable pageable);

    long countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus approvalStatus);

    @Query("SELECT b FROM Berth b WHERE b.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR b.orgUnitId = :orgUnitId) " +
            "AND (CAST(:search AS string) IS NULL OR (LOWER(b.berthCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(b.berthName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))) " +
            "AND (CAST(:berthCode AS string) IS NULL OR LOWER(b.berthCode) LIKE LOWER(CONCAT('%', CAST(:berthCode AS string), '%'))) " +
            "AND (CAST(:berthName AS string) IS NULL OR LOWER(b.berthName) LIKE LOWER(CONCAT('%', CAST(:berthName AS string), '%'))) " +
            "AND (:portId IS NULL OR b.portId = :portId) " +
            "AND (CAST(:waterway AS string) IS NULL OR LOWER(b.waterway) LIKE LOWER(CONCAT('%', CAST(:waterway AS string), '%'))) " +
            "AND (:berthType IS NULL OR b.berthType = :berthType) " +
            "AND (:operationalStatus IS NULL OR b.operationalStatus = :operationalStatus) " +
            "AND (:approvalStatus IS NULL OR b.approvalStatus = :approvalStatus)")
    Page<Berth> searchBerths(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search,
            @Param("berthCode") String berthCode,
            @Param("berthName") String berthName,
            @Param("portId") UUID portId,
            @Param("waterway") String waterway,
            @Param("berthType") BerthType berthType,
            @Param("operationalStatus") OperationalStatus operationalStatus,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            Pageable pageable);
}
