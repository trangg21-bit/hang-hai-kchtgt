package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.Pier;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.service.shared.PortNotificationService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Two-level approval service for Pier entity.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PierApprovalService {

    private final PierRepository pierRepository;
    private final InfrastructureApprovalService infrastructureApprovalService;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final PortNotificationService notificationService;

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

    /** T08: Cuc duyet vong 2 -- ho so tro thanh "Da duyet". */
    @Transactional
    public void approveC2(UUID id, String reason, UUID userId) {
        Pier entity = loadForApproval(id);
        infrastructureApprovalService.approveC2(entity, InfrastructureType.PIER,
                ApprovalStatus.APPROVED.name(), reason, userId);
        pierRepository.save(entity);
        notificationService.sendApprovalNotification("Pier", id.toString(), String.valueOf(userId), null);
    }

    /**
     * T07/T09: tu choi. Vong bi tu choi suy ra tu trang thai hien tai -- tranh
     * lech giua nut bam va du lieu.
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
     * @deprecated Uy quyen cu dung cho cac luong chua phan cap.
     */
    @Deprecated
    @Transactional
    public void reject(UUID id, String userId, String cap, String reason) {
        UUID uid = null;
        try { if (userId != null) uid = UUID.fromString(userId); } catch (Exception ignored) {}
        if ("CUC".equalsIgnoreCase(cap)) {
            infrastructureApprovalService.approveC2(loadForApproval(id), InfrastructureType.PIER,
                    ApprovalStatus.REJECTED.name(), reason, uid);
        } else {
            infrastructureApprovalService.approveC1(loadForApproval(id), InfrastructureType.PIER,
                    ApprovalStatus.REJECTED.name(), reason, uid);
        }
        pierRepository.save(loadForApproval(id));
    }

    /**
     * @deprecated Uy quyen cu. Dung {@link #approveC1} hoac {@link #approveC2}.
     */
    @Deprecated
    @Transactional
    public void approve(UUID id, String userId, String cap, String reason) {
        UUID uid = null;
        try { if (userId != null) uid = UUID.fromString(userId); } catch (Exception ignored) {}
        if ("CUC".equalsIgnoreCase(cap)) {
            approveC2(id, reason, uid);
        } else {
            approveC1(id, reason, uid);
        }
    }

    /**
     * Duyet vong dang mo cua ho so.
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
        // [TẠM TẮT GHI LỊCH SỬ] Bảng approval_logs đã bị V20260825162500 drop; user yêu cầu không ghi lịch sử phê duyệt
        // approvalLogRepository.save(approvalLogRecord);
        pierRepository.save(entity);
    }

    @Transactional
    public void reject(UUID id, String userId, String cap, String reason) {
        Pier entity = pierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + id));

        entity.setApprovalStatus(entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2
                ? ApprovalStatus.REJECTED_LEVEL2 : ApprovalStatus.REJECTED_LEVEL1);

        ApprovalLog approvalLog = ApprovalLog.builder()
                .entityType("Pier").entityId(id.toString()).decision("REJECTED").cap(cap)
                .reason(reason).decidedBy(userId).decidedAt(LocalDateTime.now()).build();
        // [TẠM TẮT GHI LỊCH SỬ] Bảng approval_logs đã bị V20260825162500 drop; user yêu cầu không ghi lịch sử phê duyệt
        // approvalLogRepository.save(approvalLog);
        pierRepository.save(entity);

        log.info("Pier [{}] rejected by {} at level {}: {}", id, userId, cap, reason);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getHistory(UUID id) {
        Pier entity = pierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + id));

        String entityId = id.toString();
        String entityType = "Pier";

        List<InfrastructureHistory> list =
                historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.PIER, id);

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
                    m.put("fieldName", h.getChangedField());
                    m.put("oldValue", h.getPreviousValue() != null ? h.getPreviousValue() : "");
                    m.put("newValue", h.getNewValue() != null ? h.getNewValue() : "");
                    m.put("changedBy", h.getApprovedBy() != null ? userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()) : "");
                    m.put("changedAt", h.getApprovedDate());
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
    public Map<String, Object> getAllHistory() {
        String entityType = "Pier";
        List<InfrastructureHistory> list =
                historyRepository.findByRefTypeOrderByApprovedDateDesc(InfrastructureType.PIER);
        Map<String, String> entityNames = new HashMap<>();
        for (InfrastructureHistory logItem : list) {
            if (logItem.getRefId() != null) {
                String refIdStr = logItem.getRefId().toString();
                if (!entityNames.containsKey(refIdStr)) {
                    try {
                        pierRepository.findById(logItem.getRefId())
                                .ifPresent(p -> entityNames.put(refIdStr, p.getPierName()));
                    } catch (Exception e) { entityNames.put(refIdStr, refIdStr); }
                }
            }
        }
        return Map.of("entityType", entityType, "changeHistory", list, "entityNames", entityNames);
    }
}
