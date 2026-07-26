package com.hanghai.kchtg.port.service;

import java.util.UUID;

import com.hanghai.kchtg.port.entity.Pier;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.port.repository.ApprovalLogRepository;
import com.hanghai.kchtg.port.service.shared.ApprovalWorkflowService;
import com.hanghai.kchtg.port.service.shared.PortNotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Approval service for Pier entity.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PierApprovalService {

    private final PierRepository pierRepository;
    private final ApprovalWorkflowService approvalWorkflowService;
    private final PortNotificationService notificationService;
    private final ChangeLogRepository changeLogRepository;
    private final ApprovalLogRepository approvalLogRepository;

    @Transactional
    public void approve(UUID id, String userId, String reason) {
        Pier entity = pierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + id));

        ApprovalStatus currentStatus = entity.getApprovalStatus();
        String currentStatusStr = currentStatus != null ? currentStatus.name() : null;

        if (reason == null || reason.isBlank()) {
            approvalWorkflowService.approve(currentStatusStr, "Pier", id.toString(), userId);
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            pierRepository.save(entity);
            log.info("Pier [{}] approved by {}", id, userId);
            notificationService.sendApprovalNotification("Pier", id.toString(), userId, null);
        } else {
            approvalWorkflowService.reject(currentStatusStr, "Pier", id.toString(), userId, reason);
            entity.setApprovalStatus(ApprovalStatus.REJECTED);
            pierRepository.save(entity);
            log.info("Pier [{}] rejected by {}: {}", id, userId, reason);
        }
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHistory(UUID id) {
        Pier entity = pierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + id));

        String entityId = id.toString();
        String entityType = "Pier";

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
