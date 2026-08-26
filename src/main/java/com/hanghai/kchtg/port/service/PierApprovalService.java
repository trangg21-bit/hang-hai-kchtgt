package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.entity.Pier;
import com.hanghai.kchtg.port.repository.ApprovalLogRepository;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.service.shared.PortNotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Two-level approval service for Pier entity (mirror BerthApprovalService).
 * Level 1: CANG_VU (Port Authority) — APPROVED_LEVEL1 → APPROVED_LEVEL2
 * Level 2: CUC (Department) — APPROVED_LEVEL2 → APPROVED
 * Reject at any level → REJECTED
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PierApprovalService {

    private final PierRepository pierRepository;

    private final InfrastructureApprovalService infrastructureApprovalService;

    // -- Phe duyet 2 cap (approval-2-level-spec 3.2) --
    // Uy quyen cho InfrastructureApprovalService: noi cai dat dung 7 trang thai,
    // phan cap theo don vi gui (BR-003/014), chong tu duyet (BR-015) va bat buoc
    // ly do tu choi toi thieu 10 ky tu (BR-016).

    /** T02/T03: gui ho so di duyet. Nguoi gui cap Cuc vao thang "Cho Cuc duyet". */
    @Transactional
    public void submit(UUID id, UUID userId) {
        Pier entity = loadForApproval(id);
        infrastructureApprovalService.submit(entity, InfrastructureType.PIER, userId);
        pierRepository.save(entity);
    }

    /** T06: Cang vu / Chi cuc duyet vong 1. */
    @Transactional
    public void approveC1(UUID id, String reason, UUID userId) {
        Pier entity = loadForApproval(id);
        infrastructureApprovalService.approveC1(entity, InfrastructureType.PIER,
                ApprovalStatus.APPROVED.name(), reason, userId);
        pierRepository.save(entity);
    }

    /** T08: Cuc duyet vong 2 - ho so tro thanh "Da duyet". */
    @Transactional
    public void approveC2(UUID id, String reason, UUID userId) {
        Pier entity = loadForApproval(id);
        infrastructureApprovalService.approveC2(entity, InfrastructureType.PIER,
                ApprovalStatus.APPROVED.name(), reason, userId);
        pierRepository.save(entity);
    }

    /**
     * T07/T09: tu choi. Vong bi tu choi suy ra tu trang thai hien tai nen giao
     * dien khong phai tu chon cap - tranh lech giua nut bam va du lieu.
     */
    @Transactional
    public void reject(UUID id, String reason, UUID userId) {
        Pier entity = loadForApproval(id);
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            infrastructureApprovalService.approveC2(entity, InfrastructureType.PIER,
                    ApprovalStatus.REJECTED.name(), reason, userId);
        } else {
            infrastructureApprovalService.approveC1(entity, InfrastructureType.PIER,
                    ApprovalStatus.REJECTED.name(), reason, userId);
        }
        pierRepository.save(entity);
    }

    /**
     * Duyet vong dang mo cua ho so. Giu cho endpoint /approve cu hoat dong nhung
     * di dung quy trinh 2 cap thay vi duyet mot phat nhu truoc, de khong con
     * duong vong bo qua vong duyet qua API.
     */
    @Transactional
    public void approveCurrentStage(UUID id, String reason, UUID userId) {
        Pier entity = loadForApproval(id);
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            approveC2(id, reason, userId);
        } else {
            approveC1(id, reason, userId);
        }
    }

    private Pier loadForApproval(UUID id) {
        return pierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + id));
    }
    private final PortNotificationService notificationService;
    private final ChangeLogRepository changeLogRepository;
    private final ApprovalLogRepository approvalLogRepository;

    @Transactional
    public void approve(UUID id, String userId, String cap, String content) {
        Pier entity = pierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + id));

        if ("CANG_VU".equals(cap)) {
            if (entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL1) {
                throw new IllegalStateException("Không thể phê duyệt cấp Cảng vụ: cầu cảng chưa ở trạng thái chờ Cảng vụ duyệt");
            }
            entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL2);
            entity.setPortAuthorityApprovedAt(LocalDateTime.now());
            entity.setPortAuthorityApprovedBy(userId);
            if (content != null && !content.isBlank()) {
                entity.setPortAuthorityApprovalContent(content.trim());
            }
            log.info("Pier [{}] approved by {} at level CANG_VU", id, userId);
        } else if ("CUC".equals(cap)) {
            if (entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL2) {
                throw new IllegalStateException("Không thể phê duyệt cấp Cục: cần phê duyệt cấp Cảng vụ trước");
            }
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setDepartmentApprovedAt(LocalDateTime.now());
            entity.setDepartmentApprovedBy(userId);
            if (content != null && !content.isBlank()) {
                entity.setDepartmentApprovalContent(content.trim());
            }
            notificationService.sendApprovalNotification("Pier", id.toString(), userId, null);
            log.info("Pier [{}] approved by {} at level CUC", id, userId);
        } else {
            throw new IllegalArgumentException("Cấp phê duyệt không hợp lệ: " + cap);
        }

        ApprovalLog approvalLogRecord = ApprovalLog.builder()
                .entityType("Pier").entityId(id.toString()).decision("APPROVED").cap(cap)
                .decidedBy(userId).decidedAt(LocalDateTime.now()).build();
        approvalLogRepository.save(approvalLogRecord);
        pierRepository.save(entity);
    }

    @Transactional
    public void reject(UUID id, String userId, String cap, String reason) {
        Pier entity = pierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + id));

        entity.setApprovalStatus(ApprovalStatus.REJECTED);

        ApprovalLog approvalLog = ApprovalLog.builder()
                .entityType("Pier").entityId(id.toString()).decision("REJECTED").cap(cap)
                .reason(reason).decidedBy(userId).decidedAt(LocalDateTime.now()).build();
        approvalLogRepository.save(approvalLog);
        pierRepository.save(entity);

        log.info("Pier [{}] rejected by {} at level {}: {}", id, userId, cap, reason);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHistory(UUID id) {
        Pier entity = pierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + id));

        String entityId = id.toString();
        String entityType = "Pier";

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
        String entityType = "Pier";
        List<ChangeLog> changeHistory = changeLogRepository.findByEntityType(entityType);
        java.util.Map<String, String> entityNames = new java.util.HashMap<>();
        for (ChangeLog log : changeHistory) {
            if (!entityNames.containsKey(log.getEntityId())) {
                try {
                    pierRepository.findById(UUID.fromString(log.getEntityId()))
                        .ifPresent(p -> entityNames.put(log.getEntityId(), p.getPierName()));
                } catch (Exception e) { entityNames.put(log.getEntityId(), log.getEntityId()); }
            }
        }
        return java.util.Map.of("entityType", entityType, "changeHistory", changeHistory, "entityNames", entityNames);
    }
}
