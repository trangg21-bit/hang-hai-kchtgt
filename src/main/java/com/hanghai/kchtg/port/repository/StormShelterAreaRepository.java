package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.entity.StormShelterArea;
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
public interface StormShelterAreaRepository extends JpaRepository<StormShelterArea, UUID> {

    Optional<StormShelterArea> findByStormShelterCode(String stormShelterCode);

    boolean existsByStormShelterCode(String stormShelterCode);

    @Query("SELECT a FROM StormShelterArea a WHERE a.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR a.orgUnitId = :orgUnitId)")
    Page<StormShelterArea> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    @Query("SELECT a FROM StormShelterArea a WHERE a.deletedAt IS NULL AND a.portId = :portId")
    List<StormShelterArea> findByPortIdAndDeletedAtIsNull(@Param("portId") UUID portId);

    @Query("SELECT COUNT(a) FROM StormShelterArea a WHERE a.deletedAt IS NULL AND a.portId = :portId")
    long countByPortIdAndDeletedAtIsNull(@Param("portId") UUID portId);

    @Query("SELECT a FROM StormShelterArea a WHERE a.deletedAt IS NULL AND a.portId = :portId")
    Page<StormShelterArea> findByPortId(@Param("portId") UUID portId, Pageable pageable);

    @Query("SELECT COUNT(a) FROM StormShelterArea a WHERE a.deletedAt IS NULL AND a.approvalStatus = :approvalStatus")
    long countByApprovalStatusAndDeletedAtIsNull(@Param("approvalStatus") ApprovalStatus approvalStatus);

    @Query("SELECT MAX(a.stormShelterCode) FROM StormShelterArea a WHERE a.stormShelterCode LIKE 'BC-%-TTB-%'")
    String findMaxStormShelterCode();

    @Query(value = "SELECT COALESCE(MAX(CAST(NULLIF(REGEXP_REPLACE(storm_shelter_code, '^BC-0*(.*?)TTB-0*', '\\1'), '') AS INTEGER)), 0) FROM storm_shelter_areas WHERE storm_shelter_code ~ '^BC-.*-TTB-[0-9]+$' AND deleted_at IS NULL", nativeQuery = true)
    Integer findMaxStormShelterCodeNumber();

    /**
     * Search storm shelter areas with unaccent support on code and name.
     */
    @Query("SELECT a FROM StormShelterArea a WHERE a.deletedAt IS NULL " +
            "AND (:includeAll = true OR a.orgUnitId IN :orgUnitIds) " +
            "AND (CAST(:search AS string) IS NULL OR " +
            "  (CAST(function('immutable_unaccent', LOWER(a.stormShelterCode)) AS string) LIKE " +
            "   CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string) " +
            "  OR CAST(function('immutable_unaccent', LOWER(a.stormShelterName)) AS string) LIKE " +
            "   CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string))) " +
            "AND (CAST(:stormShelterCode AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(a.stormShelterCode)) AS string) LIKE " +
            "  CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:stormShelterCode AS string), '%'))) AS string)) " +
            "AND (CAST(:stormShelterName AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(a.stormShelterName)) AS string) LIKE " +
            "  CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:stormShelterName AS string), '%'))) AS string)) " +
            "AND (:portId IS NULL OR a.portId = :portId) " +
            "AND (:navigationChannelId IS NULL OR a.navigationChannelId = :navigationChannelId) " +
            "AND (:buoyStationId IS NULL OR a.buoyStationId = :buoyStationId) " +
            "AND (CAST(:classification AS string) IS NULL OR " +
            "  CAST(function('immutable_unaccent', LOWER(a.classification)) AS string) LIKE " +
            "  CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:classification AS string), '%'))) AS string)) " +
            "AND (:provinceId IS NULL OR a.provinceId = :provinceId) " +
            "AND (:approvalStatus IS NULL OR a.approvalStatus = :approvalStatus) " +
            "AND ((:operationalStatusNull = true AND a.operationalStatus IS NULL) OR " +
            "  (:operationalStatusNull = false AND (:operationalStatus IS NULL OR a.operationalStatus = :operationalStatus))) " +
            "AND (CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR a.updatedAt >= :updatedFrom) " +
            "AND (CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR a.updatedAt <= :updatedTo)")
    Page<StormShelterArea> searchStormShelterAreas(
            @Param("includeAll") boolean includeAll,
            @Param("orgUnitIds") Collection<UUID> orgUnitIds,
            @Param("search") String search,
            @Param("stormShelterCode") String stormShelterCode,
            @Param("stormShelterName") String stormShelterName,
            @Param("portId") UUID portId,
            @Param("navigationChannelId") UUID navigationChannelId,
            @Param("buoyStationId") UUID buoyStationId,
            @Param("classification") String classification,
            @Param("provinceId") Integer provinceId,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("operationalStatus") OperationalStatus operationalStatus,
            @Param("operationalStatusNull") boolean operationalStatusNull,
            @Param("updatedFrom") java.time.LocalDateTime updatedFrom,
            @Param("updatedTo") java.time.LocalDateTime updatedTo,
            Pageable pageable);
}
