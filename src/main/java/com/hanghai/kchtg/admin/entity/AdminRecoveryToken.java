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
 * Token khôi phục MFA cho admin - khi admin bị một thiết bị 2FA
 * có thể yêu cầu token khôi phục (phải được approve bởi super-admin).
 */
@Entity
@Table(name = "admin_recovery_tokens")
@Getter
@Setter
@NoArgsConstructor
public class AdminRecoveryToken extends BaseEntity {

    /** ID của admin yêu cầu khôi phục MFA. */
    @Column(name = "admin_id", nullable = false)
    private UUID adminId;

    /** Mã token duy nhất - dùng để xác minh và khôi phục 2FA. */
    @Column(nullable = false, unique = true, length = 255)
    private String token;

    /** Thời điểm hết hạn của token (thường 1 giờ sau khi tạo). */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /** Cho biết token đã được sử dụng để khôi phục hay chưa. */
    @Column(nullable = false)
    private boolean used = false;

    /**
     * Tạo mới AdminRecoveryToken với thời hạn mặc định 1 giờ.
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
     * Kiểm tra token còn hạn hay không.
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}