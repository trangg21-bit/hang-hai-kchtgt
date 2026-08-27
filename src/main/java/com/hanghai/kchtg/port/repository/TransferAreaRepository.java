package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.entity.TransferArea;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TransferAreaRepository extends JpaRepository<TransferArea, UUID> {

    Optional<TransferArea> findByTransferAreaCode(String transferAreaCode);

    boolean existsByTransferAreaCode(String transferAreaCode);

    @Query("SELECT a FROM TransferArea a WHERE a.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR a.orgUnitId = :orgUnitId)")
    Page<TransferArea> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    @Query("SELECT a FROM TransferArea a WHERE a.deletedAt IS NULL AND a.portId = :portId")
    List<TransferArea> findByPortIdAndDeletedAtIsNull(@Param("portId") UUID portId);

    @Query("SELECT COUNT(a) FROM TransferArea a WHERE a.deletedAt IS NULL AND a.portId = :portId")
    long countByPortIdAndDeletedAtIsNull(@Param("portId") UUID portId);

    @Query("SELECT a FROM TransferArea a WHERE a.deletedAt IS NULL AND a.portId = :portId")
    Page<TransferArea> findByPortId(@Param("portId") UUID portId, Pageable pageable);

    @Query("SELECT COUNT(a) FROM TransferArea a WHERE a.deletedAt IS NULL AND a.approvalStatus = :approvalStatus")
    long countByApprovalStatusAndDeletedAtIsNull(@Param("approvalStatus") ApprovalStatus approvalStatus);

    @Query("SELECT MAX(a.transferAreaCode) FROM TransferArea a WHERE a.transferAreaCode LIKE 'BC-%-CT-%'")
    String findMaxTransferAreaCode();

    @Query(value = "SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(transfer_area_code, '^BC-0*(.*?)CT-0*', '\\1'), '') AS INTEGER)), 0) FROM transfer_areas WHERE transfer_area_code ~ '^BC-.*-CT-[0-9]+$' AND deleted_at IS NULL", nativeQuery = true)
    Integer findMaxTransferAreaCodeNumber();

    /**
     * Search transfer areas with unaccent support on code and name.
     */
    @Query("SELECT a FROM TransferArea a WHERE a.deletedAt IS NULL " +
            "AND (:includeAll = true OR a.orgUnitId IN :orgUnitIds) " +
            "AND (CAST(:search AS string) IS NULL OR " +
            "  (CAST(function('immutable_unaccent', LOWER(a.transferAreaCode)) AS string) LIKE " +
            "   CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string) " +
            "  OR CAST(function('immutable_unaccent', LOWER(a.transferAreaName)) AS string) LIKE " +
            "   CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string))) " +
            "AND (CAST(:transferAreaCode AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(a.transferAreaCode)) AS string) LIKE " +
            "  CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:transferAreaCode AS string), '%'))) AS string)) " +
            "AND (CAST(:transferAreaName AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(a.transferAreaName)) AS string) LIKE " +
            "  CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:transferAreaName AS string), '%'))) AS string)) " +
            "AND (:portId IS NULL OR a.portId = :portId) " +
            "AND (:provinceId IS NULL OR a.provinceId = :provinceId) " +
            "AND (CAST(:operationalFunctions AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(a.operationalFunctions)) AS string) LIKE " +
            "  CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:operationalFunctions AS string), '%'))) AS string)) " +
            "AND (:approvalStatus IS NULL OR a.approvalStatus = :approvalStatus) " +
            "AND ((:operationalStatusNull = true AND a.operationalStatus IS NULL) OR " +
            "  (:operationalStatusNull = false AND (:operationalStatus IS NULL OR a.operationalStatus = :operationalStatus))) " +
            "AND (CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR a.updatedAt >= :updatedFrom) " +
            "AND (CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR a.updatedAt <= :updatedTo)")
    Page<TransferArea> searchTransferAreas(
            @Param("includeAll") boolean includeAll,
            @Param("orgUnitIds") Collection<UUID> orgUnitIds,
            @Param("search") String search,
            @Param("transferAreaCode") String transferAreaCode,
            @Param("transferAreaName") String transferAreaName,
            @Param("portId") UUID portId,
            @Param("provinceId") Integer provinceId,
            @Param("operationalFunctions") String operationalFunctions,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("operationalStatus") OperationalStatus operationalStatus,
            @Param("operationalStatusNull") boolean operationalStatusNull,
            @Param("updatedFrom") java.time.LocalDateTime updatedFrom,
            @Param("updatedTo") java.time.LocalDateTime updatedTo,
            Pageable pageable);
}
