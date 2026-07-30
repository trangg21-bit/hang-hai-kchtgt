package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.station.dto.history.StationHistoryResponse;
import com.hanghai.kchtg.station.entity.StationHistory;
import com.hanghai.kchtg.station.repository.StationHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service cho truy van StationHistory chia se (F-084 / F-090).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class StationHistoryService {

    private final StationHistoryRepository historyRepo;

    /**
     * Lay lich su phan trang cho mot entity cuc the.
     */
    public Page<StationHistoryResponse> getHistory(
            String stationType, UUID entityId, Pageable pageable) {
        return historyRepo.findByEntityIdAndStationType(entityId, stationType, pageable)
                .map(this::toResponse);
    }

    /**
     * Lay lich su co loc voi cac filter tuy chon.
     */
    public Page<StationHistoryResponse> getHistoryFiltered(
            String stationType, UUID entityId,
            String actionType,
            Long changedBy, LocalDateTime from, LocalDateTime to,
            Pageable pageable) {
        if (entityId != null) {
            if (actionType != null && from != null && to != null) {
                Page<StationHistory> result = historyRepo
                        .findByEntityIdAndStationTypeAndActionType(entityId, stationType, actionType, pageable);
                return result.map(this::toResponse);
            }
            if (from != null && to != null) {
                return historyRepo.findByDateRange(entityId, stationType, from, to, pageable)
                        .map(this::toResponse);
            }
            if (actionType != null) {
                return historyRepo.findByEntityIdAndStationTypeAndActionType(
                        entityId, stationType, actionType, pageable)
                        .map(this::toResponse);
            }
            return historyRepo.findByEntityIdAndStationType(entityId, stationType, pageable)
                    .map(this::toResponse);
        } else {
            if (actionType != null && from != null && to != null) {
                Page<StationHistory> result = historyRepo
                        .findByStationTypeAndActionType(stationType, actionType, pageable);
                return result.map(this::toResponse);
            }
            if (from != null && to != null) {
                return historyRepo.findByStationTypeAndDateRange(stationType, from, to, pageable)
                        .map(this::toResponse);
            }
            if (actionType != null) {
                return historyRepo.findByStationTypeAndActionType(
                        stationType, actionType, pageable)
                        .map(this::toResponse);
            }
            return historyRepo.findByStationType(stationType, pageable)
                    .map(this::toResponse);
        }
    }

    private StationHistoryResponse toResponse(StationHistory entity) {
        String userName = "He thong";
        if (entity.getChangedBy() != null) {
            if (entity.getChangedBy() == 1L) {
                userName = "Quan tri vien (Super Admin)";
            } else if (entity.getChangedBy() == 2L) {
                userName = "Nhan vien van hanh";
            } else {
                userName = "Người dùng #" + entity.getChangedBy();
            }
        }
        return StationHistoryResponse.builder()
                .id(entity.getId())
                .stationType(entity.getStationType())
                .entityId(entity.getEntityId())
                .actionType(entity.getActionType())
                .changedField(entity.getChangedField())
                .previousValue(entity.getPreviousValue())
                .newValue(entity.getNewValue())
                .changedBy(entity.getChangedBy())
                .changedByName(userName)
                .changedAt(entity.getChangedAt())
                .reason(entity.getReason())
                .diffData(entity.getDiffData())
                .build();
    }
}
