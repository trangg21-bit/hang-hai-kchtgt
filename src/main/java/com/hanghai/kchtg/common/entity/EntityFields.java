package com.hanghai.kchtg.common.entity;

/**
 * Canonical JPA field names shared across ALL entities.
 * <p>
 * Every {@code Sort.by(…)} / {@code Specification} / {@code @Query} reference to a field
 * MUST use these constants — never a hardcoded string.
 * </p>
 */
public final class EntityFields {

    private EntityFields() { /* constants only */ }

    // ── BaseEntity fields (inherited by every entity) ──

    public static final String ID         = "id";
    public static final String CREATED_AT = "createdAt";
    public static final String UPDATED_AT = "updatedAt";
    public static final String CREATED_BY = "createdBy";
    public static final String UPDATED_BY = "updatedBy";
    public static final String DELETED_AT = "deletedAt";
    public static final String DELETED_BY = "deletedBy";
}
