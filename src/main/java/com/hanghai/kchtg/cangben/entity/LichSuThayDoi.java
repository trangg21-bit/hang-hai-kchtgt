package com.hanghai.kchtg.cangben.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity representing field-level change history (Lịch sử thay đổi).
 * Immutable audit trail — INSERT-only, no UPDATE or DELETE.
 * Corresponds to table: lich_su_thay_doi (Flyway V24).
 */
@Entity
@Table(name = "lich_su_thay_doi",
        indexes = {
                @Index(name = "idx_lich_su_thay_doi_entity", columnList = "entity_type, entity_id"),
                @Index(name = "idx_lich_su_thay_doi_changed_at", columnList = "changed_at DESC"),
                @Index(name = "idx_lich_su_thay_doi_changed_by", columnList = "changed_by")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LichSuThayDoi {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false, length = 36)
    private UUID id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false, length = 36)
    private String entityId;

    @Column(name = "field_name", nullable = false, length = 255)
    private String fieldName;

    @Column(name = "old_value", columnDefinition = "TEXT")
    private String oldValue;

    @Column(name = "new_value", columnDefinition = "TEXT")
    private String newValue;

    @Column(name = "changed_by", nullable = false, length = 36)
    private String changedBy;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (changedAt == null) {
            changedAt = LocalDateTime.now();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
