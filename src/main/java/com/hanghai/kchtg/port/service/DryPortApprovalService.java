package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
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

    private final InfrastructureApprovalService infrastructureApprovalService;

    // -- Phe duyet 2 cap (approval-2-level-spec 3.2) --
    // Uy quyen cho InfrastructureApprovalService: noi cai dat dung 7 trang thai,
    // phan cap theo don vi gui (BR-003/014), chong tu duyet (BR-015) va bat buoc
    // ly do tu choi toi thieu 10 ky tu (BR-016).

    /** T02/T03: gui ho so di duyet. Nguoi gui cap Cuc vao thang "Cho Cuc duyet". */
    @Transactional
    public void submit(UUID id, UUID userId) {
        DryPort entity = loadForApproval(id);
        infrastructureApprovalService.submit(entity, InfrastructureType.DRY_PORT, userId);
        dryPortRepository.save(entity);
    }

    /** T06: Cang vu / Chi cuc duyet vong 1. */
    @Transactional
    public void approveC1(UUID id, String reason, UUID userId) {
        DryPort entity = loadForApproval(id);
        infrastructureApprovalService.approveC1(entity, InfrastructureType.DRY_PORT,
                ApprovalStatus.APPROVED.name(), reason, userId);
        dryPortRepository.save(entity);
    }

    /** T08: Cuc duyet vong 2 - ho so tro thanh "Da duyet". */
    @Transactional
    public void approveC2(UUID id, String reason, UUID userId) {
        DryPort entity = loadForApproval(id);
        infrastructureApprovalService.approveC2(entity, InfrastructureType.DRY_PORT,
                ApprovalStatus.APPROVED.name(), reason, userId);
        dryPortRepository.save(entity);
    }

    /**
     * T07/T09: tu choi. Vong bi tu choi suy ra tu trang thai hien tai nen giao
     * dien khong phai tu chon cap - tranh lech giua nut bam va du lieu.
     */
    @Transactional
    public void reject(UUID id, String reason, UUID userId) {
        DryPort entity = loadForApproval(id);
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            infrastructureApprovalService.approveC2(entity, InfrastructureType.DRY_PORT,
                    ApprovalStatus.REJECTED.name(), reason, userId);
        } else {
            infrastructureApprovalService.approveC1(entity, InfrastructureType.DRY_PORT,
                    ApprovalStatus.REJECTED.name(), reason, userId);
        }
        dryPortRepository.save(entity);
    }

    /**
     * Duyet vong dang mo cua ho so. Giu cho endpoint /approve cu hoat dong nhung
     * di dung quy trinh 2 cap thay vi duyet mot phat nhu truoc, de khong con
     * duong vong bo qua vong duyet qua API.
     */
    @Transactional
    public void approveCurrentStage(UUID id, String reason, UUID userId) {
        DryPort entity = loadForApproval(id);
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            approveC2(id, reason, userId);
        } else {
            approveC1(id, reason, userId);
        }
    }

    private DryPort loadForApproval(UUID id) {
        return dryPortRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + id));
    }
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
