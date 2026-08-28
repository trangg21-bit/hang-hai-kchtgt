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
import com.hanghai.kchtg.station.dto.lrit.*;
import com.hanghai.kchtg.station.entity.CoastalStationLRIT;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.repository.CoastalStationLRITRepository;
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
public class CoastalStationLRITService {

    private final CoastalStationLRITRepository repository;
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
        String code = String.format("LRIT-%04d", next);
        while (repository.existsByCodeAndDeletedAtIsNull(code)) {
            next++;
            code = String.format("LRIT-%04d", next);
        }
        return code;
    }

    // --- TÌM KIẾM PHÂN TRANG & THỐNG KÊ TAB ---

    @Transactional(readOnly = true)
    public Page<CoastalStationLRITResponse> searchPaged(
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

        Page<CoastalStationLRIT> page = repository.searchPaged(
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
    public CoastalStationLRIT getStationById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Đài LRIT với ID: " + id));
    }

    @Transactional(readOnly = true)
    public List<CoastalStationLRITResponse> findApprovedOptions(UUID orgUnitId) {
        Scope scope = resolveEffectiveScope(orgUnitId);
        List<CoastalStationLRIT> list = repository.findApprovedOptions(
                !scope.unrestricted(), scope.orgUnitIds(), orgUnitId);
        return list.stream().map(this::buildResponse).toList();
    }

    // --- CRUD & PHÊ DUYỆT 2 CẤP ---

    public CoastalStationLRIT createStation(CoastalStationLRITRequest request) {
        FieldWriteGuard.validateObject(request);

        UUID targetOrgUnitId = request.getOrgUnitId();
        if (targetOrgUnitId != null) {
            validateAllowedOrgUnit(targetOrgUnitId);
        }

        String code = request.getCode() != null && !request.getCode().isBlank()
                ? request.getCode().trim() : generateCode();

        if (repository.existsByCodeAndDeletedAtIsNull(code)) {
            throw new IllegalArgumentException("Mã đài LRIT '" + code + "' đã tồn tại trong hệ thống");
        }

        CoastalStationLRIT entity = new CoastalStationLRIT();
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

        entity.setTerminalId(request.getTerminalId());
        entity.setImoNumber(request.getImoNumber());
        entity.setReportingInterval(request.getReportingInterval());
        entity.setAntennaHeight(request.getAntennaHeight());
        entity.setPowerOutput(request.getPowerOutput());
        entity.setAntennaType(request.getAntennaType());
        entity.setDataFormat(request.getDataFormat());
        entity.setCommunicationChannel(request.getCommunicationChannel());
        entity.setCoverageArea(request.getCoverageArea());
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

        CoastalStationLRIT saved = repository.save(entity);

        if (request.getCoordinates() != null && !request.getCoordinates().isBlank()) {
            UUID spatialId = gisSpatialObjectService.syncSpatialObject(
                    null,
                    "Đài LRIT " + saved.getName(),
                    "LRIT_" + saved.getId(),
                    GisGeometryType.POINT,
                    request.getCoordinates(),
                    saved.getId(),
                    InfrastructureType.LRIT_STATION);
            saved.setSpatialId(spatialId);
            saved = repository.save(saved);
        }

        historyService.recordHistory(
                InfrastructureType.LRIT_STATION,
                saved.getId(),
                StationHistoryActionType.CREATE,
                null,
                "Tạo mới Đài LRIT: " + saved.getName(),
                SecurityUtils.getCurrentUserId());

        return saved;
    }

    public CoastalStationLRIT updateStation(UUID id, CoastalStationLRITUpdateRequest request) {
        FieldWriteGuard.validateObject(request);
        CoastalStationLRIT entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Đài LRIT với ID: " + id));

        approvalService.assertEditable(entity);

        if (request.getOrgUnitId() != null) {
            validateAllowedOrgUnit(request.getOrgUnitId());
            entity.setOrgUnitId(request.getOrgUnitId());
            entity.setUnitId(request.getOrgUnitId());
        }

        if (request.getCode() != null && repository.existsByCodeAndIdNotAndDeletedAtIsNull(request.getCode().trim(), id)) {
            throw new IllegalArgumentException("Mã đài LRIT '" + request.getCode() + "' đã được sử dụng");
        }

        if (request.getOperatingOrgId() != null) entity.setOperatingOrgId(request.getOperatingOrgId());
        if (request.getProvinceId() != null) entity.setProvinceId(request.getProvinceId());
        if (request.getName() != null) {
            entity.setName(request.getName());
            entity.setStationName(request.getName());
        }
        if (request.getLocationAddress() != null) entity.setLocationAddress(request.getLocationAddress());
        if (request.getConditionStatus() != null) entity.setConditionStatus(request.getConditionStatus());

        if (request.getTerminalId() != null) entity.setTerminalId(request.getTerminalId());
        if (request.getImoNumber() != null) entity.setImoNumber(request.getImoNumber());
        if (request.getReportingInterval() != null) entity.setReportingInterval(request.getReportingInterval());
        if (request.getAntennaHeight() != null) entity.setAntennaHeight(request.getAntennaHeight());
        if (request.getPowerOutput() != null) entity.setPowerOutput(request.getPowerOutput());
        if (request.getAntennaType() != null) entity.setAntennaType(request.getAntennaType());
        if (request.getDataFormat() != null) entity.setDataFormat(request.getDataFormat());
        if (request.getCommunicationChannel() != null) entity.setCommunicationChannel(request.getCommunicationChannel());
        if (request.getCoverageArea() != null) entity.setCoverageArea(request.getCoverageArea());
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
                    "Đài LRIT " + entity.getName(),
                    "LRIT_" + entity.getId(),
                    GisGeometryType.POINT,
                    request.getCoordinates(),
                    entity.getId(),
                    InfrastructureType.LRIT_STATION);
            entity.setSpatialId(spatialId);
        }

        CoastalStationLRIT updated = repository.save(entity);

        historyService.recordHistory(
                InfrastructureType.LRIT_STATION,
                updated.getId(),
                StationHistoryActionType.UPDATE,
                null,
                "Cập nhật thông tin Đài LRIT: " + updated.getName(),
                SecurityUtils.getCurrentUserId());

        return updated;
    }

    public void deleteStation(UUID id) {
        CoastalStationLRIT entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Đài LRIT với ID: " + id));

        approvalService.assertDeletable(entity);
        validateAllowedOrgUnit(entity.getOrgUnitId());

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        approvalService.deleteDraft(entity, InfrastructureType.LRIT_STATION, currentUserId);
        repository.delete(entity);

        historyService.recordHistory(
                InfrastructureType.LRIT_STATION,
                entity.getId(),
                StationHistoryActionType.DELETE,
                null,
                "Xóa Đài LRIT: " + entity.getName(),
                currentUserId);
    }

    public CoastalStationLRIT submit(UUID id) {
        CoastalStationLRIT entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.submit(entity, InfrastructureType.LRIT_STATION, currentUserId);
        entity.setStatus(StationStatus.PENDING_APPROVAL);
        return repository.save(entity);
    }

    public CoastalStationLRIT approveLevel1(UUID id) {
        CoastalStationLRIT entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        validateAllowedOrgUnit(entity.getOrgUnitId());
        validateNotSelfApproval(entity.getCreatedBy(), currentUserId);
        approvalService.approveC1(entity, InfrastructureType.LRIT_STATION, "Duyệt cấp 1", "Đủ điều kiện", currentUserId);
        return repository.save(entity);
    }

    public CoastalStationLRIT approveLevel2(UUID id) {
        CoastalStationLRIT entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        validateNotSelfApproval(entity.getCreatedBy(), currentUserId);
        approvalService.approveC2(entity, InfrastructureType.LRIT_STATION, "Duyệt cấp 2", "Đồng ý ban hành", currentUserId);
        entity.setStatus(StationStatus.APPROVED_L2);
        return repository.save(entity);
    }

    public CoastalStationLRIT reject(UUID id, String reason) {
        CoastalStationLRIT entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            approvalService.approveC2(entity, InfrastructureType.LRIT_STATION, ApprovalStatus.REJECTED_LEVEL2.name(), reason, currentUserId);
        } else {
            approvalService.approveC1(entity, InfrastructureType.LRIT_STATION, ApprovalStatus.REJECTED_LEVEL1.name(), reason, currentUserId);
        }
        entity.setRejectionReason(reason);
        return repository.save(entity);
    }

    // Legacy method adaptors for existing controller tests
    public CoastalStationLRIT approveStation(UUID id, Boolean approved, Long level) {
        if (Boolean.TRUE.equals(approved)) {
            if (level != null && level == 2) {
                return approveLevel2(id);
            }
            return approveLevel1(id);
        }
        return reject(id, "Từ chối duyệt hồ sơ");
    }

    public CoastalStationLRIT rejectStation(UUID id, String reason, Long level) {
        return reject(id, reason);
    }

    public List<CoastalStationLRIT> getAllStations() {
        return repository.findAllActive();
    }

    public List<CoastalStationLRIT> searchStations(String keyword) {
        return repository.search(keyword);
    }

    public Optional<CoastalStationLRIT> findByTerminalId(String terminalId) {
        return repository.findByTerminalId(terminalId);
    }

    public Optional<CoastalStationLRIT> findByImoNumber(String imoNumber) {
        return repository.findByImoNumber(imoNumber);
    }

    public List<CoastalStationLRITHistoryResponse> getHistory(UUID id) {
        return List.of();
    }

    // --- RESPONSE BUILDER ---

    public CoastalStationLRITResponse buildResponse(CoastalStationLRIT entity) {
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

        return CoastalStationLRITResponse.builder()
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
                .terminalId(entity.getTerminalId())
                .imoNumber(entity.getImoNumber())
                .reportingInterval(entity.getReportingInterval())
                .antennaHeight(entity.getAntennaHeight())
                .powerOutput(entity.getPowerOutput())
                .antennaType(entity.getAntennaType())
                .dataFormat(entity.getDataFormat())
                .communicationChannel(entity.getCommunicationChannel())
                .coverageArea(entity.getCoverageArea())
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
