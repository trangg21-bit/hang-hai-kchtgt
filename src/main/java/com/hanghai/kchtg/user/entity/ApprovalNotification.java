package com.hanghai.kchtg.user.entity;

import com.hanghai.kchtg.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entity lưu thông báo phê duyệt tài khoản.
 * <p>
 * Được tạo khi có sự kiện APPROVAL_GRANTED / APPROVAL_REJECTED / APPROVAL_PENDING
 * để gửi email/SMS cho người dùng và admin.
 * </p>
 */
@Entity
@Table(name = "approval_notifications",
    indexes = {
        @Index(name = "idx_approval_notifications_pending_id", columnList = "pending_approval_id"),
        @Index(name = "idx_approval_notifications_type", columnList = "notification_type")
    })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ApprovalNotification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pending_approval_id", nullable = false)
    private PendingApproval pendingApproval;

    @Column(name = "recipient_type", length = 20, nullable = false)
    private String recipientType; // USER | ADMIN

    @Column(name = "recipient_email", length = 255)
    private String recipientEmail;

    @Column(name = "recipient_name", length = 200)
    private String recipientName;

    @Column(name = "notification_type", length = 20, nullable = false)
    private String notificationType; // APPROVAL_GRANTED | APPROVAL_REJECTED | APPROVAL_PENDING

    @Column(name = "message", nullable = false)
    private String message;

    @Column(name = "sent_at")
    private java.time.LocalDateTime sentAt;

    @Column(name = "sent", nullable = false)
    private Boolean sent = false;
}
