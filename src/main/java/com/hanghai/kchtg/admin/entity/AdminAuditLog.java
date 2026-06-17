package com.hanghai.kchtg.admin.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

/**
 * Nh?t kư ho?t d?ng c?a admin — ghi l?i toàn b? thao tác qu?n tr?
 * d? ph?c v? audit trail và forensic analysis.
 */
@Entity
@Table(name = "admin_audit_logs")
@Getter
@Setter
@NoArgsConstructor
public class AdminAuditLog extends BaseEntity {

    /** ID c?a admin th?c hi?n thao tác. */
    @Column(name = "admin_id", nullable = false)
    private UUID adminId;

    /** Tên dang nh?p c?a admin (denormalized). */
    @Column(nullable = false, length = 100)
    private String adminName;

    /** Hành d?ng dă th?c hi?n: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, MFA_RESET, PERMISSION_CHANGE. */
    @Column(nullable = false, length = 50)
    private String action;

    /** Đ?i tu?ng b? tác d?ng (ví d?: "User-abc123", "Role-DEF456"). */
    @Column(length = 150)
    private String target;

    /** Chi ti?t JSON c?a hành d?ng (tru?c/sau khi thay d?i). */
    @Column(columnDefinition = "TEXT")
    private String details;

    /** Đ?a ch? IP c?a admin. */
    @Column(name = "ip_addr", length = 45)
    private String ipAddr;

    /** User-Agent c?a tŕnh duy?t. */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * T?o m?i AdminAuditLog.
     */
    public static AdminAuditLog create(UUID adminId, String adminName, String action,
                                       String target, String details, String ipAddr,
                                       String userAgent) {
        AdminAuditLog log = new AdminAuditLog();
        log.setAdminId(adminId);
        log.setAdminName(adminName);
        log.setAction(action);
        log.setTarget(target);
        log.setDetails(details);
        log.setIpAddr(ipAddr);
        log.setUserAgent(userAgent);
        return log;
    }
}
