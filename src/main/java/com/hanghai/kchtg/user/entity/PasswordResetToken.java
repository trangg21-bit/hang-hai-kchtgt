package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

/**
 * Token dung cho tinh nang "Quên mật khẩu" - nguoi dung nhan token qua email
 * de dat lai mat khau. Token có thoi han 1 gio và chỉ su dung duoc mot lan.
 */
@Entity
@Table(name = "password_reset_tokens")
@Getter
@Setter
@NoArgsConstructor
public class PasswordResetToken extends BaseEntity {

    /** Nguoi dung yeu cau dat lai mat khau. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, referencedColumnName = "id")
    private User user;

    /** Ma token duy nhat - dung làm URL hoăc key khi nguoi dung click link dat lai. */
    @Column(nullable = false, unique = true, length = 255)
    private String token;

    /** Thoi diem het han cua token (thuong là 1 gio sau khi tao). */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /** Cho biet token da duoc su dung hay chua. */
    @Column(nullable = false)
    private boolean used = false;

    /** Kiem tra xem token con han hay chua. */
    public boolean isExpired() {
        return LocalDateTime.now().isAfter(expiresAt);
    }

    /** Tao mot PasswordResetToken moi voi thoi han mac dinh 1 gio. */
    public static PasswordResetToken create(User user, String token) {
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setUser(user);
        resetToken.setToken(token);
        resetToken.setExpiresAt(LocalDateTime.now().plusHours(1));
        resetToken.setUsed(false);
        return resetToken;
    }
}
