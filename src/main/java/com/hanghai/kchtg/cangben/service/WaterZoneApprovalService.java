package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.entity.ChangeLog;
import com.hanghai.kchtg.cangben.entity.ApprovalLog;
import com.hanghai.kchtg.cangben.entity.WaterZone;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.cangben.repository.ChangeLogRepository;
import com.hanghai.kchtg.cangben.repository.ApprovalLogRepository;
import com.hanghai.kchtg.cangben.repository.WaterZoneRepository;
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
 * Approval service for WaterZone entity.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WaterZoneApprovalService {

    private final WaterZoneRepository waterZoneRepository;
    private final ApprovalWorkflowService approvalWorkflowService;
    private final CangBenNotificationService notificationService;
    private final ChangeLogRepository changeLogRepository;
    private final ApprovalLogRepository approvalLogRepository;

    @Transactional
    public void approve(UUID id, String userId, String reason) {
        WaterZone entity = waterZoneRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng nước với id: " + id));

        ApprovalStatus currentStatus = entity.getApprovalStatus();
        String currentStatusStr = currentStatus != null ? currentStatus.name() : null;

        if (reason == null || reason.isBlank()) {
            approvalWorkflowService.approve(currentStatusStr, "WaterZone", id.toString(), userId);
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            waterZoneRepository.save(entity);
            log.info("WaterZone [{}] approved by {}", id, userId);
            notificationService.sendApprovalNotification("WaterZone", id.toString(), userId, null);
        } else {
            approvalWorkflowService.reject(currentStatusStr, "WaterZone", id.toString(), userId, reason);
            entity.setApprovalStatus(ApprovalStatus.REJECTED);
            waterZoneRepository.save(entity);
            log.info("WaterZone [{}] rejected by {}: {}", id, userId, reason);
        }
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHistory(UUID id) {
        WaterZone entity = waterZoneRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng nước với id: " + id));

        String entityId = id.toString();
        String entityType = "WaterZone";

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
