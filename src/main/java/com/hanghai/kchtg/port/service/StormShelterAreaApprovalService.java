package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.StormShelterArea;
import com.hanghai.kchtg.port.repository.StormShelterAreaRepository;
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
 * Two-level approval service for StormShelterArea entity.
 * Level 1: CANG_VU (Port Authority) — DRAFT/PENDING → PORT_AUTHORITY (APPROVED_LEVEL1)
 * Level 2: CUC (Department) — PORT_AUTHORITY → APPROVED
 * Reject at any level → REJECTED
 * <p>
 * Lịch sử thay đổi ghi vào bảng tập trung {@code infrastructure_history}
 * (refType = STORM_SHELTER_AREA) — cùng cấu trúc ghi/đọc với chuẩn Cảng biển/Khu neo đậu.
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StormShelterAreaApprovalService {

    private final StormShelterAreaRepository stormShelterAreaRepository;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;

    @Transactional
    public void approve(UUID id, String userId, String cap, String content) {
        StormShelterArea entity = stormShelterAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu tránh, trú bão với id: " + id));

        if ("CANG_VU".equals(cap)) {
            if (entity.getApprovalStatus() != ApprovalStatus.PENDING_APPROVAL
                    && entity.getApprovalStatus() != ApprovalStatus.PROPOSED
                    && entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL1) {
                throw new IllegalStateException("Không thể phê duyệt cấp Chi cục: trạng thái hiện tại không hợp lệ (" + entity.getApprovalStatus() + ")");
            }
            entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
            entity.setPortAuthorityApprovedAt(LocalDateTime.now());
            entity.setPortAuthorityApprovedBy(userId);
            entity.setRejectionReason(null);
            if (content != null && !content.isBlank()) {
                entity.setPortAuthorityApprovalContent(content.trim());
            }
        } else if ("CUC".equals(cap)) {
            if (entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL1
                    && entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL2) {
                throw new IllegalStateException("Không thể phê duyệt cấp Cục: cần phê duyệt cấp Chi cục trước (trạng thái hiện tại: " + entity.getApprovalStatus() + ")");
            }
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setDepartmentApprovedAt(LocalDateTime.now());
            entity.setDepartmentApprovedBy(userId);
            entity.setRejectionReason(null);
            if (content != null && !content.isBlank()) {
                entity.setDepartmentApprovalContent(content.trim());
            }
        } else {
            throw new IllegalArgumentException("Cấp phê duyệt không hợp lệ: " + cap);
        }

        stormShelterAreaRepository.save(entity);

        // Ghi sự kiện phê duyệt vào infrastructure_history (changedField = null để getHistory
        // phân loại vào approvalLog), chuẩn Cảng biển sau migration V20260825162500.
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.STORM_SHELTER_AREA)
                .approvalLevel("CANG_VU".equals(cap) ? ApprovalLevel.LEVEL_1 : ApprovalLevel.LEVEL_2)
                .status(InfrastructureHistoryStatus.APPROVED)
                .approvedBy(SecurityUtils.getCurrentUserId())
                .approvedDate(LocalDateTime.now())
                .reason(("CANG_VU".equals(cap) ? "Phê duyệt cấp Cảng vụ" : "Phê duyệt cấp Cục")
                        + (content != null && !content.isBlank() ? ": " + content.trim() : ""))
                .build());

        log.info("StormShelterArea [{}] approved by {} at level {}", id, userId, cap);
    }

    @Transactional
    public void reject(UUID id, String userId, String cap, String reason) {
        StormShelterArea entity = stormShelterAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu tránh, trú bão với id: " + id));

        boolean isCuc = "CUC".equalsIgnoreCase(cap)
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        entity.setApprovalStatus(isCuc ? ApprovalStatus.REJECTED_LEVEL2 : ApprovalStatus.REJECTED_LEVEL1);
        entity.setRejectionReason(reason);

        stormShelterAreaRepository.save(entity);

        // Ghi sự kiện từ chối vào infrastructure_history (changedField = null để getHistory
        // phân loại vào approvalLog), chuẩn Cảng biển sau migration V20260825162500.
        String levelLabel = "CANG_VU".equals(cap) ? "Cảng vụ" : "Cục";
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.STORM_SHELTER_AREA)
                .approvalLevel("CANG_VU".equals(cap) ? ApprovalLevel.LEVEL_1 : ApprovalLevel.LEVEL_2)
                .status(InfrastructureHistoryStatus.REJECTED)
                .approvedBy(SecurityUtils.getCurrentUserId())
                .approvedDate(LocalDateTime.now())
                .reason("Từ chối cấp " + levelLabel
                        + (reason != null && !reason.isBlank() ? ": " + reason.trim() : ""))
                .build());

        log.info("StormShelterArea [{}] rejected by {} at level {}: {}", id, userId, cap, reason);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHistory(UUID id) {
        StormShelterArea entity = stormShelterAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu tránh, trú bão với id: " + id));

        String entityId = id.toString();
        String entityType = "StormShelterArea";

        List<InfrastructureHistory> list =
                historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.STORM_SHELTER_AREA, id);

        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, String> userNameMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(
                                User::getId,
                                u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUsername(),
                                (a, b) -> a));

        List<Map<String, Object>> changeHistory = list.stream()
                .filter(h -> h.getChangedField() != null)
                .map(h -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", h.getId());
                    m.put("entityType", entityType);
                    m.put("entityId", entityId);
                    m.put("refId", h.getRefId());
                    m.put("refType", h.getRefType());
                    m.put("approvalLevel", h.getApprovalLevel() != null ? h.getApprovalLevel().name() : null);
                    m.put("status", h.getStatus() != null ? h.getStatus().name() : null);
                    m.put("fieldName", h.getChangedField() != null ? h.getChangedField() : "Trạng thái");
                    m.put("changedField", h.getChangedField() != null ? h.getChangedField() : "Trạng thái");
                    m.put("oldValue", h.getPreviousValue() != null ? h.getPreviousValue() : "");
                    m.put("previousValue", h.getPreviousValue());
                    m.put("newValue", h.getNewValue() != null ? h.getNewValue() : "");
                    m.put("changedBy", h.getApprovedBy() != null ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : "");
                    m.put("approvedBy", h.getApprovedBy() != null ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : null);
                    m.put("approvedByName", h.getApprovedBy() != null ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : null);
                    m.put("changedAt", h.getApprovedDate());
                    m.put("approvedDate", h.getApprovedDate());
                    m.put("reason", h.getReason());
                    return m;
                })
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
                    m.put("decidedBy", h.getApprovedBy() != null ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : "");
                    m.put("decidedAt", h.getApprovedDate());
                    m.put("cap", h.getApprovalLevel() != null ? h.getApprovalLevel().name() : "");
                    return m;
                })
                .toList();

        return Map.of(
                "entityId", entityId,
                "entityType", entityType,
                "currentApprovalStatus", entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : "",
                "changeHistory", changeHistory,
                "approvalLog", approvalLog,
                "histories", list
        );
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getAllHistory() {
        String entityType = "StormShelterArea";
        List<InfrastructureHistory> list =
                historyRepository.findByRefTypeOrderByApprovedDateDesc(InfrastructureType.STORM_SHELTER_AREA);
        java.util.Map<String, String> entityNames = new java.util.HashMap<>();
        for (InfrastructureHistory logItem : list) {
            if (logItem.getRefId() != null) {
                String refIdStr = logItem.getRefId().toString();
                if (!entityNames.containsKey(refIdStr)) {
                    try {
                        stormShelterAreaRepository.findById(logItem.getRefId())
                                .ifPresent(a -> entityNames.put(refIdStr, a.getStormShelterName()));
                    } catch (Exception e) {
                        entityNames.put(refIdStr, refIdStr);
                    }
                }
            }
        }
        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> userNameMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(
                                User::getId,
                                u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUsername(),
                                (a, b) -> a));
        List<Map<String, Object>> changeHistory = list.stream()
                .map(h -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", h.getId());
                    m.put("refId", h.getRefId());
                    m.put("entityId", h.getRefId() != null ? h.getRefId().toString() : null);
                    m.put("refType", h.getRefType());
                    m.put("approvalLevel", h.getApprovalLevel());
                    m.put("status", h.getStatus());
                    m.put("approvedBy", h.getApprovedBy() != null
                            ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString())
                            : null);
                    m.put("approvedByName", h.getApprovedBy() != null
                            ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString())
                            : null);
                    m.put("approvedDate", h.getApprovedDate());
                    m.put("reason", h.getReason());
                    m.put("changedField", h.getChangedField() != null ? h.getChangedField() : "Trạng thái");
                    m.put("fieldName", h.getChangedField() != null ? h.getChangedField() : "Trạng thái");
                    m.put("previousValue", h.getPreviousValue());
                    m.put("oldValue", h.getPreviousValue());
                    m.put("newValue", h.getNewValue());
                    m.put("changedBy", h.getApprovedBy() != null ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : "");
                    m.put("changedAt", h.getApprovedDate());
                    return m;
                })
                .toList();
        return java.util.Map.of("entityType", entityType, "changeHistory", changeHistory, "entityNames", entityNames, "histories", list);
    }
}
