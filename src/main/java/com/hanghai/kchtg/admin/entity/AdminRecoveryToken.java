package com.hanghai.kchtg.admin.entity;

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
 * Token khôi ph?c MFA cho admin — khi admin b? m?t thi?t b? 2FA
 * có th? yêu c?u token khôi ph?c (ph?i du?c approve b?i super-admin).
 */
@Entity
@Table(name = "admin_recovery_tokens")
@Getter
@Setter
@NoArgsConstructor
public class AdminRecoveryToken extends BaseEntity {

    /** ID c?a admin yêu c?u khôi ph?c MFA. */
    @Column(name = "admin_id", nullable = false)
    private UUID adminId;

    /** Mă token duy nh?t — dùng d? xác minh và khôi ph?c 2FA. */
    @Column(nullable = false, unique = true, length = 255)
    private String token;

    /** Th?i di?m h?t h?n c?a token (thu?ng 1 gi? sau khi t?o). */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /** Cho bi?t token dă du?c s? d?ng d? khôi ph?c hay chua. */
    @Column(nullable = false)
    private boolean used = false;

    /**
     * T?o m?i AdminRecoveryToken v?i th?i h?n m?c d?nh 1 gi?.
     */
    public static AdminRecoveryToken create(UUID adminId, String token) {
        AdminRecoveryToken recoveryToken = new AdminRecoveryToken();
        recoveryToken.setAdminId(adminId);
        recoveryToken.setToken(token);
        recoveryToken.setExpiresAt(LocalDateTime.now().plusHours(1));
        recoveryToken.setUsed(false);
        return recoveryToken;
    }

    /**
     * Ki?m tra token c̣n h?n hay không.
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}
