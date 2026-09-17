package com.hanghai.kchtg.port.repository;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.entity.Pier;
import com.hanghai.kchtg.port.entity.PierType;
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
public interface PierRepository extends JpaRepository<Pier, UUID> {

    Optional<Pier> findByPierCode(String pierCode);

    boolean existsByPierCode(String pierCode);

    boolean existsByPierName(String pierName);

    @Query("SELECT p FROM Pier p WHERE (p.deletedAt IS NULL AND p.deletedBy IS NULL) " +
            "AND (:orgUnitId IS NULL OR p.orgUnitId = :orgUnitId)")
    Page<Pier> findAllActive(@Param("orgUnitId") UUID orgUnitId, Pageable pageable);

    @Query("SELECT p FROM Pier p WHERE (p.deletedAt IS NULL AND p.deletedBy IS NULL) AND p.berthId = :berthId")
    List<Pier> findByBerthIdAndDeletedAtIsNull(@Param("berthId") UUID berthId);

    @Query("SELECT COUNT(p) FROM Pier p WHERE (p.deletedAt IS NULL AND p.deletedBy IS NULL) AND p.berthId = :berthId")
    long countByBerthIdAndDeletedAtIsNull(@Param("berthId") UUID berthId);

    @Query("SELECT p FROM Pier p WHERE (p.deletedAt IS NULL AND p.deletedBy IS NULL) AND p.berthId = :berthId")
    Page<Pier> findByBerthId(@Param("berthId") UUID berthId, Pageable pageable);

    @Query("SELECT COUNT(p) FROM Pier p WHERE (p.deletedAt IS NULL AND p.deletedBy IS NULL) AND p.approvalStatus = :approvalStatus")
    long countByApprovalStatusAndDeletedAtIsNull(@Param("approvalStatus") ApprovalStatus approvalStatus);

    @Query("SELECT COUNT(p) FROM Pier p WHERE p.deletedAt IS NOT NULL OR p.deletedBy IS NOT NULL")
    long countDeleted();

    @Query("SELECT p FROM Pier p WHERE (" +
            "  (:deletedOnly = true AND (p.deletedAt IS NOT NULL OR p.deletedBy IS NOT NULL)) " +
            "  OR (:deletedOnly = false AND :approvalStatus IS NULL) " +
            "  OR (:deletedOnly = false AND :approvalStatus IS NOT NULL AND p.deletedAt IS NULL AND p.deletedBy IS NULL AND p.approvalStatus = :approvalStatus)" +
            ") " +
            "AND (:includeAll = true OR p.orgUnitId IN :orgUnitIds) " +
            "AND (CAST(:search AS string) IS NULL OR (CAST(function('immutable_unaccent', LOWER(p.pierCode)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string) OR CAST(function('immutable_unaccent', LOWER(p.pierName)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:search AS string), '%'))) AS string))) " +
            "AND (CAST(:pierCode AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(p.pierCode)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:pierCode AS string), '%'))) AS string)) " +
            "AND (CAST(:pierName AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(p.pierName)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:pierName AS string), '%'))) AS string)) " +
            "AND (:berthId IS NULL OR p.berthId = :berthId) " +
            "AND (:portId IS NULL OR p.portId = :portId) " +
            "AND (:pierType IS NULL OR p.pierType = :pierType) " +
            "AND (CAST(:province AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(p.province)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:province AS string), '%'))) AS string)) " +
            "AND (:operationalStatus IS NULL OR p.operationalStatus = :operationalStatus) " +
            "AND (:navigationChannelId IS NULL OR p.navigationChannelId = :navigationChannelId) " +
            "AND (:constructionGrade IS NULL OR p.constructionGrade = :constructionGrade) " +
            "AND (:structureType IS NULL OR p.structureType = :structureType) " +
            "AND (CAST(:operationalFunction AS string) IS NULL OR CAST(function('immutable_unaccent', LOWER(p.operationalFunction)) AS string) LIKE CAST(function('immutable_unaccent', LOWER(CONCAT('%', CAST(:operationalFunction AS string), '%'))) AS string)) " +
            "AND (CAST(:updatedFrom AS java.time.LocalDateTime) IS NULL OR p.updatedAt >= :updatedFrom) " +
            "AND (CAST(:updatedTo AS java.time.LocalDateTime) IS NULL OR p.updatedAt <= :updatedTo)")
    Page<Pier> searchPiers(
            @Param("deletedOnly") boolean deletedOnly,
            @Param("approvalStatus") ApprovalStatus approvalStatus,
            @Param("includeAll") boolean includeAll,
            @Param("orgUnitIds") Collection<UUID> orgUnitIds,
            @Param("search") String search,
            @Param("pierCode") String pierCode,
            @Param("pierName") String pierName,
            @Param("berthId") UUID berthId,
            @Param("portId") UUID portId,
            @Param("pierType") PierType pierType,
            @Param("province") String province,
            @Param("operationalStatus") OperationalStatus operationalStatus,
            @Param("navigationChannelId") UUID navigationChannelId,
            @Param("constructionGrade") Integer constructionGrade,
            @Param("structureType") Integer structureType,
            @Param("operationalFunction") String operationalFunction,
            @Param("updatedFrom") java.time.LocalDateTime updatedFrom,
            @Param("updatedTo") java.time.LocalDateTime updatedTo,
            Pageable pageable);

    /** Backward-compatible overload with isDeleted Boolean. */
    default Page<Pier> searchPiers(
            Boolean isDeleted,
            boolean includeAll,
            Collection<UUID> orgUnitIds,
            String search,
            String pierCode,
            String pierName,
            UUID berthId,
            UUID portId,
            PierType pierType,
            String province,
            OperationalStatus operationalStatus,
            ApprovalStatus approvalStatus,
            UUID navigationChannelId,
            Integer constructionGrade,
            Integer structureType,
            String operationalFunction,
            java.time.LocalDateTime updatedFrom,
            java.time.LocalDateTime updatedTo,
            Pageable pageable) {
        boolean deletedOnly = Boolean.TRUE.equals(isDeleted);
        return searchPiers(deletedOnly, approvalStatus, includeAll, orgUnitIds, search, pierCode, pierName, berthId, portId, pierType,
                province, operationalStatus, navigationChannelId, constructionGrade, structureType,
                operationalFunction, updatedFrom, updatedTo, pageable);
    }

    /** Backward-compatible overload without isDeleted. */
    default Page<Pier> searchPiers(
            boolean includeAll,
            Collection<UUID> orgUnitIds,
            String search,
            String pierCode,
            String pierName,
            UUID berthId,
            UUID portId,
            PierType pierType,
            String province,
            OperationalStatus operationalStatus,
            ApprovalStatus approvalStatus,
            UUID navigationChannelId,
            Integer constructionGrade,
            Integer structureType,
            String operationalFunction,
            java.time.LocalDateTime updatedFrom,
            java.time.LocalDateTime updatedTo,
            Pageable pageable) {
        return searchPiers(false, approvalStatus, includeAll, orgUnitIds, search, pierCode, pierName, berthId, portId, pierType,
                province, operationalStatus, navigationChannelId, constructionGrade, structureType,
                operationalFunction, updatedFrom, updatedTo, pageable);
    }

    /** Backward-compatible overload used by GIS search — no port/province filter. */
    default Page<Pier> searchPiers(UUID orgUnitId, String search, UUID berthId, PierType pierType,
            OperationalStatus operationalStatus, ApprovalStatus approvalStatus, Pageable pageable) {
        return searchPiers(false, approvalStatus, orgUnitId == null, orgUnitId != null ? List.of(orgUnitId) : List.of(),
                search, null, null, berthId, null, pierType, null, operationalStatus,
                null, null, null, null, null, null, pageable);
    }
}
