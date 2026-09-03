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

import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.ArrayList;
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

    @Transactional
    public void recordDeltaChanges(
            InfrastructureType refType,
            UUID refId,
            Map<String, String> oldValues,
            java.util.function.Function<String, String> newValueResolver,
            UUID changedBy) {
        if (refType == null || refId == null || oldValues == null || oldValues.isEmpty()) {
            return;
        }
        for (Map.Entry<String, String> entry : oldValues.entrySet()) {
            String fieldName = entry.getKey();
            String oldVal = entry.getValue() != null && !entry.getValue().isBlank() ? entry.getValue() : "—";
            String newVal = newValueResolver != null ? newValueResolver.apply(fieldName) : "—";
            if (newVal == null || newVal.isBlank()) newVal = "—";

            recordHistory(
                    refType,
                    refId,
                    StationHistoryActionType.UPDATE,
                    fieldName,
                    oldVal,
                    newVal,
                    "Cập nhật " + fieldName,
                    changedBy);
        }
    }

    /**
     * Bỏ dấu từ khóa, KHÔNG bọc `%`. Truy vấn nhật ký tự nối `%` bằng CONCAT nên
     * bọc sẵn ở đây sẽ thành `%%tu khoa%%` và khớp sai.
     */
    private static String normalizeHistoryKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return null;
        }
        return java.text.Normalizer
                .normalize(keyword.trim().toLowerCase(java.util.Locale.ROOT), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
    }

    @Transactional(readOnly = true)
    public List<CoastalStationVTSHistoryResponse> getHistory(InfrastructureType refType, UUID refId,
                                                             String stationCode) {
        return getHistory(refType, refId, stationCode, null, null, null, null, null, null);
    }

    /**
     * Nhật ký thay đổi của một đài, lọc và phân trang Ở SERVER.
     *
     * `excludedStatuses` và cặp mẫu câu "nhiễu" cho phép caller loại các dòng của
     * quy trình phê duyệt ngay trong truy vấn — cần thiết để biên trang chính xác,
     * vì lọc bằng Java sau khi đã cắt trang sẽ làm trang bị hụt.
     */
    @Transactional(readOnly = true)
    public List<CoastalStationVTSHistoryResponse> getHistory(
            InfrastructureType refType, UUID refId, String stationCode,
            java.util.Collection<InfrastructureHistoryStatus> excludedStatuses,
            String[] noisePatterns,
            String keyword,
            java.time.LocalDateTime fromDate,
            java.time.LocalDateTime toDate,
            org.springframework.data.domain.Pageable pageable) {
        if (refType == null || refId == null) {
            return List.of();
        }
        Specification<InfrastructureHistory> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("refType"), refType));
            predicates.add(cb.equal(root.get("refId"), refId));

            if (excludedStatuses != null && !excludedStatuses.isEmpty()) {
                predicates.add(root.get("status").in(excludedStatuses).not());
            }

            if (fromDate != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("approvedDate"), fromDate));
            }
            if (toDate != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("approvedDate"), toDate));
            }

            String kw = normalizeHistoryKeyword(keyword);
            if (kw != null && !kw.isBlank()) {
                String pattern = "%" + kw.toLowerCase() + "%";
                Expression<String> cf = cb.function("immutable_unaccent", String.class, cb.lower(cb.coalesce(root.get("changedField"), "")));
                Expression<String> pv = cb.function("immutable_unaccent", String.class, cb.lower(cb.coalesce(root.get("previousValue"), "")));
                Expression<String> nv = cb.function("immutable_unaccent", String.class, cb.lower(cb.coalesce(root.get("newValue"), "")));
                Expression<String> rz = cb.function("immutable_unaccent", String.class, cb.lower(cb.coalesce(root.get("reason"), "")));

                predicates.add(cb.or(
                        cb.like(cf, pattern),
                        cb.like(pv, pattern),
                        cb.like(nv, pattern),
                        cb.like(rz, pattern)
                ));
            }

            query.orderBy(cb.desc(root.get("approvedDate")));
            return cb.and(predicates.toArray(new Predicate[0]));
        };

        List<InfrastructureHistory> rows;
        if (pageable != null && pageable.isPaged()) {
            rows = historyRepository.findAll(spec, pageable).getContent();
        } else {
            rows = historyRepository.findAll(spec, Sort.by(Sort.Direction.DESC, "approvedDate"));
        }

        if (noisePatterns != null && noisePatterns.length > 1) {
            String genericField = noisePatterns[0];
            rows = rows.stream().filter(h -> {
                String field = h.getChangedField();
                if (field == null || (genericField != null && field.equals(genericField))) {
                    String val = h.getNewValue();
                    if (val != null) {
                        for (int i = 1; i < noisePatterns.length; i++) {
                            if (noisePatterns[i] != null && !noisePatterns[i].isBlank() && val.contains(noisePatterns[i])) {
                                return false;
                            }
                        }
                    }
                }
                return true;
            }).toList();
        }

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
