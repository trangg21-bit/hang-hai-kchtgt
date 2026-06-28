package com.hanghai.kchtg.orgunit.repository;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
import com.hanghai.kchtg.orgunit.entity.OrgUnitType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link OrgUnit}.
 * Extends the basic CRUD operations with path-based and search queries
 * for materialized-path tree traversal.
 */
@Repository
public interface OrgUnitRepository extends JpaRepository<OrgUnit, UUID> {

    /**
     * Find all direct children of a given parent unit (respects soft-delete via @SQLRestriction).
     */
    List<OrgUnit> findByParentId(UUID parentId);

    /**
     * Find all root-level units (no parent).
     */
    List<OrgUnit> findByParentIdIsNull();

    /**
     * Look up a unit by its unique business code.
     */
    Optional<OrgUnit> findByCode(String code);

    /**
     * Check whether a code is already in use (any unit, including deleted ones — use
     * existsByCodeAndDeletedAtIsNull for active-only checks).
     */
    boolean existsByCode(String code);

    /**
     * Check whether a code is already in use by a different unit (excludes the given id).
     * Used during update to avoid false-positive on the same entity.
     */
    boolean existsByCodeAndIdNot(String code, UUID id);

    /**
     * Check whether a code is already in use by an active (non-deleted) unit with the given id excluded.
     */
    boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, UUID id);

    /**
     * Count direct children (active only, excludes deleted).
     */
    long countByParentIdAndDeletedAtIsNull(UUID parentId);

    /**
     * Find a unit by its unique code and scope (for multi-tenant support).
     */
    Optional<OrgUnit> findByCodeAndScopeId(String code, Long scopeId);

    // ── Path-based queries (Materialized Path) ───────────────────────

    /**
     * Find all units whose path starts with the given prefix (subtree query).
     * Uses LIKE '/1/%' pattern for O(log N) subtree retrieval.
     */
    @Query("SELECT u FROM OrgUnit u WHERE u.path LIKE :prefix% AND u.deletedAt IS NULL")
    List<OrgUnit> findByPathLikeAndDeletedAtIsNull(@Param("prefix") String prefix);

    /**
     * Find all units whose path starts with the given prefix, ordered by sort order.
     */
    @Query("SELECT u FROM OrgUnit u WHERE u.path LIKE :prefix% AND u.deletedAt IS NULL ORDER BY u.sortOrder ASC")
    List<OrgUnit> findAllByPathLikeOrderBySortOrder(@Param("prefix") String prefix);

    /**
     * Find all active units ordered by path (respects soft-delete).
     */
    @Query("SELECT u FROM OrgUnit u WHERE u.deletedAt IS NULL ORDER BY u.path ASC, u.sortOrder ASC")
    List<OrgUnit> findAllActiveOrderByPath();

    /**
     * Find all active units with pagination ordered by path.
     */
    @Query("SELECT u FROM OrgUnit u WHERE u.deletedAt IS NULL ORDER BY u.path ASC, u.sortOrder ASC")
    Page<OrgUnit> findAllActiveOrderByPath(Pageable pageable);

    // ── Search / filter queries ──────────────────────────────────────

    /**
     * Search units by name or code (case-insensitive, active only).
     */
    @Query("SELECT u FROM OrgUnit u WHERE "
            + "(LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) "
            + "OR LOWER(u.code) LIKE LOWER(CONCAT('%', :query, '%'))) "
            + "AND u.deletedAt IS NULL")
    List<OrgUnit> findByNameLikeOrCodeLike(@Param("query") String query);

    /**
     * Search units by name or code with pagination (active only).
     */
    @Query("SELECT u FROM OrgUnit u WHERE "
            + "(LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) "
            + "OR LOWER(u.code) LIKE LOWER(CONCAT('%', :query, '%'))) "
            + "AND u.deletedAt IS NULL")
    Page<OrgUnit> findByNameLikeOrCodeLike(@Param("query") String query, Pageable pageable);

    /**
     * Filter units by type (active only).
     */
    @Query("SELECT u FROM OrgUnit u WHERE u.type = :type AND u.deletedAt IS NULL")
    List<OrgUnit> findByTypeAndDeletedAtIsNull(@Param("type") OrgUnitType type);

    /**
     * Filter units by status (active only).
     */
    @Query("SELECT u FROM OrgUnit u WHERE u.status = :status AND u.deletedAt IS NULL")
    List<OrgUnit> findByStatusAndDeletedAtIsNull(@Param("status") OrgUnitStatus status);

    /**
     * Filter units by level (active only).
     */
    @Query("SELECT u FROM OrgUnit u WHERE u.level = :level AND u.deletedAt IS NULL")
    List<OrgUnit> findByLevelAndDeletedAtIsNull(@Param("level") Integer level);

    /**
     * Combined filter by type, status, and level (active only).
     */
    @Query("SELECT u FROM OrgUnit u WHERE "
            + "(:type IS NULL OR u.type = :type) "
            + "AND (:status IS NULL OR u.status = :status) "
            + "AND (:level IS NULL OR u.level = :level) "
            + "AND u.deletedAt IS NULL")
    Page<OrgUnit> findByFilters(@Param("type") OrgUnitType type,
                                @Param("status") OrgUnitStatus status,
                                @Param("level") Integer level,
                                Pageable pageable);
}
