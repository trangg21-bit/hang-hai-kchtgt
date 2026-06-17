package com.hanghai.kchtg.orgunit.repository;

import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Spring Data JPA repository for {@link OrgUnit}.
 */
@Repository
public interface OrgUnitRepository extends JpaRepository<OrgUnit, UUID> {

    /**
     * Find all direct children of a given parent unit.
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
     * Check whether a code is already in use.
     */
    boolean existsByCode(String code);

    /**
     * Check whether a code is already in use by a different unit
     * (used during update to avoid false-positive on the same entity).
     */
    boolean existsByCodeAndIdNot(String code, UUID id);
}
