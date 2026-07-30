package com.hanghai.kchtg.port.service;

import java.util.UUID;

import com.hanghai.kchtg.port.entity.Berth;
import com.hanghai.kchtg.port.entity.PortStatus;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.repository.BerthRepository;
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
 * Approval service for Berth entity using unified PortStatus.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BerthApprovalService {

    private final BerthRepository berthRepository;
    private final ApprovalWorkflowService approvalWorkflowService;
    private final PortNotificationService notificationService;
    private final ChangeLogRepository changeLogRepository;
    private final ApprovalLogRepository approvalLogRepository;

    @Transactional
    public void approve(UUID id, String userId, String reason) {
        Berth entity = berthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id));

        PortStatus currentStatus = entity.getPortStatus();
        String currentStatusStr = currentStatus != null ? currentStatus.name() : null;

        if (reason == null || reason.isBlank()) {
            approvalWorkflowService.approve(currentStatusStr, "Berth", id.toString(), userId);
            entity.setPortStatus(PortStatus.DA_PHE_DUYET);
            entity.syncOldFieldsFromPortStatus();
            berthRepository.save(entity);
            log.info("Berth [{}] approved by {}, status=DA_PHE_DUYET", id, userId);
            notificationService.sendApprovalNotification("Berth", id.toString(), userId, null);
        } else {
            approvalWorkflowService.reject(currentStatusStr, "Berth", id.toString(), userId, reason);
            entity.setPortStatus(PortStatus.TU_CHOI);
            entity.syncOldFieldsFromPortStatus();
            berthRepository.save(entity);
            log.info("Berth [{}] rejected by {}: {}, status=TU_CHOI", id, userId, reason);
        }
    }

    @Transactional
    public void reject(UUID id, String userId, String reason) {
        Berth entity = berthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id));

        PortStatus currentStatus = entity.getPortStatus();
        String currentStatusStr = currentStatus != null ? currentStatus.name() : null;

        approvalWorkflowService.reject(currentStatusStr, "Berth", id.toString(), userId, reason);
        entity.setPortStatus(PortStatus.TU_CHOI);
        entity.syncOldFieldsFromPortStatus();
        berthRepository.save(entity);
        log.info("Berth [{}] rejected by {}: {}, status=TU_CHOI", id, userId, reason);
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
                "currentPortStatus", entity.getPortStatus(),
                "changeHistory", changeHistory,
                "approvalLog", approvalLog
        );
    }
}
