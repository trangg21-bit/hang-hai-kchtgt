package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.DaiTtdh;
import com.hanghai.kchtg.port.repository.DaiTtdhRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Two-level approval service for DaiTtdh entity.
 * Level 1: CANG_VU (Port Authority) — APPROVED_LEVEL1 → APPROVED_LEVEL2
 * Level 2: CUC (Department) — APPROVED_LEVEL2 → APPROVED
 * Reject at any level → REJECTED_LEVEL1 / REJECTED_LEVEL2
 * <p>
 * Lịch sử thay đổi ghi/đọc từ bảng tập trung {@code infrastructure_history}
 * (refType = DAI_TTDH) qua {@link ChangeHistoryService} — chuẩn Cảng biển /
 * VTS CHK (các bảng change_logs/approval_logs đã bị V20260825162500 drop).
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DaiTtdhApprovalService {

    private final DaiTtdhRepository daiTtdhRepository;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final ChangeHistoryService changeHistoryService;

    @Transactional
    public void approve(UUID id, String userId, String cap, String content) {
        DaiTtdh entity = daiTtdhRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đài TTDH với id: " + id));

        ApprovalStatus previousStatus = entity.getApprovalStatus();
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

        daiTtdhRepository.save(entity);

        // Lịch sử phê duyệt (chuẩn Cảng biển): "Trạng thái" cũ → mới, actor = user thật
        String actorId = resolveActorId(userId);
        if (actorId != null) {
            changeHistoryService.insertChangeRecord("DAI_TTDH", entity.getId(), "Trạng thái",
                    approvalLabel(previousStatus), approvalLabel(entity.getApprovalStatus()), actorId);
        }

        log.info("DaiTtdh [{}] approved by {} at level {}", id, userId, cap);
    }

    @Transactional
    public void reject(UUID id, String userId, String cap, String reason) {
        DaiTtdh entity = daiTtdhRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đài TTDH với id: " + id));

        entity.setApprovalStatus(entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2
                ? ApprovalStatus.REJECTED_LEVEL2 : ApprovalStatus.REJECTED_LEVEL1);
        entity.setRejectionReason(reason);

        daiTtdhRepository.save(entity);

        // Lịch sử từ chối (chuẩn Cảng biển PortApprovalService.reject): "Lý do từ chối", actor = user thật
        String actorId = resolveActorId(userId);
        if (actorId != null) {
            changeHistoryService.insertChangeRecord("DAI_TTDH", entity.getId(), "Lý do từ chối",
                    null, reason, actorId);
        }

        log.info("DaiTtdh [{}] rejected by {} at level {}: {}", id, userId, cap, reason);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getHistory(UUID id) {
        DaiTtdh entity = daiTtdhRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đài TTDH với id: " + id));

        String entityId = id.toString();
        String entityType = "DaiTtdh";

        List<InfrastructureHistory> list =
                historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.DAI_TTDH, id);
        Map<UUID, String> userNameMap = resolveUserNames(list);

        List<Map<String, Object>> changeHistory = list.stream()
                .map(h -> toChangeHistoryEntry(h, entityId, entityType, userNameMap))
                .collect(Collectors.toList());

        // Các dòng phê duyệt legacy (changedField = null, chỉ có status/reason) vẫn hiển thị ở tab Phê duyệt
        List<Map<String, Object>> approvalLog = list.stream()
                .filter(h -> h.getStatus() != null && h.getChangedField() == null)
                .map(h -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", h.getId());
                    m.put("entityType", entityType);
                    m.put("entityId", entityId);
                    m.put("decision", h.getStatus().name());
                    m.put("reason", h.getReason() != null ? h.getReason() : "");
                    m.put("decidedBy", h.getApprovedBy() != null
                            ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : "");
                    m.put("decidedAt", h.getApprovedDate());
                    m.put("cap", h.getApprovalLevel() != null ? h.getApprovalLevel().name() : "");
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("entityId", entityId);
        result.put("entityType", entityType);
        result.put("currentApprovalStatus", entity.getApprovalStatus());
        result.put("changeHistory", changeHistory);
        result.put("approvalLog", approvalLog);
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAllHistory() {
        String entityType = "DaiTtdh";
        List<InfrastructureHistory> list =
                historyRepository.findByRefTypeOrderByApprovedDateDesc(InfrastructureType.DAI_TTDH);
        Map<String, String> entityNames = new HashMap<>();
        for (InfrastructureHistory logItem : list) {
            if (logItem.getRefId() != null && !entityNames.containsKey(logItem.getRefId().toString())) {
                try {
                    daiTtdhRepository.findById(logItem.getRefId())
                            .ifPresent(a -> entityNames.put(a.getId().toString(), a.getDaiTtdhName()));
                } catch (Exception e) {
                    entityNames.put(logItem.getRefId().toString(), logItem.getRefId().toString());
                }
            }
        }
        return Map.of("entityType", entityType, "changeHistory", list, "entityNames", entityNames);
    }

    /** Chuyển một dòng infrastructure_history thành entry của changeHistory (đã phân giải actor). */
    private Map<String, Object> toChangeHistoryEntry(InfrastructureHistory h, String entityId,
                                                     String entityType, Map<UUID, String> userNameMap) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", h.getId());
        m.put("entityType", entityType);
        m.put("entityId", h.getRefId() != null ? h.getRefId().toString() : entityId);
        m.put("changedField", h.getChangedField());
        m.put("previousValue", h.getPreviousValue() != null ? h.getPreviousValue() : "");
        m.put("newValue", h.getNewValue() != null ? h.getNewValue() : "");
        m.put("changedBy", h.getApprovedBy() != null
                ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : "");
        m.put("changedAt", h.getApprovedDate());
        m.put("status", h.getStatus() != null ? h.getStatus().getCode() : null);
        m.put("reason", h.getReason());
        m.put("approvalLevel", h.getApprovalLevel() != null ? h.getApprovalLevel().name() : null);
        return m;
    }

    /** Phân giải UUID actor → tên đầy đủ (fallback username) theo chuẩn PortApprovalService. */
    private Map<UUID, String> resolveUserNames(List<InfrastructureHistory> list) {
        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<UUID, String> userNameMap = new HashMap<>();
        userRepository.findAllByIdInWithOrgUnit(userIds)
                .forEach(u -> userNameMap.put(u.getId(), formatUserIdentity(u)));
        return userNameMap;
    }

    private String formatUserIdentity(User user) {
        if (user == null) return null;
        if (user.getFullName() != null && !user.getFullName().trim().isEmpty()) {
            return user.getFullName().trim();
        }
        if (user.getUsername() != null && !user.getUsername().trim().isEmpty()) {
            return user.getUsername().trim();
        }
        return null;
    }

    /**
     * Actor thật từ SecurityContext — ưu tiên UUID của user đang đăng nhập; chỉ
     * fallback parse {@code userId} khi không có principal. Không bao giờ trả về
     * chuỗi "system" (approvedBy null → drawer hiện "—").
     */
    private String resolveActorId(String userId) {
        UUID current = SecurityUtils.getCurrentUserId();
        if (current != null) {
            return current.toString();
        }
        if (userId != null) {
            try {
                return UUID.fromString(userId).toString();
            } catch (IllegalArgumentException ignored) {
                // username (không phải UUID) — không đủ dữ liệu để gán actor; bỏ qua ghi lịch sử
            }
        }
        return null;
    }

    private static String approvalLabel(ApprovalStatus st) {
        if (st == null) return "";
        return switch (st) {
            case APPROVED_LEVEL1 -> "Chờ phê duyệt cấp Cảng vụ/Chi cục";
            case APPROVED_LEVEL2 -> "Chờ phê duyệt cấp Cục";
            case APPROVED -> "Đã phê duyệt";
            case REJECTED_LEVEL1 -> "Từ chối cấp Cảng vụ/Chi cục";
            case REJECTED_LEVEL2 -> "Từ chối cấp Cục";
            case DRAFT -> "Lưu tạm";
            default -> st.getLabel();
        };
    }
}
