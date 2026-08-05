package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.entity.DryPort;
import com.hanghai.kchtg.port.repository.ApprovalLogRepository;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.port.repository.DryPortRepository;
import com.hanghai.kchtg.port.service.shared.ApprovalWorkflowService;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.PortNotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Approval service for DryPort entity.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DryPortApprovalService {

    private final DryPortRepository dryPortRepository;
    private final ApprovalWorkflowService approvalWorkflowService;
    private final PortNotificationService notificationService;
    private final ChangeLogRepository changeLogRepository;
    private final ApprovalLogRepository approvalLogRepository;
    private final ChangeHistoryService changeHistoryService;

    @Transactional
    public void approve(UUID id, String userId, String reason) {
        DryPort entity = dryPortRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + id));

        ApprovalStatus currentStatus = entity.getApprovalStatus();
        String currentStatusStr = currentStatus != null ? currentStatus.name() : null;

        // Import DryPortService's captureSnapshot — use inline instead
        DryPort snapshot = DryPort.builder()
                .dryPortCode(entity.getDryPortCode()).dryPortName(entity.getDryPortName())
                .provinceId(entity.getProvinceId()).orgUnitId(entity.getOrgUnitId())
                .operatingUnit(entity.getOperatingUnit()).region(entity.getRegion())
                .detailedLocation(entity.getDetailedLocation()).transportCorridor(entity.getTransportCorridor())
                .area(entity.getArea()).warehouseArea(entity.getWarehouseArea()).yardArea(entity.getYardArea())
                .teuCapacity(entity.getTeuCapacity()).connectionMode(entity.getConnectionMode())
                .portStatus(entity.getPortStatus()).operationalStatus(entity.getOperationalStatus())
                .remarks(entity.getRemarks())
                .announcementTime(entity.getAnnouncementTime()).announcementDecisionNumber(entity.getAnnouncementDecisionNumber())
                .announcementDecisionDate(entity.getAnnouncementDecisionDate()).announcementOrg(entity.getAnnouncementOrg())
                .mapSymbolId(entity.getMapSymbolId())
                .coordinateSystem(entity.getCoordinateSystem()).displayRule(entity.getDisplayRule())
                .approvalStatus(entity.getApprovalStatus()).spatialId(entity.getSpatialId())
                .build();

        if (reason == null || reason.isBlank()) {
            approvalWorkflowService.approve(currentStatusStr, "DryPort", id.toString(), userId);
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
        } else {
            approvalWorkflowService.reject(currentStatusStr, "DryPort", id.toString(), userId, reason);
            entity.setApprovalStatus(ApprovalStatus.REJECTED);
        }
        DryPort saved = dryPortRepository.save(entity);
        changeHistoryService.recordChanges("DryPort", saved.getId().toString(), "system", snapshot, saved);

        if (reason != null && !reason.isBlank()) {
            changeHistoryService.insertChangeRecord("DryPort", saved.getId(), "Lý do từ chối", null, reason, userId);
        }

        if (reason == null || reason.isBlank()) {
            log.info("DryPort [{}] approved by {}", id, userId);
            notificationService.sendApprovalNotification("DryPort", id.toString(), userId, null);
        } else {
            log.info("DryPort [{}] rejected by {}: {}", id, userId, reason);
        }
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHistory(UUID id) {
        DryPort entity = dryPortRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + id));

        String entityId = id.toString();
        String entityType = "DryPort";

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

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getAllHistory() {
        String entityType = "DryPort";
        List<ChangeLog> changeHistory = changeLogRepository.findByEntityType(entityType);
        java.util.Map<String, String> entityNames = new java.util.HashMap<>();
        for (ChangeLog log : changeHistory) {
            if (!entityNames.containsKey(log.getEntityId())) {
                try {
                    dryPortRepository.findById(UUID.fromString(log.getEntityId()))
                        .ifPresent(dp -> entityNames.put(log.getEntityId(), dp.getDryPortName()));
                } catch (Exception e) { entityNames.put(log.getEntityId(), log.getEntityId()); }
            }
        }
        return java.util.Map.of("entityType", entityType, "changeHistory", changeHistory, "entityNames", entityNames);
    }
}
