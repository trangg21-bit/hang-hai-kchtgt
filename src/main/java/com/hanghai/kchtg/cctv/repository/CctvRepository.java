package com.hanghai.kchtg.cctv.repository;

import java.util.UUID;

import com.hanghai.kchtg.cctv.entity.Cctv;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.cctv.dto.CctvOptionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Collection;

/**
 * Repository for Cctv entity.
 * Supports org-unit filtering and device code generation.
 */
@Repository
public interface CctvRepository extends JpaRepository<Cctv, UUID> {

    Optional<Cctv> findByDeviceCode(String deviceCode);

    boolean existsByDeviceCode(String deviceCode);

    @Query("SELECT c FROM Cctv c WHERE c.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR c.orgUnitId = :orgUnitId)")
    Page<Cctv> findAllActive(@Param("orgUnitId") String orgUnitId, Pageable pageable);

    long countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus approvalStatus);

    /**
     * Số thứ tự lớn nhất trong mã thiết bị dạng CCTV-<số> — tính trên MỌI bản ghi
     * (kể cả bản ghi đã xóa mềm, vì bản ghi xóa mềm vẫn chiếm unique index device_code).
     * So sánh theo SỐ, không so sánh chuỗi (tránh 'CCTV-000010' < 'CCTV-000002' theo từ điển).
     */
    @Query(value = "SELECT MAX(CAST(SUBSTRING(device_code FROM 6) AS INTEGER)) " +
            "FROM cctv WHERE device_code ~ '^CCTV-[0-9]+$'", nativeQuery = true)
    Optional<Integer> findMaxDeviceCodeSequence();

    /**
     * Kiểm tra mã thiết bị đã tồn tại — kể cả bản ghi đã xóa mềm
     * (unique constraint device_code vẫn áp dụng cho bản ghi xóa mềm).
     */
    @Query(value = "SELECT EXISTS (SELECT 1 FROM cctv WHERE device_code = :deviceCode)", nativeQuery = true)
    boolean existsDeviceCodeAnyState(@Param("deviceCode") String deviceCode);

    @Query("SELECT new com.hanghai.kchtg.cctv.dto.CctvOptionResponse(c.id, c.deviceCode, c.deviceName, c.orgUnitId) " +
           "FROM Cctv c WHERE c.deletedAt IS NULL ORDER BY c.deviceName ASC")
    List<CctvOptionResponse> findAllOptions();

    @Query("SELECT new com.hanghai.kchtg.cctv.dto.CctvOptionResponse(c.id, c.deviceCode, c.deviceName, c.orgUnitId) " +
           "FROM Cctv c WHERE c.deletedAt IS NULL AND c.orgUnitId IN :orgUnitIds ORDER BY c.deviceName ASC")
    List<CctvOptionResponse> findOptionsByOrgUnitIds(@Param("orgUnitIds") Collection<UUID> orgUnitIds);

    @Query("SELECT c FROM Cctv c WHERE c.id = :id AND c.deletedAt IS NULL")
    Optional<Cctv> findActiveById(@Param("id") UUID id);

    /**
     * All active (non-deleted) CCTV systems for the directory cache.
     */
    @Query("SELECT c FROM Cctv c WHERE c.deletedAt IS NULL ORDER BY c.deviceName ASC")
    List<Cctv> findAllActiveForCache();

    @Query("SELECT c FROM Cctv c WHERE c.deletedAt IS NULL " +
            "AND (:includeAll = true OR c.orgUnitId IN :orgUnitIds) " +
            "AND (:filterEnabled = false OR c.orgUnitId IN :filterOrgUnitIds) " +
            "AND (CAST(:deviceCode AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(c.deviceCode)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:deviceCode AS string), '%'))) AS string)) " +
            "AND (CAST(:deviceName AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(c.deviceName)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:deviceName AS string), '%'))) AS string)) " +
            "AND (:operationalStatus IS NULL OR c.operationalStatus = :operationalStatus) " +
            "AND (:approvalStatus IS NULL OR c.approvalStatus = :approvalStatus) " +
            "AND (:yearOfUse IS NULL OR c.yearOfUse = :yearOfUse) " +
            "AND (CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR c.updatedAt >= :updatedFrom) " +
            "AND (CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR c.updatedAt <= :updatedTo) " +
            "AND (CAST(:provinceId AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(c.provinceName)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:provinceId AS string), '%'))) AS string)) " +
            "AND (:attachedInfrastructureType IS NULL OR c.attachedInfrastructureType = :attachedInfrastructureType) " +
            "AND (:attachedInfrastructureId IS NULL OR c.attachedInfrastructureId = :attachedInfrastructureId) " +
            "AND (CAST(:search AS string) IS NULL OR (CAST(function('immutable_unaccent', LOWER(c.deviceCode)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string) OR CAST(function('immutable_unaccent', LOWER(c.deviceName)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string)))")
    Page<Cctv> searchCctv(
            @Param("includeAll") boolean includeAll,
            @Param("orgUnitIds") Collection<UUID> orgUnitIds,
            @Param("filterEnabled") boolean filterEnabled,
            @Param("filterOrgUnitIds") Collection<UUID> filterOrgUnitIds,
            @Param("deviceCode") String deviceCode,
            @Param("deviceName") String deviceName,
            @Param("operationalStatus") OperationalStatus operationalStatus,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("yearOfUse") Integer yearOfUse,
            @Param("updatedFrom") java.time.LocalDateTime updatedFrom,
            @Param("updatedTo") java.time.LocalDateTime updatedTo,
            @Param("provinceId") String provinceId,
            @Param("attachedInfrastructureType") Integer attachedInfrastructureType,
            @Param("attachedInfrastructureId") UUID attachedInfrastructureId,
            @Param("search") String search,
            Pageable pageable);

    // ── Soft-delete restore queries ──────────────────────────────────

    /**
     * Native query to find a deleted CCTV's id and deleted_at timestamp.
     */
    @Query(value = "SELECT c.id, c.deleted_at FROM cctv c WHERE c.id = :id AND c.deleted_at IS NOT NULL", nativeQuery = true)
    Optional<Object[]> findDeletedCctvById(@Param("id") UUID id);

    /**
     * JPQL bulk UPDATE to restore a soft-deleted CCTV.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Cctv c SET c.deletedAt = NULL, c.deletedBy = NULL WHERE c.id = :id AND c.deletedAt IS NOT NULL")
    int restoreCctvById(@Param("id") UUID id);
}
