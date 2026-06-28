package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity lưu yêu cầu đăng ký tài khoản tự động, chờ quản trị viên phê duyệt.
 * <p>
 * Áp dụng cho BR-001-09: tự đăng ký cần phê duyệt admin trước khi kích hoạt.
 * BR-001-11: phê duyệt → tạo User ACTIVE + gán vai trò.
 * BR-001-12: admin xem/duyệt/từ chối danh sách pending.
 * </p>
 */
@Entity
@Table(name = "pending_approvals",
    uniqueConstraints = {
        @UniqueConstraint(name = "uk_pending_approvals_username", columnNames = "username"),
        @UniqueConstraint(name = "uk_pending_approvals_email", columnNames = "email")
    },
    indexes = {
        @Index(name = "idx_pending_approvals_status", columnList = "status"),
        @Index(name = "idx_pending_approvals_status_created", columnList = "status, created_at")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PendingApproval extends BaseEntity {

    @Column(name = "username", length = 100, nullable = false)
    private String username;

    @Column(name = "email", length = 150, nullable = false)
    private String email;

    @Column(name = "full_name", length = 200)
    private String fullName;

    @Column(name = "phone", length = 20)
    private String phone;

    @Column(name = "password_hash", length = 255, nullable = false)
    private String passwordHash;

    @Column(name = "requested_role_code", length = 50)
    private String requestedRoleCode;

    @Column(name = "status", length = 20, nullable = false)
    private String status; // pending | approved | rejected

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by")
    private User approvedBy;

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @Column(name = "approved_at")
    private java.time.LocalDateTime approvedAt;

    @Column(name = "rejected_at")
    private java.time.LocalDateTime rejectedAt;

    /**
     * Kiểm tra yêu cầu còn pending.
     */
    public boolean isPending() {
        return "pending".equals(status);
    }

    /**
     * Kiểm tra yêu cầu đã được phê duyệt.
     */
    public boolean isApproved() {
        return "approved".equals(status);
    }

    /**
     * Kiểm tra yêu cầu đã bị từ chối.
     */
    public boolean isRejected() {
        return "rejected".equals(status);
    }
}
