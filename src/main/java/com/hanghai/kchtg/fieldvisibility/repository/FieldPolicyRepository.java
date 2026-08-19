package com.hanghai.kchtg.fieldvisibility.repository;

import com.hanghai.kchtg.fieldvisibility.entity.FieldPolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for {@link FieldPolicy}.
 * <p>
 * Soft-deleted rows are already excluded by {@code @SQLRestriction} on the entity;
 * this derived query only adds the {@code active = TRUE} filter. The service filters
 * by resource and subject in memory (rule count is tiny for the PoC — threat-model F-08).
 * </p>
 */
public interface FieldPolicyRepository extends JpaRepository<FieldPolicy, UUID> {

    List<FieldPolicy> findByActiveTrue();
}
