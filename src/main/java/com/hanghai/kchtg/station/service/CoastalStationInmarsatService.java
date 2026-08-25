package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.dto.inmarsat.*;
import com.hanghai.kchtg.station.entity.CoastalStationInmarsat;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.repository.CoastalStationInmarsatRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
    private final HistoryService historyService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final UserRepository userRepository;

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

        RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
                : RecordSecurityLevel.NORMAL;
        RecordSecurityLevel.validateAssignment(secLevel, "coastalstationinmarsat",
                SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());

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
        entity.setSecurityLevel(secLevel);

        // Mặc định tạo mới là DRAFT (Lưu tạm)
        entity.setApprovalStatus(ApprovalStatus.DRAFT);

        CoastalStationInmarsat saved = repository.save(entity);
        historyService.recordHistory(
                saved.getCode(),
                StationHistoryActionType.CREATE,
                null,
                "Tạo mới đài Inmarsat (Lưu tạm)",
                String.valueOf(SecurityUtils.getCurrentUserId()),
                LocalDateTime.now());
        return saved;
    }

    public CoastalStationInmarsat updateStation(UUID id, CoastalStationInmarsatUpdateRequest request) {
        FieldWriteGuard.validateObject(request);
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đài Inmarsat với id: " + id));

        if (entity.getOrgUnitId() != null) {
            validateAllowedOrgUnit(entity.getOrgUnitId());
        }

        // Chỉ cho phép cập nhật khi ở trạng thái DRAFT hoặc bị từ chối
        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT &&
            entity.getApprovalStatus() != ApprovalStatus.REJECTED_LEVEL1 &&
            entity.getApprovalStatus() != ApprovalStatus.REJECTED_LEVEL2 &&
            !SecurityUtils.isElevatedAdministrator()) {
            throw new IllegalStateException("Chỉ được chỉnh sửa bản ghi ở trạng thái Lưu tạm hoặc Bị trả về");
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

        if (request.getSecurityLevel() != null) {
            RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "coastalstationinmarsat",
                    SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
            entity.setSecurityLevel(request.getSecurityLevel());
        }

        CoastalStationInmarsat saved = repository.save(entity);
        historyService.recordHistory(
                saved.getCode(),
                StationHistoryActionType.UPDATE,
                null,
                "Cập nhật thông tin đài Inmarsat",
                String.valueOf(SecurityUtils.getCurrentUserId()),
                LocalDateTime.now());
        return saved;
    }

    public void deleteStation(UUID id) {
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đài Inmarsat với id: " + id));

        if (entity.getOrgUnitId() != null) {
            validateAllowedOrgUnit(entity.getOrgUnitId());
        }

        String code = entity.getCode() != null ? entity.getCode() : entity.getDeviceCode();
        entity.softDelete(SecurityUtils.getCurrentUserId());
        entity.setApprovalStatus(ApprovalStatus.ARCHIVED);
        entity.setStatus(StationStatus.DELETED);
        repository.save(entity);

        historyService.recordHistory(
                code,
                StationHistoryActionType.DELETE,
                "Hoạt động",
                "Xóa mềm đài Inmarsat",
                String.valueOf(SecurityUtils.getCurrentUserId()),
                LocalDateTime.now());
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
        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT &&
            entity.getApprovalStatus() != ApprovalStatus.REJECTED_LEVEL1 &&
            entity.getApprovalStatus() != ApprovalStatus.REJECTED_LEVEL2) {
            throw new IllegalStateException("Chỉ bản ghi ở trạng thái Lưu tạm hoặc Bị trả về mới được gửi phê duyệt");
        }

        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        entity.setStatus(StationStatus.PENDING_APPROVAL);
        entity.setSubmittedAt(LocalDateTime.now());
        entity.setSubmittedBy(SecurityUtils.getCurrentUserId());
        entity.setRejectionReason(null);

        historyService.recordHistory(
                entity.getCode(),
                StationHistoryActionType.UPDATE,
                "Lưu tạm",
                "Gửi phê duyệt cấp Cảng vụ/Chi cục",
                String.valueOf(SecurityUtils.getCurrentUserId()),
                LocalDateTime.now());

        return repository.save(entity);
    }

    public CoastalStationInmarsat approveLevel1(UUID id) {
        CoastalStationInmarsat entity = getStationById(id);
        if (entity.getApprovalStatus() != ApprovalStatus.PENDING_APPROVAL) {
            throw new IllegalStateException("Bản ghi không ở trạng thái Chờ duyệt cấp Cảng vụ/Chi cục");
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        validateNotSelfApproval(entity.getCreatedBy(), currentUserId);

        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setStatus(StationStatus.APPROVED_L1);
        entity.setApprovalLevel(ApprovalLevel.LEVEL_1);
        entity.setApproverLevel1(currentUserId);
        entity.setApprovedDateLevel1(LocalDateTime.now());
        entity.setRejectionReason(null);

        historyService.recordHistory(
                entity.getCode(),
                StationHistoryActionType.APPROVE_L1,
                "Chờ duyệt C1",
                "Phê duyệt cấp 1 (Cảng vụ/Chi cục)",
                String.valueOf(currentUserId),
                LocalDateTime.now());

        return repository.save(entity);
    }

    public CoastalStationInmarsat approveLevel2(UUID id) {
        CoastalStationInmarsat entity = getStationById(id);
        if (entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL1) {
            throw new IllegalStateException("Bản ghi không ở trạng thái Chờ duyệt cấp Cục");
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        validateNotSelfApproval(entity.getCreatedBy(), currentUserId);

        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setStatus(StationStatus.APPROVED_L2);
        entity.setApprovalLevel(ApprovalLevel.LEVEL_2);
        entity.setApproverLevel2(currentUserId);
        entity.setApprovedDateLevel2(LocalDateTime.now());
        entity.setApprovedBy(currentUserId);
        entity.setApprovedDate(LocalDateTime.now());
        entity.setRejectionReason(null);

        historyService.recordHistory(
                entity.getCode(),
                StationHistoryActionType.APPROVE_L2,
                "Chờ duyệt C2",
                "Phê duyệt cấp 2 (Cục Hàng hải Việt Nam) - Ban hành chính thức",
                String.valueOf(currentUserId),
                LocalDateTime.now());

        return repository.save(entity);
    }

    public CoastalStationInmarsat reject(UUID id, String rejectionReason) {
        CoastalStationInmarsat entity = getStationById(id);
        if (entity.getApprovalStatus() != ApprovalStatus.PENDING_APPROVAL &&
            entity.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL1) {
            throw new IllegalStateException("Bản ghi không ở trạng thái Chờ duyệt để từ chối");
        }

        if (rejectionReason == null || rejectionReason.trim().length() < 10) {
            throw new IllegalArgumentException("Lý do từ chối phải có ít nhất 10 ký tự");
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        validateNotSelfApproval(entity.getCreatedBy(), currentUserId);

        ApprovalStatus nextStatus = (entity.getApprovalStatus() == ApprovalStatus.PENDING_APPROVAL)
                ? ApprovalStatus.REJECTED_LEVEL1
                : ApprovalStatus.REJECTED_LEVEL2;

        entity.setApprovalStatus(nextStatus);
        entity.setStatus(StationStatus.REJECTED);
        entity.setRejectionReason(rejectionReason.trim());

        historyService.recordHistory(
                entity.getCode(),
                StationHistoryActionType.REJECT,
                "Chờ duyệt",
                "Từ chối phê duyệt: " + rejectionReason.trim(),
                String.valueOf(currentUserId),
                LocalDateTime.now());

        return repository.save(entity);
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
        return historyService.getHistory(code).stream()
                .map(h -> {
                    CoastalStationInmarsatHistoryResponse r = new CoastalStationInmarsatHistoryResponse();
                    r.setId(h.getId());
                    r.setDeviceCode(h.getStationCode());
                    r.setActionType(h.getActionType());
                    r.setPreviousValue(h.getPreviousValue());
                    r.setNewValue(h.getNewValue());
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
                .securityLevel(entity.getSecurityLevel())
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
