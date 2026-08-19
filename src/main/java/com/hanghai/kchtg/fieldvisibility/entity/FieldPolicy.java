package com.hanghai.kchtg.fieldvisibility.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.FieldNameConstants;

/**
 * Field-level authorization policy rule (M-1004 PoC).
 * <p>
 * A rule binds a {@link FieldSubjectType subject} to an {@link FieldEffect effect}
 * on a {@link FieldTargetType target} of a feature {@code resource}. Effective
 * effect per field is resolved by {@code FieldVisibilityService}; absent field == ALLOW.
 * </p>
 */
@Entity
@Table(name = "field_policy")
@Getter
@Setter
@NoArgsConstructor
@FieldNameConstants
@org.hibernate.annotations.SQLRestriction("deleted_at IS NULL")
public class FieldPolicy extends BaseEntity {

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "subject_type", nullable = false)
    private FieldSubjectType subjectType;

    @Column(name = "subject_id", nullable = false, length = 255)
    private String subjectId;

    @Column(name = "resource", nullable = false, length = 100)
    private String resource;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "target_type", nullable = false)
    private FieldTargetType targetType;

    @Column(name = "target_key", nullable = false, length = 255)
    private String targetKey;

    @Enumerated(EnumType.ORDINAL)
    @Column(name = "effect", nullable = false)
    private FieldEffect effect;

    @Column(name = "priority", nullable = false)
    private int priority = 0;

    @Column(name = "active", nullable = false)
    private boolean active = true;
}
