package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.entity.CangBien;
import com.hanghai.kchtg.cangben.entity.LichSuThayDoi;
import com.hanghai.kchtg.cangben.entity.PheDuyetLog;
import com.hanghai.kchtg.cangben.repository.CangBienRepository;
import com.hanghai.kchtg.cangben.repository.LichSuThayDoiRepository;
import com.hanghai.kchtg.cangben.repository.PheDuyetLogRepository;
import com.hanghai.kchtg.cangben.service.shared.ApprovalWorkflowService;
import com.hanghai.kchtg.cangben.service.shared.CangBenNotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Approval service for CangBien entity.
 * Handles approve/reject operations (F-011).
 * <p>
 * Uses ApprovalWorkflowService for state machine transitions.
 * On approve: sets trangThaiPheDuyet = DUOC_PHE_DUYET.
 * On reject: sets trangThaiPheDuyet = TU_CHOI.
 * On update: resets to CHO_PHE_DUYET (handled in CangBienService).
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CangBienApprovalService {

    private final CangBienRepository cangBienRepository;
    private final ApprovalWorkflowService approvalWorkflowService;
    private final CangBenNotificationService notificationService;
    private final LichSuThayDoiRepository lichSuThayDoiRepository;
    private final PheDuyetLogRepository pheDuyetLogRepository;

    /**
     * Approve or reject a CangBien entity.
     * <p>
     * If reason is null → approve → state → DUOC_PHE_DUYET
     * If reason is non-blank → reject → state → TU_CHOI
     * </p>
     *
     * @param id     CangBien entity UUID
     * @param userId user performing the action
     * @param reason rejection reason (null = approve; non-blank = reject)
     */
    @Transactional
    public void approve(UUID id, String userId, String reason) {
        CangBien entity = cangBienRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));

        String currentStatus = entity.getTrangThaiPheDuyet();

        if (reason == null || reason.isBlank()) {
            // APPROVE
            approvalWorkflowService.approve(currentStatus, "CangBien", id.toString(), userId);
            entity.setTrangThaiPheDuyet("DUOC_PHE_DUYET");
            cangBienRepository.save(entity);
            log.info("CangBien [{}] approved by {}", id, userId);
            notificationService.sendApprovalNotification("CangBien", id.toString(), userId, null);
        } else {
            // REJECT
            approvalWorkflowService.reject(currentStatus, "CangBien", id.toString(), userId, reason);
            entity.setTrangThaiPheDuyet("TU_CHOI");
            cangBienRepository.save(entity);
            log.info("CangBien [{}] rejected by {}: {}", id, userId, reason);
        }
    }

    /**
     * Get change history for a CangBien.
     *
     * @param id entity UUID
     * @return map containing entity info, approval status, change history, and approval log
     */
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHistory(UUID id) {
        CangBien entity = cangBienRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));

        String entityId = id.toString();
        String entityType = "CangBien";

        // Retrieve field change history (LichSuThayDoi)
        List<LichSuThayDoi> changeHistory = lichSuThayDoiRepository.findByEntityTypeAndEntityId(entityType, entityId);

        // Retrieve approval decision log (PheDuyetLog)
        List<PheDuyetLog> approvalLog = pheDuyetLogRepository.findByEntityTypeAndEntityId(entityType, entityId);

        return java.util.Map.of(
                "entityId", entityId,
                "entityType", entityType,
                "currentApprovalStatus", entity.getTrangThaiPheDuyet(),
                "changeHistory", changeHistory,
                "approvalLog", approvalLog
        );
    }
}
