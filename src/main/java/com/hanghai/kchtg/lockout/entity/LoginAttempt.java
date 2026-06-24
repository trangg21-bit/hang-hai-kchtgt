package com.hanghai.kchtg.lockout.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Append-only record of each login attempt (success or failure).
 */
@Entity
@Table(name = "login_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginAttempt extends BaseEntity {

    @Column(name = "user_id")
    private java.util.UUID userId;

    @Column(name = "username", nullable = false, length = 100)
    private String username;

    @Column(name = "email", length = 150)
    private String email;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "result", nullable = false, length = 20)
    private String result;

    @Column(name = "failure_reason", length = 255)
    private String failureReason;
}