package com.hanghai.kchtg.vhf.repository;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.List;
import java.util.Optional;
import java.util.Collection;

import com.hanghai.kchtg.vhf.entity.Vhf;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.vhf.dto.VhfOptionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Vhf entity.
 * Supports org-unit filtering and device code generation.
 */
@Repository
public interface VhfRepository extends JpaRepository<Vhf, UUID> {

    Optional<Vhf> findByIdAndDeletedAtIsNull(UUID id);

    Optional<Vhf> findByDeviceCodeAndDeletedAtIsNull(String deviceCode);

    boolean existsByDeviceCodeAndDeletedAtIsNull(String deviceCode);

    /**
     * Kiểm tra mã thiết bị đã tồn tại trong DB hay chưa, kể cả bản ghi đã xóa mềm.
     */
    @Query(value = "SELECT EXISTS (SELECT 1 FROM vhf WHERE device_code = :deviceCode)", nativeQuery = true)
    boolean existsDeviceCodeAnyState(@Param("deviceCode") String deviceCode);

    @Query("SELECT new com.hanghai.kchtg.vhf.dto.VhfOptionResponse(v.id, v.deviceCode, v.deviceName, v.orgUnitId) " +
           "FROM Vhf v WHERE v.deletedAt IS NULL ORDER BY v.deviceName ASC")
    List<VhfOptionResponse> findAllOptions();

    @Query("SELECT new com.hanghai.kchtg.vhf.dto.VhfOptionResponse(v.id, v.deviceCode, v.deviceName, v.orgUnitId) " +
           "FROM Vhf v WHERE v.deletedAt IS NULL AND v.orgUnitId IN :orgUnitIds ORDER BY v.deviceName ASC")
    List<VhfOptionResponse> findOptionsByOrgUnitIds(@Param("orgUnitIds") Collection<UUID> orgUnitIds);

    @Query("SELECT v FROM Vhf v WHERE v.id = :id AND v.deletedAt IS NULL")
    Optional<Vhf> findActiveById(@Param("id") UUID id);

    /**
     * All active (non-deleted) VHF systems for directory cache.
     */
    @Query("SELECT v FROM Vhf v WHERE v.deletedAt IS NULL ORDER BY v.deviceName ASC")
    List<Vhf> findAllActiveForCache();

    @Query("SELECT v FROM Vhf v WHERE " +
            "(:isDeleted IS NULL OR (:isDeleted = true AND (v.deletedAt IS NOT NULL OR v.deletedBy IS NOT NULL)) OR (:isDeleted = false AND v.deletedAt IS NULL AND v.deletedBy IS NULL)) " +
            "AND (:includeAll = true OR v.orgUnitId IN :orgUnitIds) " +
            "AND (:filterEnabled = false OR v.orgUnitId IN :filterOrgUnitIds) " +
            "AND (:seaportId IS NULL OR v.seaportId = :seaportId) " +
            "AND (CAST(:deviceCode AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(v.deviceCode)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:deviceCode AS string), '%'))) AS string)) " +
            "AND (CAST(:deviceName AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(v.deviceName)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:deviceName AS string), '%'))) AS string)) " +
            "AND (:operationalStatus IS NULL OR v.operationalStatus = :operationalStatus) " +
            "AND (:approvalStatus IS NULL OR v.approvalStatus = :approvalStatus) " +
            "AND (:yearOfUse IS NULL OR v.yearOfUse = :yearOfUse) " +
            "AND (CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR v.updatedAt >= :updatedFrom) " +
            "AND (CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR v.updatedAt <= :updatedTo) " +
            "AND (CAST(:provinceId AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(v.provinceName)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:provinceId AS string), '%'))) AS string)) " +
            "AND (:attachedInfrastructureType IS NULL OR v.attachedInfrastructureType = :attachedInfrastructureType) " +
            "AND (:attachedInfrastructureId IS NULL OR v.attachedInfrastructureId = :attachedInfrastructureId) " +
            "AND (CAST(:search AS string) IS NULL OR (CAST(function('immutable_unaccent', LOWER(v.deviceCode)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string) OR CAST(function('immutable_unaccent', LOWER(v.deviceName)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string)))")
    Page<Vhf> searchVhf(
            @Param("isDeleted") Boolean isDeleted,
            @Param("includeAll") boolean includeAll,
            @Param("orgUnitIds") Collection<UUID> orgUnitIds,
            @Param("filterEnabled") boolean filterEnabled,
            @Param("filterOrgUnitIds") Collection<UUID> filterOrgUnitIds,
            @Param("seaportId") UUID seaportId,
            @Param("deviceCode") String deviceCode,
            @Param("deviceName") String deviceName,
            @Param("operationalStatus") OperationalStatus operationalStatus,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("yearOfUse") Integer yearOfUse,
            @Param("updatedFrom") LocalDateTime updatedFrom,
            @Param("updatedTo") LocalDateTime updatedTo,
            @Param("provinceId") String provinceId,
            @Param("attachedInfrastructureType") Integer attachedInfrastructureType,
            @Param("attachedInfrastructureId") UUID attachedInfrastructureId,
            @Param("search") String search,
            Pageable pageable);

    @Query(value = "SELECT COALESCE(MAX(CAST(SUBSTRING(device_code FROM '[0-9]+$') AS INTEGER)), 0) FROM vhf",
           nativeQuery = true)
    int findMaxDeviceCodeNumber();

    @Modifying
    @Query("UPDATE Vhf v SET v.deletedAt = CURRENT_TIMESTAMP, v.deletedBy = :deletedBy WHERE v.id = :id")
    void softDelete(@Param("id") UUID id, @Param("deletedBy") UUID deletedBy);

    @Query(value = "SELECT v.id, v.deleted_at FROM vhf v WHERE v.id = :id AND v.deleted_at IS NOT NULL", nativeQuery = true)
    Optional<Object[]> findDeletedVhfById(@Param("id") UUID id);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Vhf v SET v.deletedAt = NULL, v.deletedBy = NULL WHERE v.id = :id AND v.deletedAt IS NOT NULL")
    int restoreVhfById(@Param("id") UUID id);
}
