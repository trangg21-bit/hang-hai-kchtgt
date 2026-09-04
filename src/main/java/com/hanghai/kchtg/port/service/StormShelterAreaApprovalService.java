package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.dto.buoyberth.HistoryEntry;
import com.hanghai.kchtg.port.entity.StormShelterArea;
import com.hanghai.kchtg.port.repository.StormShelterAreaRepository;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.security.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Two-level approval service for StormShelterArea entity.
 * Level 1: CANG_VU (Port Authority) — DRAFT/PENDING → PORT_AUTHORITY (APPROVED_LEVEL1)
 * Level 2: CUC (Department) — PORT_AUTHORITY → APPROVED
 * Reject at any level → REJECTED
 * <p>
 * Lịch sử thay đổi ghi vào bảng tập trung {@code infrastructure_history}
 * (refType = STORM_SHELTER_AREA) — cùng cấu trúc ghi/đọc với Bến phao (BuoyBerthApprovalService).
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StormShelterAreaApprovalService {

    private final StormShelterAreaRepository stormShelterAreaRepository;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserResolverService userResolverService;

    @Transactional
    public void approve(UUID id, String userId, String cap, String content) {
        StormShelterArea entity = stormShelterAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu tránh, trú bão với id: " + id));

        String prevLabel = approvalLabel(entity.getApprovalStatus());
        if ("CANG_VU".equals(cap)) {
            if (entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL1) {
                throw new IllegalStateException("Không thể phê duyệt cấp Chi cục: trạng thái hiện tại không hợp lệ");
            }
            entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL2);
            entity.setPortAuthorityApprovedAt(LocalDateTime.now());
            entity.setPortAuthorityApprovedBy(userId);
            entity.setRejectionReason(null);
            if (content != null && !content.isBlank()) {
                entity.setPortAuthorityApprovalContent(content.trim());
            }
        } else if ("CUC".equals(cap)) {
            if (entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL2) {
                throw new IllegalStateException("Không thể phê duyệt cấp Cục: cần phê duyệt cấp Chi cục trước");
            }
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setDepartmentApprovedAt(LocalDateTime.now());
            entity.setDepartmentApprovedBy(userId);
            if (content != null && !content.isBlank()) {
                entity.setDepartmentApprovalContent(content.trim());
            }
        } else {
            throw new IllegalArgumentException("Cấp phê duyệt không hợp lệ: " + cap);
        }

        stormShelterAreaRepository.save(entity);

        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.STORM_SHELTER_AREA)
                .approvalLevel("CANG_VU".equals(cap) ? ApprovalLevel.LEVEL_1 : ApprovalLevel.LEVEL_2)
                .status(InfrastructureHistoryStatus.APPROVED)
                .approvedBy(SecurityUtils.getCurrentUserId())
                .reason("CANG_VU".equals(cap) ? "Phê duyệt cấp Cảng vụ" : "Phê duyệt cấp Cục")
                .changedField("Trạng thái phê duyệt")
                .previousValue("Trạng thái phê duyệt=" + prevLabel)
                .newValue("Trạng thái phê duyệt=" + approvalLabel(entity.getApprovalStatus()))
                .build());

        log.info("StormShelterArea [{}] approved by {} at level {}", id, userId, cap);
    }

    @Transactional
    public void reject(UUID id, String userId, String cap, String reason) {
        StormShelterArea entity = stormShelterAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu tránh, trú bão với id: " + id));

        String prevLabel = approvalLabel(entity.getApprovalStatus());
        entity.setApprovalStatus(entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2
                ? ApprovalStatus.REJECTED_LEVEL2 : ApprovalStatus.REJECTED_LEVEL1);
        entity.setRejectionReason(reason);

        stormShelterAreaRepository.save(entity);

        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.STORM_SHELTER_AREA)
                .approvalLevel("CANG_VU".equals(cap) ? ApprovalLevel.LEVEL_1 : ApprovalLevel.LEVEL_2)
                .status(InfrastructureHistoryStatus.REJECTED)
                .approvedBy(SecurityUtils.getCurrentUserId())
                .reason(("CANG_VU".equals(cap) ? "Từ chối cấp Cảng vụ" : "Từ chối cấp Cục")
                        + (reason != null && !reason.isBlank() ? ": " + reason.trim() : ""))
                .changedField("Trạng thái phê duyệt")
                .previousValue("Trạng thái phê duyệt=" + prevLabel)
                .newValue("Trạng thái phê duyệt=" + approvalLabel(entity.getApprovalStatus()))
                .build());

        log.info("StormShelterArea [{}] rejected by {} at level {}: {}", id, userId, cap, reason);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHistory(UUID id) {
        StormShelterArea entity = stormShelterAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu tránh, trú bão với id: " + id));

        List<InfrastructureHistory> records = historyRepository
                .findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.STORM_SHELTER_AREA, id);

        java.util.Map<String, Object> result = new java.util.HashMap<>();
        result.put("entityId", id.toString());
        result.put("entityType", "StormShelterArea");
        result.put("currentApprovalStatus", entity.getApprovalStatus());
        result.put("changeHistory", records.stream().map(this::toHistoryEntry).collect(Collectors.toList()));
        result.put("entityNames", new java.util.HashMap<String, String>());
        return result;
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getAllHistory() {
        List<InfrastructureHistory> records = historyRepository
                .findByRefTypeOrderByApprovedDateDesc(InfrastructureType.STORM_SHELTER_AREA);
        java.util.Map<String, String> entityNames = new java.util.HashMap<>();
        for (InfrastructureHistory h : records) {
            if (h.getRefId() != null && !entityNames.containsKey(h.getRefId().toString())) {
                stormShelterAreaRepository.findById(h.getRefId())
                        .ifPresent(a -> entityNames.put(a.getId().toString(), a.getStormShelterName()));
            }
        }
        return java.util.Map.of(
                "entityType", "StormShelterArea",
                "changeHistory", records.stream().map(this::toHistoryEntry).collect(Collectors.toList()),
                "entityNames", entityNames);
    }

    private HistoryEntry toHistoryEntry(InfrastructureHistory h) {
        return HistoryEntry.builder()
                .id(h.getId())
                .approvalLevel(h.getApprovalLevel())
                .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                .approvedBy(h.getApprovedBy() != null ? userResolverService.resolveName(h.getApprovedBy()) : null)
                .approvedDate(h.getApprovedDate())
                .reason(h.getReason())
                .changedField(h.getChangedField())
                .previousValue(h.getPreviousValue())
                .newValue(h.getNewValue())
                .build();
    }

    private static String approvalLabel(ApprovalStatus st) {
        if (st == null) return "";
        return switch (st) {
            case APPROVED_LEVEL1 -> "Chờ phê duyệt cấp Cảng vụ/Chi cục";
            case APPROVED_LEVEL2 -> "Chờ phê duyệt cấp cục";
            case APPROVED -> "Đã phê duyệt";
            case REJECTED_LEVEL1 -> "Từ chối cấp Cảng vụ/Chi cục";
            case REJECTED_LEVEL2 -> "Từ chối cấp cục";
            case DRAFT -> "Lưu tạm";
            default -> st.getLabel();
        };
    }
}
