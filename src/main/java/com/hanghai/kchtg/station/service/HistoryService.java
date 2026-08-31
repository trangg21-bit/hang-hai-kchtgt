package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.station.dto.coastal.CoastalStationVTSHistoryResponse;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Nhật ký thay đổi / phê duyệt dùng chung cho họ nhà trạm & đài duyên hải.
 * <p>
 * Ghi thẳng vào bảng {@code infrastructure_history} — bảng nhật ký hợp nhất của
 * toàn hệ thống (xem migration V20260825162500). Trước đây service này lưu
 * in-memory nên nhật ký mất sau mỗi lần khởi động lại và dùng chung một store
 * cho mọi loại đài.
 * </p>
 */
@Service
@RequiredArgsConstructor
public class HistoryService {

    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;

    @Transactional
    public void recordHistory(InfrastructureType refType, UUID refId,
                              StationHistoryActionType action,
                              String changedField,
                              String previousValue, String newValue,
                              String reason,
                              UUID changedBy) {
        if (refType == null || refId == null) {
            return;
        }
        historyRepository.save(InfrastructureHistory.builder()
                .refId(refId)
                .refType(refType)
                .approvalLevel(toApprovalLevel(action))
                .status(toStatus(action))
                .approvedBy(changedBy)
                .approvedDate(LocalDateTime.now())
                .changedField(changedField)
                .previousValue(previousValue)
                .newValue(newValue)
                .reason(reason)
                .build());
    }

    @Transactional
    public void recordHistory(InfrastructureType refType, UUID refId,
                              StationHistoryActionType action,
                              String previousValue, String newValue,
                              UUID changedBy) {
        recordHistory(refType, refId, action, null, previousValue, newValue, null, changedBy);
    }

    @Transactional(readOnly = true)
    public List<CoastalStationVTSHistoryResponse> getHistory(InfrastructureType refType, UUID refId,
                                                             String stationCode) {
        if (refType == null || refId == null) {
            return List.of();
        }
        List<InfrastructureHistory> rows =
                historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(refType, refId);

        Map<UUID, String> userNames = resolveUserNames(rows.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet()));

        return rows.stream().map(h -> {
            CoastalStationVTSHistoryResponse entry = new CoastalStationVTSHistoryResponse();
            entry.setId(h.getId());
            entry.setStationCode(stationCode);
            entry.setActionType(toActionType(h.getStatus(), h.getApprovalLevel()));
            entry.setChangedField(h.getChangedField());
            entry.setPreviousValue(h.getPreviousValue());
            entry.setNewValue(h.getNewValue());
            entry.setReason(h.getReason());
            entry.setApprovalLevel(h.getApprovalLevel() != null ? h.getApprovalLevel().name() : null);
            entry.setChangedBy(h.getApprovedBy() == null
                    ? "Hệ thống"
                    : userNames.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()));
            entry.setChangedAt(h.getApprovedDate());
            return entry;
        }).toList();
    }

    // --- Ánh xạ enum ------------------------------------------------------

    private InfrastructureHistoryStatus toStatus(StationHistoryActionType action) {
        if (action == null) {
            return InfrastructureHistoryStatus.UPDATED;
        }
        return switch (action) {
            case CREATE -> InfrastructureHistoryStatus.CREATED;
            case UPDATE -> InfrastructureHistoryStatus.UPDATED;
            case DELETE -> InfrastructureHistoryStatus.DELETED;
            case APPROVE_L1, APPROVE_L2 -> InfrastructureHistoryStatus.APPROVED;
            case REJECT -> InfrastructureHistoryStatus.REJECTED;
        };
    }

    private ApprovalLevel toApprovalLevel(StationHistoryActionType action) {
        if (action == StationHistoryActionType.APPROVE_L1) {
            return ApprovalLevel.LEVEL_1;
        }
        if (action == StationHistoryActionType.APPROVE_L2) {
            return ApprovalLevel.LEVEL_2;
        }
        return ApprovalLevel.LEVEL_0;
    }

    private StationHistoryActionType toActionType(InfrastructureHistoryStatus status, ApprovalLevel level) {
        if (status == null) {
            return StationHistoryActionType.UPDATE;
        }
        return switch (status) {
            case CREATED, DRAFT_SAVED -> StationHistoryActionType.CREATE;
            case DELETED -> StationHistoryActionType.DELETE;
            case REJECTED -> StationHistoryActionType.REJECT;
            case APPROVED -> level == ApprovalLevel.LEVEL_2
                    ? StationHistoryActionType.APPROVE_L2
                    : StationHistoryActionType.APPROVE_L1;
            default -> StationHistoryActionType.UPDATE;
        };
    }

    private Map<UUID, String> resolveUserNames(Collection<UUID> userIds) {
        if (userIds == null || userIds.isEmpty()) {
            return Collections.emptyMap();
        }
        Set<UUID> ids = userIds.stream().filter(Objects::nonNull).collect(Collectors.toSet());
        if (ids.isEmpty()) {
            return Collections.emptyMap();
        }
        Map<UUID, String> names = new HashMap<>();
        for (User u : userRepository.findAllByIdInWithOrgUnit(ids)) {
            String label = (u.getFullName() != null && !u.getFullName().trim().isEmpty())
                    ? u.getFullName()
                    : u.getUsername();
            names.put(u.getId(), label);
        }
        return names;
    }
}
