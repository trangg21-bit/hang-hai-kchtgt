package com.hanghai.kchtg.cctv.service;

import com.hanghai.kchtg.cctv.entity.Cctv;
import com.hanghai.kchtg.cctv.repository.CctvRepository;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.port.service.shared.ApprovalWorkflowService;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.PortNotificationService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Approval service for CCTV entity.
 * Uses shared infrastructure_history table.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CctvApprovalService {

    private final CctvRepository cctvRepository;
    private final ApprovalWorkflowService approvalWorkflowService;
    private final PortNotificationService notificationService;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;
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

        List<InfrastructureHistory> list = historyRepository.findByRefIdOrderByApprovedDateDesc(id);

        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> userNameMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(
                                User::getId,
                                u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUsername(),
                                (a, b) -> a));

        List<Map<String, Object>> changeLog = list.stream()
                .filter(h -> h.getChangedField() != null)
                .map(h -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", h.getId());
                    m.put("entityType", entityType);
                    m.put("entityId", entityId);
                    m.put("fieldName", h.getChangedField());
                    m.put("oldValue", h.getPreviousValue() != null ? h.getPreviousValue() : "");
                    m.put("newValue", h.getNewValue() != null ? h.getNewValue() : "");
                    m.put("changedBy", h.getApprovedBy() != null ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : "");
                    m.put("changedAt", h.getApprovedDate());
                    return m;
                })
                .toList();

        List<Map<String, Object>> approvalLog = list.stream()
                .filter(h -> h.getStatus() != null && h.getChangedField() == null)
                .map(h -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", h.getId());
                    m.put("entityType", entityType);
                    m.put("entityId", entityId);
                    m.put("decision", h.getStatus().name());
                    m.put("reason", h.getReason() != null ? h.getReason() : "");
                    m.put("decidedBy", h.getApprovedBy() != null ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : "");
                    m.put("decidedAt", h.getApprovedDate());
                    m.put("cap", h.getApprovalLevel() != null ? h.getApprovalLevel().name() : "");
                    return m;
                })
                .toList();

        return Map.of(
                "entityId", entityId,
                "entityType", entityType,
                "currentApprovalStatus", entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : "",
                "changeLog", changeLog,
                "approvalLog", approvalLog,
                "histories", list
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAllHistory() {
        String entityType = "CCTV";
        List<InfrastructureHistory> list = historyRepository.findAll();
        Map<String, String> entityNames = new HashMap<>();
        for (InfrastructureHistory logItem : list) {
            if (logItem.getRefId() != null) {
                String refIdStr = logItem.getRefId().toString();
                if (!entityNames.containsKey(refIdStr)) {
                    try {
                        cctvRepository.findById(logItem.getRefId())
                                .ifPresent(c -> entityNames.put(refIdStr, c.getDeviceName()));
                    } catch (Exception e) { entityNames.put(refIdStr, refIdStr); }
                }
            }
        }
        return Map.of("entityType", entityType, "changeLog", list, "entityNames", entityNames);
    }
}
