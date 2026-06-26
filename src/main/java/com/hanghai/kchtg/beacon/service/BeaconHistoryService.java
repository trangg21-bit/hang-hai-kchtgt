package com.hanghai.kchtg.beacon.service;

import com.hanghai.kchtg.beacon.dto.history.BeaconHistoryResponse;
import com.hanghai.kchtg.beacon.entity.BeaconHistory;
import com.hanghai.kchtg.beacon.entity.BeaconHistoryActionType;
import com.hanghai.kchtg.beacon.entity.BeaconType;
import com.hanghai.kchtg.beacon.repository.BeaconHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service for shared BeaconHistory queries (F-073 / F-079).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BeaconHistoryService {

    private final BeaconHistoryRepository historyRepo;

    /**
     * Get paginated history for a specific entity.
     */
    public Page<BeaconHistoryResponse> getHistory(
            BeaconType beaconType, UUID entityId, Pageable pageable) {
        return historyRepo.findByEntityIdAndBeaconType(entityId, beaconType, pageable)
                .map(this::toResponse);
    }

    /**
     * Get filtered history with optional filters.
     */
    public Page<BeaconHistoryResponse> getHistoryFiltered(
            BeaconType beaconType, UUID entityId,
            BeaconHistoryActionType actionType,
            Long changedBy, LocalDateTime from, LocalDateTime to,
            Pageable pageable) {
        if (entityId != null) {
            // Priority: actionType + date range, then date range, then basic
            if (actionType != null && from != null && to != null) {
                // Combined filter not available in single query, fall back to actionType + date
                Page<BeaconHistory> result = historyRepo
                        .findByEntityIdAndBeaconTypeAndActionType(entityId, beaconType, actionType, pageable);
                return result.map(this::toResponse);
            }
            if (from != null && to != null) {
                return historyRepo.findByDateRange(entityId, beaconType, from, to, pageable)
                        .map(this::toResponse);
            }
            if (actionType != null) {
                return historyRepo.findByEntityIdAndBeaconTypeAndActionType(
                        entityId, beaconType, actionType, pageable)
                        .map(this::toResponse);
            }
            return historyRepo.findByEntityIdAndBeaconType(entityId, beaconType, pageable)
                    .map(this::toResponse);
        } else {
            // entityId is null: query all history of this beaconType
            if (actionType != null && from != null && to != null) {
                Page<BeaconHistory> result = historyRepo
                        .findByBeaconTypeAndActionType(beaconType, actionType, pageable);
                return result.map(this::toResponse);
            }
            if (from != null && to != null) {
                return historyRepo.findByBeaconTypeAndDateRange(beaconType, from, to, pageable)
                        .map(this::toResponse);
            }
            if (actionType != null) {
                return historyRepo.findByBeaconTypeAndActionType(
                        beaconType, actionType, pageable)
                        .map(this::toResponse);
            }
            return historyRepo.findByBeaconType(beaconType, pageable)
                    .map(this::toResponse);
        }
    }

    private BeaconHistoryResponse toResponse(BeaconHistory entity) {
        String userName = "Hệ thống";
        if (entity.getChangedBy() != null) {
            if (entity.getChangedBy() == 1L) {
                userName = "Quản trị viên (Super Admin)";
            } else if (entity.getChangedBy() == 2L) {
                userName = "Nhân viên vận hành";
            } else {
                userName = "Người dùng #" + entity.getChangedBy();
            }
        }
        return BeaconHistoryResponse.builder()
                .id(entity.getId())
                .beaconType(entity.getBeaconType())
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
