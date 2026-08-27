package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.entity.StormShelterArea;
import com.hanghai.kchtg.port.repository.ApprovalLogRepository;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.port.repository.StormShelterAreaRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Two-level approval service for StormShelterArea entity.
 * Level 1: CANG_VU (Port Authority) — DRAFT/PENDING → PORT_AUTHORITY (APPROVED_LEVEL1)
 * Level 2: CUC (Department) — PORT_AUTHORITY → APPROVED
 * Reject at any level → REJECTED
 * <p>
 * Entity type: "StormShelterArea" (for ApprovalLog + ChangeLog)
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StormShelterAreaApprovalService {

    private final StormShelterAreaRepository stormShelterAreaRepository;
    private final ChangeLogRepository changeLogRepository;
    private final ApprovalLogRepository approvalLogRepository;

    @Transactional
    public void approve(UUID id, String userId, String cap, String content) {
        StormShelterArea entity = stormShelterAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu tránh, trú bão với id: " + id));

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
                .entityType("StormShelterArea")
                .entityId(id.toString())
                .decision("APPROVED")
                .cap(cap)
                .decidedBy(userId)
                .decidedAt(LocalDateTime.now())
                .build();
        // [TẠM TẮT GHI LỊCH SỬ] Bảng approval_logs đã bị V20260825162500 drop; không ghi lịch sử (chuẩn Khu neo đậu)
        // approvalLogRepository.save(approvalLogRecord);
        stormShelterAreaRepository.save(entity);

        log.info("StormShelterArea [{}] approved by {} at level {}", id, userId, cap);
    }

    @Transactional
    public void reject(UUID id, String userId, String cap, String reason) {
        StormShelterArea entity = stormShelterAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu tránh, trú bão với id: " + id));

        entity.setApprovalStatus(entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2
                ? ApprovalStatus.REJECTED_LEVEL2 : ApprovalStatus.REJECTED_LEVEL1);
        entity.setRejectionReason(reason);

        ApprovalLog approvalLog = ApprovalLog.builder()
                .entityType("StormShelterArea")
                .entityId(id.toString())
                .decision("REJECTED")
                .cap(cap)
                .reason(reason)
                .decidedBy(userId)
                .decidedAt(LocalDateTime.now())
                .build();
        // [TẠM TẮT GHI LỊCH SỬ] Bảng approval_logs đã bị V20260825162500 drop; không ghi lịch sử (chuẩn Khu neo đậu)
        // approvalLogRepository.save(approvalLog);
        stormShelterAreaRepository.save(entity);

        log.info("StormShelterArea [{}] rejected by {} at level {}: {}", id, userId, cap, reason);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHistory(UUID id) {
        StormShelterArea entity = stormShelterAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu tránh, trú bão với id: " + id));

        String entityId = id.toString();
        String entityType = "StormShelterArea";

        // [TẠM TẮT ĐỌC LỊCH SỬ] Bảng change_logs/approval_logs đã bị V20260825162500 drop — trả rỗng để không crash
        List<ChangeLog> changeHistory = List.of();
        List<ApprovalLog> approvalLogs = List.of();

        return java.util.Map.of(
                "entityId", entityId,
                "entityType", entityType,
                "currentApprovalStatus", entity.getApprovalStatus(),
                "changeHistory", changeHistory,
                "approvalLog", approvalLogs
        );
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getAllHistory() {
        String entityType = "StormShelterArea";
        List<ChangeLog> changeHistory = List.of(); // [TẠM TẮT] bảng change_logs đã bị V20260825162500 drop — trả rỗng
        java.util.Map<String, String> entityNames = new java.util.HashMap<>();
        for (ChangeLog log : changeHistory) {
            if (!entityNames.containsKey(log.getEntityId())) {
                try {
                    stormShelterAreaRepository.findById(UUID.fromString(log.getEntityId()))
                        .ifPresent(a -> entityNames.put(log.getEntityId(), a.getStormShelterName()));
                } catch (Exception e) {
                    entityNames.put(log.getEntityId(), log.getEntityId());
                }
            }
        }
        return java.util.Map.of("entityType", entityType, "changeHistory", changeHistory, "entityNames", entityNames);
    }
}
