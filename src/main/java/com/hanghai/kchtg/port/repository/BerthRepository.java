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

    @Query("SELECT COUNT(b) FROM Berth b WHERE b.deletedAt IS NULL AND b.approvalStatus = :approvalStatus")
    long countByApprovalStatusAndDeletedAtIsNull(@Param("approvalStatus") ApprovalStatus approvalStatus);

    @Query("SELECT MAX(b.berthCode) FROM Berth b WHERE b.berthCode LIKE 'BC-%'")
    String findMaxBerthCode();

    @Query(value = "SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(berth_code, '^BC-0*', ''), '') AS INTEGER)), 0) FROM berths WHERE berth_code ~ '^BC-[0-9]+$' AND deleted_at IS NULL", nativeQuery = true)
    Integer findMaxBerthCodeNumber();

    /**
     * Search berths filtering by legacy DB columns.
     * For operationalStatus null-check (NHAP status), pass operationalStatusNull=true.
     */
    @Query("SELECT b FROM Berth b WHERE b.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR b.orgUnitId = :orgUnitId) " +
            "AND (CAST(:search AS string) IS NULL OR (LOWER(b.berthCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(b.berthName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))) " +
            "AND (CAST(:berthCode AS string) IS NULL OR LOWER(b.berthCode) LIKE LOWER(CONCAT('%', CAST(:berthCode AS string), '%'))) " +
            "AND (CAST(:berthName AS string) IS NULL OR LOWER(b.berthName) LIKE LOWER(CONCAT('%', CAST(:berthName AS string), '%'))) " +
            "AND (:portId IS NULL OR b.portId = :portId) " +
            "AND (CAST(:waterway AS string) IS NULL OR LOWER(b.waterway) LIKE LOWER(CONCAT('%', CAST(:waterway AS string), '%'))) " +
            "AND (:berthType IS NULL OR b.berthType = :berthType) " +
            "AND (:approvalStatus IS NULL OR b.approvalStatus = :approvalStatus) " +
            "AND ((:operationalStatusNull = true AND b.operationalStatus IS NULL) OR (:operationalStatusNull = false AND (:operationalStatus IS NULL OR b.operationalStatus = :operationalStatus)))")
    Page<Berth> searchBerths(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search,
            @Param("berthCode") String berthCode,
            @Param("berthName") String berthName,
            @Param("portId") UUID portId,
            @Param("waterway") String waterway,
            @Param("berthType") BerthType berthType,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("operationalStatus") OperationalStatus operationalStatus,
            @Param("operationalStatusNull") boolean operationalStatusNull,
            Pageable pageable);

    /**
     * @deprecated Use the new searchBerths method with legacy DB columns instead.
     * Kept for backward compatibility with KchtGis155Service.
     */
    @Deprecated
    default Page<Berth> searchBerths(UUID orgUnitId, String search, String berthCode, String berthName,
                                      UUID portId, String waterway, BerthType berthType,
                                      OperationalStatus operationalStatus, ApprovalStatus approvalStatus,
                                      Pageable pageable) {
        return searchBerths(orgUnitId, search, berthCode, berthName, portId, waterway, berthType,
                approvalStatus, operationalStatus, false, pageable);
    }
}
