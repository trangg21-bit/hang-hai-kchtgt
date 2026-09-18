package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.TransferArea;
import com.hanghai.kchtg.port.repository.TransferAreaRepository;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Two-level approval service for TransferArea entity.
 * Level 1: CANG_VU (Port Authority) — DRAFT/PENDING → PORT_AUTHORITY (APPROVED_LEVEL1)
 * Level 2: CUC (Department) — PORT_AUTHORITY → APPROVED
 * Reject at any level → REJECTED
 * <p>
 * Lịch sử thay đổi đọc từ bảng tập trung {@code infrastructure_history}
 * (refType = TRANSSHIPMENT_AREA) — cùng cấu trúc ghi/đọc với Cảng biển / Vùng nước;
 * actor UUID được phân giải sang họ tên (không trả UUID thô để drawer không hiển thị "—").
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TransferAreaApprovalService {

    private final TransferAreaRepository transferAreaRepository;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;

    @Transactional
    public void submit(UUID id, String content, UUID userId) {
        TransferArea entity = transferAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu chuyển tải với id: " + id));

        if (entity.getDeletedAt() != null || entity.getDeletedBy() != null) {
            throw new IllegalStateException("Không thể gửi phê duyệt khu chuyển tải đã bị xóa");
        }

        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        entity.setSubmittedForApprovalAt(LocalDateTime.now());
        entity.setSubmittedForApprovalBy(userId != null ? userId.toString() : null);
        entity.setRejectionReason(null);
        entity.setUpdatedAt(LocalDateTime.now());
        transferAreaRepository.save(entity);
        log.info("TransferArea [{}] submitted for approval by {}", id, userId);
    }

    @Transactional
    public void approve(UUID id, String userId, String cap, String content) {
        TransferArea entity = transferAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu chuyển tải với id: " + id));

        if (entity.getDeletedAt() != null || entity.getDeletedBy() != null) {
            throw new IllegalStateException("Không thể phê duyệt khu chuyển tải đã bị xóa");
        }

        if ("CANG_VU".equals(cap)) {
            if (entity.getApprovalStatus() != ApprovalStatus.PENDING_APPROVAL
                    && entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL1
                    && entity.getApprovalStatus() != ApprovalStatus.PROPOSED
                    && entity.getApprovalStatus() != ApprovalStatus.DRAFT) {
                throw new IllegalStateException("Không thể phê duyệt cấp Chi cục: trạng thái hiện tại không hợp lệ");
            }
            entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
            entity.setPortAuthorityApprovedAt(LocalDateTime.now());
            entity.setPortAuthorityApprovedBy(userId);
            entity.setRejectionReason(null);
            if (content != null && !content.isBlank()) {
                entity.setPortAuthorityApprovalContent(content.trim());
            }
        } else if ("CUC".equals(cap)) {
            if (entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL1
                    && entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL2) {
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

        transferAreaRepository.save(entity);

        // Ghi sự kiện phê duyệt vào infrastructure_history (changedField = null để getHistory
        // phân loại vào approvalLog), chuẩn Cảng biển/Khu neo đậu sau migration V20260825162500.
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.TRANSSHIPMENT_AREA)
                .status(InfrastructureHistoryStatus.APPROVED)
                .approvedBy(SecurityUtils.getCurrentUserId())
                .approvedDate(LocalDateTime.now())
                .build());

        log.info("TransferArea [{}] approved by {} at level {}", id, userId, cap);
    }

    @Transactional
    public void reject(UUID id, String userId, String cap, String reason) {
        TransferArea entity = transferAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu chuyển tải với id: " + id));

        boolean isLevel2 = entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2
                || "CUC".equalsIgnoreCase(cap);
        entity.setApprovalStatus(isLevel2 ? ApprovalStatus.REJECTED_LEVEL2 : ApprovalStatus.REJECTED_LEVEL1);
        entity.setRejectionReason(reason);

        transferAreaRepository.save(entity);

        // Ghi sự kiện từ chối vào infrastructure_history (changedField = null để getHistory
        // phân loại vào approvalLog), chuẩn Cảng biển sau migration V20260825162500.
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.TRANSSHIPMENT_AREA)
                .status(InfrastructureHistoryStatus.REJECTED)
                .approvedBy(SecurityUtils.getCurrentUserId())
                .approvedDate(LocalDateTime.now())
                .build());

        log.info("TransferArea [{}] rejected by {} at level {}: {}", id, userId, cap, reason);
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getHistory(UUID id) {
        TransferArea entity = transferAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu chuyển tải với id: " + id));

        String entityId = id.toString();
        String entityType = "TransferArea";

        if (entity.getApprovalStatus() == ApprovalStatus.DRAFT) {
            Map<String, Object> result = new HashMap<>();
            result.put("entityId", entityId);
            result.put("entityType", entityType);
            result.put("currentApprovalStatus", entity.getApprovalStatus());
            result.put("changeHistory", java.util.Collections.emptyList());
            result.put("approvalLog", java.util.Collections.emptyList());
            result.put("histories", java.util.Collections.emptyList());
            return result;
        }

        // Đọc từ infrastructure_history (refType = TRANSSHIPMENT_AREA) — chuẩn WaterZoneApprovalService
        List<InfrastructureHistory> list =
                historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.TRANSSHIPMENT_AREA, id);
        Map<UUID, String> userNameMap = resolveUserNames(list);

        List<Map<String, Object>> changeHistory = list.stream()
                .filter(h -> h.getChangedField() != null)
                .map(h -> toChangeHistoryMap(h, entityType, entityId, userNameMap))
                .toList();

        List<Map<String, Object>> approvalLog = list.stream()
                .filter(h -> h.getStatus() != null && h.getChangedField() == null)
                .map(h -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", h.getId());
                    m.put("entityType", entityType);
                    m.put("entityId", entityId);
                    m.put("decision", h.getStatus().name());
                    m.put("decidedBy", resolveActorName(h, userNameMap));
                    m.put("decidedAt", h.getApprovedDate());
                    return m;
                })
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("entityId", entityId);
        result.put("entityType", entityType);
        result.put("currentApprovalStatus", entity.getApprovalStatus());
        result.put("changeHistory", changeHistory);
        result.put("approvalLog", approvalLog);
        result.put("histories", list);
        return result;
    }

    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getAllHistory() {
        String entityType = "TransferArea";
        List<InfrastructureHistory> list =
                historyRepository.findByRefTypeOrderByApprovedDateDesc(InfrastructureType.TRANSSHIPMENT_AREA);

        Map<String, String> entityNames = new HashMap<>();
        for (InfrastructureHistory h : list) {
            if (h.getRefId() != null && !entityNames.containsKey(h.getRefId().toString())) {
                try {
                    transferAreaRepository.findById(h.getRefId())
                            .ifPresent(t -> entityNames.put(h.getRefId().toString(), t.getTransferAreaName()));
                } catch (Exception e) {
                    entityNames.put(h.getRefId().toString(), h.getRefId().toString());
                }
            }
        }

        Map<UUID, String> userNameMap = resolveUserNames(list);
        List<Map<String, Object>> changeHistory = list.stream()
                .filter(h -> h.getChangedField() != null)
                .map(h -> toChangeHistoryMap(h, entityType,
                        h.getRefId() != null ? h.getRefId().toString() : "", userNameMap))
                .toList();

        Map<String, Object> result = new HashMap<>();
        result.put("entityType", entityType);
        result.put("changeHistory", changeHistory);
        result.put("entityNames", entityNames);
        return result;
    }

    /** Batch resolve actor UUID → tên hiển thị (fullName, fallback username) — chuẩn WaterZoneApprovalService. */
    private Map<UUID, String> resolveUserNames(List<InfrastructureHistory> list) {
        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (userIds.isEmpty()) {
            return java.util.Collections.emptyMap();
        }
        return userRepository.findAllById(userIds).stream()
                .collect(Collectors.toMap(
                        User::getId,
                        u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUsername(),
                        (a, b) -> a));
    }

    private String resolveActorName(InfrastructureHistory h, Map<UUID, String> userNameMap) {
        if (h.getApprovedBy() == null) {
            return "";
        }
        return userNameMap.getOrDefault(h.getApprovedBy(), h.getApprovedBy().toString());
    }

    private String canonicalizeFieldName(String field) {
        if (field == null) {
            return "";
        }
        String lower = field.trim().toLowerCase();
        return switch (lower) {
            case "transferareacode", "mã khu chuyển tải", "ma khu chuyen tai", "mã khu" -> "transferAreaCode";
            case "transferareaname", "tên khu chuyển tải", "ten khu chuyen tai", "tên khu" -> "transferAreaName";
            case "portid", "thuộc cảng biển", "cảng biển", "thuoc cang bien", "cang bien" -> "portId";
            case "orgunitid", "đơn vị quản lý", "don vi quan ly" -> "orgUnitId";
            case "provinceid", "province", "địa điểm (tỉnh/thành phố)", "tỉnh/thành phố", "tinh/thanh pho", "địa điểm (tỉnh/tp)" -> "provinceId";
            case "detailedlocation", "địa điểm chi tiết", "dia diem chi tiet", "địa điểm" -> "detailedLocation";
            case "operationalfunctions", "công năng khai thác", "cong nang khai thac", "công năng", "cong nang" -> "operationalFunctions";
            case "operationalstatus", "tình trạng", "tình trạng hoạt động", "tinh trang", "tinh trang hoat dong" -> "operationalStatus";
            case "shapedescription", "hình dạng", "hinh dang" -> "shapeDescription";
            case "area", "diện tích (ha)", "diện tích", "dien tich" -> "area";
            case "designwaterdepth", "độ sâu khu nước theo thiết kế (m)", "độ sâu theo thiết kế (m)", "do sau theo thiet ke" -> "designWaterDepth";
            case "currentwaterdepth", "độ sâu khu nước hiện tại (theo tbhh gần nhất) (m)", "độ sâu hiện tại (m)", "do sau hien tai" -> "currentWaterDepth";
            case "bottomelevationdesign", "cao độ đáy bến thiết kế", "cao do day ben thiet ke" -> "bottomElevationDesign";
            case "maxvesseldwt", "cỡ tàu khai thác theo công bố (dwt)", "cỡ tàu khai thác (dwt)", "co tau khai thac" -> "maxVesselDWT";
            case "activetransfercount", "số lượng điểm chuyển tải đang khai thác", "số điểm chuyển tải đang khai thác", "so luong diem chuyen tai dang khai thac" -> "activeTransferCount";
            case "publishedtransfercount", "số lượng điểm chuyển tải đã công bố", "số điểm chuyển tải đã công bố", "so luong diem chuyen tai da cong bo" -> "publishedTransferCount";
            case "underinvestmenttransfercount", "số lượng điểm chuyển tải đang được thỏa thuận đầu tư xây dựng", "số điểm thỏa thuận đtxd", "so luong diem thoa thuan dtxd" -> "underInvestmentTransferCount";
            case "remarks", "ghi chú", "ghi chu", "note" -> "remarks";
            case "openingannouncementdate", "thời điểm công bố mở, đưa ra sử dụng", "ngày công bố mở", "ngay cong bo mo" -> "openingAnnouncementDate";
            case "publicdecision", "quyết định công bố/ văn bản cho phép khai thác", "quyết định mở", "quyet dinh mo" -> "publicDecision";
            case "investmentagreement", "văn bản thỏa thuận đầu tư xây dựng", "thỏa thuận đầu tư", "thoa thuan dau tu" -> "investmentAgreement";
            case "activitystartdate", "thời gian hoạt động từ", "thoi gian hoat dong tu", "ngày bắt đầu" -> "activityStartDate";
            case "activityenddate", "thời gian hoạt động đến", "thoi gian hoat dong den", "ngày kết thúc" -> "activityEndDate";
            case "geometrytype", "loại đối tượng", "loại đối tượng gis", "loai doi tuong" -> "geometryType";
            case "mapsymbolid", "biểu tượng", "biểu tượng bản đồ", "bieu tuong", "symbolid" -> "mapSymbolId";
            case "coordinatesystem", "hệ quy chiếu", "hệ tọa độ", "he quy chieu" -> "coordinateSystem";
            case "displayrule", "quy tắc hiển thị", "quy tac hien thi" -> "displayRule";
            case "coordinates", "tọa độ gps", "tọa độ gis", "tọa độ", "toa do" -> "coordinates";
            default -> field.trim();
        };
    }

    /**
     * Map một dòng infrastructure_history sang dạng drawer đọc được: mang đồng thời cặp alias
     * cũ/mới (changedField+fieldName, previousValue+oldValue, approvedDate+changedAt) và actor
     * đã phân giải tên (approvedByName/changedBy) kèm UUID thô (approvedBy).
     */
    private Map<String, Object> toChangeHistoryMap(InfrastructureHistory h, String entityType, String entityId,
                                                   Map<UUID, String> userNameMap) {
        String field = canonicalizeFieldName(h.getChangedField());
        String oldValue = h.getPreviousValue() != null ? h.getPreviousValue() : "";
        String newValue = h.getNewValue() != null ? h.getNewValue() : "";
        String resolvedName = resolveActorName(h, userNameMap);
        Map<String, Object> m = new HashMap<>();
        m.put("id", h.getId());
        m.put("entityType", entityType);
        m.put("entityId", entityId);
        m.put("changedField", field);
        m.put("fieldName", field);
        m.put("previousValue", oldValue);
        m.put("oldValue", oldValue);
        m.put("newValue", newValue);
        m.put("changedBy", resolvedName);
        m.put("approvedByName", resolvedName);
        m.put("approvedBy", h.getApprovedBy() != null ? h.getApprovedBy().toString() : "");
        m.put("approvedDate", h.getApprovedDate());
        m.put("changedAt", h.getApprovedDate());
        m.put("status", h.getStatus() != null ? h.getStatus().name() : "");
        return m;
    }
}
