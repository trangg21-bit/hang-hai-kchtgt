package com.hanghai.kchtg.lockout.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Lockout policy singleton table (F-277).
 * Stores global configuration for account lockout behavior.
 * <p>
 * Note: PK is INT (id=1) not UUID, per V4 migration.
 * This entity overrides BaseEntity to use INT PK instead of UUID.
 * </p>
 */
@Entity
@Table(name = "lockout_policy")
@Getter
@Setter
@NoArgsConstructor
public class LockoutPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id = 1L;

    @Column(name = "max_failed_attempts", nullable = false)
    private int maxFailedAttempts = 5;

    @Column(name = "lockout_duration_minutes", nullable = false)
    private int lockoutDurationMinutes = 30;

    @Column(name = "window_minutes", nullable = false)
    private int windowMinutes = 15;

    @Column(name = "is_enabled", nullable = false)
    private boolean enabled = true;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public boolean isEnabled() { return enabled; }
}
