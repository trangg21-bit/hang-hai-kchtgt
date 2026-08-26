package com.hanghai.kchtg.cctv.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.cctv.dto.ApprovalRequest;
import com.hanghai.kchtg.cctv.dto.CctvResponse;
import com.hanghai.kchtg.cctv.entity.Cctv;
import com.hanghai.kchtg.cctv.repository.CctvRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.repository.ApprovalLogRepository;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
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
 * Quy trình phê duyệt 2 cấp chuẩn M-1006, dùng chung
 * {@link InfrastructureApprovalService} giống module /vts-system.
 * Lịch sử đọc từ shared change_logs / approval_logs (như Port).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CctvApprovalService {

    private final CctvRepository cctvRepository;
    private final InfrastructureApprovalService approvalService;
    private final CctvService cctvService;
    private final ApprovalLogRepository approvalLogRepository;
    private final ChangeLogRepository changeLogRepository;

    @Transactional
    public CctvResponse submit(UUID id, UUID userId) {
        Cctv entity = cctvRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống CCTV với id: " + id));

        approvalService.submit(entity, InfrastructureType.CCTV, userId);
        Cctv saved = cctvRepository.save(entity);
        return cctvService.toResponse(saved);
    }

    @Transactional
    public CctvResponse approveC1(UUID id, ApprovalRequest request, UUID userId) {
        validateDecision(request);
        Cctv entity = cctvRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống CCTV với id: " + id));

        approvalService.approveC1(entity, InfrastructureType.CCTV, request.getDecision(), request.getReason(), userId);
        Cctv saved = cctvRepository.save(entity);
        return cctvService.toResponse(saved);
    }

    @Transactional
    public CctvResponse approveC2(UUID id, ApprovalRequest request, UUID userId) {
        validateDecision(request);
        Cctv entity = cctvRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy hệ thống CCTV với id: " + id));

        approvalService.approveC2(entity, InfrastructureType.CCTV, request.getDecision(), request.getReason(), userId);
        Cctv saved = cctvRepository.save(entity);
        return cctvService.toResponse(saved);
    }

    private void validateDecision(ApprovalRequest request) {
        if (request == null || request.getDecision() == null
                || !(ApprovalStatus.APPROVED.name().equalsIgnoreCase(request.getDecision())
                        || ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision()))) {
            throw new IllegalArgumentException("Quyết định phê duyệt không hợp lệ");
        }
        if (ApprovalStatus.REJECTED.name().equalsIgnoreCase(request.getDecision())
                && (request.getReason() == null || request.getReason().trim().isEmpty())) {
            throw new IllegalArgumentException("Lý do từ chối là bắt buộc");
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
                "changeHistory", changeLog,
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
        return Map.of("entityType", entityType, "changeHistory", changeLog, "entityNames", entityNames);
    }
}
