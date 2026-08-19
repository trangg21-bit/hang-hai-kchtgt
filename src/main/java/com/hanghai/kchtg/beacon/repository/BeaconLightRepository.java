package com.hanghai.kchtg.beacon.repository;

import com.hanghai.kchtg.beacon.entity.BeaconLight;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


public interface BeaconLightRepository extends JpaRepository<BeaconLight, UUID> {

    Optional<BeaconLight> findByCode(String code);
    boolean existsByCode(String code);

    Page<BeaconLight> findByStatus(String status, Pageable pageable);
    Page<BeaconLight> findByType(String type, Pageable pageable);
    List<BeaconLight> findByNameContainingIgnoreCase(String name);
    List<BeaconLight> findByCodeContainingIgnoreCase(String code);

    @Query("SELECT b FROM BeaconLight b WHERE " +
           "(:name IS NULL OR LOWER(b.name) LIKE LOWER(CONCAT('%', cast(:name as string), '%'))) AND " +
           "(:code IS NULL OR LOWER(b.code) LIKE LOWER(CONCAT('%', cast(:code as string), '%'))) AND " +
           "(:type IS NULL OR b.type = :type) AND " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:unitId IS NULL OR b.unitId = :unitId) AND " +
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
    List<BeaconLight> searchFiltered(
        @Param("name") String name,
        @Param("code") String code,
        @Param("type") String type,
        @Param("status") String status,
        @Param("unitId") UUID unitId,
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

    @Query("SELECT b FROM BeaconLight b WHERE " +
           "(:name IS NULL OR LOWER(b.name) LIKE LOWER(CONCAT('%', cast(:name as string), '%'))) AND " +
           "(:code IS NULL OR LOWER(b.code) LIKE LOWER(CONCAT('%', cast(:code as string), '%'))) AND " +
           "(:type IS NULL OR b.type = :type) AND " +
           "(:status IS NULL OR b.status = :status) AND " +
           "(:unitId IS NULL OR b.unitId = :unitId) AND " +
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
    Page<BeaconLight> searchFilteredPaged(
        @Param("name") String name,
        @Param("code") String code,
        @Param("type") String type,
        @Param("status") String status,
        @Param("unitId") UUID unitId,
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

    @Query("SELECT b FROM BeaconLight b WHERE " +
            "b.deletedAt IS NULL AND " +
            "b.approvalStatus = 'APPROVED' AND " +
            "(:orgUnitId IS NULL OR b.unitId = :orgUnitId) AND " +
            "(:search IS NULL OR LOWER(b.name) LIKE :search OR LOWER(b.code) LIKE :search)")
    List<BeaconLight> searchGis(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("search") String search);
}
