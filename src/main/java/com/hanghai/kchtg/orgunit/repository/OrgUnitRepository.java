package com.hanghai.kchtg.orgunit.repository;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link OrgUnit}.
 */
@Repository
public interface OrgUnitRepository extends JpaRepository<OrgUnit, UUID> {

    List<OrgUnit> findByParentId(UUID parentId);

    List<OrgUnit> findByParentIdIsNull();

    long countByParentIdAndDeletedAtIsNull(UUID parentId);

    @Query("SELECT u FROM OrgUnit u WHERE u.path LIKE :prefix% AND u.deletedAt IS NULL")
    List<OrgUnit> findByPathLikeAndDeletedAtIsNull(@Param("prefix") String prefix);

    @Query("SELECT u FROM OrgUnit u WHERE u.path LIKE :prefix% AND u.deletedAt IS NULL ORDER BY u.sortOrder ASC")
    List<OrgUnit> findAllByPathLikeOrderBySortOrder(@Param("prefix") String prefix);

    @Query("SELECT u FROM OrgUnit u WHERE u.deletedAt IS NULL ORDER BY u.path ASC, u.sortOrder ASC")
    List<OrgUnit> findAllActiveOrderByPath();

    @Query("SELECT u FROM OrgUnit u WHERE u.deletedAt IS NULL ORDER BY u.path ASC, u.sortOrder ASC")
    Page<OrgUnit> findAllActiveOrderByPath(Pageable pageable);

    @Query("SELECT u FROM OrgUnit u WHERE u.id IN :ids AND u.deletedAt IS NULL "
            + "ORDER BY u.path ASC, u.sortOrder ASC")
    Page<OrgUnit> findAllActiveByIds(@Param("ids") Collection<UUID> ids, Pageable pageable);

    @Query("SELECT u FROM OrgUnit u WHERE u.id IN :ids AND u.deletedAt IS NULL "
            + "ORDER BY u.path ASC, u.sortOrder ASC")
    List<OrgUnit> findAllActiveByIds(@Param("ids") Collection<UUID> ids);

    @Query("SELECT u FROM OrgUnit u WHERE "
            + "LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) "
            + "AND u.deletedAt IS NULL")
    List<OrgUnit> findByNameLike(@Param("query") String query);

    @Query("SELECT u FROM OrgUnit u WHERE "
            + "LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) "
            + "AND u.deletedAt IS NULL")
    Page<OrgUnit> findByNameLike(@Param("query") String query, Pageable pageable);

    @Query("SELECT u FROM OrgUnit u WHERE u.id IN :ids "
            + "AND LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) "
            + "AND u.deletedAt IS NULL ORDER BY u.path ASC, u.sortOrder ASC")
    Page<OrgUnit> findByNameLikeAndIds(@Param("query") String query,
                                       @Param("ids") Collection<UUID> ids,
                                       Pageable pageable);

    @Query("SELECT u FROM OrgUnit u WHERE u.id IN :ids "
            + "AND LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) "
            + "AND u.deletedAt IS NULL ORDER BY u.path ASC, u.sortOrder ASC")
    List<OrgUnit> findByNameLikeAndIds(@Param("query") String query,
                                       @Param("ids") Collection<UUID> ids);

    @Query("SELECT u FROM OrgUnit u WHERE u.level = :level AND u.deletedAt IS NULL")
    List<OrgUnit> findByLevelAndDeletedAtIsNull(@Param("level") Integer level);

    @Query("SELECT u FROM OrgUnit u WHERE "
            + "(:level IS NULL OR u.level = :level) "
            + "AND u.deletedAt IS NULL")
    Page<OrgUnit> findByFilters(@Param("level") Integer level,
                                Pageable pageable);

    @Query("SELECT u FROM OrgUnit u WHERE u.id IN :ids "
            + "AND (:level IS NULL OR u.level = :level) "
            + "AND u.deletedAt IS NULL ORDER BY u.path ASC, u.sortOrder ASC")
    Page<OrgUnit> findByFiltersAndIds(@Param("level") Integer level,
                                      @Param("ids") Collection<UUID> ids,
                                      Pageable pageable);
}
