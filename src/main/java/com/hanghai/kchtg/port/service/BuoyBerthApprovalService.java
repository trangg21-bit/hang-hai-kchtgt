package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.dto.buoyberth.HistoryEntry;
import com.hanghai.kchtg.port.entity.BuoyBerth;
import com.hanghai.kchtg.port.repository.BuoyBerthRepository;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.security.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Two-level approval service for BuoyBerth entity.
 * Level 1: CANG_VU (Port Authority) — PENDING_APPROVAL -> APPROVED_LEVEL1
 * Level 2: CUC (Department) — APPROVED_LEVEL1 -> APPROVED
 * Reject at level 1 -> REJECTED_LEVEL1, reject at level 2 -> REJECTED_LEVEL2
 * <p>
 * Lịch sử thay đổi ghi vào bảng tập trung {@code infrastructure_history}
 * (refType = BUOY_BERTH) — cùng cấu trúc ghi/đọc với Hệ thống VTS CHK.
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BuoyBerthApprovalService {

    private final BuoyBerthRepository buoyBerthRepository;
    private final InfrastructureApprovalService infrastructureApprovalService;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserResolverService userResolverService;

    private BuoyBerth loadForApproval(UUID id) {
        return buoyBerthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến phao với id: " + id));
    }

    /** Gửi duyệt hồ sơ (T02/T03). */
    @Transactional
    public void submit(UUID id, UUID userId) {
        BuoyBerth entity = loadForApproval(id);
        infrastructureApprovalService.submit(entity, InfrastructureType.BUOY_BERTH, userId);
        entity.setUpdatedAt(LocalDateTime.now());
        if (userId != null) entity.setUpdatedBy(userId);
        buoyBerthRepository.saveAndFlush(entity);
        log.info("BuoyBerth [{}] submitted for approval by {}", id, userId);
    }

    /** Cảng vụ / Chi cục duyệt Vòng 1 (T06). */
    @Transactional
    public void approveC1(UUID id, String reason, UUID userId) {
        BuoyBerth entity = loadForApproval(id);
        infrastructureApprovalService.approveC1(entity, InfrastructureType.BUOY_BERTH,
                ApprovalStatus.APPROVED.name(), reason, userId);
        entity.setUpdatedAt(LocalDateTime.now());
        if (userId != null) entity.setUpdatedBy(userId);
        buoyBerthRepository.saveAndFlush(entity);
        log.info("BuoyBerth [{}] approved C1 by {}", id, userId);
    }

    /** Cục duyệt Vòng 2 (T08). */
    @Transactional
    public void approveC2(UUID id, String reason, UUID userId) {
        BuoyBerth entity = loadForApproval(id);
        infrastructureApprovalService.approveC2(entity, InfrastructureType.BUOY_BERTH,
                ApprovalStatus.APPROVED.name(), reason, userId);
        entity.setUpdatedAt(LocalDateTime.now());
        if (userId != null) entity.setUpdatedBy(userId);
        buoyBerthRepository.saveAndFlush(entity);
        log.info("BuoyBerth [{}] approved C2 by {}", id, userId);
    }

    /** Từ chối phê duyệt (T07/T09). */
    @Transactional
    public void reject(UUID id, String reason, UUID userId) {
        BuoyBerth entity = loadForApproval(id);
        boolean isC2 = entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1;
        if (isC2) {
            infrastructureApprovalService.approveC2(entity, InfrastructureType.BUOY_BERTH,
                    ApprovalStatus.REJECTED.name(), reason, userId);
        } else {
            infrastructureApprovalService.approveC1(entity, InfrastructureType.BUOY_BERTH,
                    ApprovalStatus.REJECTED.name(), reason, userId);
        }
        entity.setUpdatedAt(LocalDateTime.now());
        if (userId != null) entity.setUpdatedBy(userId);
        buoyBerthRepository.saveAndFlush(entity);
        log.info("BuoyBerth [{}] rejected by {}: {}", id, userId, reason);
    }

    @Transactional
    public void approve(UUID id, String userId, String cap, String content) {
        UUID uid = null;
        try { if (userId != null) uid = UUID.fromString(userId); } catch (Exception ignored) {}
        if (uid == null) uid = SecurityUtils.getCurrentUserId();
        if ("CUC".equalsIgnoreCase(cap)) {
            approveC2(id, content, uid);
        } else {
            approveC1(id, content, uid);
        }
    }

    @Transactional
    public void reject(UUID id, String userId, String cap, String reason) {
        UUID uid = null;
        try { if (userId != null) uid = UUID.fromString(userId); } catch (Exception ignored) {}
        if (uid == null) uid = SecurityUtils.getCurrentUserId();
        reject(id, reason, uid);
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id) {
        return getHistory(id, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID id, Integer page, Integer pageSize,
                                         String keyword, LocalDateTime fromDate, LocalDateTime toDate) {
        buoyBerthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến phao với id: " + id));

        List<InfrastructureHistory> list;
        if (page != null && pageSize != null && pageSize > 0) {
            Pageable pageable = PageRequest.of(page, pageSize);
            String normalizedKeyword = normalizeSearchKeyword(keyword);
            if (normalizedKeyword == null && fromDate == null && toDate == null) {
                list = historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                        InfrastructureType.BUOY_BERTH, id, pageable);
            } else {
                list = historyRepository.searchHistory(
                        InfrastructureType.BUOY_BERTH, id, normalizedKeyword, fromDate, toDate, pageable);
            }
        } else {
            list = historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.BUOY_BERTH, id);
        }
        return list.stream().map(this::toHistoryEntry).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getAllHistory() {
        List<InfrastructureHistory> list =
                historyRepository.findByRefTypeOrderByApprovedDateDesc(InfrastructureType.BUOY_BERTH);
        java.util.Map<String, String> entityNames = new java.util.HashMap<>();
        for (InfrastructureHistory h : list) {
            if (h.getRefId() != null && !entityNames.containsKey(h.getRefId().toString())) {
                buoyBerthRepository.findById(h.getRefId())
                        .ifPresent(b -> entityNames.put(b.getId().toString(), b.getBuoyBerthName()));
            }
        }
        return java.util.Map.of(
                "entityType", "BuoyBerth",
                "changeHistory", list.stream().map(this::toHistoryEntry).collect(Collectors.toList()),
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

    private static String normalizeSearchKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) return null;
        return java.text.Normalizer.normalize(keyword.trim().toLowerCase(Locale.ROOT), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
    }
}
