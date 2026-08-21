package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.entity.Berth;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.repository.ApprovalLogRepository;
import com.hanghai.kchtg.port.repository.BerthRepository;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Two-level approval service for Berth entity.
 * Level 1: CANG_VU (Port Authority) — DRAFT/PENDING → PORT_AUTHORITY
 * Level 2: CUC (Department) — PORT_AUTHORITY → APPROVED
 * Reject at any level → REJECTED
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BerthApprovalService {

    private final BerthRepository berthRepository;
    private final ChangeLogRepository changeLogRepository;
    private final ApprovalLogRepository approvalLogRepository;

    @Transactional
    public void approve(UUID id, String userId, String cap, String content) {
        Berth entity = berthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id));

        if ("CANG_VU".equals(cap)) {
            if (entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL1) {
                throw new IllegalStateException("Không thể phê duyệt cấp Cảng vụ: trạng thái hiện tại không hợp lệ");
            }
            entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL2);
            entity.setPortAuthorityApprovedAt(LocalDateTime.now());
            entity.setPortAuthorityApprovedBy(userId);
            entity.setRejectionReason(null);
            if (content != null && !content.isBlank()) {
                entity.setPortAuthorityApprovalContent(content.trim());
            }
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
        } else {
            throw new IllegalArgumentException("Cấp phê duyệt không hợp lệ: " + cap);
        }

        ApprovalLog approvalLogRecord = ApprovalLog.builder()
                .entityType("Berth").entityId(id.toString()).decision("APPROVED").cap(cap)
                .decidedBy(userId).decidedAt(LocalDateTime.now()).build();
        approvalLogRepository.save(approvalLogRecord);
        berthRepository.save(entity);

        log.info("Berth [{}] approved by {} at level {}", id, userId, cap);
    }

    @Transactional
    public void reject(UUID id, String userId, String cap, String reason) {
        Berth entity = berthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id));

        entity.setApprovalStatus(ApprovalStatus.REJECTED);
        entity.setRejectionReason(reason);

        ApprovalLog approvalLog = ApprovalLog.builder()
                .entityType("Berth").entityId(id.toString()).decision("REJECTED").cap(cap)
                .reason(reason).decidedBy(userId).decidedAt(LocalDateTime.now()).build();
        approvalLogRepository.save(approvalLog);
        berthRepository.save(entity);

        log.info("Berth [{}] rejected by {} at level {}: {}", id, userId, cap, reason);
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
                "currentApprovalStatus", entity.getApprovalStatus(),
                "changeHistory", changeHistory,
                "approvalLog", approvalLog
        );
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getAllHistory() {
        String entityType = "Berth";
        List<ChangeLog> changeHistory = changeLogRepository.findByEntityType(entityType);
        java.util.Map<String, String> entityNames = new java.util.HashMap<>();
        for (ChangeLog log : changeHistory) {
            if (!entityNames.containsKey(log.getEntityId())) {
                try {
                    berthRepository.findById(UUID.fromString(log.getEntityId()))
                        .ifPresent(b -> entityNames.put(log.getEntityId(), b.getBerthName()));
                } catch (Exception e) { entityNames.put(log.getEntityId(), log.getEntityId()); }
            }
        }
        return java.util.Map.of("entityType", entityType, "changeHistory", changeHistory, "entityNames", entityNames);
    }
}
