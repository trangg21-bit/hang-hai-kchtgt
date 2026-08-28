package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.entity.DaiTtdh;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface DaiTtdhRepository extends JpaRepository<DaiTtdh, UUID> {

    Optional<DaiTtdh> findByDaiTtdhCodeAndDeletedAtIsNull(String daiTtdhCode);

    @Query("SELECT COUNT(d) FROM DaiTtdh d WHERE d.deletedAt IS NULL AND d.approvalStatus = :approvalStatus")
    long countByApprovalStatusAndDeletedAtIsNull(@Param("approvalStatus") ApprovalStatus approvalStatus);

    @Query(value = "SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(dai_ttdh_code, '^DTTDH-0*', ''), '') AS INTEGER)), 0) " +
            "FROM dai_ttdh WHERE dai_ttdh_code LIKE 'DTTDH-%'", nativeQuery = true)
    Integer findMaxDaiTtdhSeq();

    @Query("SELECT d FROM DaiTtdh d WHERE d.deletedAt IS NULL AND " +
            "((:includeAll = true) OR d.orgUnitId IN (:orgUnitIds)) " +
            "AND (CAST(:search AS string) IS NULL OR " +
            "  (CAST(function('immutable_unaccent', LOWER(d.daiTtdhCode)) AS string) LIKE " +
            "   CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string) " +
            "  OR CAST(function('immutable_unaccent', LOWER(d.daiTtdhName)) AS string) LIKE " +
            "   CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string))) " +
            "AND (CAST(:daiTtdhCode AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(d.daiTtdhCode)) AS string) LIKE " +
            "  CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:daiTtdhCode AS string), '%'))) AS string)) " +
            "AND (CAST(:daiTtdhName AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(d.daiTtdhName)) AS string) LIKE " +
            "  CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:daiTtdhName AS string), '%'))) AS string)) " +
            "AND (:stationLevel IS NULL OR d.stationLevel = :stationLevel) " +
            "AND (:provinceId IS NULL OR d.provinceId = :provinceId) " +
            "AND (:approvalStatus IS NULL OR d.approvalStatus = :approvalStatus) " +
            "AND ((:operationalStatusNull = true AND d.operationalStatus IS NULL) OR " +
            "  (:operationalStatusNull = false AND (:operationalStatus IS NULL OR d.operationalStatus = :operationalStatus))) " +
            "AND (CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR d.updatedAt >= :updatedFrom) " +
            "AND (CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR d.updatedAt <= :updatedTo)")
    Page<DaiTtdh> searchDaiTtdh(
            @Param("includeAll") boolean includeAll,
            @Param("orgUnitIds") Collection<UUID> orgUnitIds,
            @Param("search") String search,
            @Param("daiTtdhCode") String daiTtdhCode,
            @Param("daiTtdhName") String daiTtdhName,
            @Param("stationLevel") Integer stationLevel,
            @Param("provinceId") Integer provinceId,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("operationalStatus") OperationalStatus operationalStatus,
            @Param("operationalStatusNull") boolean operationalStatusNull,
            @Param("updatedFrom") java.time.LocalDateTime updatedFrom,
            @Param("updatedTo") java.time.LocalDateTime updatedTo,
            Pageable pageable);
}
