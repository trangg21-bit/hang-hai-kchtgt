package com.hanghai.kchtg.beacon.repository;

import com.hanghai.kchtg.beacon.entity.BeaconStation;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface BeaconStationRepository extends JpaRepository<BeaconStation, UUID> {

    Optional<BeaconStation> findByCode(String code);
    boolean existsByCode(String code);

    @Query("SELECT MAX(b.code) FROM BeaconStation b WHERE b.code IS NOT NULL")
    String findMaxCode();

    Page<BeaconStation> findByStatus(String status, Pageable pageable);
    Page<BeaconStation> findByType(String type, Pageable pageable);
    List<BeaconStation> findByNameContainingIgnoreCase(String name);
    List<BeaconStation> findByCodeContainingIgnoreCase(String code);

    @Query("SELECT b FROM BeaconStation b WHERE " +
           "(:name IS NULL OR CAST(function('immutable_unaccent', LOWER(b.name)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:name AS string), '%'))) AS string)) AND " +
           "(:code IS NULL OR CAST(function('immutable_unaccent', LOWER(b.code)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:code AS string), '%'))) AS string)) AND " +
           "(:type IS NULL OR b.type = :type) AND " +
           "(:primaryLightModel IS NULL OR CAST(function('immutable_unaccent', LOWER(b.primaryLightModel)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:primaryLightModel AS string), '%'))) AS string)) AND " +
           "(:status IS NULL OR (:status = 'DELETED' AND (b.status = 'DELETED' OR b.deletedAt IS NOT NULL OR b.deletedBy IS NOT NULL)) OR (b.status = :status AND b.deletedAt IS NULL AND b.deletedBy IS NULL)) AND " +
           "(:includeAll = true OR (b.unitId IN :orgUnitIds OR b.orgUnitId IN :orgUnitIds)) AND " +
           "(:seaportId IS NULL OR b.seaportId = :seaportId) AND " +
           "(CAST(:operator AS string) IS NULL OR LOWER(b.operator) LIKE LOWER(CONCAT('%', CAST(:operator AS string), '%'))) AND " +
           "(:provinceId IS NULL OR b.provinceId = :provinceId) AND " +
           "(:operationalStatus IS NULL OR b.operationalStatus = :operationalStatus) AND " +
           "(:stationArea IS NULL OR b.stationArea = :stationArea) AND " +
           "(:approvalStatus IS NULL OR b.approvalStatus = :approvalStatus) AND " +
           "(:updatedBy IS NULL OR b.updatedBy = :updatedBy) AND " +
           "(CAST(:commissionedFrom AS date) IS NULL OR b.commissionedDate >= :commissionedFrom) AND " +
           "(CAST(:commissionedTo AS date) IS NULL OR b.commissionedDate <= :commissionedTo) AND " +
           "(CAST(:updatedFrom AS timestamp) IS NULL OR b.updatedAt >= :updatedFrom) AND " +
           "(CAST(:updatedTo AS timestamp) IS NULL OR b.updatedAt <= :updatedTo) ORDER BY b.updatedAt DESC")
    List<BeaconStation> searchFiltered(
        @Param("name") String name,
        @Param("code") String code,
        @Param("type") String type,
        @Param("primaryLightModel") String primaryLightModel,
        @Param("status") String status,
        @Param("includeAll") boolean includeAll,
        @Param("orgUnitIds") Collection<UUID> orgUnitIds,
        @Param("seaportId") UUID seaportId,
        @Param("operator") String operator,
        @Param("provinceId") Integer provinceId,
        @Param("operationalStatus") Integer operationalStatus,
        @Param("stationArea") Double stationArea,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("updatedBy") UUID updatedBy,
        @Param("commissionedFrom") LocalDate commissionedFrom,
        @Param("commissionedTo") LocalDate commissionedTo,
        @Param("updatedFrom") LocalDateTime updatedFrom,
        @Param("updatedTo") LocalDateTime updatedTo
    );

    @Query("SELECT b FROM BeaconStation b WHERE " +
           "(:name IS NULL OR CAST(function('immutable_unaccent', LOWER(b.name)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:name AS string), '%'))) AS string)) AND " +
           "(:code IS NULL OR CAST(function('immutable_unaccent', LOWER(b.code)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:code AS string), '%'))) AS string)) AND " +
           "(:type IS NULL OR b.type = :type) AND " +
           "(:primaryLightModel IS NULL OR CAST(function('immutable_unaccent', LOWER(b.primaryLightModel)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:primaryLightModel AS string), '%'))) AS string)) AND " +
           "(:status IS NULL OR (:status = 'DELETED' AND (b.status = 'DELETED' OR b.deletedAt IS NOT NULL OR b.deletedBy IS NOT NULL)) OR (b.status = :status AND b.deletedAt IS NULL AND b.deletedBy IS NULL)) AND " +
           "(:includeAll = true OR (b.unitId IN :orgUnitIds OR b.orgUnitId IN :orgUnitIds)) AND " +
           "(:seaportId IS NULL OR b.seaportId = :seaportId) AND " +
           "(CAST(:operator AS string) IS NULL OR LOWER(b.operator) LIKE LOWER(CONCAT('%', CAST(:operator AS string), '%'))) AND " +
           "(:provinceId IS NULL OR b.provinceId = :provinceId) AND " +
           "(:operationalStatus IS NULL OR b.operationalStatus = :operationalStatus) AND " +
           "(:stationArea IS NULL OR b.stationArea = :stationArea) AND " +
           "(:approvalStatus IS NULL OR b.approvalStatus = :approvalStatus) AND " +
           "(:updatedBy IS NULL OR b.updatedBy = :updatedBy) AND " +
           "(CAST(:commissionedFrom AS date) IS NULL OR b.commissionedDate >= :commissionedFrom) AND " +
           "(CAST(:commissionedTo AS date) IS NULL OR b.commissionedDate <= :commissionedTo) AND " +
           "(CAST(:updatedFrom AS timestamp) IS NULL OR b.updatedAt >= :updatedFrom) AND " +
           "(CAST(:updatedTo AS timestamp) IS NULL OR b.updatedAt <= :updatedTo) ORDER BY b.updatedAt DESC")
    Page<BeaconStation> searchFilteredPaged(
        @Param("name") String name,
        @Param("code") String code,
        @Param("type") String type,
        @Param("primaryLightModel") String primaryLightModel,
        @Param("status") String status,
        @Param("includeAll") boolean includeAll,
        @Param("orgUnitIds") Collection<UUID> orgUnitIds,
        @Param("seaportId") UUID seaportId,
        @Param("operator") String operator,
        @Param("provinceId") Integer provinceId,
        @Param("operationalStatus") Integer operationalStatus,
        @Param("stationArea") Double stationArea,
        @Param("approvalStatus") ApprovalStatus approvalStatus,
        @Param("updatedBy") UUID updatedBy,
        @Param("commissionedFrom") LocalDate commissionedFrom,
        @Param("commissionedTo") LocalDate commissionedTo,
        @Param("updatedFrom") LocalDateTime updatedFrom,
        @Param("updatedTo") LocalDateTime updatedTo,
        Pageable pageable
    );

    long countByStatus(String status);

    @Query("SELECT b FROM BeaconStation b WHERE " +
            "b.deletedAt IS NULL AND " +
            "b.approvalStatus = 'APPROVED' AND " +
            "(:orgUnitId IS NULL OR b.unitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(b.name) LIKE :search OR LOWER(b.code) LIKE :search)")
    List<BeaconStation> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
