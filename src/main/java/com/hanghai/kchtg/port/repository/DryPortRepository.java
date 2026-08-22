package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.entity.DryPort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DryPortRepository extends JpaRepository<DryPort, UUID> {

    Optional<DryPort> findByDryPortCode(String dryPortCode);

    boolean existsByDryPortCode(String dryPortCode);

    @Query("SELECT d FROM DryPort d WHERE d.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR d.orgUnitId = :orgUnitId)")
    Page<DryPort> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    long countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus approvalStatus);

    @Query("SELECT MAX(d.dryPortCode) FROM DryPort d WHERE d.dryPortCode LIKE 'CC-%'")
    Optional<String> findMaxCode();

    @Query("SELECT d FROM DryPort d WHERE d.deletedAt IS NULL " +
            "AND (:includeAll = true OR d.orgUnitId IN :orgUnitIds) " +
            "AND (:provinceId IS NULL OR d.provinceId = :provinceId) " +
            "AND (CAST(:search AS string) IS NULL OR (LOWER(d.dryPortCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(d.dryPortName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(d.detailedLocation) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))) " +
            "AND (:operationalStatus IS NULL OR d.operationalStatus = :operationalStatus) " +
            "AND (:approvalStatus IS NULL OR d.approvalStatus = :approvalStatus) " +
            "AND (CAST(:code AS string) IS NULL OR LOWER(d.dryPortCode) LIKE LOWER(CONCAT('%', CAST(:code AS string), '%'))) " +
            "AND (CAST(:transportCorridor AS string) IS NULL OR LOWER(d.transportCorridor) LIKE LOWER(CONCAT('%', CAST(:transportCorridor AS string), '%'))) " +
            "AND (:region IS NULL OR d.region = :region) " +
            "AND (:portStatus IS NULL OR d.portStatus = :portStatus) " +
            "AND (CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR d.updatedAt >= :updatedFrom) " +
            "AND (CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR d.updatedAt <= :updatedTo)")
    Page<DryPort> searchDryPorts(
            @Param("includeAll") boolean includeAll,
            @Param("orgUnitIds") Collection<UUID> orgUnitIds,
            @Param("provinceId") Integer provinceId,
            @Param("search") String search,
            @Param("operationalStatus") OperationalStatus operationalStatus,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("code") String code,
            @Param("transportCorridor") String transportCorridor,
            @Param("region") String region,
            @Param("portStatus") Integer portStatus,
            @Param("updatedFrom") java.time.LocalDateTime updatedFrom,
            @Param("updatedTo") java.time.LocalDateTime updatedTo,
            Pageable pageable);

    /**
     * @deprecated Chỉ dùng cho tìm kiếm GIS legacy (KchtGis155Service) — khớp đúng đơn vị, không mở rộng đơn vị con.
     * Giữ tương thích ngược như BerthRepository.searchBerths.
     */
    @Deprecated
    default Page<DryPort> searchDryPorts(UUID orgUnitId, Integer provinceId, String search,
                                          OperationalStatus operationalStatus, ApprovalStatus approvalStatus,
                                          Pageable pageable) {
        return searchDryPorts(orgUnitId == null, orgUnitId != null ? List.of(orgUnitId) : List.of(),
                provinceId, search, operationalStatus, approvalStatus,
                null, null, null, null, null, null, pageable);
    }

    /**
     * Native query to find a deleted dry port's id and deleted_at timestamp.
     * Bypasses @SQLRestriction("deleted_at IS NULL") on BaseEntity
     * which prevents findById from locating soft-deleted rows.
     */
    @Query(value = "SELECT d.id, d.deleted_at FROM dry_ports d WHERE d.id = :id AND d.deleted_at IS NOT NULL", nativeQuery = true)
    Optional<Object[]> findDeletedDryPortById(@Param("id") UUID id);

    /**
     * JPQL bulk UPDATE to restore a soft-deleted dry port.
     * @SQLRestriction does NOT apply to UPDATE statements, so this bypasses the filter.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE DryPort d SET d.deletedAt = NULL, d.deletedBy = NULL WHERE d.id = :id AND d.deletedAt IS NOT NULL")
    int restoreDryPortById(@Param("id") UUID id);
}
