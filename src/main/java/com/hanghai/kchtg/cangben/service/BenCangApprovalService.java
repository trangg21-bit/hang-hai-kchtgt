package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.entity.BenCang;
import com.hanghai.kchtg.cangben.entity.LichSuThayDoi;
import com.hanghai.kchtg.cangben.entity.PheDuyetLog;
import com.hanghai.kchtg.cangben.repository.BenCangRepository;
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
 * Approval service for BenCang entity.
 * Handles approve/reject operations (F-017).
 * <p>
 * Uses ApprovalWorkflowService for state machine transitions.
 * On approve: sets trangThaiPheDuyet = DUOC_PHE_DUYET.
 * On reject: sets trangThaiPheDuyet = TU_CHOI.
 * On update: resets to CHO_PHE_DUYET (handled in BenCangService).
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BenCangApprovalService {

    private final BenCangRepository benCangRepository;
    private final ApprovalWorkflowService approvalWorkflowService;
    private final CangBenNotificationService notificationService;
    private final LichSuThayDoiRepository lichSuThayDoiRepository;
    private final PheDuyetLogRepository pheDuyetLogRepository;

    /**
     * Approve or reject a BenCang entity.
     * <p>
     * If reason is null → approve → state → DUOC_PHE_DUYET
     * If reason is non-blank → reject → state → TU_CHOI
     * </p>
     *
     * @param id     BenCang entity UUID
     * @param userId user performing the action
     * @param reason rejection reason (null = approve; non-blank = reject)
     */
    @Transactional
    public void approve(UUID id, String userId, String reason) {
        BenCang entity = benCangRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id));

        String currentStatus = entity.getTrangThaiPheDuyet();

        if (reason == null || reason.isBlank()) {
            // APPROVE
            approvalWorkflowService.approve(currentStatus, "BenCang", id.toString(), userId);
            entity.setTrangThaiPheDuyet("DUOC_PHE_DUYET");
            benCangRepository.save(entity);
            log.info("BenCang [{}] approved by {}", id, userId);
            notificationService.sendApprovalNotification("BenCang", id.toString(), userId, null);
        } else {
            // REJECT
            approvalWorkflowService.reject(currentStatus, "BenCang", id.toString(), userId, reason);
            entity.setTrangThaiPheDuyet("TU_CHOI");
            benCangRepository.save(entity);
            log.info("BenCang [{}] rejected by {}: {}", id, userId, reason);
        }
    }

    /**
     * Get change history for a BenCang.
     *
     * @param id entity UUID
     * @return map containing entity info, approval status, change history, and approval log
     */
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHistory(UUID id) {
        BenCang entity = benCangRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id));

        String entityId = id.toString();
        String entityType = "BenCang";

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
