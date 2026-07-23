package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.entity.Port;
import com.hanghai.kchtg.common.entity.TrangThaiPheDuyet;
import com.hanghai.kchtg.cangben.entity.ChangeLog;
import com.hanghai.kchtg.cangben.entity.ApprovalLog;
import com.hanghai.kchtg.cangben.repository.PortRepository;
import com.hanghai.kchtg.cangben.repository.ChangeLogRepository;
import com.hanghai.kchtg.cangben.repository.ApprovalLogRepository;
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
 * Approval service for Port entity.
 * Handles approve/reject operations.
 * <p>
 * Uses ApprovalWorkflowService for state machine transitions.
 * On approve: sets approvalStatus = DUOC_PHE_DUYET.
 * On reject: sets approvalStatus = TU_CHOI.
 * On update: resets to CHO_PHE_DUYET (handled in PortService).
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PortApprovalService {

    private final PortRepository portRepository;
    private final ApprovalWorkflowService approvalWorkflowService;
    private final CangBenNotificationService notificationService;
    private final ChangeLogRepository changeLogRepository;
    private final ApprovalLogRepository approvalLogRepository;

    @Transactional
    public void approve(UUID id, String userId, String reason) {
        Port entity = portRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));

        TrangThaiPheDuyet currentStatus = entity.getApprovalStatus();
        String currentStatusStr = currentStatus != null ? currentStatus.name() : null;

        if (reason == null || reason.isBlank()) {
            approvalWorkflowService.approve(currentStatusStr, "Port", id.toString(), userId);
            entity.setApprovalStatus(TrangThaiPheDuyet.DUOC_PHE_DUYET);
            portRepository.save(entity);
            log.info("Port [{}] approved by {}", id, userId);
            notificationService.sendApprovalNotification("Port", id.toString(), userId, null);
        } else {
            approvalWorkflowService.reject(currentStatusStr, "Port", id.toString(), userId, reason);
            entity.setApprovalStatus(TrangThaiPheDuyet.TU_CHOI);
            portRepository.save(entity);
            log.info("Port [{}] rejected by {}: {}", id, userId, reason);
        }
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHistory(UUID id) {
        Port entity = portRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));

        String entityId = id.toString();
        String entityType = "Port";

        List<ChangeLog> changeHistory = changeLogRepository.findByEntityTypeAndEntityId(entityType, entityId);
        List<ApprovalLog> approvalLog = approvalLogRepository.findByEntityTypeAndEntityId(entityType, entityId);

        return java.util.Map.of(
                "entityId", entityId,
                "entityType", entityType,
                "currentApprovalStatus", entity.getApprovalStatus(),
                "changeHistory", changeHistory,
                "approvalLog", approvalLog
        );
    }
}
