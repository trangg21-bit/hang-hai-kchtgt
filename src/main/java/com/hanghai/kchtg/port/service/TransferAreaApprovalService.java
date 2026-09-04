package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.entity.TransferArea;
import com.hanghai.kchtg.port.repository.TransferAreaRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Two-level approval service for TransferArea entity.
 * Level 1: CANG_VU (Port Authority) — DRAFT/PENDING → PORT_AUTHORITY (APPROVED_LEVEL1)
 * Level 2: CUC (Department) — PORT_AUTHORITY → APPROVED
 * Reject at any level → REJECTED
 * <p>
 * Lịch sử thay đổi đọc từ bảng tập trung {@code infrastructure_history}
 * (refType = TRANSSHIPMENT_AREA) — cùng cấu trúc ghi/đọc với Cảng biển / Vùng nước;
 * actor UUID được phân giải sang họ tên (không trả UUID thô để drawer không hiển thị "—").
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TransferAreaApprovalService {

    private final TransferAreaRepository transferAreaRepository;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;

    @Transactional
    public void approve(UUID id, String userId, String cap, String content) {
        TransferArea entity = transferAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu chuyển tải với id: " + id));

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
                .entityType("TransferArea")
                .entityId(id.toString())
                .decision("APPROVED")
                .cap(cap)
                .decidedBy(userId)
                .decidedAt(LocalDateTime.now())
                .build();
        // [TẠM TẮT GHI LỊCH SỬ] Bảng approval_logs đã bị V20260825162500 drop; không ghi lịch sử (chuẩn Khu neo đậu)
        // approvalLogRepository.save(approvalLogRecord);
        transferAreaRepository.save(entity);

        log.info("TransferArea [{}] approved by {} at level {}", id, userId, cap);
    }

    @Transactional
    public void reject(UUID id, String userId, String cap, String reason) {
        TransferArea entity = transferAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu chuyển tải với id: " + id));

        entity.setApprovalStatus(entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2
                ? ApprovalStatus.REJECTED_LEVEL2 : ApprovalStatus.REJECTED_LEVEL1);
        entity.setRejectionReason(reason);

        ApprovalLog approvalLog = ApprovalLog.builder()
                .entityType("TransferArea")
                .entityId(id.toString())
                .decision("REJECTED")
                .cap(cap)
                .reason(reason)
                .decidedBy(userId)
                .decidedAt(LocalDateTime.now())
                .build();
        // [TẠM TẮT GHI LỊCH SỬ] Bảng approval_logs đã bị V20260825162500 drop; không ghi lịch sử (chuẩn Khu neo đậu)
        // approvalLogRepository.save(approvalLog);
        transferAreaRepository.save(entity);

        log.info("TransferArea [{}] rejected by {} at level {}: {}", id, userId, cap, reason);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHistory(UUID id) {
        TransferArea entity = transferAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu chuyển tải với id: " + id));

        String entityId = id.toString();
        String entityType = "TransferArea";

        // Đọc từ infrastructure_history (refType = TRANSSHIPMENT_AREA) — chuẩn WaterZoneApprovalService
        List<InfrastructureHistory> list =
                historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.TRANSSHIPMENT_AREA, id);
        Map<UUID, String> userNameMap = resolveUserNames(list);

        List<Map<String, Object>> changeHistory = list.stream()
                .filter(h -> h.getChangedField() != null)
                .map(h -> toChangeHistoryMap(h, entityType, entityId, userNameMap))
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
                    m.put("decidedBy", resolveActorName(h, userNameMap));
                    m.put("decidedAt", h.getApprovedDate());
                    m.put("cap", h.getApprovalLevel() != null ? h.getApprovalLevel().name() : "");
                    return m;
                })
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("entityId", entityId);
        result.put("entityType", entityType);
        result.put("currentApprovalStatus", entity.getApprovalStatus());
        result.put("changeHistory", changeHistory);
        result.put("approvalLog", approvalLog);
        return result;
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getAllHistory() {
        String entityType = "TransferArea";
        List<InfrastructureHistory> list =
                historyRepository.findByRefTypeOrderByApprovedDateDesc(InfrastructureType.TRANSSHIPMENT_AREA);

        Map<String, String> entityNames = new HashMap<>();
        for (InfrastructureHistory h : list) {
            if (h.getRefId() != null && !entityNames.containsKey(h.getRefId().toString())) {
                try {
                    transferAreaRepository.findById(h.getRefId())
                            .ifPresent(t -> entityNames.put(h.getRefId().toString(), t.getTransferAreaName()));
                } catch (Exception e) {
                    entityNames.put(h.getRefId().toString(), h.getRefId().toString());
                }
            }
        }

        Map<UUID, String> userNameMap = resolveUserNames(list);
        List<Map<String, Object>> changeHistory = list.stream()
                .filter(h -> h.getChangedField() != null)
                .map(h -> toChangeHistoryMap(h, entityType,
                        h.getRefId() != null ? h.getRefId().toString() : "", userNameMap))
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("entityType", entityType);
        result.put("changeHistory", changeHistory);
        result.put("entityNames", entityNames);
        return result;
    }

    /** Batch resolve actor UUID → tên hiển thị (fullName, fallback username) — chuẩn WaterZoneApprovalService. */
    private Map<UUID, String> resolveUserNames(List<InfrastructureHistory> list) {
        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (userIds.isEmpty()) {
            return java.util.Collections.emptyMap();
        }
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(
                        User::getId,
                        u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUsername(),
                        (a, b) -> a));
    }

    private String resolveActorName(InfrastructureHistory h, Map<UUID, String> userNameMap) {
        if (h.getApprovedBy() == null) {
            return "";
        }
        return userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString());
    }

    /**
     * Map một dòng infrastructure_history sang dạng drawer đọc được: mang đồng thời cặp alias
     * cũ/mới (changedField+fieldName, previousValue+oldValue, approvedDate+changedAt) và actor
     * đã phân giải tên (approvedByName/changedBy) kèm UUID thô (approvedBy).
     */
    private Map<String, Object> toChangeHistoryMap(InfrastructureHistory h, String entityType, String entityId,
                                                   Map<UUID, String> userNameMap) {
        String field = h.getChangedField() != null ? h.getChangedField() : "";
        String oldValue = h.getPreviousValue() != null ? h.getPreviousValue() : "";
        String newValue = h.getNewValue() != null ? h.getNewValue() : "";
        String resolvedName = resolveActorName(h, userNameMap);
        Map<String, Object> m = new HashMap<>();
        m.put("id", h.getId());
        m.put("entityType", entityType);
        m.put("entityId", entityId);
        m.put("changedField", field);
        m.put("fieldName", field);
        m.put("previousValue", oldValue);
        m.put("oldValue", oldValue);
        m.put("newValue", newValue);
        m.put("changedBy", resolvedName);
        m.put("approvedByName", resolvedName);
        m.put("approvedBy", h.getApprovedBy() != null ? h.getApprovedBy().toString() : "");
        m.put("approvedDate", h.getApprovedDate());
        m.put("changedAt", h.getApprovedDate());
        m.put("status", h.getStatus() != null ? h.getStatus().name() : "");
        m.put("reason", h.getReason() != null ? h.getReason() : "");
        m.put("approvalLevel", h.getApprovalLevel() != null ? h.getApprovalLevel().name() : "");
        return m;
    }
}
