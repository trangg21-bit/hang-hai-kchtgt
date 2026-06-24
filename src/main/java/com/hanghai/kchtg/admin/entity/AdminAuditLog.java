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
 * Nhật ký hoạt động của admin - ghi lại toàn bộ thao tác quản trị
 * để phục vụ audit trail và forensic analysis.
 */
@Entity
@Table(name = "admin_audit_logs")
@Getter
@Setter
@NoArgsConstructor
public class AdminAuditLog extends BaseEntity {

    /** ID của admin thực hiện thao tác. */
    @Column(name = "admin_id", nullable = false)
    private UUID adminId;

    /** Tên đăng nhập của admin (denormalized). */
    @Column(nullable = false, length = 100)
    private String adminName;

    /** Hành động đã thực hiện: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, MFA_RESET, PERMISSION_CHANGE. */
    @Column(nullable = false, length = 50)
    private String action;

    /** Đối tượng bị tác động (ví dụ: "User-abc123", "Role-DEF456"). */
    @Column(length = 150)
    private String target;

    /** Chi tiết JSON của hành động (trước/sau khi thay đổi). */
    @Column(columnDefinition = "TEXT")
    private String details;

    /** Địa chỉ IP của admin. */
    @Column(name = "ip_addr", length = 45)
    private String ipAddr;

    /** User-Agent của trình duyệt. */
    @Column(name = "user_agent", length = 500)
    private String userAgent;

    /**
     * Tạo mới AdminAuditLog.
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