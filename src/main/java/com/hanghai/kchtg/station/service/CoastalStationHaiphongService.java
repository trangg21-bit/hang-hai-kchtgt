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
    private final UserRepository userRepository;
    private final GisSpatialObjectService gisSpatialObjectService;

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

        historyService.recordHistory(
                InfrastructureType.HANOI_STATION,
                updated.getId(),
                StationHistoryActionType.UPDATE,
                null,
                "Cập nhật thông tin Đài TTXLTT: " + updated.getName(),
                SecurityUtils.getCurrentUserId());

        return updated;
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
}
