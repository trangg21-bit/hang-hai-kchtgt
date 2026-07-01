package com.hanghai.kchtg.security.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import com.hanghai.kchtg.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * JWT session entity - lu tru Refresh Token co bao mat (hash + salt)
 * lien ket voi user + device/session metadata.
 * <p>
 * Dua tren BR-274-03 (token duoc hash trc khi lu DB)
 * va BR-274-04 (reuse detection ->’ revoke-all).
 * </p>
 */
@Entity
@Table(
    name = "jwt_sessions",
    indexes = {
        @Index(name = "idx_jwt_session_user_revoked", columnList = "user_id, is_revoked"),
        @Index(name = "idx_jwt_session_refresh_hash", columnList = "refresh_token_hash", unique = true),
        @Index(name = "idx_jwt_session_session_id", columnList = "session_id", unique = true)
    }
)
@Getter
@Setter
@NoArgsConstructor
@SQLRestriction("deleted_at IS NULL")
public class JwtSessionEntity extends BaseEntity {

    /**
     * User chu session - FK ->’ User.id.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, insertable = false, updatable = false, foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
    private User user;

    /**
     * UUID userId (de query nhanh khong can JOIN).
     */
    @Column(name = "user_id", nullable = false, length = 36)
    private String userId;

    /**
     * Username cua user (de display).
     */
    @Column(name = "username", nullable = false, length = 100)
    private String username;

    /**
     * Cap do vai tro (1=USER, 2=ADMIN, 3=SUPER_ADMIN) - sao chep tu User.role.
     */
    @Column(name = "role_level", nullable = false)
    private Integer roleLevel;

    /**
     * SHA-512 hash cua refresh token (BR-274-03).
     * Ben ngoai: không bao giờ lu plain token.
     */
    @Column(name = "refresh_token_hash", nullable = false, length = 512, unique = true)
    private String refreshTokenHash;

    /**
     * Salt (Base64) dung cho hash refresh token.
     */
    @Column(name = "refresh_token_salt", nullable = false, length = 256)
    private String refreshTokenSalt;

    /**
     * Session ID (correlate voi JWT sessionId claim).
     */
    @Column(name = "session_id", nullable = false, length = 128, unique = true)
    private String sessionId;

    /**
     * User-Agent cua client.
     */
    @Column(name = "user_agent", length = 512)
    private String userAgent;

    /**
     * Device fingerprint (nullable).
     */
    @Column(name = "device_fingerprint", length = 256)
    private String deviceFingerprint;

    /**
     * IP address cua client.
     */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /**
     * Thoi diem het han cua refresh token.
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * Thoi diem su dung cuoi cung (touch on refresh).
     */
    @Column(name = "last_used_at")
    private LocalDateTime lastUsedAt;

    /**
     * Co duoc thu hoi hay khong (BR-274-04).
     */
    @Column(name = "is_revoked", nullable = false)
    private Boolean isRevoked = false;

    /**
     * Thoi diem thu hoi (nullable).
     */
    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    /**
     * Trang thai session (ACTIVE / REVOKED / EXPIRED).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private SessionStatus status = SessionStatus.ACTIVE;

    /**
     * Trang thai session enum.
     */
    public enum SessionStatus {
        ACTIVE,
        REVOKED,
        EXPIRED
    }

    /**
     * Danh dau session là đã revoked.
     */
    public void revoke(String reason, UUID revokedBy) {
        this.isRevoked = true;
        this.revokedAt = LocalDateTime.now();
        this.status = SessionStatus.REVOKED;
    }

    /**
     * Touch lastUsedAt timestamp.
     */
    public void touch() {
        this.lastUsedAt = LocalDateTime.now();
    }
}
