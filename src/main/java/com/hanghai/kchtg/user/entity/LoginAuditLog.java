package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Ghi nhận mỗi lần đăng nhập (CREDENTIALS / TOTP).
 * <p>
 * Kế thừa {@link BaseEntity} để có sẵn {@code id}, {@code createdAt},
 * {@code updatedAt}.
 * </p>
 */
@Entity
@Table(name = "login_audit_log")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class LoginAuditLog extends BaseEntity {

    /** UUID của người dùng (null nếu attempt chưa xác thực được user) */
    @Column(name = "user_id", length = 36)
    private UUID userId;

    /** Tên đăng nhập (ghi lại để dễ tra cứu, nếu tồn tại) */
    @Column(length = 100)
    private String username;

    /** Loại attempt: CREDENTIALS hay TOTP */
    @Enumerated(EnumType.STRING)
    @Column(name = "attempt_type", nullable = false, length = 20)
    private LoginAttemptType attemptType;

    /** Kết quả: SUCCESS hoặc FAIL */
    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 10)
    private LoginAttemptResult result;

    /** Lý do thất bại (null nếu thành công) */
    @Column(name = "failure_reason", length = 255)
    private String failureReason;

    /** Địa chỉ IP của request */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /** User-Agent của client */
    @Column(name = "user_agent", length = 512)
    private String userAgent;

    /** Thời điểm attempt xảy ra */
    @Column(name = "attempted_at", nullable = false)
    private LocalDateTime attemptedAt;
}