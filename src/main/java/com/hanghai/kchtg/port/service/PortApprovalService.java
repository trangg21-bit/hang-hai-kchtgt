package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.service.shared.ApprovalWorkflowService;
import com.hanghai.kchtg.port.service.shared.PortNotificationService;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;
import java.text.Normalizer;
import java.time.LocalDateTime;

import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

/**
 * Approval service for Port entity.
 * Handles approve/reject operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PortApprovalService {

    private final PortRepository portRepository;
    private final ApprovalWorkflowService approvalWorkflowService;
    private final PortNotificationService notificationService;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;
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
        entity.setUpdatedAt(LocalDateTime.now());
        if (userId != null) entity.setUpdatedBy(userId);
        portRepository.saveAndFlush(entity);
        portCacheService.evictAfterCommit();
    }

    /** T06: Cảng vụ / Chi cục duyệt vòng 1. */
    @Transactional
    public void approveC1(UUID id, String reason, UUID userId) {
        Port entity = loadPort(id);
        infrastructureApprovalService.approveC1(entity, InfrastructureType.SEAPORT,
                ApprovalStatus.APPROVED.name(), reason, userId);
        entity.setUpdatedAt(LocalDateTime.now());
        if (userId != null) entity.setUpdatedBy(userId);
        portRepository.saveAndFlush(entity);
        portCacheService.evictAfterCommit();
        notificationService.sendApprovalNotification("Port", id.toString(), String.valueOf(userId), null);
    }

    /** T08: Cục duyệt vòng 2 — hồ sơ trở thành "Đã duyệt". */
    @Transactional
    public void approveC2(UUID id, String reason, UUID userId) {
        Port entity = loadPort(id);
        infrastructureApprovalService.approveC2(entity, InfrastructureType.SEAPORT,
                ApprovalStatus.APPROVED.name(), reason, userId);
        entity.setUpdatedAt(LocalDateTime.now());
        if (userId != null) entity.setUpdatedBy(userId);
        portRepository.saveAndFlush(entity);
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
        entity.setUpdatedAt(LocalDateTime.now());
        if (userId != null) entity.setUpdatedBy(userId);
        portRepository.saveAndFlush(entity);
        portCacheService.evictAfterCommit();
    }

    private Port loadPort(UUID id) {
        return portRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));
    }

    /**
     * Phê duyệt trực tiếp 1 cấp (mô hình chuẩn Cảng biển / Cảng cạn theo hh.csdl).
     */
    @Transactional
    public void approve(UUID id, String userId, String reason) {
        Port entity = portRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));

        UUID uid = null;
        try { if (userId != null) uid = UUID.fromString(userId); } catch (Exception ignored) {}
        if (uid == null) uid = SecurityUtils.getCurrentUserId();

        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setApprovedDateLevel2(LocalDateTime.now());
        entity.setApproverLevel2(uid);
        entity.setLevel2ApprovalContent(reason);
        entity.setUpdatedAt(LocalDateTime.now());
        if (uid != null) entity.setUpdatedBy(uid);
        portRepository.saveAndFlush(entity);
        portCacheService.evictAfterCommit();

        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.SEAPORT)
                .approvalLevel(ApprovalLevel.LEVEL_2)
                .status(InfrastructureHistoryStatus.APPROVED)
                .approvedBy(uid)
                .approvedDate(LocalDateTime.now())
                .build());

        log.info("Port [{}] approved directly by {}", id, uid);
        notificationService.sendApprovalNotification("Port", id.toString(), String.valueOf(uid), null);
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id) {
        return getHistory(id, null, null);
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize) {
        return getHistory(id, page, pageSize, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize, String keyword,
            LocalDateTime fromDate, LocalDateTime toDate) {
        Port parent = portRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));
        if (parent.getApprovalStatus() == ApprovalStatus.DRAFT) {
            return Collections.emptyList();
        }
        List<InfrastructureHistory> list;
        if (page != null && pageSize != null && pageSize > 0) {
            Pageable pageable = PageRequest.of(page, pageSize);
            String normalizedKeyword = normalizeSearchKeyword(keyword);
            if (normalizedKeyword == null && fromDate == null && toDate == null) {
                list = historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                        InfrastructureType.SEAPORT, id, pageable);
            } else {
                list = historyRepository.searchHistory(InfrastructureType.SEAPORT, id, normalizedKeyword,
                        fromDate, toDate, pageable);
            }
        } else {
            list = historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.SEAPORT, id);
        }
        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, User> userMap = resolveUsers(userIds);
        Map<UUID, String> userNameMap = new HashMap<>();
        userMap.forEach((userId, user) -> userNameMap.put(userId, formatUserIdentity(user)));

        return list.stream()
                .map(h -> HistoryEntry.builder()
                        .id(h.getId())
                        .approvalLevel(h.getApprovalLevel())
                        .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                        .approvedBy(h.getApprovedBy() != null ? userNameMap.get(h.getApprovedBy()) : null)
                        .orgUnitName(h.getApprovedBy() != null && userMap.get(h.getApprovedBy()) != null
                                && userMap.get(h.getApprovedBy()).getOrgUnit() != null
                                        ? userMap.get(h.getApprovedBy()).getOrgUnit().getName()
                                        : null)
                        .approvedDate(h.getApprovedDate())
                        .changedField(h.getChangedField())
                        .previousValue(h.getPreviousValue())
                        .newValue(h.getNewValue())
                        .build())
                .collect(Collectors.toList());
    }

    private void ensureExists(UUID id) {
        if (!portRepository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id);
        }
    }

    private static String normalizeSearchKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return null;
        }
        return Normalizer.normalize(keyword.trim().toLowerCase(Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
    }

    private Map<UUID, User> resolveUsers(Collection<UUID> userIds) {
        if (userIds == null || userIds.isEmpty())
            return Collections.emptyMap();
        Set<UUID> nonNullIds = userIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
        if (nonNullIds.isEmpty())
            return Collections.emptyMap();
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

    @Transactional(readOnly = true)
    public Map<String, Object> getAllHistory() {
        String entityType = "Port";
        List<InfrastructureHistory> list =
                historyRepository.findByRefTypeOrderByApprovedDateDesc(InfrastructureType.SEAPORT);
        Map<String, String> entityNames = new HashMap<>();
        for (InfrastructureHistory logItem : list) {
            if (logItem.getRefId() != null) {
                String refIdStr = logItem.getRefId().toString();
                if (!entityNames.containsKey(refIdStr)) {
                    try {
                        portRepository.findById(logItem.getRefId())
                                .ifPresent(p -> entityNames.put(refIdStr, p.getPortName()));
                    } catch (Exception e) { entityNames.put(refIdStr, refIdStr); }
                }
            }
        }
        return Map.of("entityType", entityType, "changeHistory", list, "entityNames", entityNames);
    }
}
