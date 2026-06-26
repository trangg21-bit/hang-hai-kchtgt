package com.hanghai.kchtg.report.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.Accessors;
import lombok.experimental.SuperBuilder;
import org.springframework.data.annotation.CreatedBy;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedBy;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.Instant;
import java.util.UUID;

/**
 * Abstract base entity for report-domain entities with auditing fields.
 * Provides UUID id, code, name, and timestamp tracking (created/updated) with user attribution.
 */
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
@SuperBuilder
@Getter
@Setter
@EqualsAndHashCode
@Accessors(chain = true)
public abstract class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(length = 100)
    private String code;

    @Column(length = 500)
    private String name;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @CreatedBy
    @Column(name = "created_by", length = 36)
    private UUID createdBy;

    @LastModifiedDate
    @Column(name = "updated_at")
    private Instant updatedAt;

    @LastModifiedBy
    @Column(name = "updated_by", length = 36)
    private UUID updatedBy;
}
