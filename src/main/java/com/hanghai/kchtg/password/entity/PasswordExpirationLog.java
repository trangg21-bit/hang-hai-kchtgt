package com.hanghai.kchtg.password.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Password expiration audit trail (F-276).
 * Tracks warnings, forced changes, and password changes.
 */
@Entity
@Table(name = "password_expiration_log")
@Getter
@Setter
@NoArgsConstructor
public class PasswordExpirationLog extends BaseEntity {

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "expired_at", nullable = false)
    private LocalDateTime expiredAt;

    @Column(nullable = false, length = 20)
    private String status; // "warning", "forced_change", "changed"

    @Column(name = "notified_via", nullable = false, length = 20)
    private String notifiedVia = "none";
}