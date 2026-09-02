package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.entity.ChangeLog;
import com.hanghai.kchtg.port.entity.ShipRepairYard;
import com.hanghai.kchtg.port.repository.ApprovalLogRepository;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.port.repository.ShipRepairYardRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Two-level approval service for ShipRepairYard entity.
 * Level 1: CANG_VU (Port Authority) — DRAFT/PENDING → PORT_AUTHORITY (APPROVED_LEVEL1)
 * Level 2: CUC (Department) — PORT_AUTHORITY → APPROVED
 * Reject at any level → REJECTED
 * <p>
 * Entity type: "ShipRepairYard" (for ApprovalLog + ChangeLog)
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShipRepairYardApprovalService {

    private final ShipRepairYardRepository shipRepairYardRepository;
    private final ChangeLogRepository changeLogRepository;
    private final ApprovalLogRepository approvalLogRepository;

    @Transactional
    public void approve(UUID id, String userId, String cap, String content) {
        ShipRepairYard entity = shipRepairYardRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cơ sở sửa chữa, đóng tàu với id: " + id));

        if ("CANG_VU".equals(cap)) {
            if (entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL1) {
                throw new IllegalStateException("Không thể phê duyệt cấp Chi cục: trạng thái hiện tại không hợp lệ");
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
                throw new IllegalStateException("Không thể phê duyệt cấp Cục: cần phê duyệt cấp Chi cục trước");
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
                .entityType("ShipRepairYard")
                .entityId(id.toString())
                .decision("APPROVED")
                .cap(cap)
                .decidedBy(userId)
                .decidedAt(LocalDateTime.now())
                .build();
        // [TẠM TẮT GHI LỊCH SỬ] Bảng approval_logs đã bị V20260825162500 drop; không ghi lịch sử (chuẩn Khu neo đậu)
        shipRepairYardRepository.save(entity);

        log.info("ShipRepairYard [{}] approved by {} at level {}", id, userId, cap);
    }

    @Transactional
    public void reject(UUID id, String userId, String cap, String reason) {
        ShipRepairYard entity = shipRepairYardRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cơ sở sửa chữa, đóng tàu với id: " + id));

        entity.setApprovalStatus(entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2
                ? ApprovalStatus.REJECTED_LEVEL2 : ApprovalStatus.REJECTED_LEVEL1);
        entity.setRejectionReason(reason);

        ApprovalLog approvalLog = ApprovalLog.builder()
                .entityType("ShipRepairYard")
                .entityId(id.toString())
                .decision("REJECTED")
                .cap(cap)
                .reason(reason)
                .decidedBy(userId)
                .decidedAt(LocalDateTime.now())
                .build();
        // [TẠM TẮT GHI LỊCH SỬ] Bảng approval_logs đã bị V20260825162500 drop; không ghi lịch sử (chuẩn Khu neo đậu)
        shipRepairYardRepository.save(entity);

        log.info("ShipRepairYard [{}] rejected by {} at level {}: {}", id, userId, cap, reason);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHistory(UUID id) {
        ShipRepairYard entity = shipRepairYardRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cơ sở sửa chữa, đóng tàu với id: " + id));

        String entityId = id.toString();
        String entityType = "ShipRepairYard";

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
        String entityType = "ShipRepairYard";
        List<ChangeLog> changeHistory = List.of(); // [TẠM TẮT] bảng change_logs đã bị V20260825162500 drop — trả rỗng
        java.util.Map<String, String> entityNames = new java.util.HashMap<>();
        for (ChangeLog log : changeHistory) {
            if (!entityNames.containsKey(log.getEntityId())) {
                try {
                    shipRepairYardRepository.findById(UUID.fromString(log.getEntityId()))
                        .ifPresent(a -> entityNames.put(log.getEntityId(), a.getShipRepairYardName()));
                } catch (Exception e) {
                    entityNames.put(log.getEntityId(), log.getEntityId());
                }
            }
        }
        return java.util.Map.of("entityType", entityType, "changeHistory", changeHistory, "entityNames", entityNames);
    }
}
