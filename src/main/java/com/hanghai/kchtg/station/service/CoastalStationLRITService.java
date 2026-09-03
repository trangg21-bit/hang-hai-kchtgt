package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.entity.OrgUnit;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.dto.lrit.*;
import com.hanghai.kchtg.station.entity.CoastalStationLRIT;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.repository.CoastalStationLRITRepository;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
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
import com.hanghai.kchtg.mapicon.entity.MapSymbol;
import com.hanghai.kchtg.mapicon.repository.MapSymbolRepository;

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
    private final OrgUnitCacheService orgUnitCacheService;
    private final OperatingOrganizationRepository operatingOrganizationRepository;
    private final UserRepository userRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final MapSymbolRepository mapSymbolRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;
    private final com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository attachmentRepository;

    private UUID resolveSymbolId(UUID requestSymbolId, String requestSymbol) {
        if (requestSymbolId != null) {
            return requestSymbolId;
        }
        if (requestSymbol != null && !requestSymbol.isBlank()) {
            String trimmed = requestSymbol.trim();
            try {
                return UUID.fromString(trimmed);
            } catch (IllegalArgumentException notUuid) {
                if (mapSymbolRepository != null) {
                    return mapSymbolRepository.findByCode(trimmed)
                            .map(MapSymbol::getId)
                            .orElse(null);
                }
            }
        }
        return null;
    }

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

    /**
     * Chuẩn hóa từ khóa cho vế LIKE.
     *
     * Truy vấn so sánh với {@code immutable_unaccent(LOWER(...))} — tức là chuỗi
     * ĐÃ bỏ dấu — nên từ khóa cũng phải bỏ dấu, nếu không thì gõ tiếng Việt có dấu
     * (cách gõ tự nhiên) sẽ không bao giờ khớp và màn hình luôn báo không có dữ liệu.
     */
    private static String toKeywordLike(String keyword) {
        String normalized = normalizeHistoryKeyword(keyword);
        return normalized == null ? null : "%" + normalized + "%";
    }

    /** Bỏ dấu từ khóa, KHÔNG bọc `%` — truy vấn nhật ký tự nối `%` bằng CONCAT. */
    private static String normalizeHistoryKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return null;
        }
        return java.text.Normalizer
                .normalize(keyword.trim().toLowerCase(java.util.Locale.ROOT), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
    }

    private void validateAllowedOrgUnit(UUID orgUnitId) {
        Scope userScope = orgUnitScopeService.currentUserScope();
        if (!userScope.unrestricted() && (orgUnitId == null || !userScope.orgUnitIds().contains(orgUnitId))) {
            throw new AccessDeniedException("Bạn không có quyền thao tác trên đơn vị quản lý này");
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

    public static ConditionStatus parseConditionStatus(Object val) {
        if (val == null) return null;
        if (val instanceof ConditionStatus cs) return cs;
        String s = val.toString().trim();
        if (s.isEmpty()) return null;
        if ("NOT_OPERATIONAL".equalsIgnoreCase(s)) return ConditionStatus.STOPPED;
        try {
            return ConditionStatus.valueOf(s.toUpperCase());
        } catch (IllegalArgumentException e) {
            try {
                int ordinal = Integer.parseInt(s);
                if (ordinal >= 0 && ordinal < ConditionStatus.values().length) {
                    return ConditionStatus.values()[ordinal];
                }
            } catch (NumberFormatException ignored) {}
            return null;
        }
    }

    // --- TÌM KIẾM PHÂN TRANG & THỐNG KÊ TAB ---

    @Transactional(readOnly = true)
    public Page<CoastalStationLRITResponse> searchPaged(
            UUID orgUnitId,
            String keyword,
            String name,
            String code,
            UUID operatingOrgId,
            Integer provinceId,
            ConditionStatus conditionStatus,
            ApprovalStatus approvalStatus,
            UUID updatedBy,
            LocalDateTime updatedFrom,
            LocalDateTime updatedTo,
            Pageable pageable) {

        Scope scope = resolveEffectiveScope(orgUnitId);
        boolean scopeEnabled = !scope.unrestricted();
        List<UUID> scopeOrgUnitIds = scope.orgUnitIds();

        Page<CoastalStationLRIT> page = repository.searchPaged(
                scopeEnabled, scopeOrgUnitIds, orgUnitId, toKeywordLike(keyword), toKeywordLike(name), toKeywordLike(code),
                operatingOrgId, provinceId,
                conditionStatus, approvalStatus, updatedBy, updatedFrom, updatedTo, pageable);

        return page.map(this::buildResponse);
    }

    @Transactional(readOnly = true)
    public Page<CoastalStationLRITResponse> searchPaged(
            UUID orgUnitId,
            String keyword,
            String name,
            String code,
            UUID operatingOrgId,
            Integer provinceId,
            String conditionStatus,
            ApprovalStatus approvalStatus,
            UUID updatedBy,
            LocalDateTime updatedFrom,
            LocalDateTime updatedTo,
            Pageable pageable) {
        return searchPaged(orgUnitId, keyword, name, code, operatingOrgId, provinceId,
                parseConditionStatus(conditionStatus), approvalStatus, updatedBy, updatedFrom, updatedTo, pageable);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByApprovalStatus(UUID orgUnitId, String keyword, ConditionStatus conditionStatus) {
        return countByApprovalStatus(orgUnitId, keyword, null, null, conditionStatus, null, null, null);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByApprovalStatus(UUID orgUnitId, String keyword, String conditionStatus) {
        return countByApprovalStatus(orgUnitId, keyword, parseConditionStatus(conditionStatus));
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByApprovalStatus(UUID orgUnitId, String keyword, String name, String code,
            String conditionStatus, Integer provinceId, LocalDateTime updatedFrom, LocalDateTime updatedTo) {
        return countByApprovalStatus(orgUnitId, keyword, name, code, parseConditionStatus(conditionStatus), provinceId, updatedFrom, updatedTo);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByApprovalStatus(UUID orgUnitId, String keyword, String name, String code,
            ConditionStatus conditionStatus, Integer provinceId, LocalDateTime updatedFrom, LocalDateTime updatedTo) {
        Scope scope = resolveEffectiveScope(orgUnitId);
        boolean scopeEnabled = !scope.unrestricted();
        List<UUID> scopeOrgUnitIds = scope.orgUnitIds();

        List<Object[]> rawCounts = repository.countByApprovalStatus(
                scopeEnabled, scopeOrgUnitIds, orgUnitId, toKeywordLike(keyword), toKeywordLike(name), toKeywordLike(code),
                conditionStatus, provinceId, updatedFrom, updatedTo);

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
        long rejectedL1 = countsByStatus.getOrDefault(ApprovalStatus.REJECTED_LEVEL1, 0L)
                + countsByStatus.getOrDefault(ApprovalStatus.REJECTED, 0L);
        long rejectedL2 = countsByStatus.getOrDefault(ApprovalStatus.REJECTED_LEVEL2, 0L);
        long all = draft + pending + approvedL1 + approved + rejectedL1 + rejectedL2;

        // Chuẩn tên Enum (khớp hoàn toàn với VTS)
        result.put("ALL", all);
        result.put(ApprovalStatus.DRAFT.name(), draft);
        result.put(ApprovalStatus.PENDING_APPROVAL.name(), pending);
        result.put(ApprovalStatus.APPROVED_LEVEL1.name(), approvedL1);
        result.put(ApprovalStatus.APPROVED.name(), approved);
        result.put(ApprovalStatus.REJECTED_LEVEL1.name(), rejectedL1);
        result.put(ApprovalStatus.REJECTED_LEVEL2.name(), rejectedL2);

        // Backward compatibility keys
        result.put("all", all);
        result.put("draft", draft);
        result.put("pending", pending);
        result.put("approvedL1", approvedL1);
        result.put("approved", approved);
        result.put("rejectedLevel1", rejectedL1);
        result.put("rejectedLevel2", rejectedL2);
        result.put("rejected", rejectedL1 + rejectedL2);

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
        entity.setOperatingOrgId(request.getOperatingOrgId());
        entity.setProvinceId(request.getProvinceId());
        entity.setCode(code);
        entity.setName(request.getName());
        entity.setLocationAddress(request.getLocationAddress());
        entity.setConditionStatus(request.getConditionStatus() != null ? request.getConditionStatus() : ConditionStatus.OPERATIONAL);
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
        UUID resolvedSymbolId = resolveSymbolId(request.getSymbolId(), request.getSymbol());
        entity.setSymbolId(resolvedSymbolId);

        CoastalStationLRIT saved = repository.save(entity);

        if (request.getCoordinates() != null && !request.getCoordinates().isBlank()) {
            String reqGeom = request.getGeometryType() != null ? request.getGeometryType() : request.getObjectType();
            UUID spatialId = gisSpatialObjectService.syncSpatialObject(
                    null,
                    "Đài LRIT " + saved.getName(),
                    "LRIT_" + saved.getId(),
                    toGisGeometryType(reqGeom, request.getCoordinates()),
                    request.getCoordinates(),
                    saved.getId(),
                    InfrastructureType.LRIT_STATION);
            saved.setSpatialId(spatialId);
            saved = repository.save(saved);
        }

        return saved;
    }

    public CoastalStationLRIT updateStation(UUID id, CoastalStationLRITUpdateRequest request) {
        FieldWriteGuard.validateObject(request);
        CoastalStationLRIT entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy Đài LRIT với ID: " + id));

        approvalService.assertEditable(entity);

        boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        String currentGeomType = "POINT";
        if (entity.getSpatialId() != null && gisSpatialObjectService != null) {
            Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(entity.getSpatialId());
            if (spatialOpt.isPresent() && spatialOpt.get().getGeometryType() != null) {
                currentGeomType = spatialOpt.get().getGeometryType().name();
            }
        }
        entity.setGeometryType(currentGeomType);
        entity.setObjectType(currentGeomType);

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
                oldValues.put("Địa điểm (Tỉnh/TP)", formatProvinceDisplay(entity.getProvinceId()));
            }
            if (request.getLocationAddress() != null && !Objects.equals(request.getLocationAddress(), entity.getLocationAddress())) {
                oldValues.put("Địa điểm chi tiết", entity.getLocationAddress() != null ? entity.getLocationAddress() : "—");
            }
            if (request.getConditionStatus() != null && !Objects.equals(request.getConditionStatus(), entity.getConditionStatus())) {
                oldValues.put("Tình trạng", formatConditionStatusDisplay(entity.getConditionStatus()));
            }
            if (request.getTerminalId() != null && !Objects.equals(request.getTerminalId(), entity.getTerminalId())) {
                oldValues.put("Mã Terminal", entity.getTerminalId() != null ? entity.getTerminalId() : "—");
            }
            if (request.getImoNumber() != null && !Objects.equals(request.getImoNumber(), entity.getImoNumber())) {
                oldValues.put("Số IMO", entity.getImoNumber() != null ? entity.getImoNumber() : "—");
            }
            if (request.getReportingInterval() != null && !Objects.equals(request.getReportingInterval(), entity.getReportingInterval())) {
                oldValues.put("Chu kỳ báo cáo", entity.getReportingInterval() != null ? String.valueOf(entity.getReportingInterval()) : "—");
            }
            if (request.getAntennaHeight() != null && !Objects.equals(request.getAntennaHeight(), entity.getAntennaHeight())) {
                oldValues.put("Chiều cao anten", entity.getAntennaHeight() != null ? String.valueOf(entity.getAntennaHeight()) : "—");
            }
            if (request.getPowerOutput() != null && !Objects.equals(request.getPowerOutput(), entity.getPowerOutput())) {
                oldValues.put("Công suất phát", entity.getPowerOutput() != null ? String.valueOf(entity.getPowerOutput()) : "—");
            }
            if (request.getAntennaType() != null && !Objects.equals(request.getAntennaType(), entity.getAntennaType())) {
                oldValues.put("Loại anten", entity.getAntennaType() != null ? entity.getAntennaType() : "—");
            }
            if (request.getDataFormat() != null && !Objects.equals(request.getDataFormat(), entity.getDataFormat())) {
                oldValues.put("Định dạng dữ liệu", entity.getDataFormat() != null ? entity.getDataFormat() : "—");
            }
            if (request.getCommunicationChannel() != null && !Objects.equals(request.getCommunicationChannel(), entity.getCommunicationChannel())) {
                oldValues.put("Kênh liên lạc", entity.getCommunicationChannel() != null ? entity.getCommunicationChannel() : "—");
            }
            if (request.getCoverageArea() != null && !Objects.equals(request.getCoverageArea(), entity.getCoverageArea())) {
                oldValues.put("Vùng phủ sóng", entity.getCoverageArea() != null ? entity.getCoverageArea() : "—");
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
            String reqGeom = request.getGeometryType() != null ? request.getGeometryType() : request.getObjectType();
            if (reqGeom != null && !Objects.equals(reqGeom, currentGeomType)) {
                oldValues.put("Loại đối tượng GIS", formatObjectTypeDisplay(currentGeomType));
            }
            UUID targetSymbolId = resolveSymbolId(request.getSymbolId(), request.getSymbol());
            if ((request.getSymbolId() != null || request.getSymbol() != null) && !Objects.equals(targetSymbolId, entity.getSymbolId())) {
                String oldSymDisplay = entity.getSymbolId() != null
                        ? (gisSpatialObjectService != null ? gisSpatialObjectService.getSymbolDisplayName(entity.getSymbolId().toString()) : entity.getSymbolId().toString())
                        : "—";
                oldValues.put("Biểu tượng", oldSymDisplay);
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
        }

        if (request.getCode() != null && repository.existsByCodeAndIdNotAndDeletedAtIsNull(request.getCode().trim(), id)) {
            throw new IllegalArgumentException("Mã đài LRIT '" + request.getCode() + "' đã được sử dụng");
        }

        if (request.getOperatingOrgId() != null) entity.setOperatingOrgId(request.getOperatingOrgId());
        if (request.getProvinceId() != null) entity.setProvinceId(request.getProvinceId());
        if (request.getName() != null) {
            entity.setName(request.getName());
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

        if (request.getSymbolId() != null || request.getSymbol() != null) {
            entity.setSymbolId(resolveSymbolId(request.getSymbolId(), request.getSymbol()));
        }
        String reqGeom = request.getGeometryType() != null ? request.getGeometryType() : request.getObjectType();
        GisGeometryType geomType = toGisGeometryType(reqGeom, request.getCoordinates());
        entity.setGeometryType(geomType.name());
        entity.setObjectType(geomType.name());

        // coordinates != null means the caller intentionally changed GIS. An
        // empty string clears the old spatial object; omitting the property
        // keeps a legacy caller's existing location intact.
        if (request.getCoordinates() != null) {
            if (!request.getCoordinates().isBlank()) {
                BigDecimal[] pt = extractFirstCoordinate(request.getCoordinates());
                if (pt != null) {
                    entity.setLatitude(pt[0]);
                    entity.setLongitude(pt[1]);
                }
            } else {
                entity.setLatitude(null);
                entity.setLongitude(null);
            }
            UUID spatialId = gisSpatialObjectService.syncSpatialObject(
                    entity.getSpatialId(),
                    "Đài LRIT " + entity.getName(),
                    "LRIT_" + entity.getId(),
                    geomType,
                    request.getCoordinates(),
                    entity.getId(),
                    InfrastructureType.LRIT_STATION);
            entity.setSpatialId(spatialId);
        }

        CoastalStationLRIT updated = repository.save(entity);

        if (wasApproved && !oldValues.isEmpty()) {
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            historyService.recordDeltaChanges(
                    InfrastructureType.LRIT_STATION,
                    updated.getId(),
                    oldValues,
                    field -> getNewValueDisplay(field, updated),
                    currentUserId);
        }

        return updated;
    }

    private GisGeometryType toGisGeometryType(String geometryType, String coordinates) {
        if ("LINE".equalsIgnoreCase(geometryType) || "LINESTRING".equalsIgnoreCase(geometryType)) {
            return GisGeometryType.LINE;
        }
        if ("POLYGON".equalsIgnoreCase(geometryType)) {
            return GisGeometryType.POLYGON;
        }
        if (coordinates != null) {
            String upper = coordinates.trim().toUpperCase();
            if (upper.startsWith("LINE")) return GisGeometryType.LINE;
            if (upper.startsWith("POLYGON")) return GisGeometryType.POLYGON;
        }
        return GisGeometryType.POINT;
    }

    private GisGeometryType toGisGeometryType(String geometryType) {
        return toGisGeometryType(geometryType, null);
    }

    private BigDecimal[] extractFirstCoordinate(String wkt) {
        if (wkt == null || wkt.isBlank()) return null;
        try {
            java.util.regex.Matcher matcher = java.util.regex.Pattern.compile("([-+]?[0-9]+(?:\\.[0-9]+)?)\\s+([-+]?[0-9]+(?:\\.[0-9]+)?)").matcher(wkt);
            if (matcher.find()) {
                BigDecimal lng = new BigDecimal(matcher.group(1));
                BigDecimal lat = new BigDecimal(matcher.group(2));
                return new BigDecimal[]{lat, lng};
            }
        } catch (Exception ignored) {}
        return null;
    }

    private String resolveOperatingOrgName(UUID operatingOrgId) {
        if (operatingOrgId == null) return null;
        return operatingOrganizationRepository.findById(operatingOrgId)
                .map(OperatingOrganization::getName)
                .orElseGet(() -> orgUnitCacheService.getName(operatingOrgId));
    }

    private String getNewValueDisplay(String fieldName, CoastalStationLRIT entity) {
        if (entity == null || fieldName == null) return "—";
        return switch (fieldName) {
            case "Tên đài" -> entity.getName() != null ? entity.getName() : "—";
            case "Đơn vị quản lý" -> entity.getOrgUnitId() != null ? orgUnitCacheService.getName(entity.getOrgUnitId()) : "—";
            case "Đơn vị khai thác" -> entity.getOperatingOrgId() != null ? resolveOperatingOrgName(entity.getOperatingOrgId()) : "—";
            case "Địa điểm (Tỉnh/TP)" -> formatProvinceDisplay(entity.getProvinceId());
            case "Địa điểm chi tiết" -> entity.getLocationAddress() != null ? entity.getLocationAddress() : "—";
            case "Tình trạng" -> formatConditionStatusDisplay(entity.getConditionStatus());
            case "Mã Terminal" -> entity.getTerminalId() != null ? entity.getTerminalId() : "—";
            case "Số IMO" -> entity.getImoNumber() != null ? entity.getImoNumber() : "—";
            case "Chu kỳ báo cáo" -> entity.getReportingInterval() != null ? String.valueOf(entity.getReportingInterval()) : "—";
            case "Chiều cao anten" -> entity.getAntennaHeight() != null ? String.valueOf(entity.getAntennaHeight()) : "—";
            case "Công suất phát" -> entity.getPowerOutput() != null ? String.valueOf(entity.getPowerOutput()) : "—";
            case "Loại anten" -> entity.getAntennaType() != null ? entity.getAntennaType() : "—";
            case "Định dạng dữ liệu" -> entity.getDataFormat() != null ? entity.getDataFormat() : "—";
            case "Kênh liên lạc" -> entity.getCommunicationChannel() != null ? entity.getCommunicationChannel() : "—";
            case "Vùng phủ sóng" -> entity.getCoverageArea() != null ? entity.getCoverageArea() : "—";
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

    /**
     * Nhật ký phải lưu GIÁ TRỊ NGƯỜI DÙNG ĐỌC ĐƯỢC, không lưu mã enum.
     *
     * Trước đây trường này ghi thẳng {@code OPERATIONAL}/{@code STOPPED} nên màn
     * hình lịch sử hiện tiếng Anh, và tìm kiếm nhật ký theo "dừng hoạt động"
     * không bao giờ khớp vì trong CSDL không có chuỗi đó.
     */
    private String formatConditionStatusDisplay(ConditionStatus conditionStatus) {
        if (conditionStatus == null) return "—";
        return switch (conditionStatus) {
            case OPERATIONAL -> "Đang hoạt động";
            case STOPPED -> "Dừng hoạt động";
            case MAINTENANCE -> "Đang bảo trì";
            case UNDER_CONSTRUCTION -> "Đang xây dựng";
        };
    }

    private String formatConditionStatusDisplay(String conditionStatus) {
        if (conditionStatus == null || conditionStatus.isBlank()) return "—";
        ConditionStatus cs = parseConditionStatus(conditionStatus);
        if (cs != null) return formatConditionStatusDisplay(cs);
        return conditionStatus;
    }

    /** Tương tự: lưu tên tỉnh/thành thay cho số ID vốn vô nghĩa với người đọc. */
    private String formatProvinceDisplay(Integer provinceId) {
        if (provinceId == null) return "—";
        try {
            List<String> names = jdbcTemplate.queryForList(
                    "SELECT name FROM provinces WHERE id = ?", String.class, provinceId);
            if (!names.isEmpty() && names.get(0) != null) return names.get(0);
        } catch (Exception e) {
            log.debug("Không tra được tên tỉnh {} cho nhật ký LRIT", provinceId, e);
        }
        return String.valueOf(provinceId);
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
        if (currentUserId == null) {
            currentUserId = entity.getUpdatedBy() != null ? entity.getUpdatedBy() : entity.getCreatedBy();
            if (currentUserId == null) {
                currentUserId = UUID.fromString("00000000-0000-0000-0000-000000000001");
            }
        }
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.submit(entity, InfrastructureType.LRIT_STATION, currentUserId);
        entity.setSubmittedAt(LocalDateTime.now());
        entity.setSubmittedBy(currentUserId);
        entity.setRejectionReason(null);
        entity.setStatus(StationStatus.PENDING_APPROVAL);
        return repository.save(entity);
    }

    public CoastalStationLRIT approveLevel1(UUID id) {
        return approveLevel1(id, null);
    }

    public CoastalStationLRIT approveLevel1(UUID id, String content) {
        CoastalStationLRIT entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = entity.getUpdatedBy() != null ? entity.getUpdatedBy() : entity.getCreatedBy();
            if (currentUserId == null) {
                currentUserId = UUID.fromString("00000000-0000-0000-0000-000000000001");
            }
        }
        validateAllowedOrgUnit(entity.getOrgUnitId());
        String approvalContent = content == null || content.isBlank() ? "Đủ điều kiện" : content.trim();
        approvalService.approveC1(entity, InfrastructureType.LRIT_STATION, ApprovalStatus.APPROVED_LEVEL1.name(), approvalContent, currentUserId);
        return repository.save(entity);
    }

    public CoastalStationLRIT approveLevel2(UUID id) {
        return approveLevel2(id, null);
    }

    public CoastalStationLRIT approveLevel2(UUID id, String content) {
        CoastalStationLRIT entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (currentUserId == null) {
            currentUserId = entity.getUpdatedBy() != null ? entity.getUpdatedBy() : entity.getCreatedBy();
            if (currentUserId == null) {
                currentUserId = UUID.fromString("00000000-0000-0000-0000-000000000001");
            }
        }
        String approvalContent = content == null || content.isBlank() ? "Đồng ý ban hành" : content.trim();
        approvalService.approveC2(entity, InfrastructureType.LRIT_STATION, ApprovalStatus.APPROVED_LEVEL2.name(), approvalContent, currentUserId);
        entity.setStatus(StationStatus.APPROVED_L2);
        LocalDateTime now = LocalDateTime.now();

        // Khi Cấp Cục phê duyệt trực tiếp, nếu chưa có thông tin người gửi thì tự động điền
        if (entity.getSubmittedBy() == null) {
            entity.setSubmittedBy(currentUserId);
            entity.setSubmittedAt(now);
        }

        // Hướng 2: Khi Cấp Cục phê duyệt trực tiếp, tự động điền luôn thông tin Cấp 1
        if (entity.getApproverLevel1() == null) {
            entity.setApproverLevel1(currentUserId);
            entity.setApprovedDateLevel1(now);
            entity.setLevel1ApprovalContent("Cấp Cục phê duyệt trực tiếp (đồng thuận cả 2 cấp)");
        }

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

    @Transactional(readOnly = true)
    public List<CoastalStationLRITHistoryResponse> getHistory(UUID id) {
        return getHistory(id, null, null, null, null, null);
    }

    /**
     * Nhật ký thay đổi, lọc và phân trang Ở SERVER.
     *
     * Trước đây hàm này tải TOÀN BỘ nhật ký rồi lọc bằng Java và không phân trang —
     * hồ sơ sửa nhiều lần là drawer nặng dần, và nếu phân trang mà vẫn lọc ở Java
     * thì biên trang sai. Nay điều kiện trạng thái, mốc "sau phê duyệt cấp cuối",
     * mẫu câu nhiễu của dữ liệu cũ, từ khóa và khoảng ngày đều nằm trong truy vấn.
     */
    @Transactional(readOnly = true)
    public List<CoastalStationLRITHistoryResponse> getHistory(UUID id, Integer page, Integer pageSize,
            String keyword, LocalDateTime fromDate, LocalDateTime toDate) {
        CoastalStationLRIT entity = getStationById(id);
        String code = entity.getCode() != null ? entity.getCode() : entity.getStationCode();
        LocalDateTime finalApprovalAt = entity.getApprovedDate() != null
                ? entity.getApprovedDate()
                : entity.getApprovedDateLevel2();

        // Nhật ký thay đổi chỉ có ý nghĩa sau khi hồ sơ đã được phê duyệt cấp cuối.
        if (finalApprovalAt == null) {
            return List.of();
        }
        LocalDateTime effectiveFrom = (fromDate == null || fromDate.isBefore(finalApprovalAt))
                ? finalApprovalAt
                : fromDate;
        org.springframework.data.domain.Pageable pageable =
                (page != null && pageSize != null && page >= 0 && pageSize > 0)
                        ? org.springframework.data.domain.PageRequest.of(page, pageSize)
                        : org.springframework.data.domain.Pageable.unpaged();

        return historyService.getHistory(
                        InfrastructureType.LRIT_STATION, entity.getId(), code,
                        List.of(com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus.CREATED,
                                com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus.APPROVED,
                                com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus.REJECTED),
                        new String[] { "Thông tin", "Phê duyệt", "Cập nhật thông tin đài LRIT" },
                        keyword, effectiveFrom, toDate, pageable)
                .stream()
                .filter(h -> h.getActionType() != null)
                .map(h -> {
                    CoastalStationLRITHistoryResponse r = new CoastalStationLRITHistoryResponse();
                    r.setId(h.getId());
                    r.setStationCode(h.getStationCode());
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
        UUID effectiveSubmittedBy = entity.getSubmittedBy() != null ? entity.getSubmittedBy() : entity.getCreatedBy();
        String submittedByName = resolveUserName(effectiveSubmittedBy);
        String approver1Name = resolveUserName(entity.getApproverLevel1());
        String approver2Name = resolveUserName(entity.getApproverLevel2());

        String coords = null;
        String resolvedGeomType = "POINT";
        if (entity.getSpatialId() != null && gisSpatialObjectService != null) {
            Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(entity.getSpatialId());
            if (spatialOpt.isPresent()) {
                GisSpatialObject so = spatialOpt.get();
                coords = so.getCoordinates();
                if (so.getGeometryType() != null) {
                    resolvedGeomType = so.getGeometryType().name();
                }
            }
        }
        if (coords == null && entity.getLatitude() != null && entity.getLongitude() != null) {
            coords = "POINT(" + entity.getLongitude() + " " + entity.getLatitude() + ")";
        }
        if (coords != null && (resolvedGeomType == null || "POINT".equals(resolvedGeomType))) {
            String upper = coords.trim().toUpperCase();
            if (upper.startsWith("LINE")) resolvedGeomType = "LINE";
            else if (upper.startsWith("POLYGON")) resolvedGeomType = "POLYGON";
        }
        BigDecimal lat = entity.getLatitude();
        BigDecimal lng = entity.getLongitude();
        if ((lat == null || lng == null) && coords != null && !coords.isBlank()) {
            BigDecimal[] pt = extractFirstCoordinate(coords);
            if (pt != null) {
                lat = pt[0];
                lng = pt[1];
            }
        }

        return CoastalStationLRITResponse.builder()
                .id(entity.getId())
                .orgUnitId(effectiveOrgId)
                .orgUnitName(orgUnitName)
                .operatingOrgId(entity.getOperatingOrgId())
                .operatingOrgName(opOrgName)
                .provinceId(entity.getProvinceId())
                .code(entity.getCode())
                .stationCode(entity.getCode())
                .name(entity.getName())
                .stationName(entity.getName())
                .locationAddress(entity.getLocationAddress())
                .conditionStatus(entity.getConditionStatus())
                .conditionStatusLabel(formatConditionStatusDisplay(entity.getConditionStatus()))
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
                .symbolId(entity.getSymbolId())
                .symbolName(entity.getSymbolId() != null && gisSpatialObjectService != null
                        ? gisSpatialObjectService.getSymbolDisplayName(entity.getSymbolId().toString())
                        : null)
                .geometryType(resolvedGeomType)
                .objectType(resolvedGeomType)
                .symbol(entity.getSymbol())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
                .latitude(lat)
                .longitude(lng)
                .coordinates(coords)
                .approvalStatus(entity.getApprovalStatus())
                .submittedAt(entity.getSubmittedAt() != null ? entity.getSubmittedAt() : entity.getCreatedAt())
                .submittedBy(effectiveSubmittedBy)
                .submittedByName(submittedByName)
                .approverLevel1(entity.getApproverLevel1())
                .approverLevel1Name(approver1Name)
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approvalContentLevel1(entity.getLevel1ApprovalContent())
                .level1ApprovalContent(entity.getLevel1ApprovalContent())
                .approverLevel2(entity.getApproverLevel2())
                .approverLevel2Name(approver2Name)
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .approvalContentLevel2(entity.getLevel2ApprovalContent())
                .level2ApprovalContent(entity.getLevel2ApprovalContent())
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

    public List<CoastalStationLRITAttachmentResponse> uploadAttachments(
            UUID id,
            List<org.springframework.web.multipart.MultipartFile> files,
            UUID userId) {
        CoastalStationLRIT entity = getStationById(id);
        validateAllowedOrgUnit(entity.getOrgUnitId());
        boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        java.nio.file.Path basePath = java.nio.file.Paths.get("uploads", "lrit-attachments");
        List<com.hanghai.kchtg.common.entity.InfrastructureAttachment> savedAttachments = new ArrayList<>();

        for (org.springframework.web.multipart.MultipartFile file : files) {
            if (file.isEmpty()) continue;

            String originalFilename = file.getOriginalFilename();
            String storageFileName = System.currentTimeMillis() + "_" + (originalFilename != null ? originalFilename : "unnamed");
            java.nio.file.Path targetDir = basePath.resolve(InfrastructureType.LRIT_STATION.name()).resolve(id.toString());
            java.nio.file.Path targetPath = targetDir.resolve(storageFileName);

            try {
                java.nio.file.Files.createDirectories(targetDir);
                file.transferTo(targetPath);
            } catch (java.io.IOException e) {
                throw new RuntimeException("Không thể lưu file: " + originalFilename, e);
            }

            com.hanghai.kchtg.common.entity.InfrastructureAttachment attachment = com.hanghai.kchtg.common.entity.InfrastructureAttachment.builder()
                    .refId(id)
                    .refType(InfrastructureType.LRIT_STATION)
                    .fileName(originalFilename)
                    .filePath(basePath.resolve(InfrastructureType.LRIT_STATION.name()).resolve(id.toString()).resolve(storageFileName).toString())
                    .fileSize(file.getSize())
                    .fileType(com.hanghai.kchtg.common.enums.AttachmentFileType.fromValue(file.getContentType()))
                    .uploadedBy(userId)
                    .build();
            savedAttachments.add(attachmentRepository.save(attachment));

            if (historyService != null && wasApproved) {
                historyService.recordHistory(
                        InfrastructureType.LRIT_STATION,
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
    public List<CoastalStationLRITAttachmentResponse> listAttachments(UUID id) {
        return attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.LRIT_STATION)
                .stream().map(this::toAttachmentResponse).toList();
    }

    public void deleteAttachment(UUID id, UUID attachmentId, UUID userId) {
        CoastalStationLRIT entity = getStationById(id);
        validateAllowedOrgUnit(entity.getOrgUnitId());
        boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        com.hanghai.kchtg.common.entity.InfrastructureAttachment attachment = attachmentRepository.findByIdAndRefIdAndRefType(attachmentId, id, InfrastructureType.LRIT_STATION)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm với ID: " + attachmentId));
        String fileName = attachment.getFileName();
        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
        } catch (Exception e) {
            log.warn("Không thể xóa file vật lý {}: {}", attachment.getFilePath(), e.getMessage());
        }
        attachmentRepository.delete(attachment);

        if (historyService != null && wasApproved) {
            historyService.recordHistory(
                    InfrastructureType.LRIT_STATION,
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
        return attachmentRepository.findByIdAndRefIdAndRefType(attachmentId, id, InfrastructureType.LRIT_STATION)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm với ID: " + attachmentId));
    }

    private CoastalStationLRITAttachmentResponse toAttachmentResponse(com.hanghai.kchtg.common.entity.InfrastructureAttachment a) {
        String uploadedByName = a.getUploadedBy() != null
                ? userRepository.findById(a.getUploadedBy()).map(User::getFullName).orElse(a.getUploadedBy().toString())
                : null;
        return CoastalStationLRITAttachmentResponse.builder()
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
