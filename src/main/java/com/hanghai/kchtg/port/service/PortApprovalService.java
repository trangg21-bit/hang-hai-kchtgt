package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.ApprovalLogRepository;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
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
 * Approval service for Port entity.
 * Handles approve/reject operations.
 * <p>
 * Uses ApprovalWorkflowService for state machine transitions.
 * On approve: sets approvalStatus = APPROVED.
 * On reject: sets approvalStatus = REJECTED.
 * On update: resets to PENDING (handled in PortService).
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
    private final ChangeHistoryService changeHistoryService;
    private final PortCacheService portCacheService;
    private final InfrastructureApprovalService infrastructureApprovalService;

    // ── Phê duyệt 2 cấp (approval-2-level-spec §3.2) ────────────────────────
    // Bốn thao tác dưới đây uỷ quyền cho InfrastructureApprovalService — nơi cài
    // đặt đúng 7 trạng thái, phân cấp theo đơn vị gửi (BR-003/014), chống tự
    // duyệt (BR-015) và bắt buộc lý do từ chối (BR-016).

    /** T02/T03: gửi hồ sơ đi duyệt. Người gửi cấp Cục vào thẳng "Chờ Cục duyệt". */
    @Transactional
    public void submit(UUID id, UUID userId) {
        Port entity = loadPort(id);
        infrastructureApprovalService.submit(entity, InfrastructureType.SEAPORT, userId);
        portRepository.save(entity);
        portCacheService.evictAfterCommit();
    }

    /** T06: Cảng vụ / Chi cục duyệt vòng 1. */
    @Transactional
    public void approveC1(UUID id, String reason, UUID userId) {
        Port entity = loadPort(id);
        infrastructureApprovalService.approveC1(entity, InfrastructureType.SEAPORT,
                ApprovalStatus.APPROVED.name(), reason, userId);
        portRepository.save(entity);
        portCacheService.evictAfterCommit();
        notificationService.sendApprovalNotification("Port", id.toString(), String.valueOf(userId), null);
    }

    /** T08: Cục duyệt vòng 2 — hồ sơ trở thành "Đã duyệt". */
    @Transactional
    public void approveC2(UUID id, String reason, UUID userId) {
        Port entity = loadPort(id);
        infrastructureApprovalService.approveC2(entity, InfrastructureType.SEAPORT,
                ApprovalStatus.APPROVED.name(), reason, userId);
        portRepository.save(entity);
        portCacheService.evictAfterCommit();
        notificationService.sendApprovalNotification("Port", id.toString(), String.valueOf(userId), null);
    }

    /**
     * T07/T09: từ chối. Vòng bị từ chối suy ra từ trạng thái hiện tại nên giao
     * diện không phải tự chọn cấp — tránh lệch giữa nút bấm và dữ liệu.
     */
    @Transactional
    public void reject(UUID id, String reason, UUID userId) {
        Port entity = loadPort(id);
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            infrastructureApprovalService.approveC2(entity, InfrastructureType.SEAPORT,
                    ApprovalStatus.REJECTED.name(), reason, userId);
        } else {
            infrastructureApprovalService.approveC1(entity, InfrastructureType.SEAPORT,
                    ApprovalStatus.REJECTED.name(), reason, userId);
        }
        portRepository.save(entity);
        portCacheService.evictAfterCommit();
        changeHistoryService.insertChangeRecord("Port", id, "Lý do từ chối", null, reason, String.valueOf(userId));
    }

    private Port loadPort(UUID id) {
        return portRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));
    }

    /**
     * @deprecated Duyệt một lần của cơ chế cũ. Giữ lại cho các luồng chưa chuyển
     *             đổi; luồng cảng biển đã dùng {@link #approveC1}/{@link #approveC2}.
     */
    @Deprecated
    @Transactional
    public void approve(UUID id, String userId, String reason) {
        Port entity = portRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));

        ApprovalStatus currentStatus = entity.getApprovalStatus();
        String currentStatusStr = currentStatus != null ? currentStatus.name() : null;

        // Capture full snapshot before mutation
        Port snapshot = Port.builder()
                .id(entity.getId()).portCode(entity.getPortCode()).portName(entity.getPortName())
                .province(entity.getProvince()).area(entity.getArea()).maxVesselCapacity(entity.getMaxVesselCapacity())
                .orgUnitId(entity.getOrgUnitId()).portGroup(entity.getPortGroup())
                .operationalStatus(entity.getOperationalStatus()).approvalStatus(entity.getApprovalStatus())
                .mapSymbolId(entity.getMapSymbolId()).spatialId(entity.getSpatialId())
                .detailedLocation(entity.getDetailedLocation()).portClass(entity.getPortClass())
                .coordinateSystem(entity.getCoordinateSystem()).displayRule(entity.getDisplayRule())
                .waterAreaScope(entity.getWaterAreaScope()).totalBerths(entity.getTotalBerths())
                .totalAnchoragesTransshipment(entity.getTotalAnchoragesTransshipment())
                .totalPublicChannels(entity.getTotalPublicChannels()).totalDedicatedChannels(entity.getTotalDedicatedChannels())
                .totalPublicChannelLength(entity.getTotalPublicChannelLength()).totalDedicatedChannelLength(entity.getTotalDedicatedChannelLength())
                .totalBuoysBeacons(entity.getTotalBuoysBeacons()).totalDikes(entity.getTotalDikes())
                .totalDikeLength(entity.getTotalDikeLength()).totalLighthouses(entity.getTotalLighthouses())
                .buoyBerthCount(entity.getBuoyBerthCount()).anchorageCount(entity.getAnchorageCount())
                .transshipmentCount(entity.getTransshipmentCount()).otherWaterAreas(entity.getOtherWaterAreas())
                .remarks(entity.getRemarks()).build();

        if (reason == null || reason.isBlank()) {
            // Mô hình 2 trạng thái: Nháp → phê duyệt thẳng. Chỉ gọi workflow cũ khi
            // đang ở PENDING_APPROVAL (legacy) vì workflow yêu cầu đúng trạng thái đó.
            if (currentStatus == ApprovalStatus.PENDING_APPROVAL) {
                approvalWorkflowService.approve(currentStatusStr, "Port", id.toString(), userId);
            }
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
        } else {
            approvalWorkflowService.reject(currentStatusStr, "Port", id.toString(), userId, reason);
            entity.setApprovalStatus(ApprovalStatus.REJECTED);
        }
        Port saved = portRepository.save(entity);
        changeHistoryService.recordChanges("Port", saved.getId().toString(), "system", snapshot, saved);
        portCacheService.evictAfterCommit();

        if (reason != null && !reason.isBlank()) {
            changeHistoryService.insertChangeRecord("Port", saved.getId(), "Lý do từ chối", null, reason, userId);
        }

        if (reason == null || reason.isBlank()) {
            log.info("Port [{}] approved by {}", id, userId);
            notificationService.sendApprovalNotification("Port", id.toString(), userId, null);
        } else {
            log.info("Port [{}] rejected by {}: {}", id, userId, reason);
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
                "currentApprovalStatus", entity.getApprovalStatus(),
                "changeHistory", changeHistory,
                "approvalLog", approvalLog
        );
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getAllHistory() {
        String entityType = "Port";
        List<ChangeLog> changeHistory = changeLogRepository.findByEntityType(entityType);
        java.util.Map<String, String> entityNames = new java.util.HashMap<>();
        for (ChangeLog log : changeHistory) {
            if (!entityNames.containsKey(log.getEntityId())) {
                try {
                    portRepository.findById(UUID.fromString(log.getEntityId()))
                        .ifPresent(p -> entityNames.put(log.getEntityId(), p.getPortName()));
                } catch (Exception e) { entityNames.put(log.getEntityId(), log.getEntityId()); }
            }
        }
        return java.util.Map.of("entityType", entityType, "changeHistory", changeHistory, "entityNames", entityNames);
    }
}
