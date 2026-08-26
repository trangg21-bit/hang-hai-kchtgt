package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.station.dto.history.StationHistoryResponse;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Truy vấn nhật ký nhà trạm (F-084 / F-090).
 * <p>
 * Đọc từ bảng nhật ký hợp nhất {@code infrastructure_history}. Bảng riêng
 * {@code station_history} đã bị gỡ ở migration V20260825162500.
 * </p>
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StationHistoryService {

    private final InfrastructureHistoryRepository historyRepo;
    private final UserRepository userRepository;

    /** Bí danh cũ của tên loại nhà trạm -> InfrastructureType. */
    private static final Map<String, InfrastructureType> TYPE_ALIASES = Map.ofEntries(
            Map.entry("PHAO", InfrastructureType.BUOY_STATION),
            Map.entry("BUOY_STATION", InfrastructureType.BUOY_STATION),
            Map.entry("NHA_TRAM_PHAO", InfrastructureType.BUOY_STATION),
            Map.entry("VTS", InfrastructureType.COASTAL_RADIO_STATION),
            Map.entry("COASTAL_VTS", InfrastructureType.COASTAL_RADIO_STATION),
            Map.entry("DAI_DUYEN_HAI", InfrastructureType.COASTAL_RADIO_STATION),
            Map.entry("INMARSAT", InfrastructureType.INMARSAT_STATION),
            Map.entry("COSPAS_SARSAT", InfrastructureType.COSPAS_SARSAT_STATION),
            Map.entry("COSPAS-SARSAT", InfrastructureType.COSPAS_SARSAT_STATION),
            Map.entry("LRIT", InfrastructureType.LRIT_STATION),
            Map.entry("HAIPHONG", InfrastructureType.HANOI_STATION));

    public Page<StationHistoryResponse> getHistory(String stationType, UUID entityId, Pageable pageable) {
        return getHistoryFiltered(stationType, entityId, null, null, null, null, pageable);
    }

    public Page<StationHistoryResponse> getHistoryFiltered(
            String stationType, UUID entityId,
            String actionType, UUID changedBy,
            LocalDateTime from, LocalDateTime to,
            Pageable pageable) {

        InfrastructureType refType = resolveType(stationType);
        InfrastructureHistoryStatus status = actionType != null ? toStatus(actionType) : null;
        ApprovalLevel level = actionType != null ? toLevel(actionType) : null;

        Specification<InfrastructureHistory> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (refType != null) {
                predicates.add(cb.equal(root.get("refType"), refType));
            }
            if (entityId != null) {
                predicates.add(cb.equal(root.get("refId"), entityId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (level != null) {
                predicates.add(cb.equal(root.get("approvalLevel"), level));
            }
            if (changedBy != null) {
                predicates.add(cb.equal(root.get("approvedBy"), changedBy));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("approvedDate"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("approvedDate"), to));
            }
            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<InfrastructureHistory> page = historyRepo.findAll(spec, pageable);
        Map<UUID, String> userNames = resolveUserNames(page.getContent().stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet()));

        return page.map(h -> toResponse(h, stationType, userNames));
    }

    private StationHistoryResponse toResponse(InfrastructureHistory h, String stationType,
                                              Map<UUID, String> userNames) {
        return StationHistoryResponse.builder()
                .id(h.getId())
                .stationType(stationType)
                .entityId(h.getRefId())
                .actionType(toActionType(h.getStatus(), h.getApprovalLevel()).name())
                .changedField(h.getChangedField())
                .previousValue(h.getPreviousValue())
                .newValue(h.getNewValue())
                .changedBy(h.getApprovedBy())
                .changedByName(h.getApprovedBy() == null
                        ? "Hệ thống"
                        : userNames.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString()))
                .changedAt(h.getApprovedDate())
                .reason(h.getReason())
                .build();
    }

    // --- Ánh xạ ---

    private InfrastructureType resolveType(String stationType) {
        if (stationType == null || stationType.isBlank()) {
            return null;
        }
        String key = stationType.trim().toUpperCase(Locale.ROOT);
        InfrastructureType alias = TYPE_ALIASES.get(key);
        if (alias != null) {
            return alias;
        }
        try {
            return InfrastructureType.valueOf(key);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Loại nhà trạm không hợp lệ: " + stationType);
        }
    }

    private InfrastructureHistoryStatus toStatus(String actionType) {
        return switch (actionType.trim().toUpperCase(Locale.ROOT)) {
            case "CREATE" -> InfrastructureHistoryStatus.CREATED;
            case "DELETE", "SOFT_DELETE" -> InfrastructureHistoryStatus.DELETED;
            case "REJECT" -> InfrastructureHistoryStatus.REJECTED;
            case "APPROVE_L1", "APPROVE_L2", "APPROVE" -> InfrastructureHistoryStatus.APPROVED;
            default -> InfrastructureHistoryStatus.UPDATED;
        };
    }

    /** Chỉ APPROVE_L1 / APPROVE_L2 mới cần lọc thêm theo vòng duyệt. */
    private ApprovalLevel toLevel(String actionType) {
        String key = actionType.trim().toUpperCase(Locale.ROOT);
        if ("APPROVE_L1".equals(key)) {
            return ApprovalLevel.LEVEL_1;
        }
        if ("APPROVE_L2".equals(key)) {
            return ApprovalLevel.LEVEL_2;
        }
        return null;
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
