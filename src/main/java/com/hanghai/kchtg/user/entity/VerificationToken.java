package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entity lưu token xác minh đăng ký tài khoản.
 * <p>
 * Token được lưu dưới dạng băm SHA-256. Thời gian sống mặc định 30 phút.
 * </p>
 */
@Entity
@Table(name = "verification_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class VerificationToken extends BaseEntity {

    /**
     * Tai khoan goc cua token (co the bi null neu user da bi xoa).
     */
    @Column(name = "user_id")
    private UUID userId;

    /**
     * Email nguoi dung can xac minh (duoc luu de de dat truyen link).
     */
    @Column(name = "email", nullable = false, length = 150)
    private String email;

    /**
     * Hash SHA-256 cua token (khong bao gio luu plaintext).
     */
    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    /**
     * Thoi diem het han (30 phut sau khi tao mac dinh).
     */
    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    /**
     * Co hay khong token da duoc su dung.
     */
    @Column(name = "used", nullable = false)
    private boolean used = false;

    /**
     * Kiem tra token co het han chua.
     *
     * @return true neu da het han
     */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }
}