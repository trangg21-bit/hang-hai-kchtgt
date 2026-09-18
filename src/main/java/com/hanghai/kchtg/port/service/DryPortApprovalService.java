package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.port.entity.DryPort;
import com.hanghai.kchtg.port.repository.DryPortRepository;
import com.hanghai.kchtg.port.service.shared.PortNotificationService;
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
 * Approval service for DryPort entity.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DryPortApprovalService {

    private final DryPortRepository dryPortRepository;
    private final InfrastructureApprovalService infrastructureApprovalService;
    private final InfrastructureHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final PortNotificationService notificationService;

    // -- Phe duyet 2 cap (approval-2-level-spec 3.2) --
    // Uy quyen cho InfrastructureApprovalService: noi cai dat dung 7 trang thai,
    // phan cap theo don vi gui (BR-003/014), chong tu duyet (BR-015) va bat buoc
    // ly do tu choi toi thieu 10 ky tu (BR-016).

    /** T02/T03: gui ho so di duyet. Nguoi gui cap Cuc vao thang "Cho Cuc duyet". */
    @Transactional
    public void submit(UUID id, UUID userId) {
        DryPort entity = loadForApproval(id);
        infrastructureApprovalService.submit(entity, InfrastructureType.DRY_PORT, userId);
        entity.setUpdatedAt(LocalDateTime.now());
        dryPortRepository.save(entity);
    }

    /** T06: Cang vu / Chi cuc duyet vong 1. */
    @Transactional
    public void approveC1(UUID id, String reason, UUID userId) {
        DryPort entity = loadForApproval(id);
        infrastructureApprovalService.approveC1(entity, InfrastructureType.DRY_PORT,
                ApprovalStatus.APPROVED.name(), reason, userId);
        entity.setUpdatedAt(LocalDateTime.now());
        dryPortRepository.save(entity);

        // Ghi sự kiện phê duyệt cấp 1 vào infrastructure_history (chuẩn /berth)
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.DRY_PORT)
                .approvalLevel(ApprovalLevel.LEVEL_1)
                .status(InfrastructureHistoryStatus.APPROVED)
                .approvedBy(userId != null ? userId : SecurityUtils.getCurrentUserId())
                .approvedDate(LocalDateTime.now())
                .build());

        log.info("DryPort [{}] approved at level CANG_VU by {}", id, userId);
    }

    /** T08: Cuc duyet vong 2 -- ho so tro thanh "Da duyet". */
    @Transactional
    public void approveC2(UUID id, String reason, UUID userId) {
        DryPort entity = loadForApproval(id);
        infrastructureApprovalService.approveC2(entity, InfrastructureType.DRY_PORT,
                ApprovalStatus.APPROVED.name(), reason, userId);
        entity.setUpdatedAt(LocalDateTime.now());
        dryPortRepository.save(entity);

        // Ghi sự kiện phê duyệt cấp 2 vào infrastructure_history (chuẩn /berth)
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.DRY_PORT)
                .approvalLevel(ApprovalLevel.LEVEL_2)
                .status(InfrastructureHistoryStatus.APPROVED)
                .approvedBy(userId != null ? userId : SecurityUtils.getCurrentUserId())
                .approvedDate(LocalDateTime.now())
                .build());

        notificationService.sendApprovalNotification("DryPort", id.toString(), String.valueOf(userId), null);
        log.info("DryPort [{}] approved at level CUC by {}", id, userId);
    }

    /**
     * T07/T09: tu choi. Vong bi tu choi suy ra tu trang thai hien tai -- tranh
     * lech giua nut bam va du lieu.
     */
    @Transactional
    public void reject(UUID id, String reason, UUID userId) {
        DryPort entity = loadForApproval(id);
        boolean isC2 = entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;
        entity.setApprovalStatus(isC2 ? ApprovalStatus.REJECTED_LEVEL2 : ApprovalStatus.REJECTED_LEVEL1);
        entity.setRejectionReason(reason);
        entity.setUpdatedAt(LocalDateTime.now());
        dryPortRepository.save(entity);

        // Ghi sự kiện từ chối vào infrastructure_history (chuẩn /berth)
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.DRY_PORT)
                .approvalLevel(isC2 ? ApprovalLevel.LEVEL_2 : ApprovalLevel.LEVEL_1)
                .status(InfrastructureHistoryStatus.REJECTED)
                .approvedBy(userId != null ? userId : SecurityUtils.getCurrentUserId())
                .approvedDate(LocalDateTime.now())
                .build());

        log.info("DryPort [{}] rejected at level {} by {}: {}", id, isC2 ? "CUC" : "CANG_VU", userId, reason);
    }

    /**
     * @deprecated Uy quyen cu dung cho cac luong chua phan cap.
     */
    @Deprecated
    @Transactional
    public void reject(UUID id, String userId, String cap, String reason) {
        UUID uid = null;
        try { if (userId != null) uid = UUID.fromString(userId); } catch (Exception ignored) {}
        if ("CUC".equalsIgnoreCase(cap)) {
            infrastructureApprovalService.approveC2(loadForApproval(id), InfrastructureType.DRY_PORT,
                    ApprovalStatus.REJECTED.name(), reason, uid);
        } else {
            infrastructureApprovalService.approveC1(loadForApproval(id), InfrastructureType.DRY_PORT,
                    ApprovalStatus.REJECTED.name(), reason, uid);
        }
        dryPortRepository.save(loadForApproval(id));
    }

    /**
     * @deprecated Uy quyen cu. Dung {@link #approveC1} hoac {@link #approveC2}.
     */
    @Deprecated
    @Transactional
    public void approve(UUID id, String userId, String cap, String reason) {
        UUID uid = null;
        try { if (userId != null) uid = UUID.fromString(userId); } catch (Exception ignored) {}
        if ("CUC".equalsIgnoreCase(cap)) {
            approveC2(id, reason, uid);
        } else {
            approveC1(id, reason, uid);
        }
    }

    @Deprecated
    @Transactional
    public void approve(UUID id, String userId, String reason) {
        UUID uid = null;
        try { if (userId != null) uid = UUID.fromString(userId); } catch (Exception ignored) {}
        approveCurrentStage(id, reason, uid);
    }

    /**
     * Duyet vong dang mo cua ho so. Giu cho endpoint /approve cu hoat dong nhung
     * di dung quy trinh 2 cap thay vi duyet mot phat nhu truoc, de khong con
     * duong vong bo qua vong duyet qua API.
     */
    @Transactional
    public void approveCurrentStage(UUID id, String reason, UUID userId) {
        DryPort entity = loadForApproval(id);
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            approveC2(id, reason, userId);
        } else {
            approveC1(id, reason, userId);
        }
    }

    private DryPort loadForApproval(UUID id) {
        return dryPortRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + id));
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
            case "dryportcode", "mã cảng cạn", "ma cang can" -> "dryPortCode";
            case "dryportname", "tên cảng cạn", "ten cang can" -> "dryPortName";
            case "orgunitid", "đơn vị quản lý", "don vi quan ly" -> "orgUnitId";
            case "provinceid", "province", "địa điểm (tỉnh/thành phố)", "tỉnh/thành phố", "tinh/thanh pho", "địa điểm (tỉnh/tp)" -> "provinceId";
            case "detailedlocation", "địa điểm chi tiết", "dia diem chi tiet", "địa điểm" -> "detailedLocation";
            case "operatingorgid", "operatingunit", "đơn vị khai thác", "don vi khai thac" -> "operatingUnit";
            case "region", "khu vực", "khu vuc" -> "region";
            case "transportcorridor", "hành lang vận tải", "hanh lang van tai" -> "transportCorridor";
            case "area", "tổng diện tích cảng (m2)", "tổng diện tích (m2)", "diện tích", "dien tich" -> "area";
            case "warehousearea", "diện tích kho (m2)", "diện tích kho", "dien tich kho" -> "warehouseArea";
            case "yardarea", "diện tích bãi (m2)", "diện tích bãi", "dien tich bai" -> "yardArea";
            case "teucapacity", "công suất khai thác", "cong suat khai thac" -> "teuCapacity";
            case "connectionmode", "phương thức kết nối giao thông", "phương thức kết nối", "phuong thuc ket noi" -> "connectionMode";
            case "portstatus", "tình trạng", "tinh trang" -> "portStatus";
            case "operationalstatus", "trạng thái hoạt động", "trang thai hoat dong" -> "operationalStatus";
            case "remarks", "ghi chú", "ghi chu", "note" -> "remarks";
            case "announcementtime", "thời điểm công bố mở", "thoi diem cong bo mo" -> "announcementTime";
            case "announcementdecisionnumber", "quyết định công bố số", "quyet dinh cong bo so" -> "announcementDecisionNumber";
            case "announcementdecisiondate", "ngày ra quyết định công bố", "ngay ra quyet dinh cong bo" -> "announcementDecisionDate";
            case "announcementorg", "đơn vị ra quyết định công bố", "don vi ra quyet dinh cong bo" -> "announcementOrg";
            case "openingannouncementdate", "thời điểm công bố mở, đưa vào sử dụng", "ngày công bố mở", "ngay cong bo mo" -> "openingAnnouncementDate";
            case "openingdecision", "quyết định công bố/ văn bản cho phép khai thác", "quyết định mở", "quyet dinh mo" -> "openingDecision";
            case "investmentagreementdoc", "văn bản thỏa thuận đầu tư xây dựng", "thỏa thuận đầu tư", "thoa thuan dau tu" -> "investmentAgreementDoc";
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
        DryPort entity = dryPortRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + id));

        String entityId = id.toString();
        String entityType = "DryPort";

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
                historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(InfrastructureType.DRY_PORT, id);

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
        String entityType = "DryPort";
        List<InfrastructureHistory> list =
                historyRepository.findByRefTypeOrderByApprovedDateDesc(InfrastructureType.DRY_PORT);
        Map<String, String> entityNames = new HashMap<>();
        for (InfrastructureHistory logItem : list) {
            if (logItem.getRefId() != null) {
                String refIdStr = logItem.getRefId().toString();
                if (!entityNames.containsKey(refIdStr)) {
                    try {
                        dryPortRepository.findById(logItem.getRefId())
                                .ifPresent(dp -> entityNames.put(refIdStr, dp.getDryPortName()));
                    } catch (Exception e) { entityNames.put(refIdStr, refIdStr); }
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
