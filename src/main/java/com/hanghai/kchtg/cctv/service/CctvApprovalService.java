package com.hanghai.kchtg.cctv.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.cctv.entity.Cctv;
import com.hanghai.kchtg.cctv.repository.CctvRepository;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.repository.ApprovalLogRepository;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.port.service.shared.ApprovalWorkflowService;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.PortNotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Approval service for CCTV entity.
 * Uses shared change_logs and approval_logs tables (same as Port).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CctvApprovalService {

    private final CctvRepository cctvRepository;
    private final ApprovalWorkflowService approvalWorkflowService;
    private final PortNotificationService notificationService;
    private final ApprovalLogRepository approvalLogRepository;
    private final ChangeLogRepository changeLogRepository;
    private final ChangeHistoryService changeHistoryService;

    @Transactional
    public void approve(UUID id, String userId, String reason) {
        Cctv entity = cctvRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống CCTV với id: " + id));

        ApprovalStatus currentStatus = entity.getApprovalStatus();
        String currentStatusStr = currentStatus != null ? currentStatus.name() : null;

        // Capture full snapshot before mutation
        Cctv snapshot = Cctv.builder()
                .id(entity.getId())
                .deviceCode(entity.getDeviceCode())
                .deviceName(entity.getDeviceName())
                .detailedLocation(entity.getDetailedLocation())
                .manufacturer(entity.getManufacturer())
                .model(entity.getModel())
                .quantity(entity.getQuantity())
                .orgUnitId(entity.getOrgUnitId())
                .operatingUnitId(entity.getOperatingUnitId())
                .provinceId(entity.getProvinceId())
                .attachedInfrastructureType(entity.getAttachedInfrastructureType())
                .attachedInfrastructureId(entity.getAttachedInfrastructureId())
                .unitOfMeasure(entity.getUnitOfMeasure())
                .yearOfUse(entity.getYearOfUse())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
                .specifications(entity.getSpecifications())
                .maintenanceInformation(entity.getMaintenanceInformation())
                .note(entity.getNote())
                .objectType(entity.getObjectType())
                .mapSymbolId(entity.getMapSymbolId())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
                .spatialId(entity.getSpatialId())
                .build();

        if (reason == null || reason.isBlank()) {
            approvalWorkflowService.approve(currentStatusStr, "CCTV", id.toString(), userId);
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
        } else {
            approvalWorkflowService.reject(currentStatusStr, "CCTV", id.toString(), userId, reason);
            entity.setApprovalStatus(ApprovalStatus.REJECTED);
        }

        Cctv saved = cctvRepository.save(entity);
        changeHistoryService.recordChanges("CCTV", saved.getId().toString(), "system", snapshot, saved);

        if (reason != null && !reason.isBlank()) {
            changeHistoryService.insertChangeRecord("CCTV", saved.getId(), "Lý do từ chối", null, reason, userId);
        }

        if (reason == null || reason.isBlank()) {
            log.info("CCTV [{}] approved by {}", id, userId);
            notificationService.sendApprovalNotification("CCTV", id.toString(), userId, null);
        } else {
            log.info("CCTV [{}] rejected by {}: {}", id, userId, reason);
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getHistory(UUID id) {
        Cctv entity = cctvRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống CCTV với id: " + id));

        String entityId = id.toString();
        String entityType = "CCTV";

        List<ChangeLog> changeLog = changeLogRepository.findByEntityTypeAndEntityId(entityType, entityId);
        List<ApprovalLog> approvalLog = approvalLogRepository.findByEntityTypeAndEntityId(entityType, entityId);

        return Map.of(
                "entityId", entityId,
                "entityType", entityType,
                "currentApprovalStatus", entity.getApprovalStatus(),
                "changeLog", changeLog,
                "approvalLog", approvalLog
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAllHistory() {
        String entityType = "CCTV";
        List<ChangeLog> changeLog = changeLogRepository.findByEntityType(entityType);
        Map<String, String> entityNames = new java.util.HashMap<>();
        for (ChangeLog log : changeLog) {
            if (!entityNames.containsKey(log.getEntityId())) {
                try {
                    cctvRepository.findById(java.util.UUID.fromString(log.getEntityId()))
                        .ifPresent(c -> entityNames.put(log.getEntityId(), c.getDeviceName()));
                } catch (Exception e) { entityNames.put(log.getEntityId(), log.getEntityId()); }
            }
        }
        return Map.of("entityType", entityType, "changeLog", changeLog, "entityNames", entityNames);
    }
}
