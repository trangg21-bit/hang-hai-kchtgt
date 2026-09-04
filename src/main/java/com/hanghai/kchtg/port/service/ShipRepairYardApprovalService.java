package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.ApprovalLog;
import com.hanghai.kchtg.port.entity.ShipRepairYard;
import com.hanghai.kchtg.port.repository.ApprovalLogRepository;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.port.repository.ShipRepairYardRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

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
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;

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

        // Lịch sử thay đổi tập trung infrastructure_history (chuẩn Cảng biển PortApprovalService).
        List<InfrastructureHistory> historyRows = historyRepository
                .findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.SHIP_REPAIR_YARD, id);
        Map<UUID, User> userMap = resolveUsers(historyRows);
        Map<UUID, String> userNameMap = new HashMap<>();
        userMap.forEach((userId, user) -> userNameMap.put(userId, formatUserIdentity(user)));
        List<HistoryEntry> changeHistory = historyRows.stream()
                .map(h -> toHistoryEntry(h, userMap, userNameMap))
                .collect(Collectors.toList());

        return java.util.Map.of(
                "entityId", entityId,
                "entityType", entityType,
                "currentApprovalStatus", entity.getApprovalStatus(),
                "changeHistory", changeHistory,
                "approvalLog", List.of()
        );
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getAllHistory() {
        String entityType = "ShipRepairYard";
        List<InfrastructureHistory> historyRows = historyRepository
                .findByRefTypeOrderByApprovedDateDesc(InfrastructureType.SHIP_REPAIR_YARD);
        Map<UUID, User> userMap = resolveUsers(historyRows);
        Map<UUID, String> userNameMap = new HashMap<>();
        userMap.forEach((userId, user) -> userNameMap.put(userId, formatUserIdentity(user)));
        List<HistoryEntry> changeHistory = historyRows.stream()
                .map(h -> toHistoryEntry(h, userMap, userNameMap))
                .collect(Collectors.toList());

        Map<String, String> entityNames = new HashMap<>();
        for (InfrastructureHistory logItem : historyRows) {
            if (logItem.getRefId() != null) {
                String refIdStr = logItem.getRefId().toString();
                if (!entityNames.containsKey(refIdStr)) {
                    try {
                        shipRepairYardRepository.findById(logItem.getRefId())
                                .ifPresent(a -> entityNames.put(refIdStr, a.getShipRepairYardName()));
                    } catch (Exception e) {
                        entityNames.put(refIdStr, refIdStr);
                    }
                }
            }
        }
        return java.util.Map.of("entityType", entityType, "changeHistory", changeHistory, "entityNames", entityNames);
    }

    /** Map lịch sử → HistoryEntry với approvedBy đã resolve thành tên người dùng thật. */
    private HistoryEntry toHistoryEntry(InfrastructureHistory h,
                                        Map<UUID, User> userMap, Map<UUID, String> userNameMap) {
        User userActor = h.getApprovedBy() != null ? userMap.get(h.getApprovedBy()) : null;
        return HistoryEntry.builder()
                .id(h.getId())
                .approvalLevel(h.getApprovalLevel())
                .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                .approvedBy(h.getApprovedBy() != null ? userNameMap.get(h.getApprovedBy()) : null)
                .orgUnitName(userActor != null && userActor.getOrgUnit() != null
                        ? userActor.getOrgUnit().getName() : null)
                .approvedDate(h.getApprovedDate())
                .reason(h.getReason())
                .changedField(h.getChangedField())
                .previousValue(h.getPreviousValue())
                .newValue(h.getNewValue())
                .build();
    }

    private Map<UUID, User> resolveUsers(List<InfrastructureHistory> rows) {
        if (rows == null || rows.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<UUID> userIds = rows.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        return resolveUsers(userIds);
    }

    private Map<UUID, User> resolveUsers(Collection<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<UUID> nonNullIds = userIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
        if (nonNullIds.isEmpty()) {
            return Collections.emptyMap();
        }
        return userRepository.findAllByIdInWithOrgUnit(nonNullIds).stream()
                .collect(Collectors.toMap(User::getId, user -> user, (first, second) -> first));
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
}
