package com.hanghai.kchtg.orgunit.repository;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.entity.OrgUnitStatus;
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
 */
@Repository
public interface OrgUnitRepository extends JpaRepository<OrgUnit, UUID> {

    List<OrgUnit> findByParentId(UUID parentId);

    List<OrgUnit> findByParentIdIsNull();

    Optional<OrgUnit> findByCode(String code);

    boolean existsByCode(String code);

    boolean existsByCodeAndIdNot(String code, UUID id);

    boolean existsByCodeAndIdNotAndDeletedAtIsNull(String code, UUID id);

    long countByParentIdAndDeletedAtIsNull(UUID parentId);

    @Query("SELECT u FROM OrgUnit u WHERE u.path LIKE :prefix% AND u.deletedAt IS NULL")
    List<OrgUnit> findByPathLikeAndDeletedAtIsNull(@Param("prefix") String prefix);

    @Query("SELECT u FROM OrgUnit u WHERE u.path LIKE :prefix% AND u.deletedAt IS NULL ORDER BY u.sortOrder ASC")
    List<OrgUnit> findAllByPathLikeOrderBySortOrder(@Param("prefix") String prefix);

    @Query("SELECT u FROM OrgUnit u WHERE u.deletedAt IS NULL ORDER BY u.path ASC, u.sortOrder ASC")
    List<OrgUnit> findAllActiveOrderByPath();

    @Query("SELECT u FROM OrgUnit u WHERE u.deletedAt IS NULL ORDER BY u.path ASC, u.sortOrder ASC")
    Page<OrgUnit> findAllActiveOrderByPath(Pageable pageable);

    @Query("SELECT u FROM OrgUnit u WHERE "
            + "(LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) "
            + "OR LOWER(u.code) LIKE LOWER(CONCAT('%', :query, '%'))) "
            + "AND u.deletedAt IS NULL")
    List<OrgUnit> findByNameLikeOrCodeLike(@Param("query") String query);

    @Query("SELECT u FROM OrgUnit u WHERE "
            + "(LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) "
            + "OR LOWER(u.code) LIKE LOWER(CONCAT('%', :query, '%'))) "
            + "AND u.deletedAt IS NULL")
    Page<OrgUnit> findByNameLikeOrCodeLike(@Param("query") String query, Pageable pageable);

    @Query("SELECT u FROM OrgUnit u WHERE u.status = :status AND u.deletedAt IS NULL")
    List<OrgUnit> findByStatusAndDeletedAtIsNull(@Param("status") OrgUnitStatus status);

    @Query("SELECT u FROM OrgUnit u WHERE u.level = :level AND u.deletedAt IS NULL")
    List<OrgUnit> findByLevelAndDeletedAtIsNull(@Param("level") Integer level);

    @Query("SELECT u FROM OrgUnit u WHERE "
            + "(:status IS NULL OR u.status = :status) "
            + "AND (:level IS NULL OR u.level = :level) "
            + "AND u.deletedAt IS NULL")
    Page<OrgUnit> findByFilters(@Param("status") OrgUnitStatus status,
                                @Param("level") Integer level,
                                Pageable pageable);
}
