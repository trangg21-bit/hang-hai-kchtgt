package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.entity.Anchorage;
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
public interface AnchorageRepository extends JpaRepository<Anchorage, UUID> {

    Optional<Anchorage> findByAnchorageCode(String anchorageCode);

    boolean existsByAnchorageCode(String anchorageCode);

    @Query("SELECT a FROM Anchorage a WHERE a.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR a.orgUnitId = :orgUnitId)")
    Page<Anchorage> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    @Query("SELECT a FROM Anchorage a WHERE a.deletedAt IS NULL AND a.portId = :portId")
    List<Anchorage> findByPortIdAndDeletedAtIsNull(@Param("portId") UUID portId);

    @Query("SELECT COUNT(a) FROM Anchorage a WHERE a.deletedAt IS NULL AND a.portId = :portId")
    long countByPortIdAndDeletedAtIsNull(@Param("portId") UUID portId);

    @Query("SELECT a FROM Anchorage a WHERE a.deletedAt IS NULL AND a.portId = :portId")
    Page<Anchorage> findByPortId(@Param("portId") UUID portId, Pageable pageable);

    @Query("SELECT COUNT(a) FROM Anchorage a WHERE a.deletedAt IS NULL AND a.approvalStatus = :approvalStatus")
    long countByApprovalStatusAndDeletedAtIsNull(@Param("approvalStatus") ApprovalStatus approvalStatus);

    @Query("SELECT MAX(a.anchorageCode) FROM Anchorage a WHERE a.anchorageCode LIKE 'BC-%-ND-%'")
    String findMaxAnchorageCode();

    @Query(value = "SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(anchorage_code, '^BC-0*(.*?)ND-0*', '\\1'), '') AS INTEGER)), 0) FROM anchorages WHERE anchorage_code ~ '^BC-.*-ND-[0-9]+$' AND deleted_at IS NULL", nativeQuery = true)
    Integer findMaxAnchorageCodeNumber();

    /**
     * Search anchorages with unaccent support on code and name.
     */
    @Query("SELECT a FROM Anchorage a WHERE a.deletedAt IS NULL " +
            "AND (:includeAll = true OR a.orgUnitId IN :orgUnitIds) " +
            "AND (CAST(:search AS string) IS NULL OR " +
            "  (CAST(function('immutable_unaccent', LOWER(a.anchorageCode)) AS string) LIKE " +
            "   CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string) " +
            "  OR CAST(function('immutable_unaccent', LOWER(a.anchorageName)) AS string) LIKE " +
            "   CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string))) " +
            "AND (CAST(:anchorageCode AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(a.anchorageCode)) AS string) LIKE " +
            "  CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:anchorageCode AS string), '%'))) AS string)) " +
            "AND (CAST(:anchorageName AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(a.anchorageName)) AS string) LIKE " +
            "  CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:anchorageName AS string), '%'))) AS string)) " +
            "AND (:portId IS NULL OR a.portId = :portId) " +
            "AND (:navigationChannelId IS NULL OR a.navigationChannelId = :navigationChannelId) " +
            "AND (:buoyStationId IS NULL OR a.buoyStationId = :buoyStationId) " +
            "AND (:provinceId IS NULL OR a.provinceId = :provinceId) " +
            "AND (:approvalStatus IS NULL OR a.approvalStatus = :approvalStatus) " +
            "AND ((:operationalStatusNull = true AND a.operationalStatus IS NULL) OR " +
            "  (:operationalStatusNull = false AND (:operationalStatus IS NULL OR a.operationalStatus = :operationalStatus))) " +
            "AND (CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR a.updatedAt >= :updatedFrom) " +
            "AND (CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR a.updatedAt <= :updatedTo)")
    Page<Anchorage> searchAnchorages(
            @Param("includeAll") boolean includeAll,
            @Param("orgUnitIds") Collection<UUID> orgUnitIds,
            @Param("search") String search,
            @Param("anchorageCode") String anchorageCode,
            @Param("anchorageName") String anchorageName,
            @Param("portId") UUID portId,
            @Param("navigationChannelId") UUID navigationChannelId,
            @Param("buoyStationId") UUID buoyStationId,
            @Param("provinceId") Integer provinceId,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("operationalStatus") OperationalStatus operationalStatus,
            @Param("operationalStatusNull") boolean operationalStatusNull,
            @Param("updatedFrom") java.time.LocalDateTime updatedFrom,
            @Param("updatedTo") java.time.LocalDateTime updatedTo,
            Pageable pageable);

    /**
     * @deprecated Use the new searchAnchorages method instead.
     */
    @Deprecated
    default Page<Anchorage> searchAnchorages(UUID orgUnitId, String search, String anchorageCode,
                                              String anchorageName, UUID portId,
                                              ApprovalStatus approvalStatus,
                                              OperationalStatus operationalStatus, Pageable pageable) {
        return searchAnchorages(orgUnitId == null, orgUnitId != null ? List.of(orgUnitId) : List.of(),
                search, anchorageCode, anchorageName, portId, null, null,
                null,
                approvalStatus, operationalStatus, false, null, null, pageable);
    }
}
