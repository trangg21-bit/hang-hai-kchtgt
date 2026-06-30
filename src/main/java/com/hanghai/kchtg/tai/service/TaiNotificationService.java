package com.hanghai.kchtg.tai.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.util.UUID;

/**
 * Service stub cho tiep tuc notification integration (M-015).
 * Pattern tu NotificationService (M-014).
 * Gui thong bao tai cac su kien workflow quan trong.
 */
@Service("taiNotificationService")
@Slf4j
public class TaiNotificationService {

    /**
     * Gui thong bao khi dai duoc gui phe duyet.
     *
     * @param entityName Ten doi tuong dai (e.g. "Tai Thong Tin Duyen Hai: HN-001")
     * @param approverId ID nguoi duoc thong bao (neu co)
     */
    public void sendApproveNotification(String entityName, UUID approverId) {
        // Post-integration: thong bao nguoi quan ly L1 (phong) cua don vi entity.
        // Message: "Co dai moi chờ phê duyệt: " + entityName
        log.info("sendApproveNotification: entityName={}, approverId={}", entityName, approverId);
    }

    /**
     * Gui thong bao tu choi khi dai bi tu tuyen phe duyet.
     *
     * @param entityName Ten doi tuong dai (e.g. "Tai Thong Tin Duyen Hai: HN-001")
     * @param approverId ID nguoi tu tuyen
     */
    public void sendRejectNotification(String entityName, UUID approverId) {
        // Post-integration: thong bao nguoi tao.
        // Message: "Dai bi tu tuyen phê duyệt: " + entityName
        log.info("sendRejectNotification: entityName={}, approverId={}", entityName, approverId);
    }

    /**
     * Gui thong bao khi dai da duoc phe duyet L2 / cong bo.
     *
     * @param entityName Ten doi tuong dai
     * @param approverId ID nguoi phe duyet L2
     */
    public void sendApprovedNotification(String entityName, UUID approverId) {
        // Post-integration: thong bao toan bo don vi lien quan.
        // Message: "Dai da duoc phê duyệt: " + entityName
        log.info("sendApprovedNotification: entityName={}, approverId={}", entityName, approverId);
    }
}
