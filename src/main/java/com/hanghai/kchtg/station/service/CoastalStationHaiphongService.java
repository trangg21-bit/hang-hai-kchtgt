package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.dto.haiphong.*;
import com.hanghai.kchtg.station.entity.CoastalStationHaiphong;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.repository.CoastalStationHaiphongRepository;
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

import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.common.entity.OperatingOrganization;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CoastalStationHaiphongService {

    private final CoastalStationHaiphongRepository repository;
    private final InfrastructureApprovalService approvalService;
    private final HistoryService historyService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final OrgUnitRepository orgUnitRepository;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OperatingOrganizationRepository operatingOrganizationRepository;
    private final UserRepository userRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository attachmentRepository;

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
        String code = String.format("TTXLTT-%04d", next);
        while (repository.existsByCodeAndDeletedAtIsNull(code)) {
            next++;
            code = String.format("TTXLTT-%04d", next);
        }
        return code;
    }

    // --- TÌM KIẾM PHÂN TRANG & THỐNG KÊ TAB ---

    @Transactional(readOnly = true)
    public Page<CoastalStationHaiphongResponse> searchPaged(
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

        Scope scope = resolveEffectiveScope(orgUnitId);
        boolean scopeEnabled = !scope.unrestricted();
        List<UUID> scopeOrgUnitIds = scope.orgUnitIds();

        String kw = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%" : null;

        Page<CoastalStationHaiphong> page = repository.searchPaged(
                scopeEnabled, scopeOrgUnitIds, orgUnitId, kw, operatingOrgId, provinceId,
                conditionStatus, approvalStatus, updatedBy, updatedFrom, updatedTo, pageable);

        return page.map(this::buildResponse);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByApprovalStatus(UUID orgUnitId, String keyword, String conditionStatus) {
        Scope scope = resolveEffectiveScope(orgUnitId);
        boolean scopeEnabled = !scope.unrestricted();
        List<UUID> scopeOrgUnitIds = scope.orgUnitIds();

        String kw = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + keyword.trim().toLowerCase() + "%" : null;

        List<Object[]> rawCounts = repository.countByApprovalStatus(
                scopeEnabled, scopeOrgUnitIds, orgUnitId, kw, conditionStatus);

        Map<ApprovalStatus, Long> countsByStatus = new EnumMap<>(ApprovalStatus.class);
        for (Object[] row : rawCounts) {
            ApprovalStatus status = (ApprovalStatus) row[0];
            Long count = (Long) row[1];
            countsByStatus.put(status, count);
        }

        Map<String, Long> result = new LinkedHashMap<>();
        long draft = countsByStatus.getOrDefault(ApprovalStatus.DRAFT, 0L);
        long pending = countsByStatus.getOrDefault(ApprovalStatus.PENDING_APPROVAL, 0L)
                + countsByStatus.getOrDefault(ApprovalStatus.PROPOSED, 0L);
        long approvedL1 = countsByStatus.getOrDefault(ApprovalStatus.APPROVED_LEVEL1, 0L);
        long approved = countsByStatus.getOrDefault(ApprovalStatus.APPROVED, 0L)
                + countsByStatus.getOrDefault(ApprovalStatus.APPROVED_LEVEL2, 0L);
        long rejected = countsByStatus.getOrDefault(ApprovalStatus.REJECTED, 0L)
                + countsByStatus.getOrDefault(ApprovalStatus.REJECTED_LEVEL1, 0L)
                + countsByStatus.getOrDefault(ApprovalStatus.REJECTED_LEVEL2, 0L);
        long all = draft + pending + approvedL1 + approved + rejected;

        result.put("all", all);
        result.put("draft", draft);
        result.put("pending", pending);
        result.put("approvedL1", approvedL1);
        result.put("approved", approved);
        result.put("rejected", rejected);

        return result;
    }

    @Transactional(readOnly = true)
    public CoastalStationHaiphong getStationById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Đài TTXLTT với ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<CoastalStationHaiphongResponse> findApprovedOptions(UUID orgUnitId) {
        Scope scope = resolveEffectiveScope(orgUnitId);
        List<CoastalStationHaiphong> list = repository.findApprovedOptions(
                !scope.unrestricted(), scope.orgUnitIds(), orgUnitId);
        return list.stream().map(this::buildResponse).toList();
    }

    // --- CRUD & PHÊ DUYỆT 2 CẤP ---

    public CoastalStationHaiphong createStation(CoastalStationHaiphongRequest request) {
        FieldWriteGuard.validateObject(request);

        UUID targetOrgUnitId = request.getOrgUnitId();
        if (targetOrgUnitId != null) {
            validateAllowedOrgUnit(targetOrgUnitId);
        }

        String code = request.getCode() != null && !request.getCode().isBlank()
                ? request.getCode().trim() : generateCode();

        if (repository.existsByCodeAndDeletedAtIsNull(code)) {
            throw new IllegalArgumentException("Mã đài TTXLTT '" + code + "' đã tồn tại trong hệ thống");
        }

        CoastalStationHaiphong entity = new CoastalStationHaiphong();
        entity.setOrgUnitId(targetOrgUnitId);
        entity.setUnitId(targetOrgUnitId);
        entity.setOperatingOrgId(request.getOperatingOrgId());
        entity.setProvinceId(request.getProvinceId());
        entity.setCode(code);
        entity.setStationCode(code);
        entity.setName(request.getName() != null ? request.getName() : request.getStationName());
        entity.setStationName(entity.getName());
        entity.setLocationAddress(request.getLocationAddress());
        entity.setConditionStatus(request.getConditionStatus() != null ? request.getConditionStatus() : "OPERATIONAL");
        entity.setStatus(StationStatus.DRAFT);
        entity.setApprovalStatus(ApprovalStatus.DRAFT);

        entity.setPortName(request.getPortName());
        entity.setDistrict(request.getDistrict());
        entity.setWard(request.getWard());
        entity.setOperationalLicense(request.getOperationalLicense());
        entity.setLicenseExpiry(request.getLicenseExpiry());
        entity.setInspectorName(request.getInspectorName());
        entity.setInspectorPhone(request.getInspectorPhone());
        entity.setLastInspectionDate(request.getLastInspectionDate());
        entity.setNextInspectionDate(request.getNextInspectionDate());
        entity.setCoverageArea(request.getCoverageArea());
        entity.setEquipmentType(request.getEquipmentType());
        entity.setCommunicationFrequency(request.getCommunicationFrequency());
        entity.setServicesProvided(request.getServicesProvided());
        entity.setDescription(request.getDescription());
        entity.setContactPerson(request.getContactPerson());
        entity.setContactPhone(request.getContactPhone());

        // GIS
        entity.setGeometryType(request.getGeometryType() != null ? request.getGeometryType() : "POINT");
        entity.setSymbol(request.getSymbol());
        entity.setCoordinateSystem(request.getCoordinateSystem() != null ? request.getCoordinateSystem() : "WGS84");
        entity.setDisplayRule(request.getDisplayRule());
        entity.setLatitude(request.getLatitude());
        entity.setLongitude(request.getLongitude());

        CoastalStationHaiphong saved = repository.save(entity);

        if (request.getCoordinates() != null && !request.getCoordinates().isBlank()) {
            UUID spatialId = gisSpatialObjectService.syncSpatialObject(
                    null,
                    "Đài TTXLTT " + saved.getName(),
                    "HAIPHONG_" + saved.getId(),
                    GisGeometryType.POINT,
                    request.getCoordinates(),
                    saved.getId(),
                    InfrastructureType.HANOI_STATION);
            saved.setSpatialId(spatialId);
            saved = repository.save(saved);
        }

        historyService.recordHistory(
                InfrastructureType.HANOI_STATION,
                saved.getId(),
                StationHistoryActionType.CREATE,
                null,
                "Tạo mới Đài TTXLTT: " + saved.getName(),
                SecurityUtils.getCurrentUserId());

        return saved;
    }

    public CoastalStationHaiphong updateStation(UUID id, CoastalStationHaiphongUpdateRequest request) {
        FieldWriteGuard.validateObject(request);
        CoastalStationHaiphong entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Đài TTXLTT với ID: " + id));

        approvalService.assertEditable(entity);

        boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        Map<String, String> oldValues = new LinkedHashMap<>();
        if (wasApproved) {
            if (request.getName() != null && !Objects.equals(request.getName(), entity.getName())) {
                oldValues.put("Tên đài", entity.getName() != null ? entity.getName() : "—");
            }
            if (request.getOrgUnitId() != null && !Objects.equals(request.getOrgUnitId(), entity.getOrgUnitId())) {
                String oldName = entity.getOrgUnitId() != null ? orgUnitCacheService.getName(entity.getOrgUnitId()) : "—";
                oldValues.put("Đơn vị quản lý", oldName != null ? oldName : "—");
            }
            if (request.getOperatingOrgId() != null && !Objects.equals(request.getOperatingOrgId(), entity.getOperatingOrgId())) {
                String oldName = entity.getOperatingOrgId() != null ? resolveOperatingOrgName(entity.getOperatingOrgId()) : "—";
                oldValues.put("Đơn vị khai thác", oldName != null ? oldName : "—");
            }
            if (request.getProvinceId() != null && !Objects.equals(request.getProvinceId(), entity.getProvinceId())) {
                oldValues.put("Địa điểm (Tỉnh/TP)", entity.getProvinceId() != null ? String.valueOf(entity.getProvinceId()) : "—");
            }
            if (request.getLocationAddress() != null && !Objects.equals(request.getLocationAddress(), entity.getLocationAddress())) {
                oldValues.put("Địa điểm chi tiết", entity.getLocationAddress() != null ? entity.getLocationAddress() : "—");
            }
            if (request.getConditionStatus() != null && !Objects.equals(request.getConditionStatus(), entity.getConditionStatus())) {
                oldValues.put("Tình trạng", entity.getConditionStatus() != null ? entity.getConditionStatus() : "—");
            }
            if (request.getPortName() != null && !Objects.equals(request.getPortName(), entity.getPortName())) {
                oldValues.put("Cảng biển", entity.getPortName() != null ? entity.getPortName() : "—");
            }
            if (request.getDistrict() != null && !Objects.equals(request.getDistrict(), entity.getDistrict())) {
                oldValues.put("Quận/Huyện", entity.getDistrict() != null ? entity.getDistrict() : "—");
            }
            if (request.getWard() != null && !Objects.equals(request.getWard(), entity.getWard())) {
                oldValues.put("Phường/Xã", entity.getWard() != null ? entity.getWard() : "—");
            }
            if (request.getOperationalLicense() != null && !Objects.equals(request.getOperationalLicense(), entity.getOperationalLicense())) {
                oldValues.put("Giấy phép hoạt động", entity.getOperationalLicense() != null ? entity.getOperationalLicense() : "—");
            }
            if (request.getLicenseExpiry() != null && !Objects.equals(request.getLicenseExpiry(), entity.getLicenseExpiry())) {
                oldValues.put("Hạn giấy phép", entity.getLicenseExpiry() != null ? String.valueOf(entity.getLicenseExpiry()) : "—");
            }
            if (request.getInspectorName() != null && !Objects.equals(request.getInspectorName(), entity.getInspectorName())) {
                oldValues.put("Cán bộ kiểm định", entity.getInspectorName() != null ? entity.getInspectorName() : "—");
            }
            if (request.getInspectorPhone() != null && !Objects.equals(request.getInspectorPhone(), entity.getInspectorPhone())) {
                oldValues.put("SĐT cán bộ kiểm định", entity.getInspectorPhone() != null ? entity.getInspectorPhone() : "—");
            }
            if (request.getLastInspectionDate() != null && !Objects.equals(request.getLastInspectionDate(), entity.getLastInspectionDate())) {
                oldValues.put("Ngày kiểm định gần nhất", entity.getLastInspectionDate() != null ? String.valueOf(entity.getLastInspectionDate()) : "—");
            }
            if (request.getNextInspectionDate() != null && !Objects.equals(request.getNextInspectionDate(), entity.getNextInspectionDate())) {
                oldValues.put("Ngày kiểm định tiếp theo", entity.getNextInspectionDate() != null ? String.valueOf(entity.getNextInspectionDate()) : "—");
            }
            if (request.getCoverageArea() != null && !Objects.equals(request.getCoverageArea(), entity.getCoverageArea())) {
                oldValues.put("Vùng phủ sóng", entity.getCoverageArea() != null ? entity.getCoverageArea() : "—");
            }
            if (request.getEquipmentType() != null && !Objects.equals(request.getEquipmentType(), entity.getEquipmentType())) {
                oldValues.put("Loại thiết bị", entity.getEquipmentType() != null ? entity.getEquipmentType() : "—");
            }
            if (request.getCommunicationFrequency() != null && !Objects.equals(request.getCommunicationFrequency(), entity.getCommunicationFrequency())) {
                oldValues.put("Tần số liên lạc", entity.getCommunicationFrequency() != null ? entity.getCommunicationFrequency() : "—");
            }
            if (request.getServicesProvided() != null && !Objects.equals(request.getServicesProvided(), entity.getServicesProvided())) {
                oldValues.put("Dịch vụ cung cấp", entity.getServicesProvided() != null ? entity.getServicesProvided() : "—");
            }
            if (request.getDescription() != null && !Objects.equals(request.getDescription(), entity.getDescription())) {
                oldValues.put("Ghi chú", entity.getDescription() != null ? entity.getDescription() : "—");
            }
            if (request.getContactPerson() != null && !Objects.equals(request.getContactPerson(), entity.getContactPerson())) {
                oldValues.put("Người liên hệ", entity.getContactPerson() != null ? entity.getContactPerson() : "—");
            }
            if (request.getContactPhone() != null && !Objects.equals(request.getContactPhone(), entity.getContactPhone())) {
                oldValues.put("Số điện thoại liên hệ", entity.getContactPhone() != null ? entity.getContactPhone() : "—");
            }

            // GIS fields
            if (request.getGeometryType() != null && !Objects.equals(request.getGeometryType(), entity.getGeometryType())) {
                oldValues.put("Loại đối tượng GIS", formatObjectTypeDisplay(entity.getGeometryType()));
            }
            if (request.getSymbol() != null && !Objects.equals(request.getSymbol(), entity.getSymbol())) {
                oldValues.put("Biểu tượng", gisSpatialObjectService != null ? gisSpatialObjectService.getSymbolDisplayName(entity.getSymbol()) : (entity.getSymbol() != null ? entity.getSymbol() : "—"));
            }
            if (request.getCoordinateSystem() != null && !Objects.equals(request.getCoordinateSystem(), entity.getCoordinateSystem())) {
                oldValues.put("Hệ quy chiếu", entity.getCoordinateSystem() != null ? entity.getCoordinateSystem() : "—");
            }
            if (request.getDisplayRule() != null && !Objects.equals(request.getDisplayRule(), entity.getDisplayRule())) {
                oldValues.put("Quy tắc hiển thị", entity.getDisplayRule() != null ? entity.getDisplayRule() : "—");
            }
            boolean latChanged = (request.getLatitude() != null && (entity.getLatitude() == null || request.getLatitude().compareTo(entity.getLatitude()) != 0))
                    || (request.getLatitude() == null && entity.getLatitude() != null);
            boolean lngChanged = (request.getLongitude() != null && (entity.getLongitude() == null || request.getLongitude().compareTo(entity.getLongitude()) != 0))
                    || (request.getLongitude() == null && entity.getLongitude() != null);

            String oldCoord = gisSpatialObjectService != null ? gisSpatialObjectService.getCoordinatesBySpatialId(entity.getSpatialId()) : null;
            if (oldCoord == null || oldCoord.isBlank()) {
                oldCoord = (entity.getLatitude() != null && entity.getLongitude() != null)
                        ? entity.getLatitude() + ", " + entity.getLongitude()
                        : (entity.getLatitude() != null ? "Vĩ độ: " + entity.getLatitude() : (entity.getLongitude() != null ? "Kinh độ: " + entity.getLongitude() : "—"));
            }
            String newCoord = request.getCoordinates();
            if (newCoord == null || newCoord.isBlank()) {
                newCoord = (request.getLatitude() != null && request.getLongitude() != null)
                        ? request.getLatitude() + ", " + request.getLongitude()
                        : (request.getLatitude() != null ? "Vĩ độ: " + request.getLatitude() : (request.getLongitude() != null ? "Kinh độ: " + request.getLongitude() : null));
            }
            boolean coordsChanged = (newCoord != null && !Objects.equals(newCoord, oldCoord)) || latChanged || lngChanged;
            if (coordsChanged) {
                oldValues.put("Tọa độ GIS", oldCoord != null ? oldCoord : "—");
            }
        }

        if (request.getOrgUnitId() != null) {
            validateAllowedOrgUnit(request.getOrgUnitId());
            entity.setOrgUnitId(request.getOrgUnitId());
            entity.setUnitId(request.getOrgUnitId());
        }

        if (request.getCode() != null && repository.existsByCodeAndIdNotAndDeletedAtIsNull(request.getCode().trim(), id)) {
            throw new IllegalArgumentException("Mã đài TTXLTT '" + request.getCode() + "' đã được sử dụng");
        }

        if (request.getOperatingOrgId() != null) entity.setOperatingOrgId(request.getOperatingOrgId());
        if (request.getProvinceId() != null) entity.setProvinceId(request.getProvinceId());
        if (request.getName() != null) {
            entity.setName(request.getName());
            entity.setStationName(request.getName());
        }
        if (request.getLocationAddress() != null) entity.setLocationAddress(request.getLocationAddress());
        if (request.getConditionStatus() != null) entity.setConditionStatus(request.getConditionStatus());

        if (request.getPortName() != null) entity.setPortName(request.getPortName());
        if (request.getDistrict() != null) entity.setDistrict(request.getDistrict());
        if (request.getWard() != null) entity.setWard(request.getWard());
        if (request.getOperationalLicense() != null) entity.setOperationalLicense(request.getOperationalLicense());
        if (request.getLicenseExpiry() != null) entity.setLicenseExpiry(request.getLicenseExpiry());
        if (request.getInspectorName() != null) entity.setInspectorName(request.getInspectorName());
        if (request.getInspectorPhone() != null) entity.setInspectorPhone(request.getInspectorPhone());
        if (request.getLastInspectionDate() != null) entity.setLastInspectionDate(request.getLastInspectionDate());
        if (request.getNextInspectionDate() != null) entity.setNextInspectionDate(request.getNextInspectionDate());
        if (request.getCoverageArea() != null) entity.setCoverageArea(request.getCoverageArea());
        if (request.getEquipmentType() != null) entity.setEquipmentType(request.getEquipmentType());
        if (request.getCommunicationFrequency() != null) entity.setCommunicationFrequency(request.getCommunicationFrequency());
        if (request.getServicesProvided() != null) entity.setServicesProvided(request.getServicesProvided());
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        if (request.getContactPerson() != null) entity.setContactPerson(request.getContactPerson());
        if (request.getContactPhone() != null) entity.setContactPhone(request.getContactPhone());

        if (request.getGeometryType() != null) entity.setGeometryType(request.getGeometryType());
        if (request.getSymbol() != null) entity.setSymbol(request.getSymbol());
        if (request.getCoordinateSystem() != null) entity.setCoordinateSystem(request.getCoordinateSystem());
        if (request.getDisplayRule() != null) entity.setDisplayRule(request.getDisplayRule());
        if (request.getLatitude() != null) entity.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) entity.setLongitude(request.getLongitude());

        if (request.getCoordinates() != null && !request.getCoordinates().isBlank()) {
            UUID spatialId = gisSpatialObjectService.syncSpatialObject(
                    entity.getSpatialId(),
                    "Đài TTXLTT " + entity.getName(),
                    "HAIPHONG_" + entity.getId(),
                    GisGeometryType.POINT,
                    request.getCoordinates(),
                    entity.getId(),
                    InfrastructureType.HANOI_STATION);
            entity.setSpatialId(spatialId);
        }

        CoastalStationHaiphong updated = repository.save(entity);

        if (wasApproved && !oldValues.isEmpty()) {
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            historyService.recordDeltaChanges(
                    InfrastructureType.HANOI_STATION,
                    updated.getId(),
                    oldValues,
                    field -> getNewValueDisplay(field, updated),
                    currentUserId);
        }

        return updated;
    }

    private String resolveOperatingOrgName(UUID operatingOrgId) {
        if (operatingOrgId == null) return "—";
        return operatingOrganizationRepository.findById(operatingOrgId)
                .map(OperatingOrganization::getName)
                .orElse("—");
    }

    private String getNewValueDisplay(String fieldName, CoastalStationHaiphong entity) {
        if (entity == null || fieldName == null) return "—";
        return switch (fieldName) {
            case "Tên đài" -> entity.getName() != null ? entity.getName() : "—";
            case "Đơn vị quản lý" -> entity.getOrgUnitId() != null ? orgUnitCacheService.getName(entity.getOrgUnitId()) : "—";
            case "Đơn vị khai thác" -> entity.getOperatingOrgId() != null ? resolveOperatingOrgName(entity.getOperatingOrgId()) : "—";
            case "Địa điểm (Tỉnh/TP)" -> entity.getProvinceId() != null ? String.valueOf(entity.getProvinceId()) : "—";
            case "Địa điểm chi tiết" -> entity.getLocationAddress() != null ? entity.getLocationAddress() : "—";
            case "Tình trạng" -> entity.getConditionStatus() != null ? entity.getConditionStatus() : "—";
            case "Cảng biển" -> entity.getPortName() != null ? entity.getPortName() : "—";
            case "Quận/Huyện" -> entity.getDistrict() != null ? entity.getDistrict() : "—";
            case "Phường/Xã" -> entity.getWard() != null ? entity.getWard() : "—";
            case "Giấy phép hoạt động" -> entity.getOperationalLicense() != null ? entity.getOperationalLicense() : "—";
            case "Hạn giấy phép" -> entity.getLicenseExpiry() != null ? String.valueOf(entity.getLicenseExpiry()) : "—";
            case "Cán bộ kiểm định" -> entity.getInspectorName() != null ? entity.getInspectorName() : "—";
            case "SĐT cán bộ kiểm định" -> entity.getInspectorPhone() != null ? entity.getInspectorPhone() : "—";
            case "Ngày kiểm định gần nhất" -> entity.getLastInspectionDate() != null ? String.valueOf(entity.getLastInspectionDate()) : "—";
            case "Ngày kiểm định tiếp theo" -> entity.getNextInspectionDate() != null ? String.valueOf(entity.getNextInspectionDate()) : "—";
            case "Vùng phủ sóng" -> entity.getCoverageArea() != null ? entity.getCoverageArea() : "—";
            case "Loại thiết bị" -> entity.getEquipmentType() != null ? entity.getEquipmentType() : "—";
            case "Tần số liên lạc" -> entity.getCommunicationFrequency() != null ? entity.getCommunicationFrequency() : "—";
            case "Dịch vụ cung cấp" -> entity.getServicesProvided() != null ? entity.getServicesProvided() : "—";
            case "Ghi chú" -> entity.getDescription() != null ? entity.getDescription() : "—";
            case "Người liên hệ" -> entity.getContactPerson() != null ? entity.getContactPerson() : "—";
            case "Số điện thoại liên hệ" -> entity.getContactPhone() != null ? entity.getContactPhone() : "—";
            case "Loại đối tượng", "Loại đối tượng GIS" -> formatObjectTypeDisplay(entity.getGeometryType());
            case "Biểu tượng" -> gisSpatialObjectService != null ? gisSpatialObjectService.getSymbolDisplayName(entity.getSymbol()) : (entity.getSymbol() != null ? entity.getSymbol() : "—");
            case "Hệ quy chiếu" -> entity.getCoordinateSystem() != null ? entity.getCoordinateSystem() : "—";
            case "Quy tắc hiển thị" -> entity.getDisplayRule() != null ? entity.getDisplayRule() : "—";
            case "Tọa độ", "Tọa độ GIS", "Tọa độ GPS" -> {
                String c = gisSpatialObjectService != null ? gisSpatialObjectService.getCoordinatesBySpatialId(entity.getSpatialId()) : null;
                if (c != null && !c.isBlank()) yield c;
                yield (entity.getLatitude() != null && entity.getLongitude() != null)
                        ? entity.getLatitude() + ", " + entity.getLongitude()
                        : (entity.getLatitude() != null ? "Vĩ độ: " + entity.getLatitude() : (entity.getLongitude() != null ? "Kinh độ: " + entity.getLongitude() : "—"));
            }
            default -> "—";
        };
    }

    private String formatObjectTypeDisplay(String objectType) {
        if (objectType == null || objectType.isBlank()) return "—";
        return switch (objectType.toUpperCase()) {
            case "POINT" -> "Đối tượng điểm";
            case "LINE" -> "Đối tượng đường";
            case "POLYGON" -> "Đối tượng vùng";
            default -> objectType;
        };
    }

    public void deleteStation(UUID id) {
        CoastalStationHaiphong entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Đài TTXLTT với ID: " + id));

        approvalService.assertDeletable(entity);
        validateAllowedOrgUnit(entity.getOrgUnitId());

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        approvalService.deleteDraft(entity, InfrastructureType.HANOI_STATION, currentUserId);
        repository.delete(entity);

        historyService.recordHistory(
                InfrastructureType.HANOI_STATION,
                entity.getId(),
                StationHistoryActionType.DELETE,
                null,
                "Xóa Đài TTXLTT: " + entity.getName(),
                currentUserId);
    }

    public CoastalStationHaiphong submit(UUID id) {
        CoastalStationHaiphong entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.submit(entity, InfrastructureType.HANOI_STATION, currentUserId);
        entity.setStatus(StationStatus.PENDING_APPROVAL);
        return repository.save(entity);
    }

    public CoastalStationHaiphong approveLevel1(UUID id) {
        CoastalStationHaiphong entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        validateAllowedOrgUnit(entity.getOrgUnitId());
        validateNotSelfApproval(entity.getCreatedBy(), currentUserId);
        approvalService.approveC1(entity, InfrastructureType.HANOI_STATION, "Duyệt cấp 1", "Đủ điều kiện", currentUserId);
        return repository.save(entity);
    }

    public CoastalStationHaiphong approveLevel2(UUID id) {
        CoastalStationHaiphong entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        validateNotSelfApproval(entity.getCreatedBy(), currentUserId);
        approvalService.approveC2(entity, InfrastructureType.HANOI_STATION, "Duyệt cấp 2", "Đồng ý ban hành", currentUserId);
        entity.setStatus(StationStatus.APPROVED_L2);
        return repository.save(entity);
    }

    public CoastalStationHaiphong reject(UUID id, String reason) {
        CoastalStationHaiphong entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            approvalService.approveC2(entity, InfrastructureType.HANOI_STATION, ApprovalStatus.REJECTED_LEVEL2.name(), reason, currentUserId);
        } else {
            approvalService.approveC1(entity, InfrastructureType.HANOI_STATION, ApprovalStatus.REJECTED_LEVEL1.name(), reason, currentUserId);
        }
        entity.setRejectionReason(reason);
        return repository.save(entity);
    }

    // Legacy method adaptors for existing controller tests
    public CoastalStationHaiphong approveStation(UUID id, Boolean approved, Long level) {
        if (Boolean.TRUE.equals(approved)) {
            if (level != null && level == 2) {
                return approveLevel2(id);
            }
            return approveLevel1(id);
        }
        return reject(id, "Từ chối duyệt hồ sơ");
    }

    public CoastalStationHaiphong rejectStation(UUID id, String reason, Long level) {
        return reject(id, reason);
    }

    public List<CoastalStationHaiphong> getAllStations() {
        return repository.findAllActive();
    }

    public List<CoastalStationHaiphong> searchStations(String keyword) {
        return repository.search(keyword);
    }

    public List<CoastalStationHaiphong> findByPortName(String portName) {
        return repository.findByPortName(portName);
    }

    public List<CoastalStationHaiphongHistoryResponse> getHistory(UUID id) {
        return List.of();
    }

    // --- RESPONSE BUILDER ---

    public CoastalStationHaiphongResponse buildResponse(CoastalStationHaiphong entity) {
        if (entity == null) return null;

        String orgUnitName = null;
        UUID effectiveOrgId = entity.getOrgUnitId();
        if (effectiveOrgId != null) {
            orgUnitName = orgUnitRepository.findById(effectiveOrgId).map(OrgUnit::getName).orElse(null);
        }

        String opOrgName = null;
        if (entity.getOperatingOrgId() != null) {
            opOrgName = orgUnitRepository.findById(entity.getOperatingOrgId()).map(OrgUnit::getName).orElse(null);
        }

        String createdByName = resolveUserName(entity.getCreatedBy());
        String updatedByName = resolveUserName(entity.getUpdatedBy());
        String approver1Name = resolveUserName(entity.getApproverLevel1());
        String approver2Name = resolveUserName(entity.getApproverLevel2());

        return CoastalStationHaiphongResponse.builder()
                .id(entity.getId())
                .orgUnitId(effectiveOrgId)
                .orgUnitName(orgUnitName)
                .operatingOrgId(entity.getOperatingOrgId())
                .operatingOrgName(opOrgName)
                .provinceId(entity.getProvinceId())
                .code(entity.getCode() != null ? entity.getCode() : entity.getStationCode())
                .stationCode(entity.getCode() != null ? entity.getCode() : entity.getStationCode())
                .name(entity.getName() != null ? entity.getName() : entity.getStationName())
                .stationName(entity.getName() != null ? entity.getName() : entity.getStationName())
                .locationAddress(entity.getLocationAddress())
                .conditionStatus(entity.getConditionStatus())
                .status(entity.getStatus())
                .portName(entity.getPortName())
                .district(entity.getDistrict())
                .ward(entity.getWard())
                .operationalLicense(entity.getOperationalLicense())
                .licenseExpiry(entity.getLicenseExpiry())
                .inspectorName(entity.getInspectorName())
                .inspectorPhone(entity.getInspectorPhone())
                .lastInspectionDate(entity.getLastInspectionDate())
                .nextInspectionDate(entity.getNextInspectionDate())
                .coverageArea(entity.getCoverageArea())
                .equipmentType(entity.getEquipmentType())
                .communicationFrequency(entity.getCommunicationFrequency())
                .servicesProvided(entity.getServicesProvided())
                .description(entity.getDescription())
                .contactPerson(entity.getContactPerson())
                .contactPhone(entity.getContactPhone())
                .spatialId(entity.getSpatialId())
                .geometryType(entity.getGeometryType())
                .symbol(entity.getSymbol())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .approvalStatus(entity.getApprovalStatus())
                .submittedAt(entity.getSubmittedAt())
                .submittedBy(entity.getSubmittedBy())
                .approverLevel1(entity.getApproverLevel1())
                .approverLevel1Name(approver1Name)
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approverLevel2(entity.getApproverLevel2())
                .approverLevel2Name(approver2Name)
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .rejectionReason(entity.getRejectionReason())
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .createdAt(entity.getCreatedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedByName(updatedByName)
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private String resolveUserName(UUID userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
                .map(u -> (u.getFullName() != null && !u.getFullName().isBlank()) ? u.getFullName() : u.getUsername())
                .orElse(null);
    }

    // ── Attachment handling ──

    public List<CoastalStationHaiphongAttachmentResponse> uploadAttachments(
            UUID id,
            List<org.springframework.web.multipart.MultipartFile> files,
            UUID userId) {
        CoastalStationHaiphong entity = getStationById(id);
        validateAllowedOrgUnit(entity.getOrgUnitId());

        java.nio.file.Path basePath = java.nio.file.Paths.get("uploads", "haiphong-attachments");
        List<com.hanghai.kchtg.common.entity.InfrastructureAttachment> savedAttachments = new ArrayList<>();

        for (org.springframework.web.multipart.MultipartFile file : files) {
            if (file.isEmpty()) continue;

            String originalFilename = file.getOriginalFilename();
            String storageFileName = System.currentTimeMillis() + "_" + (originalFilename != null ? originalFilename : "unnamed");
            java.nio.file.Path targetDir = basePath.resolve(InfrastructureType.HANOI_STATION.name()).resolve(id.toString());
            java.nio.file.Path targetPath = targetDir.resolve(storageFileName);

            try {
                java.nio.file.Files.createDirectories(targetDir);
                file.transferTo(targetPath);
            } catch (java.io.IOException e) {
                throw new RuntimeException("Không thể lưu file: " + originalFilename, e);
            }

            com.hanghai.kchtg.common.entity.InfrastructureAttachment attachment = com.hanghai.kchtg.common.entity.InfrastructureAttachment.builder()
                    .refId(id)
                    .refType(InfrastructureType.HANOI_STATION)
                    .fileName(originalFilename)
                    .filePath(basePath.resolve(InfrastructureType.HANOI_STATION.name()).resolve(id.toString()).resolve(storageFileName).toString())
                    .fileSize(file.getSize())
                    .fileType(com.hanghai.kchtg.common.enums.AttachmentFileType.fromValue(file.getContentType()))
                    .uploadedBy(userId)
                    .build();
            savedAttachments.add(attachmentRepository.save(attachment));

            if (historyService != null) {
                historyService.recordHistory(
                        InfrastructureType.HANOI_STATION,
                        id,
                        com.hanghai.kchtg.station.entity.StationHistoryActionType.UPDATE,
                        "Tài liệu đính kèm",
                        "—",
                        originalFilename,
                        "Tải lên tài liệu đính kèm: " + originalFilename,
                        userId
                );
            }
        }
        return savedAttachments.stream().map(this::toAttachmentResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CoastalStationHaiphongAttachmentResponse> listAttachments(UUID id) {
        return attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.HANOI_STATION)
                .stream().map(this::toAttachmentResponse).toList();
    }

    public void deleteAttachment(UUID id, UUID attachmentId, UUID userId) {
        CoastalStationHaiphong entity = getStationById(id);
        validateAllowedOrgUnit(entity.getOrgUnitId());

        com.hanghai.kchtg.common.entity.InfrastructureAttachment attachment = attachmentRepository.findByIdAndRefIdAndRefType(attachmentId, id, InfrastructureType.HANOI_STATION)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm với ID: " + attachmentId));
        String fileName = attachment.getFileName();
        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
        } catch (Exception e) {
            log.warn("Không thể xóa file vật lý {}: {}", attachment.getFilePath(), e.getMessage());
        }
        attachmentRepository.delete(attachment);

        if (historyService != null) {
            historyService.recordHistory(
                    InfrastructureType.HANOI_STATION,
                    id,
                    com.hanghai.kchtg.station.entity.StationHistoryActionType.UPDATE,
                    "Tài liệu đính kèm",
                    fileName,
                    "—",
                    "Xóa tài liệu đính kèm: " + fileName,
                    userId
            );
        }
    }

    public com.hanghai.kchtg.common.entity.InfrastructureAttachment getAttachment(UUID id, UUID attachmentId) {
        return attachmentRepository.findByIdAndRefIdAndRefType(attachmentId, id, InfrastructureType.HANOI_STATION)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm với ID: " + attachmentId));
    }

    private CoastalStationHaiphongAttachmentResponse toAttachmentResponse(com.hanghai.kchtg.common.entity.InfrastructureAttachment a) {
        String uploadedByName = a.getUploadedBy() != null
                ? userRepository.findById(a.getUploadedBy()).map(User::getFullName).orElse(a.getUploadedBy().toString())
                : null;
        return CoastalStationHaiphongAttachmentResponse.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .filePath(a.getFilePath())
                .fileSize(a.getFileSize())
                .documentType(a.getFileType() != null ? a.getFileType().name() : null)
                .uploadedBy(a.getUploadedBy())
                .uploadedByName(uploadedByName)
                .uploadedDate(a.getUploadedDate())
                .build();
    }
}
