package com.hanghai.kchtg.user.repository;

import java.util.UUID;

import com.hanghai.kchtg.user.entity.ApprovalNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

/**
 * Repository cho entity {@link ApprovalNotification}.
 */
public interface ApprovalNotificationRepository extends JpaRepository<ApprovalNotification, UUID> {

    /**
     * Tìm tất cả thông báo liên quan đến một yêu cầu phê duyệt.
     */
    List<ApprovalNotification> findByPendingApprovalId(UUID pendingApprovalId);

    /**
     * Tìm thông báo theo loại.
     */
    List<ApprovalNotification> findByNotificationType(String notificationType);
}
