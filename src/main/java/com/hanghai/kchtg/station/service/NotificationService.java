package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.station.entity.BuoyStation;
import com.hanghai.kchtg.station.entity.LighthouseStation;
import org.springframework.stereotype.Service;

/**
 * Service stub cho tiep tuc notification integration.
 * Gui thong bao tai cac su kien workflow quan trong.
 */
@Service("stationNotificationService")
public class NotificationService {

    public void sendApprovalNotificationDen(LighthouseStation entity) {
    }

    public void sendL2ApprovalNotificationDen(LighthouseStation entity) {
    }

    public void sendRejectionNotificationDen(LighthouseStation entity, String rejectReason) {
    }

    public void sendApprovalNotificationPhao(BuoyStation entity) {
    }

    public void sendL2ApprovalNotificationPhao(BuoyStation entity) {
    }

    public void sendRejectionNotificationPhao(BuoyStation entity, String rejectReason) {
    }
}
