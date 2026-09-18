package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.ShipRepairYard;
import com.hanghai.kchtg.port.repository.ShipRepairYardRepository;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Two-level approval service for ShipRepairYard entity.
 * Level 1: CANG_VU (Port Authority) — DRAFT/PENDING → PORT_AUTHORITY (APPROVED_LEVEL1)
 * Level 2: CUC (Department) — PORT_AUTHORITY → APPROVED
 * Reject at any level → REJECTED
 * <p>
 * Entity type: "ShipRepairYard" (for ApprovalLog + ChangeLog)
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShipRepairYardApprovalService {

    private final ShipRepairYardRepository shipRepairYardRepository;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;

    @Transactional
    public void submit(UUID id, String content, UUID userId) {
        ShipRepairYard entity = shipRepairYardRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cơ sở sửa chữa, đóng tàu với id: " + id));

        if (entity.getDeletedAt() != null || entity.getDeletedBy() != null) {
            throw new IllegalStateException("Không thể gửi phê duyệt cơ sở sửa chữa, đóng tàu đã bị xóa");
        }

        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        entity.setSubmittedForApprovalAt(LocalDateTime.now());
        entity.setSubmittedForApprovalBy(userId != null ? userId.toString() : null);
        entity.setRejectionReason(null);
        entity.setUpdatedAt(LocalDateTime.now());
        shipRepairYardRepository.save(entity);
        log.info("ShipRepairYard [{}] submitted for approval by {}", id, userId);
    }

    @Transactional
    public void approve(UUID id, String userId, String cap, String content) {
        ShipRepairYard entity = shipRepairYardRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cơ sở sửa chữa, đóng tàu với id: " + id));

        if (entity.getDeletedAt() != null || entity.getDeletedBy() != null) {
            throw new IllegalStateException("Không thể phê duyệt cơ sở sửa chữa, đóng tàu đã bị xóa");
        }

        if ("CANG_VU".equals(cap)) {
            if (entity.getApprovalStatus() != ApprovalStatus.PENDING_APPROVAL
                    && entity.getApprovalStatus() != ApprovalStatus.PROPOSED) {
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

        entity.setUpdatedAt(LocalDateTime.now());
        shipRepairYardRepository.save(entity);

        // Ghi sự kiện phê duyệt vào infrastructure_history (changedField = null để getHistory
        // phân loại vào approvalLog), chuẩn Cảng biển sau migration V20260825162500.
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.SHIP_REPAIR_YARD)
                .approvalLevel("CANG_VU".equals(cap) ? ApprovalLevel.LEVEL_1 : ApprovalLevel.LEVEL_2)
                .status(InfrastructureHistoryStatus.APPROVED)
                .approvedBy(SecurityUtils.getCurrentUserId())
                .approvedDate(LocalDateTime.now())
                .build());

        log.info("ShipRepairYard [{}] approved by {} at level {}", id, userId, cap);
    }

    @Transactional
    public void reject(UUID id, String userId, String cap, String reason) {
        ShipRepairYard entity = shipRepairYardRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cơ sở sửa chữa, đóng tàu với id: " + id));

        if (entity.getDeletedAt() != null || entity.getDeletedBy() != null) {
            throw new IllegalStateException("Không thể từ chối cơ sở sửa chữa, đóng tàu đã bị xóa");
        }

        boolean isC2 = "CUC".equalsIgnoreCase(cap)
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;
        entity.setApprovalStatus(isC2 ? ApprovalStatus.REJECTED_LEVEL2 : ApprovalStatus.REJECTED_LEVEL1);
        entity.setRejectionReason(reason);

        entity.setUpdatedAt(LocalDateTime.now());
        shipRepairYardRepository.save(entity);

        // Ghi sự kiện từ chối vào infrastructure_history (changedField = null để getHistory
        // phân loại vào approvalLog), chuẩn Cảng biển sau migration V20260825162500.
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.SHIP_REPAIR_YARD)
                .approvalLevel("CANG_VU".equals(cap) ? ApprovalLevel.LEVEL_1 : ApprovalLevel.LEVEL_2)
                .status(InfrastructureHistoryStatus.REJECTED)
                .approvedBy(SecurityUtils.getCurrentUserId())
                .approvedDate(LocalDateTime.now())
                .build());

        log.info("ShipRepairYard [{}] rejected by {} at level {}: {}", id, userId, cap, reason);
    }

    private static final Set<String> EXCLUDED_HISTORY_FIELDS = Set.of(
            "approvalstatus",
            "trạng thái phê duyệt",
            "trang thai phe duyet",
            "trạng thái",
            "activitystatus",
            "approvalcontentlevel1",
            "approvalcontentlevel2",
            "level1approvalcontent",
            "level2approvalcontent",
            "approvalcontent",
            "submitteddate",
            "submittedat",
            "submittedby",
            "submittedforapprovalat",
            "submittedforapprovalby",
            "approverlevel1",
            "approverlevel2",
            "approveddatelevel1",
            "approveddatelevel2",
            "rejectionreason",
            "lý do từ chối",
            "ly do tu choi",
            "portauthorityapprovedby",
            "portauthorityapprovedat",
            "portauthorityapprovalcontent",
            "departmentapprovedby",
            "departmentapprovedat",
            "departmentapprovalcontent",
            "approvedby",
            "approvedat",
            "approvedremarks",
            "cấp 1 phê duyệt",
            "cấp 2 phê duyệt",
            "nội dung phê duyệt",
            "ngày gửi phê duyệt",
            "người gửi phê duyệt",
            "thời điểm gửi phê duyệt",
            "thời điểm cảng vụ phê duyệt",
            "thời điểm cục phê duyệt",
            "nội dung cảng vụ phê duyệt",
            "nội dung cục phê duyệt",
            "cán bộ cảng vụ phê duyệt",
            "cán bộ cục phê duyệt",
            "infrastructurelist",
            "infrastructurelist_raw",
            "attachments",
            "spatialid",
            "vị trí không gian"
    );

    private boolean isExcludedHistoryField(String field) {
        if (field == null || field.trim().isEmpty()) {
            return true;
        }
        String normalized = field.trim().toLowerCase();
        return EXCLUDED_HISTORY_FIELDS.contains(normalized);
    }

    private String canonicalizeFieldName(String field) {
        if (field == null) {
            return "";
        }
        String lower = field.trim().toLowerCase();
        return switch (lower) {
            case "shiprepairyardcode", "mã cơ sở sửa chữa, đóng tàu", "mã cơ sở", "ma co so sua chua dong tau", "ma co so" -> "shipRepairYardCode";
            case "shiprepairyardname", "tên cơ sở sửa chữa, đóng tàu", "tên cơ sở", "ten co so sua chua dong tau", "ten co so" -> "shipRepairYardName";
            case "portid", "thuộc cảng biển", "cảng biển", "thuoc cang bien", "cang bien" -> "portId";
            case "pierid", "thuộc cầu cảng", "cầu cảng", "thuoc cau cang", "cau cang" -> "pierId";
            case "orgunitid", "đơn vị quản lý", "don vi quan ly" -> "orgUnitId";
            case "provinceid", "province", "địa điểm (tỉnh/thành phố)", "tỉnh/thành phố", "tinh/thanh pho", "địa điểm (tỉnh/tp)" -> "provinceId";
            case "detailedlocation", "địa điểm chi tiết", "dia diem chi tiet", "địa điểm" -> "detailedLocation";
            case "operationalstatus", "tình trạng", "tình trạng hoạt động", "tinh trang", "tinh trang hoat dong" -> "operationalStatus";
            case "usagefunction", "công năng sử dụng", "cong nang su dung" -> "usageFunction";
            case "workshoparea", "diện tích nhà xưởng, kho bãi", "diện tích nhà xưởng, kho bãi (m2)", "diện tích nhà xưởng (m2)", "diện tích", "dien tich nha xuong" -> "workshopArea";
            case "vesseltype", "loại tàu đóng mới, sửa chữa", "loại tàu", "loai tau" -> "vesselType";
            case "vesseldwt", "cỡ tàu (dwt)", "cỡ tàu", "co tau" -> "vesselDwt";
            case "businesstype", "loại hình doanh nghiệp", "loai hinh doanh nghiep" -> "businessType";
            case "activity", "hoạt động", "hoat dong" -> "activity";
            case "slipwaycount", "số lượng triền đà", "số triền đà", "so luong trien da" -> "slipwayCount";
            case "remarks", "ghi chú", "ghi chu", "note" -> "remarks";
            case "geometrytype", "loại đối tượng", "loại đối tượng gis", "loai doi tuong" -> "geometryType";
            case "mapsymbolid", "biểu tượng", "biểu tượng bản đồ", "bieu tuong", "symbolid" -> "mapSymbolId";
            case "coordinatesystem", "hệ quy chiếu", "hệ tọa độ", "he quy chieu" -> "coordinateSystem";
            case "displayrule", "quy tắc hiển thị", "quy tac hien thi" -> "displayRule";
            case "coordinates", "tọa độ gps", "tọa độ gis", "tọa độ", "toa do" -> "coordinates";
            case "file đính kèm", "tài liệu đính kèm", "attachments", "attachment" -> "attachments";
            default -> field.trim();
        };
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getHistory(UUID id) {
        ShipRepairYard entity = shipRepairYardRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cơ sở sửa chữa, đóng tàu với id: " + id));

        String entityId = id.toString();
        String entityType = "ShipRepairYard";

        if (entity.getApprovalStatus() == ApprovalStatus.DRAFT) {
            return Map.of(
                    "entityId", entityId,
                    "entityType", entityType,
                    "currentApprovalStatus", ApprovalStatus.DRAFT.name(),
                    "changeHistory", Collections.emptyList(),
                    "approvalLog", Collections.emptyList(),
                    "histories", Collections.emptyList()
            );
        }

        List<InfrastructureHistory> list =
                historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.SHIP_REPAIR_YARD, id);

        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> userNameMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(
                                User::getId,
                                u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUsername(),
                                (a, b) -> a));

        Set<String> seenSessionKeys = new HashSet<>();
        List<Map<String, Object>> changeHistory = list.stream()
                .filter(h -> {
                    if (h.getStatus() == InfrastructureHistoryStatus.CREATED) {
                        return false;
                    }
                    String field = h.getChangedField();
                    if (field != null && isExcludedHistoryField(field)) {
                        return false;
                    }
                    if (h.getPreviousValue() != null && Objects.equals(h.getPreviousValue(), h.getNewValue())) {
                        return false;
                    }
                    long epochSec = h.getApprovedDate() != null
                            ? h.getApprovedDate().atZone(java.time.ZoneId.systemDefault()).toEpochSecond()
                            : 0L;
                    String canonical = canonicalizeFieldName(h.getChangedField());
                    String sessionKey = epochSec + "_" + canonical;
                    if (!canonical.isEmpty() && !seenSessionKeys.add(sessionKey)) {
                        return false;
                    }
                    return true;
                })
                .filter(h -> h.getChangedField() != null)
                .map(h -> {
                    String field = canonicalizeFieldName(h.getChangedField());
                    String oldValue = h.getPreviousValue() != null ? h.getPreviousValue() : "";
                    String newValue = h.getNewValue() != null ? h.getNewValue() : "";
                    String resolvedName = h.getApprovedBy() != null ? userNameMap.get(h.getApprovedBy()) : null;
                    if (resolvedName == null || resolvedName.isBlank()) {
                        resolvedName = "Hệ thống";
                    }
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", h.getId());
                    m.put("entityType", entityType);
                    m.put("entityId", entityId);
                    m.put("fieldName", field);
                    m.put("changedField", field);
                    m.put("oldValue", oldValue);
                    m.put("previousValue", oldValue);
                    m.put("newValue", newValue);
                    m.put("changedBy", resolvedName);
                    m.put("approvedByName", resolvedName);
                    m.put("approvedBy", resolvedName);
                    m.put("changedAt", h.getApprovedDate());
                    m.put("approvedDate", h.getApprovedDate());
                    m.put("status", h.getStatus() != null ? h.getStatus().name() : "");
                    if (entity.getOrgUnitId() != null) {
                        m.put("orgUnitId", entity.getOrgUnitId().toString());
                    }
                    return m;
                })
                .toList();

        List<Map<String, Object>> approvalLog = list.stream()
                .filter(h -> h.getStatus() != null && h.getChangedField() == null)
                .map(h -> {
                    String resolvedName = h.getApprovedBy() != null ? userNameMap.get(h.getApprovedBy()) : null;
                    if (resolvedName == null || resolvedName.isBlank()) {
                        resolvedName = "Hệ thống";
                    }
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", h.getId());
                    m.put("entityType", entityType);
                    m.put("entityId", entityId);
                    m.put("decision", h.getStatus().name());
                    m.put("decidedBy", resolvedName);
                    m.put("decidedAt", h.getApprovedDate());
                    return m;
                })
                .toList();

        return Map.of(
                "entityId", entityId,
                "entityType", entityType,
                "currentApprovalStatus", entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : "",
                "changeHistory", changeHistory,
                "approvalLog", approvalLog,
                "histories", list
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getAllHistory() {
        String entityType = "ShipRepairYard";
        List<InfrastructureHistory> list =
                historyRepository.findByRefTypeOrderByApprovedDateDesc(InfrastructureType.SHIP_REPAIR_YARD);
        Map<String, String> entityNames = new HashMap<>();
        for (InfrastructureHistory logItem : list) {
            if (logItem.getRefId() != null) {
                String refIdStr = logItem.getRefId().toString();
                if (!entityNames.containsKey(refIdStr)) {
                    try {
                        shipRepairYardRepository.findById(logItem.getRefId())
                                .ifPresent(a -> entityNames.put(refIdStr, a.getShipRepairYardName()));
                    } catch (Exception e) {
                        entityNames.put(refIdStr, refIdStr);
                    }
                }
            }
        }

        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> userNameMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllById(userIds).stream()
                        .collect(Collectors.toMap(
                                User::getId,
                                u -> u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUsername(),
                                (a, b) -> a));

        Set<String> seenSessionKeys = new HashSet<>();
        List<Map<String, Object>> changeHistory = list.stream()
                .filter(h -> {
                    if (h.getStatus() == InfrastructureHistoryStatus.CREATED) {
                        return false;
                    }
                    String field = h.getChangedField();
                    if (field != null && isExcludedHistoryField(field)) {
                        return false;
                    }
                    if (h.getPreviousValue() != null && Objects.equals(h.getPreviousValue(), h.getNewValue())) {
                        return false;
                    }
                    long epochSec = h.getApprovedDate() != null
                            ? h.getApprovedDate().atZone(java.time.ZoneId.systemDefault()).toEpochSecond()
                            : 0L;
                    String canonical = canonicalizeFieldName(h.getChangedField());
                    String sessionKey = (h.getRefId() != null ? h.getRefId().toString() : "") + "_" + epochSec + "_" + canonical;
                    if (!canonical.isEmpty() && !seenSessionKeys.add(sessionKey)) {
                        return false;
                    }
                    return true;
                })
                .map(h -> {
                    String resolvedName = h.getApprovedBy() != null
                            ? userNameMap.get(h.getApprovedBy())
                            : null;
                    if (resolvedName == null || resolvedName.isBlank()) {
                        resolvedName = "Hệ thống";
                    }
                    String field = canonicalizeFieldName(h.getChangedField());
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", h.getId());
                    m.put("refId", h.getRefId());
                    m.put("entityId", h.getRefId() != null ? h.getRefId().toString() : null);
                    m.put("refType", h.getRefType());
                    m.put("status", h.getStatus());
                    m.put("approvedBy", resolvedName);
                    m.put("approvedByName", resolvedName);
                    m.put("approvedDate", h.getApprovedDate());
                    m.put("changedAt", h.getApprovedDate());
                    m.put("changedField", field);
                    m.put("fieldName", field);
                    m.put("previousValue", h.getPreviousValue());
                    m.put("oldValue", h.getPreviousValue());
                    m.put("newValue", h.getNewValue());
                    m.put("changedBy", resolvedName);
                    return m;
                })
                .toList();
        return Map.of("entityType", entityType, "changeHistory", changeHistory, "entityNames", entityNames);
    }
}
