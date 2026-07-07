package com.hanghai.kchtg.beacon.service;

import com.hanghai.kchtg.beacon.dto.history.BeaconHistoryResponse;
import com.hanghai.kchtg.beacon.entity.BeaconHistory;
import com.hanghai.kchtg.beacon.entity.BeaconHistoryActionType;
import com.hanghai.kchtg.beacon.entity.BeaconType;
import com.hanghai.kchtg.beacon.repository.BeaconHistoryRepository;
import com.hanghai.kchtg.beacon.repository.BeaconLightRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
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
    private final BeaconLightRepository beaconLightRepo;
    private final BuoyRepository buoyRepo;

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
            BeaconType beaconType, UUID entityId, String entityCode,
            BeaconHistoryActionType actionType,
            Long changedBy, LocalDateTime from, LocalDateTime to,
            Pageable pageable) {
        
        java.util.List<UUID> entityIds = null;
        boolean hasEntityIds = false;

        if (entityId != null) {
            entityIds = java.util.List.of(entityId);
            hasEntityIds = true;
        } else if (entityCode != null && !entityCode.trim().isEmpty()) {
            String cleanCode = entityCode.trim();
            if (beaconType == BeaconType.BEACON_LIGHT) {
                entityIds = beaconLightRepo.findByCodeContainingIgnoreCase(cleanCode).stream()
                        .map(com.hanghai.kchtg.beacon.entity.BeaconLight::getId)
                        .toList();
            } else {
                entityIds = buoyRepo.findByCodeContainingIgnoreCase(cleanCode).stream()
                        .map(com.hanghai.kchtg.beacon.entity.Buoy::getId)
                        .toList();
            }
            if (entityIds.isEmpty()) {
                return Page.empty();
            }
            hasEntityIds = true;
        }

        return historyRepo.searchHistory(beaconType, entityIds, hasEntityIds, actionType, from, to, pageable)
                .map(this::toResponse);
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
