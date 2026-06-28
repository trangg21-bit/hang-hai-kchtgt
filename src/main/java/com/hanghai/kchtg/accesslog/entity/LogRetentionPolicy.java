package com.hanghai.kchtg.accesslog.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Singleton configurable retention policy for access-log cleanup.
 * <p>
 * System-admin can view/update this via {@code PUT /api/logs/retention}.
 * The {@code LogCleanupScheduler} reads the active row at runtime
 * instead of using a hardcoded constant.
 * </p>
 */
@Entity
@Table(name = "log_retention_policies")
@Getter
@Setter
@NoArgsConstructor
public class LogRetentionPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @Positive
    @Column(name = "retention_days", nullable = false)
    private Integer retentionDays = 90;

    @NotNull
    @Positive
    @Column(name = "max_export_rows", nullable = false)
    private Integer maxExportRows = 10000;

    @NotNull
    @Column(name = "cleanup_schedule", length = 50, nullable = false)
    private String cleanupSchedule = "0 0 2 * * ?";

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", updatable = false, nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
