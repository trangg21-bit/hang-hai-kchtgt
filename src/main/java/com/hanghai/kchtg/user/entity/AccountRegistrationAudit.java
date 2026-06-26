package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Audit log cho qua trinh dang ki tai khoan.
 * <p>
 * Ghi lai moi su kien: thanh cong, that bai, bi rate-limit, v.v.
 * </p>
 */
@Entity
@Table(name = "account_registration_audit")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AccountRegistrationAudit extends BaseEntity {

    /**
     * User ID lien quan (null neu chua co tai khoan).
     */
    @Column(name = "user_id")
    private UUID userId;

    /**
     * Email hoac so dien thoai dang ki.
     */
    @Column(name = "identifier", nullable = false, length = 100)
    private String identifier;

    /**
     * Loai su kien (REGISTER_SUCCESS, REGISTER_FAILURE, VERIFY_SUCCESS, VERIFY_FAILURE, RESEND_TOKEN, RATE_LIMITED).
     */
    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    /**
     * Trang thai: SUCCESS hoặc FAILURE.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private AuditStatus status;

    /**
     * Thoi gian xu ly (miliseconds).
     */
    @Column(name = "processing_time_ms")
    private Long processingTimeMs;

    /**
     * Lỗi đối tượng (error message) nếu thất bại.
     */
    @Column(name = "error_message", length = 500)
    private String errorMessage;

    /**
     * Dia chi IP nguoi dang ki.
     */
    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /**
     * User-Agent cua trinh duyet.
     */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * Trang thai audit log.
     */
    public enum AuditStatus {
        SUCCESS,
        FAILURE
    }
}
