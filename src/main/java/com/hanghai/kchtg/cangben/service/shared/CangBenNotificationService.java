package com.hanghai.kchtg.cangben.service.shared;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Notification service stub for CangBen module.
 * <p>
 * Wraps an existing TaiNotificationService pattern — currently just
 * logs approval/rejection events. Real notification delivery (email,
 * push) is deferred pending Q-001 resolution.
 * </p>
 */
@Slf4j
@Service
public class CangBenNotificationService {

    /**
     * Send approval notification to requester.
     * Currently: log.info — real delivery deferred.
     *
     * @param entityType entity type name (e.g. "CangBien")
     * @param entityId   entity UUID
     * @param approvedBy user who approved
     * @param requester  user who should be notified
     */
    public void sendApprovalNotification(String entityType, String entityId,
                                          String approvedBy, String requester) {
        log.info("NOTIFICATION (stub): {} [{}] approved by {}. Notify requester: {}",
                entityType, entityId, approvedBy, requester);
    }

    /**
     * Send rejection notification to requester.
     * Currently: log.info — real delivery deferred.
     *
     * @param entityType entity type name (e.g. "CangBien")
     * @param entityId   entity UUID
     * @param rejectedBy user who rejected
     * @param requester  user who should be notified
     * @param reason     rejection reason
     */
    public void sendRejectionNotification(String entityType, String entityId,
                                           String rejectedBy, String requester, String reason) {
        log.info("NOTIFICATION (stub): {} [{}] rejected by {}. Reason: {}. Notify requester: {}",
                entityType, entityId, rejectedBy, reason, requester);
    }
}
