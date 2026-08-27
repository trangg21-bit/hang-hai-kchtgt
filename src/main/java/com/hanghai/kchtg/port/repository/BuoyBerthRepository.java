package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.entity.BuoyBerth;
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
public interface BuoyBerthRepository extends JpaRepository<BuoyBerth, UUID> {

    Optional<BuoyBerth> findByBuoyBerthCode(String buoyBerthCode);

    boolean existsByBuoyBerthCode(String buoyBerthCode);

    @Query("SELECT a FROM BuoyBerth a WHERE a.deletedAt IS NULL AND a.portId = :portId")
    List<BuoyBerth> findByPortIdAndDeletedAtIsNull(@Param("portId") UUID portId);

    @Query("SELECT COUNT(a) FROM BuoyBerth a WHERE a.deletedAt IS NULL AND a.approvalStatus = :approvalStatus")
    long countByApprovalStatusAndDeletedAtIsNull(@Param("approvalStatus") ApprovalStatus approvalStatus);

    /**
     * Search buoy berths with unaccent support on code and name.
     */
    @Query("SELECT a FROM BuoyBerth a WHERE a.deletedAt IS NULL " +
            "AND (:includeAll = true OR a.orgUnitId IN :orgUnitIds) " +
            "AND (CAST(:search AS string) IS NULL OR " +
            "  (CAST(function('immutable_unaccent', LOWER(a.buoyBerthCode)) AS string) LIKE " +
            "   CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string) " +
            "  OR CAST(function('immutable_unaccent', LOWER(a.buoyBerthName)) AS string) LIKE " +
            "   CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string))) " +
            "AND (CAST(:buoyBerthCode AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(a.buoyBerthCode)) AS string) LIKE " +
            "  CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:buoyBerthCode AS string), '%'))) AS string)) " +
            "AND (CAST(:buoyBerthName AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(a.buoyBerthName)) AS string) LIKE " +
            "  CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:buoyBerthName AS string), '%'))) AS string)) " +
            "AND (:portId IS NULL OR a.portId = :portId) " +
            "AND (:waterwayId IS NULL OR a.waterwayId = :waterwayId) " +
            "AND (CAST(:classification AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(a.classification)) AS string) LIKE " +
            "  CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:classification AS string), '%'))) AS string)) " +
            "AND (:provinceId IS NULL OR a.provinceId = :provinceId) " +
            "AND (:approvalStatus IS NULL OR a.approvalStatus = :approvalStatus) " +
            "AND ((:operationalStatusNull = true AND a.operationalStatus IS NULL) OR " +
            "  (:operationalStatusNull = false AND (:operationalStatus IS NULL OR a.operationalStatus = :operationalStatus))) " +
            "AND (CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR a.updatedAt >= :updatedFrom) " +
            "AND (CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR a.updatedAt <= :updatedTo)")
    Page<BuoyBerth> searchBuoyBerths(
            @Param("includeAll") boolean includeAll,
            @Param("orgUnitIds") Collection<UUID> orgUnitIds,
            @Param("search") String search,
            @Param("buoyBerthCode") String buoyBerthCode,
            @Param("buoyBerthName") String buoyBerthName,
            @Param("portId") UUID portId,
            @Param("waterwayId") UUID waterwayId,
            @Param("classification") String classification,
            @Param("provinceId") Integer provinceId,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("operationalStatus") OperationalStatus operationalStatus,
            @Param("operationalStatusNull") boolean operationalStatusNull,
            @Param("updatedFrom") java.time.LocalDateTime updatedFrom,
            @Param("updatedTo") java.time.LocalDateTime updatedTo,
            Pageable pageable);
}
