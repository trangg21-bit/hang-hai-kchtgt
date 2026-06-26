package com.hanghai.kchtg.beacon.service;

import com.hanghai.kchtg.beacon.entity.BeaconLight;
import com.hanghai.kchtg.beacon.entity.Buoy;
import org.springframework.stereotype.Service;

/**
 * Stub service for notification integration.
 * Sends notifications at key workflow events.
 */
@Service("beaconNotificationService")
public class NotificationService {

    /**
     * Send notification to L1 leader when beacon light submitted for approval.
     */
    public void sendApprovalNotification(BeaconLight entity) {
        // Post-integration: notify L1 leader (phòng) of entity's unit.
        // Message: "Có đèn biển mới chờ phê duyệt: {entity.getName()}"
    }

    /**
     * Send notification to L2 leader when beacon light approved at L1.
     */
    public void sendL2ApprovalNotification(BeaconLight entity) {
        // Post-integration: notify L2 leader (cục).
        // Message: "Có đèn biển đã được L1 duyệt, chờ L2: {entity.getName()}"
    }

    /**
     * Send rejection notification to creator with reason.
     */
    public void sendRejectionNotification(BeaconLight entity, String rejectReason) {
        // Post-integration: notify the creator.
        // Message: "Đèn biển bị từ chối — Lý do: {rejectReason}"
    }

    /**
     * Send notification to L1 leader when buoy submitted for approval.
     */
    public void sendApprovalNotificationBuoy(Buoy entity) {
        // Post-integration: notify L1 leader (phòng) of entity's unit.
        // Message: "Có phao tiêu mới chờ phê duyệt: {entity.getName()}"
    }

    /**
     * Send notification to L2 leader when buoy approved at L1.
     */
    public void sendL2ApprovalNotificationBuoy(Buoy entity) {
        // Post-integration: notify L2 leader (cục).
        // Message: "Có phao tiêu đã được L1 duyệt, chờ L2: {entity.getName()}"
    }

    /**
     * Send rejection notification to creator with reason.
     */
    public void sendRejectionNotificationBuoy(Buoy entity, String rejectReason) {
        // Post-integration: notify the creator.
        // Message: "Phao tiêu bị từ chối — Lý do: {rejectReason}"
    }
}
