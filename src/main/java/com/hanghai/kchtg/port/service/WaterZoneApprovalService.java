package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.entity.WaterZone;
import com.hanghai.kchtg.port.repository.ApprovalLogRepository;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.port.repository.WaterZoneRepository;
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
 * Approval service for WaterZone entity.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class WaterZoneApprovalService {

    private final WaterZoneRepository waterZoneRepository;

    private final InfrastructureApprovalService infrastructureApprovalService;

    // -- Phe duyet 2 cap (approval-2-level-spec 3.2) --
    // Uy quyen cho InfrastructureApprovalService: noi cai dat dung 7 trang thai,
    // phan cap theo don vi gui (BR-003/014), chong tu duyet (BR-015) va bat buoc
    // ly do tu choi toi thieu 10 ky tu (BR-016).

    /** T02/T03: gui ho so di duyet. Nguoi gui cap Cuc vao thang "Cho Cuc duyet". */
    @Transactional
    public void submit(UUID id, UUID userId) {
        WaterZone entity = loadForApproval(id);
        infrastructureApprovalService.submit(entity, InfrastructureType.WATER_AREA, userId);
        waterZoneRepository.save(entity);
    }

    /** T06: Cang vu / Chi cuc duyet vong 1. */
    @Transactional
    public void approveC1(UUID id, String reason, UUID userId) {
        WaterZone entity = loadForApproval(id);
        infrastructureApprovalService.approveC1(entity, InfrastructureType.WATER_AREA,
                ApprovalStatus.APPROVED.name(), reason, userId);
        waterZoneRepository.save(entity);
    }

    /** T08: Cuc duyet vong 2 - ho so tro thanh "Da duyet". */
    @Transactional
    public void approveC2(UUID id, String reason, UUID userId) {
        WaterZone entity = loadForApproval(id);
        infrastructureApprovalService.approveC2(entity, InfrastructureType.WATER_AREA,
                ApprovalStatus.APPROVED.name(), reason, userId);
        waterZoneRepository.save(entity);
    }

    /**
     * T07/T09: tu choi. Vong bi tu choi suy ra tu trang thai hien tai nen giao
     * dien khong phai tu chon cap - tranh lech giua nut bam va du lieu.
     */
    @Transactional
    public void reject(UUID id, String reason, UUID userId) {
        WaterZone entity = loadForApproval(id);
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            infrastructureApprovalService.approveC2(entity, InfrastructureType.WATER_AREA,
                    ApprovalStatus.REJECTED.name(), reason, userId);
        } else {
            infrastructureApprovalService.approveC1(entity, InfrastructureType.WATER_AREA,
                    ApprovalStatus.REJECTED.name(), reason, userId);
        }
        waterZoneRepository.save(entity);
    }

    /**
     * Duyet vong dang mo cua ho so. Giu cho endpoint /approve cu hoat dong nhung
     * di dung quy trinh 2 cap thay vi duyet mot phat nhu truoc, de khong con
     * duong vong bo qua vong duyet qua API.
     */
    @Transactional
    public void approveCurrentStage(UUID id, String reason, UUID userId) {
        WaterZone entity = loadForApproval(id);
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            approveC2(id, reason, userId);
        } else {
            approveC1(id, reason, userId);
        }
    }

    private WaterZone loadForApproval(UUID id) {
        return waterZoneRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng nước với id: " + id));
    }
    private final ApprovalWorkflowService approvalWorkflowService;
    private final PortNotificationService notificationService;
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
