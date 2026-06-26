package com.hanghai.kchtg.nhatram.service;

import com.hanghai.kchtg.nhatram.dto.history.NhaTramHistoryResponse;
import com.hanghai.kchtg.nhatram.entity.NhaTramHistory;
import com.hanghai.kchtg.nhatram.entity.NhaTramHistoryActionType;
import com.hanghai.kchtg.nhatram.entity.NhaTramType;
import com.hanghai.kchtg.nhatram.repository.NhaTramHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Service cho truy van NhaTramHistory chia se (F-084 / F-090).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NhaTramHistoryService {

    private final NhaTramHistoryRepository historyRepo;

    /**
     * Lay lich su phan trang cho mot entity cuc the.
     */
    public Page<NhaTramHistoryResponse> getHistory(
            NhaTramType tramType, UUID entityId, Pageable pageable) {
        return historyRepo.findByEntityIdAndTramType(entityId, tramType, pageable)
                .map(this::toResponse);
    }

    /**
     * Lay lich su co loc voi cac filter tuy chon.
     */
    public Page<NhaTramHistoryResponse> getHistoryFiltered(
            NhaTramType tramType, UUID entityId,
            NhaTramHistoryActionType actionType,
            Long changedBy, LocalDateTime from, LocalDateTime to,
            Pageable pageable) {
        if (entityId != null) {
            // Priorit: actionType + date range, date range, sau do co ban
            if (actionType != null && from != null && to != null) {
                // Combined filter khong available trong 1 query, chon actionType + date
                Page<NhaTramHistory> result = historyRepo
                        .findByEntityIdAndTramTypeAndActionType(entityId, tramType, actionType, pageable);
                return result.map(this::toResponse);
            }
            if (from != null && to != null) {
                return historyRepo.findByDateRange(entityId, tramType, from, to, pageable)
                        .map(this::toResponse);
            }
            if (actionType != null) {
                return historyRepo.findByEntityIdAndTramTypeAndActionType(
                        entityId, tramType, actionType, pageable)
                        .map(this::toResponse);
            }
            return historyRepo.findByEntityIdAndTramType(entityId, tramType, pageable)
                    .map(this::toResponse);
        } else {
            // entityId = null: query tat ca history cua tramType nay
            if (actionType != null && from != null && to != null) {
                Page<NhaTramHistory> result = historyRepo
                        .findByTramTypeAndActionType(tramType, actionType, pageable);
                return result.map(this::toResponse);
            }
            if (from != null && to != null) {
                return historyRepo.findByTramTypeAndDateRange(tramType, from, to, pageable)
                        .map(this::toResponse);
            }
            if (actionType != null) {
                return historyRepo.findByTramTypeAndActionType(
                        tramType, actionType, pageable)
                        .map(this::toResponse);
            }
            return historyRepo.findByTramType(tramType, pageable)
                    .map(this::toResponse);
        }
    }

    private NhaTramHistoryResponse toResponse(NhaTramHistory entity) {
        String userName = "He thong";
        if (entity.getChangedBy() != null) {
            if (entity.getChangedBy() == 1L) {
                userName = "Quan tri vien (Super Admin)";
            } else if (entity.getChangedBy() == 2L) {
                userName = "Nhan vien van hanh";
            } else {
                userName = "Nguoi dung #" + entity.getChangedBy();
            }
        }
        return NhaTramHistoryResponse.builder()
                .id(entity.getId())
                .tramType(entity.getTramType())
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
