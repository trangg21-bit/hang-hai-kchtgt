package com.hanghai.kchtg.common.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.type.SqlTypes;
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
@org.hibernate.annotations.FilterDef(
        name = "orgUnitFilter",
        parameters = @org.hibernate.annotations.ParamDef(name = "orgUnitIds", type = java.util.UUID.class)
)
@org.hibernate.annotations.FilterDef(
        name = "recordSecurityLevelFilter",
        parameters = @org.hibernate.annotations.ParamDef(name = "maxSecurityLevel", type = Integer.class)
)
public abstract class BaseEntity {

    /**
     * Primary key - auto-generated UUID (Hibernate 6 native support).
     */
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
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

    public UUID getId() { return id; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public LocalDateTime getDeletedAt() { return deletedAt; }

    /**
     * User ID who soft-deleted the entity (null = not deleted).
     */
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "deleted_by")
    private UUID deletedBy;

    /**
     * User ID who created the entity.
     */
    @org.springframework.data.annotation.CreatedBy
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "created_by")
    private UUID createdBy;

    /**
     * User ID who last updated the entity.
     */
    @org.springframework.data.annotation.LastModifiedBy
    @JdbcTypeCode(SqlTypes.UUID)
    @Column(name = "updated_by")
    private UUID updatedBy;

    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }



    /**
     * Mark this entity as soft-deleted, recording who performed the deletion.
     *
     * @param deletedBy User ID of the deleter
     */
    public void softDelete(UUID deletedBy) {
        this.deletedAt = LocalDateTime.now();
        this.deletedBy = deletedBy;
    }
}
