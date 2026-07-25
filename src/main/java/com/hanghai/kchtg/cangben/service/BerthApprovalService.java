package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.entity.Berth;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.cangben.entity.ChangeLog;
import com.hanghai.kchtg.cangben.entity.ApprovalLog;
import com.hanghai.kchtg.cangben.repository.BerthRepository;
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
 * Approval service for Berth entity.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BerthApprovalService {

    private final BerthRepository berthRepository;
    private final ApprovalWorkflowService approvalWorkflowService;
    private final CangBenNotificationService notificationService;
    private final ChangeLogRepository changeLogRepository;
    private final ApprovalLogRepository approvalLogRepository;

    @Transactional
    public void approve(UUID id, String userId, String reason) {
        Berth entity = berthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id));

        ApprovalStatus currentStatus = entity.getApprovalStatus();
        String currentStatusStr = currentStatus != null ? currentStatus.name() : null;

        if (reason == null || reason.isBlank()) {
            approvalWorkflowService.approve(currentStatusStr, "Berth", id.toString(), userId);
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            berthRepository.save(entity);
            log.info("Berth [{}] approved by {}", id, userId);
            notificationService.sendApprovalNotification("Berth", id.toString(), userId, null);
        } else {
            approvalWorkflowService.reject(currentStatusStr, "Berth", id.toString(), userId, reason);
            entity.setApprovalStatus(ApprovalStatus.REJECTED);
            berthRepository.save(entity);
            log.info("Berth [{}] rejected by {}: {}", id, userId, reason);
        }
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHistory(UUID id) {
        Berth entity = berthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id));

        String entityId = id.toString();
        String entityType = "Berth";

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
