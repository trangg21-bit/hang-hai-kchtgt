package com.hanghai.kchtg.tai.service;

import com.hanghai.kchtg.tai.dto.history.TaiHistoryResponse;
import com.hanghai.kchtg.tai.entity.TaiHistory;
import com.hanghai.kchtg.tai.entity.TaiHistoryActionType;
import com.hanghai.kchtg.tai.entity.TaiType;
import com.hanghai.kchtg.tai.repository.TaiHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

/**
 * Service cho truy van TaiHistory chia se (M-015).
 * Pattern tu NhaTramHistoryService (M-014).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TaiHistoryService {

    private final TaiHistoryRepository historyRepo;

    /**
     * Lay lich su phan trang cho mot entity cuc the.
     */
    public Page<TaiHistoryResponse> getHistory(
            UUID entityId, TaiType taiType, Pageable pageable) {
        return historyRepo.findByEntityIdAndTaiType(entityId, taiType, pageable)
                .map(this::toResponse);
    }

    /**
     * Lay lich su co loc theo taiType va action.
     */
    public Page<TaiHistoryResponse> findAllHistory(Pageable pageable) {
        return historyRepo.findAll(pageable)
                .map(this::toResponse);
    }

    /**
     * Loc lich su theo taiType.
     */
    public Page<TaiHistoryResponse> findHistoryByType(TaiType taiType, Pageable pageable) {
        return historyRepo.findByTaiType(taiType, pageable)
                .map(this::toResponse);
    }

    /**
     * Loc lich su theo actionType.
     */
    public Page<TaiHistoryResponse> findHistoryByAction(TaiHistoryActionType actionType, Pageable pageable) {
        java.util.List<TaiHistoryResponse> list = historyRepo.findAll().stream()
                .filter(e -> e.getActionType() == actionType)
                .sorted((a, b) -> b.getChangedAt().compareTo(a.getChangedAt()))
                .skip(pageable.getOffset())
                .limit(pageable.getPageSize())
                .map(this::toResponse)
                .collect(java.util.stream.Collectors.toList());

        long total = historyRepo.findAll().stream()
                .filter(e -> e.getActionType() == actionType)
                .count();

        return new org.springframework.data.domain.PageImpl<>(list, pageable, total);
    }

    /**
     * Loc lich su theo entity + action.
     */
    public Page<TaiHistoryResponse> getHistoryFiltered(
            UUID entityId, TaiType taiType,
            TaiHistoryActionType actionType, Instant from, Instant to,
            Pageable pageable) {
        if (entityId != null) {
            if (actionType != null) {
                return historyRepo.findByEntityIdAndTaiTypeAndActionType(
                        entityId, taiType, actionType, pageable)
                        .map(this::toResponse);
            }
            return historyRepo.findByEntityIdAndTaiType(entityId, taiType, pageable)
                    .map(this::toResponse);
        } else {
            if (actionType != null) {
                return historyRepo.findByTaiTypeAndActionType(
                        taiType, actionType, pageable)
                        .map(this::toResponse);
            }
            return historyRepo.findByTaiType(taiType, pageable)
                    .map(this::toResponse);
        }
    }

    private TaiHistoryResponse toResponse(TaiHistory entity) {
        String userName = "He thong";
        if (entity.getChangedBy() != null) {
            userName = "Quan tri vien #" + entity.getChangedBy();
        }
        return TaiHistoryResponse.builder()
                .id(entity.getId())
                .entityName(entity.getEntityName())
                .taiType(entity.getTaiType())
                .entityId(entity.getEntityId())
                .actionType(entity.getActionType())
                .changedField(entity.getChangedField())
                .previousValue(entity.getPreviousValue())
                .newValue(entity.getNewValue())
                .changedBy(entity.getChangedBy())
                .changedByName(userName)
                .changedAt(entity.getChangedAt())
                .reason(entity.getReason())
                .build();
    }
}
