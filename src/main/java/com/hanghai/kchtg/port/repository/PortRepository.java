package com.hanghai.kchtg.port.repository;

import java.util.UUID;

import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.Collection;
import com.hanghai.kchtg.port.dto.port.PortOptionResponse;

/**
 * Repository for Port entity.
 * Supports org-unit filtering and code uniqueness checks.
 */
@Repository
public interface PortRepository extends JpaRepository<Port, UUID> {

    Optional<Port> findByPortCode(String portCode);

    boolean existsByPortCode(String portCode);

    @Query("SELECT p FROM Port p WHERE p.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR p.orgUnitId = :orgUnitId)")
    Page<Port> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    long countByApprovalStatusAndDeletedAtIsNull(ApprovalStatus approvalStatus);

    @Query("SELECT MAX(p.portCode) FROM Port p WHERE p.portCode LIKE 'CB-%' AND p.deletedAt IS NULL")
    Optional<String> findMaxPortCode();

    @Query("SELECT new com.hanghai.kchtg.port.dto.port.PortOptionResponse(p.id, p.portCode, p.portName, p.orgUnitId) " +
           "FROM Port p WHERE p.deletedAt IS NULL ORDER BY p.portName ASC")
    List<PortOptionResponse> findAllOptions();

    @Query("SELECT new com.hanghai.kchtg.port.dto.port.PortOptionResponse(p.id, p.portCode, p.portName, p.orgUnitId) " +
           "FROM Port p WHERE p.deletedAt IS NULL AND p.orgUnitId IN :orgUnitIds ORDER BY p.portName ASC")
    List<PortOptionResponse> findOptionsByOrgUnitIds(@Param("orgUnitIds") Collection<UUID> orgUnitIds);

    @Query("SELECT p FROM Port p WHERE p.id = :id AND p.deletedAt IS NULL")
    Optional<Port> findActiveById(@Param("id") UUID id);

    /**
     * All active (non-deleted) ports for the port directory cache.
     */
    @Query("SELECT p FROM Port p WHERE p.deletedAt IS NULL ORDER BY p.portName ASC")
    List<Port> findAllActiveForCache();

    @Query("SELECT p FROM Port p WHERE p.deletedAt IS NULL " +
            "AND (:orgUnitId IS NULL OR p.orgUnitId = :orgUnitId) " +
            "AND (CAST(:portCode AS string) IS NULL OR LOWER(p.portCode) LIKE LOWER(CONCAT('%', CAST(:portCode AS string), '%'))) " +
            "AND (CAST(:portName AS string) IS NULL OR LOWER(p.portName) LIKE LOWER(CONCAT('%', CAST(:portName AS string), '%'))) " +
            "AND (CAST(:province AS string) IS NULL OR LOWER(p.province) LIKE LOWER(CONCAT('%', CAST(:province AS string), '%'))) " +
            "AND (:operationalStatus IS NULL OR p.operationalStatus = :operationalStatus) " +
            "AND (:approvalStatus IS NULL OR p.approvalStatus = :approvalStatus) " +
            "AND (:portGroup IS NULL OR p.portGroup = :portGroup) " +
            "AND (:portClass IS NULL OR p.portClass = :portClass) " +
            "AND (CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR p.updatedAt >= :updatedFrom) " +
            "AND (CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR p.updatedAt <= :updatedTo) " +
            "AND (CAST(:search AS string) IS NULL OR (LOWER(p.portCode) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')) OR LOWER(p.portName) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))))")
    Page<Port> searchPorts(
            @Param("orgUnitId") UUID orgUnitId,
            @Param("portCode") String portCode,
            @Param("portName") String portName,
            @Param("province") String province,
            @Param("operationalStatus") OperationalStatus operationalStatus,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("portGroup") Integer portGroup,
            @Param("portClass") Integer portClass,
            @Param("updatedFrom") java.time.LocalDateTime updatedFrom,
            @Param("updatedTo") java.time.LocalDateTime updatedTo,
            @Param("search") String search,
            Pageable pageable);

    // ── Soft-delete restore queries ──────────────────────────────────

    /**
     * Native query to find a deleted port's id and deleted_at timestamp.
     * Bypasses @SQLRestriction("deleted_at IS NULL") on BaseEntity
     * which prevents findById from locating soft-deleted rows.
     */
    @Query(value = "SELECT p.id, p.deleted_at FROM ports p WHERE p.id = :id AND p.deleted_at IS NOT NULL", nativeQuery = true)
    Optional<Object[]> findDeletedPortById(@Param("id") UUID id);

    /**
     * JPQL bulk UPDATE to restore a soft-deleted port.
     * @SQLRestriction does NOT apply to UPDATE statements, so this bypasses the filter.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Port p SET p.deletedAt = NULL, p.deletedBy = NULL WHERE p.id = :id AND p.deletedAt IS NOT NULL")
    int restorePortById(@Param("id") UUID id);
}
