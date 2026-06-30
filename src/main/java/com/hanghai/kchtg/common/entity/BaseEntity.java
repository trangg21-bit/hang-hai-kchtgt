package com.hanghai.kchtg.common.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLRestriction;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Abstract base entity providing common audit fields for all JPA entities.
 * <p>
 * Uses {@code @EnableJpaAuditing} (already configured on
 * {@link com.hanghai.kchtg.KchtgApplication}) to automatically populate
 * {@code createdAt} and {@code updatedAt} via the
 * {@link AuditingEntityListener}.
 * </p>
 */
@Getter
@Setter
@SuperBuilder
@NoArgsConstructor
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@SQLRestriction("deleted_at IS NULL")
public abstract class BaseEntity {

    /**
     * Primary key - auto-generated UUID (Hibernate 6 native support).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false, length = 36)
    private UUID id;

    /**
     * Timestamp set once when the entity is first persisted.
     */
    @CreatedDate
    @Column(updatable = false, nullable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp that is automatically refreshed on every update.
     */
    @LastModifiedDate
    @Column(nullable = false)
    private LocalDateTime updatedAt;

    /**
     * Timestamp when entity is soft-deleted (null = still active).
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * User ID who created the entity.
     */
    @Column(name = "created_by", length = 36)
    private String createdBy;

    /**
     * User ID who last updated the entity.
     */
    @Column(name = "updated_by", length = 36)
    private String updatedBy;

    /**
     * Mark this entity as soft-deleted.
     */
    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }
}
