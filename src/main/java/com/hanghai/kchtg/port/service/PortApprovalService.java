package com.hanghai.kchtg.port.service;

import java.util.UUID;

import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.entity.PortStatus;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.repository.PortRepository;
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
 * Approval service for Port entity.
 * Handles approve/reject operations using unified PortStatus.
 * <p>
 * On approve: sets portStatus = DA_PHE_DUYET.
 * On reject: sets portStatus = TU_CHOI.
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PortApprovalService {

    private final PortRepository portRepository;
    private final ApprovalWorkflowService approvalWorkflowService;
    private final PortNotificationService notificationService;
    private final ChangeLogRepository changeLogRepository;
    private final ApprovalLogRepository approvalLogRepository;

    @Transactional
    public void approve(UUID id, String userId, String reason) {
        Port entity = portRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));

        PortStatus currentStatus = entity.getPortStatus();
        String currentStatusStr = toApprovalStatusStr(currentStatus);

        if (reason == null || reason.isBlank()) {
            approvalWorkflowService.approve(currentStatusStr, "Port", id.toString(), userId);
            entity.setPortStatus(PortStatus.DA_PHE_DUYET);
            entity.syncOldFieldsFromPortStatus();
            portRepository.save(entity);
            log.info("Port [{}] approved by {}, status=DA_PHE_DUYET", id, userId);
            notificationService.sendApprovalNotification("Port", id.toString(), userId, null);
        } else {
            approvalWorkflowService.reject(currentStatusStr, "Port", id.toString(), userId, reason);
            entity.setPortStatus(PortStatus.TU_CHOI);
            entity.syncOldFieldsFromPortStatus();
            portRepository.save(entity);
            log.info("Port [{}] rejected by {}: {}, status=TU_CHOI", id, userId, reason);
        }
    }

    @Transactional
    public void reject(UUID id, String userId, String reason) {
        Port entity = portRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));

        PortStatus currentStatus = entity.getPortStatus();
        String currentStatusStr = toApprovalStatusStr(currentStatus);

        approvalWorkflowService.reject(currentStatusStr, "Port", id.toString(), userId, reason);
        entity.setPortStatus(PortStatus.TU_CHOI);
        entity.syncOldFieldsFromPortStatus();
        portRepository.save(entity);
        log.info("Port [{}] rejected by {}: {}, status=TU_CHOI", id, userId, reason);
    }

    private String toApprovalStatusStr(PortStatus portStatus) {
        if (portStatus == null) return null;
        switch (portStatus) {
            case NHAP: return "PENDING";
            case CHO_PHE_DUYET: return "PENDING";
            case DA_PHE_DUYET: return "APPROVED";
            case TU_CHOI: return "REJECTED";
            case TAM_NGUNG: return "APPROVED";
            case DA_XOA: return "REJECTED";
            default: return "PENDING";
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
                "currentPortStatus", entity.getPortStatus(),
                "changeHistory", changeHistory,
                "approvalLog", approvalLog
        );
    }
}
