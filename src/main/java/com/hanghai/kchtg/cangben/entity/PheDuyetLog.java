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
 * Entity representing approval decision log (Phê duyệt log).
 * Immutable audit trail — INSERT-only, no UPDATE or DELETE.
 * Records approve/reject decisions per entity.
 * Corresponds to table: phe_duyet_log (Flyway V25).
 */
@Entity
@Table(name = "phe_duyet_log",
        indexes = {
                @Index(name = "idx_phe_duyet_log_entity", columnList = "entity_type, entity_id"),
                @Index(name = "idx_phe_duyet_log_decided_at", columnList = "decided_at DESC"),
                @Index(name = "idx_phe_duyet_log_decided_by", columnList = "decided_by")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PheDuyetLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false, length = 36)
    private UUID id;

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @Column(name = "entity_id", nullable = false, length = 36)
    private String entityId;

    @Column(name = "decision", nullable = false, length = 50)
    private String decision;

    @Column(name = "reason", columnDefinition = "TEXT")
    private String reason;

    @Column(name = "decided_by", nullable = false, length = 36)
    private String decidedBy;

    @Column(name = "decided_at", nullable = false)
    private LocalDateTime decidedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (decidedAt == null) {
            decidedAt = LocalDateTime.now();
        }
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
