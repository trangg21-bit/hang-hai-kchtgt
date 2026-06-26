package com.hanghai.kchtg.nhatram.service;

import com.hanghai.kchtg.nhatram.entity.NhaTramDen;
import com.hanghai.kchtg.nhatram.entity.NhaTramPhao;
import org.springframework.stereotype.Service;

/**
 * Service stub cho tiep tuc notification integration.
 * Gui thong bao tai cac su kien workflow quan trong.
 */
@Service("nhatramNotificationService")
public class NotificationService {

    /**
     * Gui thong bao den nguoi phuc quyen L1 khi nha tram den duoc gui phe duyet.
     */
    public void sendApprovalNotificationDen(NhaTramDen entity) {
        // Post-integration: thong bao nguoi quan ly L1 (phong) cua don vi entity.
        // Message: "Co nha tram den moi cho phe duyet: {entity.getName()}"
    }

    /**
     * Gui thong bao den nguoi phuc quyen L2 khi nha tram den duoc phe duyet L1.
     */
    public void sendL2ApprovalNotificationDen(NhaTramDen entity) {
        // Post-integration: thong bao nguoi quan ly L2 (cuc).
        // Message: "Co nha tram den da duoc L1 phe duyet, cho L2: {entity.getName()}"
    }

    /**
     * Gui thong bao tu choi den nguoi tao voi ly do.
     */
    public void sendRejectionNotificationDen(NhaTramDen entity, String rejectReason) {
        // Post-integration: thong bao nguoi tao.
        // Message: "Nha tram den bi tu choi — Ly do: {rejectReason}"
    }

    /**
     * Gui thong bao den nguoi phuc quyen L1 khi nha tram phao duoc gui phe duyet.
     */
    public void sendApprovalNotificationPhao(NhaTramPhao entity) {
        // Post-integration: thong bao nguoi quan ly L1 (phong) cua don vi entity.
        // Message: "Co nha tram phao moi cho phe duyet: {entity.getName()}"
    }

    /**
     * Gui thong bao den nguoi phuc quyen L2 khi nha tram phao duoc phe duyet L1.
     */
    public void sendL2ApprovalNotificationPhao(NhaTramPhao entity) {
        // Post-integration: thong bao nguoi quan ly L2 (cuc).
        // Message: "Co nha tram phao da duoc L1 phe duyet, cho L2: {entity.getName()}"
    }

    /**
     * Gui thong bao tu choi den nguoi tao voi ly do.
     */
    public void sendRejectionNotificationPhao(NhaTramPhao entity, String rejectReason) {
        // Post-integration: thong bao nguoi tao.
        // Message: "Nha tram phao bi tu choi — Ly do: {rejectReason}"
    }
}
