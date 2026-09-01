package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.dto.inmarsat.*;
import com.hanghai.kchtg.station.entity.CoastalStationInmarsat;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.repository.CoastalStationInmarsatRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service xử lý nghiệp vụ cho Đài thông tin vệ tinh Inmarsat (M-004: F-098..F-103).
 * Tuân thủ quy chuẩn kiến trúc KCHTGT 3 tầng, DataScope phân cấp,
 * Quy trình phê duyệt 2 cấp C1/C2 và nguyên tắc 4 mắt (chống tự duyệt).
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CoastalStationInmarsatService {

    private final CoastalStationInmarsatRepository repository;
    private final InfrastructureApprovalService approvalService;
    private final HistoryService historyService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final UserRepository userRepository;
    private final InfrastructureAttachmentRepository attachmentRepository;

    @Value("${app.upload.attachment-path:uploads/inmarsat-attachments}")
    private String attachmentPath;

    private Scope resolveEffectiveScope(UUID selectedOrgUnitId) {
        Scope userScope = orgUnitScopeService.currentUserScope();
        if (selectedOrgUnitId == null) {
            return userScope;
        }
        if (!userScope.unrestricted() && !userScope.orgUnitIds().contains(selectedOrgUnitId)) {
            return Scope.restricted(List.of());
        }
        List<UUID> selectedSubtree = orgUnitScopeService.resolveSubtreeIds(selectedOrgUnitId);
        if (userScope.unrestricted()) {
            return Scope.restricted(selectedSubtree);
        }
        List<UUID> intersected = selectedSubtree.stream()
                .filter(userScope.orgUnitIds()::contains)
                .toList();
        return Scope.restricted(intersected);
    }

    private void validateAllowedOrgUnit(UUID orgUnitId) {
        Scope userScope = orgUnitScopeService.currentUserScope();
        if (!userScope.unrestricted() && (orgUnitId == null || !userScope.orgUnitIds().contains(orgUnitId))) {
            throw new AccessDeniedException("Bạn không có quyền thao tác trên đơn vị quản lý này");
        }
    }

    private void validateNotSelfApproval(UUID createdBy, UUID currentUserId) {
        if (createdBy != null && currentUserId != null && createdBy.equals(currentUserId)) {
            throw new IllegalStateException("Bạn không thể tự phê duyệt bản ghi do chính mình tạo (Nguyên tắc 4 mắt)");
        }
    }

    @Transactional(readOnly = true)
    public String generateCode() {
        long next = repository.count() + 1;
        String code = String.format("INMARSAT-%04d", next);
        while (repository.existsByCodeAndDeletedAtIsNull(code)) {
            next++;
            code = String.format("INMARSAT-%04d", next);
        }
        return code;
    }

    // --- TÌM KIẾM PHÂN TRANG & THỐNG KÊ TAB (F-102) ---

    @Transactional(readOnly = true)
    public Page<CoastalStationInmarsatResponse> searchPaged(
            UUID orgUnitId,
            String keyword,
            UUID operatingOrgId,
            Integer provinceId,
            String conditionStatus,
            ApprovalStatus approvalStatus,
            UUID updatedBy,
            LocalDateTime updatedFrom,
            LocalDateTime updatedTo,
            Pageable pageable) {

        Scope effectiveScope = resolveEffectiveScope(orgUnitId);
        String kw = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;

        Page<CoastalStationInmarsat> page = repository.searchPaged(
                !effectiveScope.unrestricted(),
                effectiveScope.orgUnitIds(),
                orgUnitId,
                kw,
                operatingOrgId,
                provinceId,
                conditionStatus,
                approvalStatus,
                updatedBy,
                updatedFrom,
                updatedTo,
                pageable
        );

        return page.map(this::buildResponse);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByApprovalStatus(UUID orgUnitId, String keyword, String conditionStatus) {
        Scope effectiveScope = resolveEffectiveScope(orgUnitId);
        String kw = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%"
                : null;

        List<Object[]> rows = repository.countByApprovalStatus(
                !effectiveScope.unrestricted(),
                effectiveScope.orgUnitIds(),
                orgUnitId,
                kw,
                conditionStatus
        );

        Map<String, Long> counts = new HashMap<>();
        long total = 0;
        for (Object[] r : rows) {
            ApprovalStatus st = (ApprovalStatus) r[0];
            Long cnt = (Long) r[1];
            if (st != null && cnt != null) {
                counts.put(st.name(), cnt);
                total += cnt;
            }
        }
        counts.put("ALL", total);
        return counts;
    }

    // --- CRUD ---

    public CoastalStationInmarsat createStation(CoastalStationInmarsatRequest request) {
        FieldWriteGuard.validateObject(request);

        User currentUser = SecurityUtils.getCurrentUser();
        UUID effectiveOrgUnitId = request.getOrgUnitId() != null
                ? request.getOrgUnitId()
                : (currentUser != null && currentUser.getOrgUnit() != null ? currentUser.getOrgUnit().getId() : null);

        if (effectiveOrgUnitId != null) {
            validateAllowedOrgUnit(effectiveOrgUnitId);
        }

        String effectiveCode = request.getEffectiveCode();
        if (effectiveCode == null || effectiveCode.isBlank()) {
            effectiveCode = generateCode();
        } else {
            if (repository.findByCode(effectiveCode).isPresent()) {
                throw new IllegalArgumentException("Mã đài đã tồn tại: " + effectiveCode);
            }
        }

        String effectiveName = request.getEffectiveName();
        if (effectiveName == null || effectiveName.isBlank()) {
            throw new IllegalArgumentException("Tên đài không được để trống");
        }

        validateCoordinates(request.getLongitude(), request.getLatitude());

        CoastalStationInmarsat entity = new CoastalStationInmarsat();
        entity.setCode(effectiveCode);
        entity.setDeviceCode(effectiveCode);
        entity.setName(effectiveName);
        entity.setStationName(effectiveName);
        entity.setOrgUnitId(effectiveOrgUnitId);
        entity.setUnitId(effectiveOrgUnitId);
        entity.setOperatingOrgId(request.getOperatingOrgId());
        entity.setProvinceId(request.getProvinceId());
        entity.setLocationAddress(request.getLocationAddress());
        entity.setLocationDetail(request.getLocationDetail());
        entity.setConditionStatus(request.getConditionStatus() != null ? request.getConditionStatus() : "OPERATIONAL");
        entity.setStatus(StationStatus.DRAFT);
        entity.setIsActive(true);

        // Thông số Inmarsat
        entity.setCoverageZone(request.getCoverageZone() != null ? request.getCoverageZone() : request.getCoverageArea());
        entity.setCoverageArea(request.getCoverageArea() != null ? request.getCoverageArea() : request.getCoverageZone());
        entity.setServices(request.getServices());
        entity.setFrequency(request.getFrequency());
        entity.setModemType(request.getModemType());
        entity.setSarCode(request.getSarCode());
        entity.setSatelliteSystem(request.getSatelliteSystem());
        entity.setNotes(request.getNotes() != null ? request.getNotes() : request.getDescription());
        entity.setDescription(request.getDescription() != null ? request.getDescription() : request.getNotes());
        entity.setContactPerson(request.getContactPerson());
        entity.setContactPhone(request.getContactPhone());

        // GIS
        entity.setSpatialId(request.getSpatialId());
        entity.setObjectType(request.getObjectType());
        entity.setSymbol(request.getSymbol());
        entity.setCoordinateSystem(request.getCoordinateSystem() != null ? request.getCoordinateSystem() : "WGS84");
        entity.setDisplayRule(request.getDisplayRule());
        entity.setLatitude(request.getLatitude());
        entity.setLongitude(request.getLongitude());

        // Mặc định tạo mới là DRAFT (Lưu tạm) - chưa ghi lịch sử biến động cho hồ sơ nháp
        entity.setApprovalStatus(ApprovalStatus.DRAFT);

        return repository.save(entity);
    }

    public CoastalStationInmarsat updateStation(UUID id, CoastalStationInmarsatUpdateRequest request) {
        FieldWriteGuard.validateObject(request);
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đài Inmarsat với id: " + id));

        if (entity.getOrgUnitId() != null) {
            validateAllowedOrgUnit(entity.getOrgUnitId());
        }

        // Quy tắc 12: Kiểm tra quyền chỉnh sửa hồ sơ
        approvalService.assertEditable(entity);

        boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        Map<String, String> oldValues = new LinkedHashMap<>();
        if (wasApproved) {
            if (request.getEffectiveName() != null && !Objects.equals(request.getEffectiveName(), entity.getName())) {
                oldValues.put("Tên đài", entity.getName() != null ? entity.getName() : "—");
            }
            if (request.getOrgUnitId() != null && !Objects.equals(request.getOrgUnitId(), entity.getOrgUnitId())) {
                String oldName = entity.getOrgUnitId() != null ? orgUnitCacheService.getName(entity.getOrgUnitId()) : "—";
                oldValues.put("Đơn vị quản lý", oldName != null ? oldName : "—");
            }
            if (request.getOperatingOrgId() != null && !Objects.equals(request.getOperatingOrgId(), entity.getOperatingOrgId())) {
                String oldName = entity.getOperatingOrgId() != null ? orgUnitCacheService.getName(entity.getOperatingOrgId()) : "—";
                oldValues.put("Đơn vị khai thác", oldName != null ? oldName : "—");
            }
            if (request.getProvinceId() != null && !Objects.equals(request.getProvinceId(), entity.getProvinceId())) {
                oldValues.put("Địa điểm (Tỉnh/TP)", entity.getProvinceId() != null ? String.valueOf(entity.getProvinceId()) : "—");
            }
            if (request.getLocationAddress() != null && !Objects.equals(request.getLocationAddress(), entity.getLocationAddress())) {
                oldValues.put("Địa chỉ", entity.getLocationAddress() != null ? entity.getLocationAddress() : "—");
            }
            if (request.getLocationDetail() != null && !Objects.equals(request.getLocationDetail(), entity.getLocationDetail())) {
                oldValues.put("Địa điểm chi tiết", entity.getLocationDetail() != null ? entity.getLocationDetail() : "—");
            }
            if (request.getConditionStatus() != null && !Objects.equals(request.getConditionStatus(), entity.getConditionStatus())) {
                oldValues.put("Tình trạng", entity.getConditionStatus() != null ? entity.getConditionStatus() : "—");
            }
            if (request.getCoverageZone() != null && !Objects.equals(request.getCoverageZone(), entity.getCoverageZone())) {
                oldValues.put("Vùng phủ sóng", entity.getCoverageZone() != null ? entity.getCoverageZone() : "—");
            }
            if (request.getCoverageArea() != null && !Objects.equals(request.getCoverageArea(), entity.getCoverageArea())) {
                oldValues.put("Khu vực phủ sóng", entity.getCoverageArea() != null ? entity.getCoverageArea() : "—");
            }
            if (request.getServices() != null && !Objects.equals(request.getServices(), entity.getServices())) {
                oldValues.put("Dịch vụ cung cấp", entity.getServices() != null ? entity.getServices() : "—");
            }
            if (request.getFrequency() != null && !Objects.equals(request.getFrequency(), entity.getFrequency())) {
                oldValues.put("Tần số", entity.getFrequency() != null ? entity.getFrequency() : "—");
            }
            if (request.getModemType() != null && !Objects.equals(request.getModemType(), entity.getModemType())) {
                oldValues.put("Loại Modem", entity.getModemType() != null ? entity.getModemType() : "—");
            }
            if (request.getSarCode() != null && !Objects.equals(request.getSarCode(), entity.getSarCode())) {
                oldValues.put("Mã SAR", entity.getSarCode() != null ? entity.getSarCode() : "—");
            }
            if (request.getSatelliteSystem() != null && !Objects.equals(request.getSatelliteSystem(), entity.getSatelliteSystem())) {
                oldValues.put("Hệ thống vệ tinh", entity.getSatelliteSystem() != null ? entity.getSatelliteSystem() : "—");
            }
            if (request.getNotes() != null && !Objects.equals(request.getNotes(), entity.getNotes())) {
                oldValues.put("Ghi chú", entity.getNotes() != null ? entity.getNotes() : "—");
            }
            if (request.getDescription() != null && !Objects.equals(request.getDescription(), entity.getDescription())) {
                oldValues.put("Mô tả", entity.getDescription() != null ? entity.getDescription() : "—");
            }
            if (request.getContactPerson() != null && !Objects.equals(request.getContactPerson(), entity.getContactPerson())) {
                oldValues.put("Người liên hệ", entity.getContactPerson() != null ? entity.getContactPerson() : "—");
            }
            if (request.getContactPhone() != null && !Objects.equals(request.getContactPhone(), entity.getContactPhone())) {
                oldValues.put("Số điện thoại liên hệ", entity.getContactPhone() != null ? entity.getContactPhone() : "—");
            }
        }

        validateCoordinates(request.getLongitude(), request.getLatitude());

        if (request.getOrgUnitId() != null) {
            validateAllowedOrgUnit(request.getOrgUnitId());
            entity.setOrgUnitId(request.getOrgUnitId());
            entity.setUnitId(request.getOrgUnitId());
        }

        if (request.getOperatingOrgId() != null) {
            entity.setOperatingOrgId(request.getOperatingOrgId());
        }

        if (request.getEffectiveName() != null) {
            entity.setName(request.getEffectiveName());
            entity.setStationName(request.getEffectiveName());
        }

        if (request.getProvinceId() != null) {
            entity.setProvinceId(request.getProvinceId());
        }

        if (request.getLocationAddress() != null) entity.setLocationAddress(request.getLocationAddress());
        if (request.getLocationDetail() != null) entity.setLocationDetail(request.getLocationDetail());
        if (request.getConditionStatus() != null) entity.setConditionStatus(request.getConditionStatus());

        if (request.getCoverageZone() != null) entity.setCoverageZone(request.getCoverageZone());
        if (request.getCoverageArea() != null) entity.setCoverageArea(request.getCoverageArea());
        if (request.getServices() != null) entity.setServices(request.getServices());
        if (request.getFrequency() != null) entity.setFrequency(request.getFrequency());
        if (request.getModemType() != null) entity.setModemType(request.getModemType());
        if (request.getSarCode() != null) entity.setSarCode(request.getSarCode());
        if (request.getSatelliteSystem() != null) entity.setSatelliteSystem(request.getSatelliteSystem());
        if (request.getNotes() != null) entity.setNotes(request.getNotes());
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        if (request.getContactPerson() != null) entity.setContactPerson(request.getContactPerson());
        if (request.getContactPhone() != null) entity.setContactPhone(request.getContactPhone());

        if (request.getSpatialId() != null) entity.setSpatialId(request.getSpatialId());
        if (request.getObjectType() != null) entity.setObjectType(request.getObjectType());
        if (request.getSymbol() != null) entity.setSymbol(request.getSymbol());
        if (request.getCoordinateSystem() != null) entity.setCoordinateSystem(request.getCoordinateSystem());
        if (request.getDisplayRule() != null) entity.setDisplayRule(request.getDisplayRule());
        if (request.getLatitude() != null) entity.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) entity.setLongitude(request.getLongitude());

        CoastalStationInmarsat saved = repository.save(entity);
        if (wasApproved && !oldValues.isEmpty()) {
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            for (Map.Entry<String, String> entry : oldValues.entrySet()) {
                String fieldName = entry.getKey();
                String oldVal = entry.getValue();
                String newVal = getNewValueDisplay(fieldName, saved);
                historyService.recordHistory(
                        InfrastructureType.INMARSAT_STATION,
                        saved.getId(),
                        StationHistoryActionType.UPDATE,
                        fieldName,
                        oldVal,
                        newVal,
                        "Cập nhật " + fieldName,
                        currentUserId);
            }
        }
        return saved;
    }

    private String getNewValueDisplay(String fieldName, CoastalStationInmarsat entity) {
        if (entity == null || fieldName == null) return "—";
        return switch (fieldName) {
            case "Tên đài" -> entity.getName() != null ? entity.getName() : "—";
            case "Đơn vị quản lý" -> entity.getOrgUnitId() != null ? orgUnitCacheService.getName(entity.getOrgUnitId()) : "—";
            case "Đơn vị khai thác" -> entity.getOperatingOrgId() != null ? orgUnitCacheService.getName(entity.getOperatingOrgId()) : "—";
            case "Địa điểm (Tỉnh/TP)" -> entity.getProvinceId() != null ? String.valueOf(entity.getProvinceId()) : "—";
            case "Địa chỉ" -> entity.getLocationAddress() != null ? entity.getLocationAddress() : "—";
            case "Địa điểm chi tiết" -> entity.getLocationDetail() != null ? entity.getLocationDetail() : "—";
            case "Tình trạng" -> entity.getConditionStatus() != null ? entity.getConditionStatus() : "—";
            case "Vùng phủ sóng" -> entity.getCoverageZone() != null ? entity.getCoverageZone() : "—";
            case "Khu vực phủ sóng" -> entity.getCoverageArea() != null ? entity.getCoverageArea() : "—";
            case "Dịch vụ cung cấp" -> entity.getServices() != null ? entity.getServices() : "—";
            case "Tần số" -> entity.getFrequency() != null ? entity.getFrequency() : "—";
            case "Loại Modem" -> entity.getModemType() != null ? entity.getModemType() : "—";
            case "Mã SAR" -> entity.getSarCode() != null ? entity.getSarCode() : "—";
            case "Hệ thống vệ tinh" -> entity.getSatelliteSystem() != null ? entity.getSatelliteSystem() : "—";
            case "Ghi chú" -> entity.getNotes() != null ? entity.getNotes() : "—";
            case "Mô tả" -> entity.getDescription() != null ? entity.getDescription() : "—";
            case "Người liên hệ" -> entity.getContactPerson() != null ? entity.getContactPerson() : "—";
            case "Số điện thoại liên hệ" -> entity.getContactPhone() != null ? entity.getContactPhone() : "—";
            default -> "—";
        };
    }

    public void deleteStation(UUID id) {
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đài Inmarsat với id: " + id));

        if (entity.getOrgUnitId() != null) {
            validateAllowedOrgUnit(entity.getOrgUnitId());
        }

        // BR-100-01: chỉ xóa được hồ sơ "Lưu tạm" hoặc "Bị trả về"; hồ sơ đang
        // trong quy trình duyệt hoặc đã duyệt thì không. Trước đây không kiểm tra
        // gì nên API xóa được ở mọi trạng thái dù giao diện có chặn.
        ApprovalStatus status = entity.getApprovalStatus();
        boolean deletable = status == null
                || status == ApprovalStatus.DRAFT
                || status == ApprovalStatus.REJECTED_LEVEL1
                || status == ApprovalStatus.REJECTED_LEVEL2;
        if (!deletable) {
            throw new IllegalStateException(
                    "Chỉ xóa được hồ sơ ở trạng thái Lưu tạm hoặc Bị trả về. Trạng thái hiện tại: "
                            + status.getLabel());
        }

        String code = entity.getCode() != null ? entity.getCode() : entity.getDeviceCode();
        entity.softDelete(SecurityUtils.getCurrentUserId());
        entity.setApprovalStatus(ApprovalStatus.ARCHIVED);
        entity.setStatus(StationStatus.DELETED);
        repository.save(entity);

        historyService.recordHistory(
                InfrastructureType.INMARSAT_STATION,
                entity.getId(),
                StationHistoryActionType.DELETE,
                "Hoạt động",
                "Xóa mềm đài Inmarsat",
                SecurityUtils.getCurrentUserId());
    }

    @Transactional(readOnly = true)
    public CoastalStationInmarsat getStationById(UUID id) {
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đài Inmarsat với id: " + id));
        if (entity.getOrgUnitId() != null) {
            validateAllowedOrgUnit(entity.getOrgUnitId());
        }
        return entity;
    }

    @Transactional(readOnly = true)
    public List<CoastalStationInmarsat> getAllStations() {
        return repository.findAllActive();
    }

    @Transactional(readOnly = true)
    public List<CoastalStationInmarsat> searchStations(String keyword) {
        return repository.searchGis(null, keyword);
    }

    @Transactional(readOnly = true)
    public Optional<CoastalStationInmarsat> findByDeviceCode(String deviceCode) {
        return repository.findByDeviceCode(deviceCode);
    }

    // --- QUY TRÌNH PHÊ DUYỆT 2 CẤP (F-101) ---

    public CoastalStationInmarsat submit(UUID id) {
        CoastalStationInmarsat entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        // Quy tắc 14: người gửi thuộc cấp Cục -> bỏ qua vòng 1, vào thẳng "Chờ Cục duyệt".
        // Kiểm tra trạng thái hợp lệ và ghi nhật ký do service dùng chung đảm nhiệm.
        approvalService.submit(entity, InfrastructureType.INMARSAT_STATION, currentUserId);

        entity.setSubmittedAt(LocalDateTime.now());
        entity.setSubmittedBy(currentUserId);
        entity.setRejectionReason(null);
        syncStationStatus(entity);
        return repository.save(entity);
    }

    public CoastalStationInmarsat approveLevel1(UUID id) {
        CoastalStationInmarsat entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        // Chống tự duyệt 4 mắt (quy tắc 8) do service dùng chung đảm nhiệm.
        approvalService.approveC1(entity, InfrastructureType.INMARSAT_STATION, "APPROVED", null, currentUserId);
        syncStationStatus(entity);
        return repository.save(entity);
    }

    public CoastalStationInmarsat approveLevel2(UUID id) {
        CoastalStationInmarsat entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        approvalService.approveC2(entity, InfrastructureType.INMARSAT_STATION, "APPROVED", null, currentUserId);
        entity.setApprovedBy(currentUserId);
        entity.setApprovedDate(LocalDateTime.now());
        syncStationStatus(entity);
        return repository.save(entity);
    }

    public CoastalStationInmarsat reject(UUID id, String rejectionReason) {
        CoastalStationInmarsat entity = getStationById(id);
        // Quy tắc 5: từ chối ở bất kỳ vòng nào đều bắt buộc lý do tối thiểu 10 ký tự
        if (rejectionReason == null || rejectionReason.trim().length() < 10) {
            throw new IllegalArgumentException("Lý do từ chối phải có ít nhất 10 ký tự");
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        boolean isLevel2 = entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1;
        if (isLevel2) {
            approvalService.approveC2(entity, InfrastructureType.INMARSAT_STATION, "REJECTED",
                    rejectionReason.trim(), currentUserId);
        } else {
            approvalService.approveC1(entity, InfrastructureType.INMARSAT_STATION, "REJECTED",
                    rejectionReason.trim(), currentUserId);
        }
        syncStationStatus(entity);
        CoastalStationInmarsat saved = repository.save(entity);
        historyService.recordHistory(
                InfrastructureType.INMARSAT_STATION,
                saved.getId(),
                StationHistoryActionType.REJECT,
                "Trạng thái phê duyệt",
                isLevel2 ? "Chờ Cục duyệt" : "Chờ Cảng vụ duyệt",
                "Từ chối",
                rejectionReason.trim(),
                currentUserId);
        return saved;
    }

    /**
     * Đồng bộ các trường hiển thị riêng của họ nhà trạm ({@code status}, {@code approvalLevel})
     * theo trạng thái phê duyệt chuẩn do service dùng chung đặt.
     */
    private void syncStationStatus(CoastalStationInmarsat entity) {
        ApprovalStatus st = entity.getApprovalStatus();
        if (st == null) {
            return;
        }
        switch (st) {
            case DRAFT, PROPOSED -> {
                entity.setStatus(StationStatus.DRAFT);
                entity.setApprovalLevel(ApprovalLevel.LEVEL_0);
            }
            case PENDING_APPROVAL -> {
                entity.setStatus(StationStatus.PENDING_APPROVAL);
                entity.setApprovalLevel(ApprovalLevel.LEVEL_0);
            }
            case APPROVED_LEVEL1 -> {
                entity.setStatus(StationStatus.APPROVED_L1);
                entity.setApprovalLevel(ApprovalLevel.LEVEL_1);
            }
            case APPROVED_LEVEL2, APPROVED -> {
                entity.setStatus(StationStatus.APPROVED_L2);
                entity.setApprovalLevel(ApprovalLevel.LEVEL_2);
            }
            case REJECTED, REJECTED_LEVEL1, REJECTED_LEVEL2 -> {
                entity.setStatus(StationStatus.DRAFT);
                entity.setApprovalLevel(ApprovalLevel.LEVEL_0);
            }
            default -> { }
        }
    }


    // Tương thích ngược phương thức cũ
    public CoastalStationInmarsat approveStation(UUID id, boolean approved, Long userId) {
        CoastalStationInmarsat entity = getStationById(id);
        if (approved) {
            if (entity.getApprovalStatus() == ApprovalStatus.PENDING_APPROVAL) {
                return approveLevel1(id);
            } else if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
                return approveLevel2(id);
            } else {
                return approveLevel1(id);
            }
        } else {
            return reject(id, "Từ chối phê duyệt bởi quản trị viên");
        }
    }

    public CoastalStationInmarsat rejectStation(UUID id, String rejectionReason, Long userId) {
        return reject(id, rejectionReason);
    }

    // --- LOOKUP OPTIONS CHO CÁC MODULE KHÁC LIÊN KẾT (Chỉ lấy APPROVED & OPERATIONAL) ---

    @Transactional(readOnly = true)
    public List<CoastalStationInmarsatOptionResponse> getOptions(UUID orgUnitId) {
        List<CoastalStationInmarsat> list = repository.findAllApprovedOptions(orgUnitId);
        return list.stream()
                .map(e -> CoastalStationInmarsatOptionResponse.builder()
                        .id(e.getId())
                        .code(e.getCode() != null ? e.getCode() : e.getDeviceCode())
                        .name(e.getName() != null ? e.getName() : e.getStationName())
                        .orgUnitId(e.getOrgUnitId() != null ? e.getOrgUnitId() : e.getUnitId())
                        .conditionStatus(e.getConditionStatus())
                        .build())
                .toList();
    }

    // --- LỊCH SỬ BIẾN ĐỘNG & KIỂM TOÁN (F-103) ---

    @Transactional(readOnly = true)
    public List<CoastalStationInmarsatHistoryResponse> getHistory(UUID id) {
        CoastalStationInmarsat entity = getStationById(id);
        String code = entity.getCode() != null ? entity.getCode() : entity.getDeviceCode();
        return historyService.getHistory(InfrastructureType.INMARSAT_STATION, entity.getId(), code).stream()
                .filter(h -> {
                    if (h.getActionType() == null) return false;
                    StationHistoryActionType act = h.getActionType();
                    if (act == StationHistoryActionType.APPROVE_L1 || act == StationHistoryActionType.APPROVE_L2 || act == StationHistoryActionType.REJECT) {
                        return false;
                    }
                    String changedField = h.getChangedField();
                    String newVal = h.getNewValue();
                    if ((changedField == null || "Thông tin".equals(changedField))
                            && newVal != null && (newVal.contains("Phê duyệt") || newVal.contains("Cập nhật thông tin đài Inmarsat"))) {
                        return false;
                    }
                    return true;
                })
                .map(h -> {
                    CoastalStationInmarsatHistoryResponse r = new CoastalStationInmarsatHistoryResponse();
                    r.setId(h.getId());
                    r.setDeviceCode(h.getStationCode());
                    r.setActionType(h.getActionType());
                    r.setChangedField(h.getChangedField());
                    r.setPreviousValue(h.getPreviousValue());
                    r.setNewValue(h.getNewValue());
                    r.setReason(h.getReason());
                    r.setApprovalLevel(h.getApprovalLevel());
                    r.setChangedBy(h.getChangedBy());
                    r.setChangedAt(h.getChangedAt());
                    return r;
                })
                .toList();
    }

    // --- BUILD RESPONSE DTO ---

    public CoastalStationInmarsatResponse buildResponse(CoastalStationInmarsat entity) {
        UUID effectiveOrgUnitId = entity.getOrgUnitId() != null ? entity.getOrgUnitId() : entity.getUnitId();
        String orgUnitName = effectiveOrgUnitId != null ? orgUnitCacheService.getName(effectiveOrgUnitId) : null;
        String operatingOrgName = entity.getOperatingOrgId() != null ? orgUnitCacheService.getName(entity.getOperatingOrgId()) : null;

        String createdByName = resolveUserName(entity.getCreatedBy());
        String updatedByName = resolveUserName(entity.getUpdatedBy());
        String submittedByName = resolveUserName(entity.getSubmittedBy());
        String approverNameL1 = resolveUserName(entity.getApproverLevel1());
        String approverNameL2 = resolveUserName(entity.getApproverLevel2());
        String approvedByName = resolveUserName(entity.getApprovedBy());

        return CoastalStationInmarsatResponse.builder()
                .id(entity.getId())
                .orgUnitId(effectiveOrgUnitId)
                .orgUnitName(orgUnitName)
                .operatingOrgId(entity.getOperatingOrgId())
                .operatingOrgName(operatingOrgName)
                .code(entity.getCode() != null ? entity.getCode() : entity.getDeviceCode())
                .deviceCode(entity.getDeviceCode() != null ? entity.getDeviceCode() : entity.getCode())
                .name(entity.getName() != null ? entity.getName() : entity.getStationName())
                .stationName(entity.getStationName() != null ? entity.getStationName() : entity.getName())
                .provinceId(entity.getProvinceId())
                .locationAddress(entity.getLocationAddress())
                .locationDetail(entity.getLocationDetail())
                .conditionStatus(entity.getConditionStatus())
                .status(entity.getStatus())
                .isActive(entity.getIsActive())
                .coverageZone(entity.getCoverageZone())
                .coverageArea(entity.getCoverageArea())
                .services(entity.getServices())
                .frequency(entity.getFrequency())
                .modemType(entity.getModemType())
                .sarCode(entity.getSarCode())
                .satelliteSystem(entity.getSatelliteSystem())
                .notes(entity.getNotes())
                .description(entity.getDescription())
                .contactPerson(entity.getContactPerson())
                .contactPhone(entity.getContactPhone())
                .spatialId(entity.getSpatialId())
                .objectType(entity.getObjectType())
                .symbol(entity.getSymbol())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .approvalStatus(entity.getApprovalStatus())
                .approvalLevel(entity.getApprovalLevel())
                .submittedAt(entity.getSubmittedAt())
                .submittedBy(entity.getSubmittedBy())
                .submittedByName(submittedByName)
                .approverLevel1(entity.getApproverLevel1())
                .approverNameLevel1(approverNameL1)
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approverLevel2(entity.getApproverLevel2())
                .approverNameLevel2(approverNameL2)
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .approvedBy(entity.getApprovedBy())
                .approvedByName(approvedByName)
                .approvedDate(entity.getApprovedDate())
                .rejectionReason(entity.getRejectionReason())
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .createdAt(entity.getCreatedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedByName(updatedByName)
                .updatedAt(entity.getUpdatedAt())
                .deletedBy(entity.getDeletedBy())
                .deletedAt(entity.getDeletedAt())
                .build();
    }

    private String resolveUserName(UUID userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
                .map(User::getFullName)
                .orElse(null);
    }

    public List<CoastalStationInmarsatAttachmentResponse> uploadAttachments(UUID id, List<org.springframework.web.multipart.MultipartFile> files, UUID userId) {
        CoastalStationInmarsat entity = getStationById(id);
        validateAllowedOrgUnit(entity.getOrgUnitId());

        long existingCount = attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.INMARSAT_STATION).size();
        if (existingCount + files.size() > 10) {
            throw new IllegalArgumentException("Tối đa 10 file đính kèm theo quy định");
        }

        java.nio.file.Path basePath = java.nio.file.Paths.get(attachmentPath != null ? attachmentPath : "uploads/inmarsat-attachments").toAbsolutePath().normalize();
        List<com.hanghai.kchtg.common.entity.InfrastructureAttachment> savedAttachments = new ArrayList<>();
        for (org.springframework.web.multipart.MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
            String storageFileName = System.currentTimeMillis() + "_" + originalFilename;

            try {
                java.nio.file.Path dir = basePath.resolve(InfrastructureType.INMARSAT_STATION.name()).resolve(id.toString());
                java.nio.file.Files.createDirectories(dir);
                java.nio.file.Path filePath = dir.resolve(storageFileName);
                file.transferTo(filePath.toFile());
            } catch (Exception e) {
                log.warn("Không thể lưu file {} cho đài inmarsat {}: {}", originalFilename, id, e.getMessage());
                throw new RuntimeException("Không thể lưu file: " + originalFilename);
            }

            com.hanghai.kchtg.common.entity.InfrastructureAttachment attachment = com.hanghai.kchtg.common.entity.InfrastructureAttachment.builder()
                    .refId(id)
                    .refType(InfrastructureType.INMARSAT_STATION)
                    .fileName(originalFilename)
                    .filePath(basePath.resolve(InfrastructureType.INMARSAT_STATION.name()).resolve(id.toString()).resolve(storageFileName).toString())
                    .fileSize(file.getSize())
                    .fileType(com.hanghai.kchtg.common.enums.AttachmentFileType.fromValue(file.getContentType()))
                    .uploadedBy(userId)
                    .build();
            savedAttachments.add(attachmentRepository.save(attachment));
        }
        return savedAttachments.stream().map(this::toAttachmentResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CoastalStationInmarsatAttachmentResponse> listAttachments(UUID id) {
        return attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.INMARSAT_STATION)
                .stream().map(this::toAttachmentResponse).toList();
    }

    public void deleteAttachment(UUID id, UUID attachmentId, UUID userId) {
        CoastalStationInmarsat entity = getStationById(id);
        validateAllowedOrgUnit(entity.getOrgUnitId());

        com.hanghai.kchtg.common.entity.InfrastructureAttachment attachment = attachmentRepository.findByIdAndRefIdAndRefType(attachmentId, id, InfrastructureType.INMARSAT_STATION)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm với ID: " + attachmentId));
        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
        } catch (Exception e) {
            log.warn("Không thể xóa file vật lý {}: {}", attachment.getFilePath(), e.getMessage());
        }
        attachmentRepository.delete(attachment);
    }

    public com.hanghai.kchtg.common.entity.InfrastructureAttachment getAttachment(UUID id, UUID attachmentId) {
        return attachmentRepository.findByIdAndRefIdAndRefType(attachmentId, id, InfrastructureType.INMARSAT_STATION)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm với ID: " + attachmentId));
    }

    private CoastalStationInmarsatAttachmentResponse toAttachmentResponse(com.hanghai.kchtg.common.entity.InfrastructureAttachment a) {
        String uploadedByName = a.getUploadedBy() != null
                ? userRepository.findById(a.getUploadedBy()).map(User::getFullName).orElse(a.getUploadedBy().toString())
                : "Cán bộ quản lý";
        return CoastalStationInmarsatAttachmentResponse.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .filePath(a.getFilePath())
                .fileSize(a.getFileSize())
                .documentType(a.getFileType() != null ? a.getFileType().getCode() : "OTHER")
                .uploadedBy(a.getUploadedBy())
                .uploadedByName(uploadedByName)
                .uploadedDate(a.getUploadedDate())
                .build();
    }

    private void validateCoordinates(BigDecimal longitude, BigDecimal latitude) {
        if (longitude != null) {
            double lon = longitude.doubleValue();
            if (lon < -180.0 || lon > 180.0) {
                throw new IllegalArgumentException("Kinh độ phải trong khoảng -180~180 (WGS84)");
            }
        }
        if (latitude != null) {
            double lat = latitude.doubleValue();
            if (lat < -90.0 || lat > 90.0) {
                throw new IllegalArgumentException("Vĩ độ phải trong khoảng -90~90 (WGS84)");
            }
        }
    }
}
