package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.entity.OperatingOrganization;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.common.util.WktCoordinateUtils;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.dto.cospas.*;
import com.hanghai.kchtg.station.entity.CoastalStationCospasSarsat;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.station.repository.CoastalStationCospasSarsatRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service xử lý nghiệp vụ cho Đài thông tin vệ tinh Cospas-Sarsat.
 * Chuẩn hóa theo kiến trúc KCHTGT 3 tầng, DataScope phân cấp,
 * Quy trình phê duyệt 2 cấp C1/C2 và nguyên tắc 4 mắt (chống tự duyệt).
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CoastalStationCospasSarsatService {

    private final CoastalStationCospasSarsatRepository repository;
    private final HistoryService historyService;
    private final InfrastructureApprovalService approvalService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final UserRepository userRepository;
    private final OperatingOrganizationRepository operatingOrganizationRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final InfrastructureAttachmentRepository attachmentRepository;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

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

    private static String toKeywordLike(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return null;
        }
        String normalized = java.text.Normalizer
                .normalize(keyword.trim().toLowerCase(java.util.Locale.ROOT), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
        return "%" + normalized + "%";
    }

    // --- TÌM KIẾM PHÂN TRANG & THỐNG KÊ (Chuẩn VTS) ---

    @Transactional(readOnly = true)
    public Page<CoastalStationCospasSarsatResponse> searchPaged(
            UUID orgUnitId,
            UUID operatingOrgId,
            Integer provinceId,
            ConditionStatus conditionStatus,
            ApprovalStatus approvalStatus,
            String keyword,
            String name,
            String code,
            LocalDateTime updatedFrom,
            LocalDateTime updatedTo,
            Pageable pageable) {

        Scope effectiveScope = resolveEffectiveScope(orgUnitId);

        Page<CoastalStationCospasSarsat> page = repository.search(
                !effectiveScope.unrestricted(),
                effectiveScope.orgUnitIds(),
                null,
                operatingOrgId,
                provinceId,
                conditionStatus,
                approvalStatus,
                toKeywordLike(keyword),
                toKeywordLike(name),
                toKeywordLike(code),
                updatedFrom,
                updatedTo,
                pageable);

        List<CoastalStationCospasSarsatResponse> responses = page.getContent().stream()
                .map(this::buildResponse)
                .toList();

        return new PageImpl<>(responses, pageable, page.getTotalElements());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByApprovalStatus(
            UUID orgUnitId,
            UUID operatingOrgId,
            Integer provinceId,
            ConditionStatus conditionStatus,
            String keyword,
            String name,
            String code,
            LocalDateTime updatedFrom,
            LocalDateTime updatedTo) {

        Scope effectiveScope = resolveEffectiveScope(orgUnitId);

        List<Object[]> rows = repository.countByApprovalStatus(
                !effectiveScope.unrestricted(),
                effectiveScope.orgUnitIds(),
                null,
                operatingOrgId,
                provinceId,
                conditionStatus,
                toKeywordLike(keyword),
                toKeywordLike(name),
                toKeywordLike(code),
                updatedFrom,
                updatedTo);

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

    @Transactional(readOnly = true)
    public String generateCode() {
        long next = repository.count() + 1;
        String code = String.format("SARSAT-%06d", next);
        while (repository.existsByCodeAndDeletedAtIsNull(code)) {
            next++;
            code = String.format("SARSAT-%06d", next);
        }
        return code;
    }

    public CoastalStationCospasSarsat createStation(CoastalStationCospasSarsatRequest request) {
        FieldWriteGuard.validateObject(request);

        String effectiveCode = request.getEffectiveCode();
        if (effectiveCode == null || effectiveCode.isBlank()) {
            effectiveCode = generateCode();
            request.setCode(effectiveCode);
            request.setStationCode(effectiveCode);
        }
        if (repository.findByCode(effectiveCode).isPresent()) {
            throw new IllegalArgumentException("Mã đã tồn tại: " + effectiveCode);
        }

        String effectiveName = request.getEffectiveName();
        if (effectiveName == null || effectiveName.isBlank()) {
            throw new IllegalArgumentException("Tên đài không được để trống");
        }

        UUID effectiveOrgUnitId = request.getEffectiveOrgUnitId();
        if (effectiveOrgUnitId == null) {
            throw new IllegalArgumentException("Đơn vị quản lý không được để trống");
        }
        validateAllowedOrgUnit(effectiveOrgUnitId);
        if (request.getProvinceId() == null) {
            throw new IllegalArgumentException("Tỉnh/Thành phố không được để trống");
        }
        ConditionStatus effectiveConditionStatus = request.getConditionStatus() != null
                ? request.getConditionStatus()
                : ConditionStatus.NOT_YET_OPERATIONAL;
        if (request.getLocationAddress() == null || request.getLocationAddress().isBlank()) {
            throw new IllegalArgumentException("Địa điểm chi tiết không được để trống");
        }

        CoastalStationCospasSarsat entity = new CoastalStationCospasSarsat();
        entity.setCode(effectiveCode);
        entity.setName(effectiveName);
        entity.setOrgUnitId(effectiveOrgUnitId);
        entity.setProvinceId(request.getProvinceId());
        entity.setConditionStatus(effectiveConditionStatus);
        entity.setOperatingOrgId(request.getOperatingOrgId());
        entity.setOwningOrgId(request.getOwningOrgId());
        entity.setSymbolId(request.getSymbolId());
        entity.setCoordinateReferenceSystem(request.getCoordinateReferenceSystem());
        entity.setNote(request.getEffectiveNote());
        entity.setDescription(request.getEffectiveNote());
        entity.setSpatialId(request.getSpatialId());

        entity.setFrequency(request.getFrequency());
        entity.setCoverageArea(request.getCoverageArea());
        entity.setBeaconProtocol(request.getBeaconProtocol());
        entity.setEmergencyChannel(request.getEmergencyChannel());
        entity.setAntennaType(request.getAntennaType());
        entity.setLocationAddress(request.getLocationAddress());
        entity.setContactPerson(request.getContactPerson());
        entity.setContactPhone(request.getContactPhone());
        entity.setSignalRange(request.getSignalRange());
        entity.setOperatingMode(request.getOperatingMode());
        entity.setServicesProvided(request.getEffectiveServicesProvided());
        entity.setIsActive(true);

        if (request.getApprovalStatus() != null) {
            entity.setApprovalStatus(request.getApprovalStatus());
        } else {
            entity.setApprovalStatus(ApprovalStatus.DRAFT);
        }

        CoastalStationCospasSarsat saved = repository.save(entity);

        String effectiveCoords = request.getEffectiveCoordinates();
        if (effectiveCoords != null && !effectiveCoords.isBlank() && gisSpatialObjectService != null) {
            UUID spatialId = gisSpatialObjectService.syncSpatialObject(
                    null,
                    "Đài Cospas-Sarsat " + saved.getName(),
                    "COSPAS_" + saved.getId(),
                    request.getEffectiveGeometryType(),
                    effectiveCoords,
                    saved.getId(),
                    InfrastructureType.COSPAS_SARSAT_STATION);
            saved.setSpatialId(spatialId);
            saved = repository.save(saved);
        }

        historyService.recordHistory(
                InfrastructureType.COSPAS_SARSAT_STATION,
                saved.getId(),
                StationHistoryActionType.CREATE,
                null,
                "Cospas-Sarsat station created",
                SecurityUtils.getCurrentUserId());
        return saved;
    }

    private String resolveOperatingOrgName(UUID operatingOrgId) {
        if (operatingOrgId == null) return null;
        return operatingOrganizationRepository.findById(operatingOrgId)
                .map(OperatingOrganization::getName)
                .orElseGet(() -> orgUnitCacheService.getName(operatingOrgId));
    }

    private String formatConditionStatusDisplay(ConditionStatus conditionStatus) {
        if (conditionStatus == null) return "—";
        return switch (conditionStatus) {
            case OPERATIONAL -> "Đang khai thác/vận hành";
            case STOPPED, SUSPENDED -> "Dừng khai thác/vận hành";
            case MAINTENANCE -> "Đang bảo trì";
            case UNDER_CONSTRUCTION, NOT_YET_OPERATIONAL -> "Chưa khai thác/vận hành";
            default -> "Đang khai thác/vận hành";
        };
    }

    private String formatApprovalStatusDisplay(ApprovalStatus approvalStatus) {
        if (approvalStatus == null) return "—";
        return approvalStatus.getLabel() != null ? approvalStatus.getLabel() : approvalStatus.name();
    }

    public CoastalStationCospasSarsat updateStation(UUID id, CoastalStationCospasSarsatUpdateRequest request) {
        FieldWriteGuard.validateObject(request);
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cospas-Sarsat station not found with id: " + id));

        // Quy tắc 12 (approval-2-level-spec.md mục 3.9): cấm sửa khi hồ sơ đang trong vòng duyệt
        approvalService.assertEditable(entity);

        if (request.getEffectiveOrgUnitId() != null) {
            validateAllowedOrgUnit(request.getEffectiveOrgUnitId());
        }

        ApprovalStatus previousApprovalStatus = entity.getApprovalStatus();
        boolean wasApproved = previousApprovalStatus == ApprovalStatus.APPROVED
                || previousApprovalStatus == ApprovalStatus.APPROVED_LEVEL2;

        Map<String, String> oldValues = new LinkedHashMap<>();
        if (wasApproved) {
            if (request.getEffectiveName() != null && !Objects.equals(request.getEffectiveName(), entity.getName())) {
                oldValues.put("Tên đài", entity.getName());
            }
            if (request.getEffectiveOrgUnitId() != null && !Objects.equals(request.getEffectiveOrgUnitId(), entity.getOrgUnitId())) {
                String oldName = entity.getOrgUnitId() != null ? orgUnitCacheService.getName(entity.getOrgUnitId()) : "—";
                oldValues.put("Đơn vị quản lý", oldName != null ? oldName : null);
            }
            if (request.getOperatingOrgId() != null && !Objects.equals(request.getOperatingOrgId(), entity.getOperatingOrgId())) {
                String oldName = resolveOperatingOrgName(entity.getOperatingOrgId());
                oldValues.put("Đơn vị khai thác", oldName != null ? oldName : null);
            }
            if (request.getFrequency() != null && !Objects.equals(request.getFrequency(), entity.getFrequency())) {
                oldValues.put("Tần số", entity.getFrequency());
            }
            if (request.getCoverageArea() != null && !Objects.equals(request.getCoverageArea(), entity.getCoverageArea())) {
                oldValues.put("Vùng phủ sóng", entity.getCoverageArea());
            }
            if (request.getBeaconProtocol() != null && !Objects.equals(request.getBeaconProtocol(), entity.getBeaconProtocol())) {
                oldValues.put("Giao thức phát", entity.getBeaconProtocol());
            }
            if (request.getEmergencyChannel() != null && !Objects.equals(request.getEmergencyChannel(), entity.getEmergencyChannel())) {
                oldValues.put("Kênh khẩn cấp", entity.getEmergencyChannel());
            }
            if (request.getAntennaType() != null && !Objects.equals(request.getAntennaType(), entity.getAntennaType())) {
                oldValues.put("Loại anten", entity.getAntennaType());
            }
            if (request.getLocationAddress() != null && !Objects.equals(request.getLocationAddress(), entity.getLocationAddress())) {
                oldValues.put("Địa điểm chi tiết", entity.getLocationAddress());
            }
            if (request.getContactPerson() != null && !Objects.equals(request.getContactPerson(), entity.getContactPerson())) {
                oldValues.put("Người liên hệ", entity.getContactPerson());
            }
            if (request.getContactPhone() != null && !Objects.equals(request.getContactPhone(), entity.getContactPhone())) {
                oldValues.put("Số điện thoại liên hệ", entity.getContactPhone());
            }
            if (request.getSignalRange() != null && !Objects.equals(request.getSignalRange(), entity.getSignalRange())) {
                oldValues.put("Cự ly tín hiệu", String.valueOf(entity.getSignalRange()));
            }
            if (request.getOperatingMode() != null && !Objects.equals(request.getOperatingMode(), entity.getOperatingMode())) {
                oldValues.put("Chế độ hoạt động", entity.getOperatingMode());
            }
            if (request.getEffectiveServicesProvided() != null && !Objects.equals(request.getEffectiveServicesProvided(), entity.getServicesProvided())) {
                oldValues.put("Dịch vụ cung cấp", entity.getServicesProvided());
            }
            if (request.getConditionStatus() != null && !Objects.equals(request.getConditionStatus(), entity.getConditionStatus())) {
                oldValues.put("Tình trạng", formatConditionStatusDisplay(entity.getConditionStatus()));
            }
            if (request.getEffectiveNote() != null && !Objects.equals(request.getEffectiveNote(), entity.getNote())) {
                oldValues.put("Ghi chú", entity.getNote());
            }
            if (request.getProvinceId() != null && !Objects.equals(request.getProvinceId(), entity.getProvinceId())) {
                oldValues.put("Địa điểm (Tỉnh/Thành phố)", formatProvinceDisplay(entity.getProvinceId()));
            }
            if (request.getEffectiveCoordinateReferenceSystem() != null && !Objects.equals(request.getEffectiveCoordinateReferenceSystem(), entity.getCoordinateReferenceSystem())) {
                oldValues.put("Hệ quy chiếu", entity.getCoordinateReferenceSystem());
            }
            if (request.getSymbolId() != null && !Objects.equals(request.getSymbolId(), entity.getSymbolId())) {
                String oldSym = entity.getSymbolId() != null && gisSpatialObjectService != null
                        ? gisSpatialObjectService.getSymbolDisplayName(entity.getSymbolId().toString())
                        : (entity.getSymbolId() != null ? entity.getSymbolId().toString() : "—");
                oldValues.put("Biểu tượng bản đồ", oldSym);
            }
            String oldCoord = gisSpatialObjectService != null ? gisSpatialObjectService.getCoordinatesBySpatialId(entity.getSpatialId()) : null;
            String newCoord = request.getEffectiveCoordinates();
            if (newCoord != null && !newCoord.isBlank() && !WktCoordinateUtils.coordinatesEqual(newCoord, oldCoord)) {
                oldValues.put("Tọa độ GIS", oldCoord != null ? oldCoord : "—");
            }
        }

        if (request.getEffectiveName() != null) entity.setName(request.getEffectiveName());
        if (request.getEffectiveOrgUnitId() != null) entity.setOrgUnitId(request.getEffectiveOrgUnitId());
        if (request.getProvinceId() != null) entity.setProvinceId(request.getProvinceId());
        if (request.getConditionStatus() != null) entity.setConditionStatus(request.getConditionStatus());
        if (request.getOperatingOrgId() != null) entity.setOperatingOrgId(request.getOperatingOrgId());
        if (request.getOwningOrgId() != null) entity.setOwningOrgId(request.getOwningOrgId());
        if (request.getSymbolId() != null) entity.setSymbolId(request.getSymbolId());
        if (request.getCoordinateReferenceSystem() != null) entity.setCoordinateReferenceSystem(request.getCoordinateReferenceSystem());
        if (request.getEffectiveCoordinateReferenceSystem() != null) entity.setCoordinateReferenceSystem(request.getEffectiveCoordinateReferenceSystem());
        if (request.getSpatialId() != null) entity.setSpatialId(request.getSpatialId());
        if (request.getEffectiveNote() != null) {
            entity.setNote(request.getEffectiveNote());
            entity.setDescription(request.getEffectiveNote());
        }

        if (request.getFrequency() != null) entity.setFrequency(request.getFrequency());
        if (request.getCoverageArea() != null) entity.setCoverageArea(request.getCoverageArea());
        if (request.getBeaconProtocol() != null) entity.setBeaconProtocol(request.getBeaconProtocol());
        if (request.getEmergencyChannel() != null) entity.setEmergencyChannel(request.getEmergencyChannel());
        if (request.getAntennaType() != null) entity.setAntennaType(request.getAntennaType());
        if (request.getLocationAddress() != null) entity.setLocationAddress(request.getLocationAddress());
        if (request.getContactPerson() != null) entity.setContactPerson(request.getContactPerson());
        if (request.getContactPhone() != null) entity.setContactPhone(request.getContactPhone());
        if (request.getSignalRange() != null) entity.setSignalRange(request.getSignalRange());
        if (request.getOperatingMode() != null) entity.setOperatingMode(request.getOperatingMode());
        if (request.getEffectiveServicesProvided() != null) entity.setServicesProvided(request.getEffectiveServicesProvided());

        String effectiveCoords = request.getEffectiveCoordinates();
        if (effectiveCoords != null && gisSpatialObjectService != null) {
            UUID spatialId = gisSpatialObjectService.syncSpatialObject(
                    entity.getSpatialId(),
                    "Đài Cospas-Sarsat " + entity.getName(),
                    "COSPAS_" + entity.getId(),
                    request.getEffectiveGeometryType(),
                    effectiveCoords,
                    entity.getId(),
                    InfrastructureType.COSPAS_SARSAT_STATION);
            entity.setSpatialId(spatialId);
        }

        CoastalStationCospasSarsat saved = repository.save(entity);

        // T12 — sửa hồ sơ đã duyệt: giữ nguyên trạng thái "Đã duyệt", chỉ ghi vết thay đổi
        if (wasApproved) {
            saved.setApprovalStatus(ApprovalStatus.APPROVED);
            saved = repository.save(saved);
        }

        if (wasApproved && !oldValues.isEmpty()) {
            final CoastalStationCospasSarsat finalSaved = saved;
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            historyService.recordDeltaChanges(
                    InfrastructureType.COSPAS_SARSAT_STATION,
                    finalSaved.getId(),
                    oldValues,
                    field -> getNewValueDisplay(field, finalSaved),
                    currentUserId);
        }
        return saved;
    }

    private String getNewValueDisplay(String fieldName, CoastalStationCospasSarsat entity) {
        if (entity == null || fieldName == null) return "—";
        return switch (fieldName) {
            case "Tên đài" -> entity.getName() != null ? entity.getName() : "—";
            case "Đơn vị quản lý" -> entity.getOrgUnitId() != null ? orgUnitCacheService.getName(entity.getOrgUnitId()) : "—";
            case "Đơn vị khai thác" -> resolveOperatingOrgName(entity.getOperatingOrgId()) != null ? resolveOperatingOrgName(entity.getOperatingOrgId()) : "—";
            case "Tần số" -> entity.getFrequency() != null ? entity.getFrequency() : "—";
            case "Vùng phủ sóng" -> entity.getCoverageArea() != null ? entity.getCoverageArea() : "—";
            case "Giao thức phát" -> entity.getBeaconProtocol() != null ? entity.getBeaconProtocol() : "—";
            case "Kênh khẩn cấp" -> entity.getEmergencyChannel() != null ? entity.getEmergencyChannel() : "—";
            case "Loại anten" -> entity.getAntennaType() != null ? entity.getAntennaType() : "—";
            case "Địa điểm chi tiết" -> entity.getLocationAddress() != null ? entity.getLocationAddress() : "—";
            case "Người liên hệ" -> entity.getContactPerson() != null ? entity.getContactPerson() : "—";
            case "Số điện thoại liên hệ" -> entity.getContactPhone() != null ? entity.getContactPhone() : "—";
            case "Cự ly tín hiệu" -> entity.getSignalRange() != null ? String.valueOf(entity.getSignalRange()) : "—";
            case "Chế độ hoạt động" -> entity.getOperatingMode() != null ? entity.getOperatingMode() : "—";
            case "Dịch vụ cung cấp" -> entity.getServicesProvided() != null ? entity.getServicesProvided() : "—";
            case "Tình trạng" -> formatConditionStatusDisplay(entity.getConditionStatus());
            case "Ghi chú" -> entity.getNote() != null ? entity.getNote() : "—";
            case "Địa điểm (Tỉnh/Thành phố)" -> formatProvinceDisplay(entity.getProvinceId());
            case "Hệ quy chiếu" -> entity.getCoordinateReferenceSystem() != null ? entity.getCoordinateReferenceSystem() : "—";
            case "Biểu tượng bản đồ" -> entity.getSymbolId() != null && gisSpatialObjectService != null
                    ? gisSpatialObjectService.getSymbolDisplayName(entity.getSymbolId().toString())
                    : (entity.getSymbolId() != null ? entity.getSymbolId().toString() : "—");
            case "Tọa độ GIS" -> {
                String c = gisSpatialObjectService != null ? gisSpatialObjectService.getCoordinatesBySpatialId(entity.getSpatialId()) : null;
                yield c != null ? c : "—";
            }
            default -> "—";
        };
    }

    private String formatProvinceDisplay(Integer provinceId) {
        if (provinceId == null) return "—";
        try {
            List<String> names = jdbcTemplate.queryForList(
                    "SELECT name FROM provinces WHERE id = ?", String.class, provinceId);
            if (!names.isEmpty() && names.get(0) != null) return names.get(0);
        } catch (Exception e) {
            log.debug("Không tra được tên tỉnh {} cho nhật ký Cospas-Sarsat", provinceId, e);
        }
        return String.valueOf(provinceId);
    }

    public void deleteStation(UUID id) {
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cospas-Sarsat station not found with id: " + id));

        // Kiểm tra quyền xóa: chỉ cho phép xóa khi DRAFT (quy tắc 11)
        approvalService.assertDeletable(entity);

        entity.softDelete(SecurityUtils.getCurrentUserId());
        entity.setApprovalStatus(ApprovalStatus.ARCHIVED);
        repository.save(entity);

        historyService.recordHistory(
                InfrastructureType.COSPAS_SARSAT_STATION,
                entity.getId(),
                StationHistoryActionType.DELETE,
                "Active",
                "Cospas-Sarsat station deleted",
                SecurityUtils.getCurrentUserId());
    }

    @Transactional(readOnly = true)
    public CoastalStationCospasSarsat getStationById(UUID id) {
        return repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cospas-Sarsat station not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<CoastalStationCospasSarsat> getAllStations() {
        return repository.findAllActive();
    }

    @Transactional(readOnly = true)
    public List<CoastalStationCospasSarsatOptionResponse> getOptions(UUID orgUnitId) {
        Scope effectiveScope = resolveEffectiveScope(orgUnitId);
        boolean orgFiltered = (orgUnitId != null);
        Collection<UUID> targetOrgUnitIds = orgFiltered
                ? orgUnitScopeService.resolveSubtreeIds(orgUnitId)
                : Collections.emptyList();

        return repository.findOptions(
                !effectiveScope.unrestricted(),
                effectiveScope.orgUnitIds(),
                orgFiltered,
                targetOrgUnitIds);
    }

    @Transactional(readOnly = true)
    public List<CoastalStationCospasSarsat> searchStations(String keyword) {
        return repository.search(keyword);
    }

    @Transactional(readOnly = true)
    public Optional<CoastalStationCospasSarsat> findByCode(String code) {
        return repository.findByCode(code);
    }

    // --- QUY TRÌNH PHÊ DUYỆT 2 CẤP (docs/conventions/approval-2-level-spec.md) ---

    public CoastalStationCospasSarsat submit(UUID id) {
        CoastalStationCospasSarsat entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();

        approvalService.submit(entity, InfrastructureType.COSPAS_SARSAT_STATION, currentUserId);
        entity.setSubmittedAt(LocalDateTime.now());
        entity.setSubmittedBy(currentUserId);
        return repository.save(entity);
    }

    public CoastalStationCospasSarsat approveLevel1(UUID id) {
        CoastalStationCospasSarsat entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        approvalService.approveC1(entity, InfrastructureType.COSPAS_SARSAT_STATION, "APPROVED", null, currentUserId);
        return repository.save(entity);
    }

    public CoastalStationCospasSarsat approveLevel2(UUID id) {
        CoastalStationCospasSarsat entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        approvalService.approveC2(entity, InfrastructureType.COSPAS_SARSAT_STATION, "APPROVED", null, currentUserId);
        entity.setApprovedBy(currentUserId);
        entity.setApprovedDate(LocalDateTime.now());
        return repository.save(entity);
    }

    public CoastalStationCospasSarsat reject(UUID id, String rejectionReason) {
        CoastalStationCospasSarsat entity = getStationById(id);
        if (rejectionReason == null || rejectionReason.trim().length() < 10) {
            throw new IllegalArgumentException("Lý do từ chối phải có ít nhất 10 ký tự");
        }

        UUID currentUserId = SecurityUtils.getCurrentUserId();
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            approvalService.approveC2(entity, InfrastructureType.COSPAS_SARSAT_STATION, "REJECTED", rejectionReason.trim(), currentUserId);
            entity.setLevel2ApprovalContent(rejectionReason.trim());
        } else {
            approvalService.approveC1(entity, InfrastructureType.COSPAS_SARSAT_STATION, "REJECTED", rejectionReason.trim(), currentUserId);
            entity.setLevel1ApprovalContent(rejectionReason.trim());
        }
        return repository.save(entity);
    }

    // Tương thích ngược với endpoint /approve cũ
    public CoastalStationCospasSarsat approveStation(UUID id, boolean approved) {
        CoastalStationCospasSarsat entity = getStationById(id);
        if (!approved) {
            return reject(id, "Từ chối phê duyệt bởi quản trị viên");
        }
        if (entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) {
            return approveLevel2(id);
        }
        return approveLevel1(id);
    }

    @Transactional(readOnly = true)
    public List<CoastalStationCospasSarsatHistoryResponse> getHistory(UUID id) {
        return getHistory(id, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<CoastalStationCospasSarsatHistoryResponse> getHistory(UUID id, Integer page, Integer pageSize,
                                                                     String keyword, LocalDateTime fromDate, LocalDateTime toDate) {
        CoastalStationCospasSarsat entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cospas-Sarsat station not found with id: " + id));
        String code = entity.getCode();

        org.springframework.data.domain.Pageable pageable = (page != null && pageSize != null && page >= 0 && pageSize > 0)
                ? org.springframework.data.domain.PageRequest.of(page, pageSize)
                : org.springframework.data.domain.Pageable.unpaged();

        return historyService.getHistory(
                InfrastructureType.COSPAS_SARSAT_STATION, entity.getId(), code,
                null,
                new String[] { "Thông tin", "Phê duyệt", "Cập nhật thông tin đài Cospas" },
                keyword, fromDate, toDate, pageable)
                .stream()
                .filter(h -> h.getActionType() != null)
                .map(h -> {
                    CoastalStationCospasSarsatHistoryResponse r = new CoastalStationCospasSarsatHistoryResponse();
                    r.setId(h.getId());
                    r.setStationCode(h.getStationCode());
                    r.setActionType(h.getActionType());
                    r.setChangedField(h.getChangedField());
                    r.setPreviousValue(h.getPreviousValue());
                    r.setNewValue(h.getNewValue());
                    r.setDescription(h.getPreviousValue() != null && h.getNewValue() != null ? null : h.getNewValue());
                    r.setChangedBy(h.getChangedBy());
                    r.setOrgUnitName(h.getOrgUnitName());
                    r.setChangedAt(h.getChangedAt());
                    return r;
                })
                .toList();
    }

    // --- MAPPER BUILD RESPONSE ---

    public CoastalStationCospasSarsatResponse buildResponse(CoastalStationCospasSarsat entity) {
        if (entity == null) return null;

        String orgUnitName = null;
        if (entity.getOrgUnitId() != null) {
            orgUnitName = orgUnitCacheService.getName(entity.getOrgUnitId());
        }

        String operatingOrgName = resolveOperatingOrgName(entity.getOperatingOrgId());
        String owningOrgName = resolveOperatingOrgName(entity.getOwningOrgId());

        String createdByName = resolveUserName(entity.getCreatedBy());
        String updatedByName = resolveUserName(entity.getUpdatedBy());
        String submittedByName = resolveUserName(entity.getSubmittedBy());
        String approverLevel1Name = resolveUserName(entity.getApproverLevel1());
        String approverLevel2Name = resolveUserName(entity.getApproverLevel2());

        String coords = null;
        String resolvedGeomType = "POINT";
        if (entity.getSpatialId() != null && gisSpatialObjectService != null) {
            GisSpatialObject so = gisSpatialObjectService.findById(entity.getSpatialId()).orElse(null);
            if (so != null) {
                coords = so.getCoordinates();
                if (so.getGeometryType() != null) {
                    resolvedGeomType = so.getGeometryType().name();
                }
            }
        }
        if (coords != null && (resolvedGeomType == null || "POINT".equals(resolvedGeomType))) {
            String upper = coords.trim().toUpperCase();
            if (upper.startsWith("LINE"))
                resolvedGeomType = "LINE";
            else if (upper.startsWith("POLYGON"))
                resolvedGeomType = "POLYGON";
        }

        return CoastalStationCospasSarsatResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .stationCode(entity.getCode())
                .name(entity.getName())
                .stationName(entity.getName())
                .orgUnitId(entity.getOrgUnitId())
                .unitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitName)
                .operatingOrgId(entity.getOperatingOrgId())
                .operatingOrgName(operatingOrgName)
                .owningOrgId(entity.getOwningOrgId())
                .owningOrgName(owningOrgName)
                .provinceId(entity.getProvinceId())
                .conditionStatus(entity.getConditionStatus())
                .conditionStatusLabel(formatConditionStatusDisplay(entity.getConditionStatus()))
                .frequency(entity.getFrequency())
                .coverageArea(entity.getCoverageArea())
                .beaconProtocol(entity.getBeaconProtocol())
                .emergencyChannel(entity.getEmergencyChannel())
                .antennaType(entity.getAntennaType())
                .locationAddress(entity.getLocationAddress())
                .contactPerson(entity.getContactPerson())
                .contactPhone(entity.getContactPhone())
                .signalRange(entity.getSignalRange())
                .operatingMode(entity.getOperatingMode())
                .servicesProvided(entity.getServicesProvided())
                .services(entity.getServicesProvided())
                .description(entity.getDescription())
                .note(entity.getNote())
                .spatialId(entity.getSpatialId())
                .symbolId(entity.getSymbolId())
                .coordinateReferenceSystem(entity.getCoordinateReferenceSystem())
                .coordinateSystem(entity.getCoordinateReferenceSystem())
                .displayRule(entity.getCoordinateReferenceSystem() != null ? "Hiển thị theo lớp Đài trạm chuyên dùng" : null)
                .geometryType(resolvedGeomType)
                .objectType(resolvedGeomType)
                .coordinates(coords)
                .wktGeometry(coords)
                .status(entity.getStatus())
                .approvalStatus(entity.getApprovalStatus())
                .approvalStatusLabel(formatApprovalStatusDisplay(entity.getApprovalStatus()))
                .approvalLevel(entity.getApprovalLevel())
                .approvedBy(entity.getApprovedBy())
                .approvedByName(approverLevel2Name)
                .approvedDate(entity.getApprovedDate())
                .submittedAt(entity.getSubmittedAt())
                .submittedBy(entity.getSubmittedBy())
                .submittedByName(submittedByName)
                .approverLevel1(entity.getApproverLevel1())
                .approverLevel1Name(approverLevel1Name)
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .level1ApprovalContent(entity.getLevel1ApprovalContent())
                .approverLevel2(entity.getApproverLevel2())
                .approverLevel2Name(approverLevel2Name)
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .level2ApprovalContent(entity.getLevel2ApprovalContent())
                .rejectionReason(entity.getRejectionReason())
                .createdAt(entity.getCreatedAt())
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .updatedAt(entity.getUpdatedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedByName(updatedByName)
                .deletedAt(entity.getDeletedAt())
                .attachments(listAttachments(entity.getId()))
                .build();
    }

    private String resolveUserName(UUID userId) {
        if (userId == null) return null;
        return userRepository.findById(userId).map(User::getFullName).orElse(null);
    }

    // ── Attachment handling ──

    public List<CoastalStationCospasSarsatAttachmentResponse> uploadAttachments(
            UUID id,
            List<org.springframework.web.multipart.MultipartFile> files,
            UUID userId) {
        CoastalStationCospasSarsat entity = getStationById(id);
        validateAllowedOrgUnit(entity.getOrgUnitId());
        boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        List<com.hanghai.kchtg.common.entity.InfrastructureAttachment> existingAtts = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.COSPAS_SARSAT_STATION);
        List<String> fileListBefore = existingAtts.stream()
                .map(com.hanghai.kchtg.common.entity.InfrastructureAttachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.toList());
        String oldFilesSummary = String.join(", ", fileListBefore);

        java.nio.file.Path basePath = java.nio.file.Paths.get("uploads", "cospas-attachments");
        List<com.hanghai.kchtg.common.entity.InfrastructureAttachment> savedAttachments = new ArrayList<>();
        List<String> uploadedFileNames = new ArrayList<>();
        LocalDateTime batchNow = LocalDateTime.now();

        for (org.springframework.web.multipart.MultipartFile file : files) {
            if (file.isEmpty()) continue;

            String originalFilename = file.getOriginalFilename();
            String storageFileName = System.currentTimeMillis() + "_" + (originalFilename != null ? originalFilename : "unnamed");
            java.nio.file.Path targetDir = basePath.resolve(InfrastructureType.COSPAS_SARSAT_STATION.name()).resolve(id.toString());
            java.nio.file.Path targetPath = targetDir.resolve(storageFileName);

            try {
                java.nio.file.Files.createDirectories(targetDir);
                file.transferTo(targetPath);
            } catch (java.io.IOException e) {
                throw new RuntimeException("Không thể lưu file: " + originalFilename, e);
            }

            com.hanghai.kchtg.common.entity.InfrastructureAttachment attachment = com.hanghai.kchtg.common.entity.InfrastructureAttachment.builder()
                    .refId(id)
                    .refType(InfrastructureType.COSPAS_SARSAT_STATION)
                    .fileName(originalFilename)
                    .filePath(basePath.resolve(InfrastructureType.COSPAS_SARSAT_STATION.name()).resolve(id.toString()).resolve(storageFileName).toString())
                    .fileSize(file.getSize())
                    .fileType(com.hanghai.kchtg.common.enums.AttachmentFileType.fromValue(file.getContentType()))
                    .uploadedBy(userId)
                    .build();
            savedAttachments.add(attachmentRepository.save(attachment));
            if (originalFilename != null && !originalFilename.isBlank()) {
                uploadedFileNames.add(originalFilename.trim());
            }
        }

        List<String> fileListAfter = new ArrayList<>(fileListBefore);
        for (String fn : uploadedFileNames) {
            if (!fileListAfter.contains(fn)) {
                fileListAfter.add(fn);
            }
        }
        String newFilesSummary = String.join(", ", fileListAfter);

        if (historyService != null && wasApproved && !uploadedFileNames.isEmpty()) {
            boolean isNewlyCreated = entity.getCreatedAt() != null
                    && Math.abs(java.time.Duration.between(entity.getCreatedAt(), LocalDateTime.now()).toSeconds()) <= 5;
            if (!isNewlyCreated) {
                String oldVal = (oldFilesSummary == null || oldFilesSummary.isBlank()) ? null : oldFilesSummary.trim();
                String newVal = (newFilesSummary == null || newFilesSummary.isBlank()) ? null : newFilesSummary.trim();
                if (!Objects.equals(oldVal, newVal)) {
                    historyService.recordAttachmentHistory(
                            InfrastructureType.COSPAS_SARSAT_STATION,
                            id,
                            InfrastructureHistoryStatus.ATTACHMENT_UPLOADED,
                            "Tài liệu đính kèm",
                            oldVal != null ? oldVal : "—",
                            newVal != null ? newVal : "—",
                            "Tải lên tệp: " + String.join(", ", uploadedFileNames),
                            userId,
                            batchNow
                    );
                }
            }
        }
        return savedAttachments.stream().map(this::toAttachmentResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<CoastalStationCospasSarsatAttachmentResponse> listAttachments(UUID id) {
        if (id == null || attachmentRepository == null) return Collections.emptyList();
        return attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.COSPAS_SARSAT_STATION)
                .stream().map(this::toAttachmentResponse).toList();
    }

    public void deleteAttachment(UUID id, UUID attachmentId, UUID userId) {
        CoastalStationCospasSarsat entity = getStationById(id);
        validateAllowedOrgUnit(entity.getOrgUnitId());
        boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        com.hanghai.kchtg.common.entity.InfrastructureAttachment attachment = attachmentRepository.findByIdAndRefIdAndRefType(attachmentId, id, InfrastructureType.COSPAS_SARSAT_STATION)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm với ID: " + attachmentId));
        String fileName = attachment.getFileName();
        List<com.hanghai.kchtg.common.entity.InfrastructureAttachment> existingAtts = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.COSPAS_SARSAT_STATION);
        String oldFilesSummary = existingAtts.stream()
                .map(com.hanghai.kchtg.common.entity.InfrastructureAttachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));

        String newFilesSummary = existingAtts.stream()
                .filter(a -> !a.getId().equals(attachmentId))
                .map(com.hanghai.kchtg.common.entity.InfrastructureAttachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));

        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
        } catch (Exception e) {
            log.warn("Không thể xóa file vật lý {}: {}", attachment.getFilePath(), e.getMessage());
        }
        attachmentRepository.delete(attachment);

        if (historyService != null && wasApproved) {
            String oldVal = (oldFilesSummary == null || oldFilesSummary.isBlank()) ? null : oldFilesSummary.trim();
            String newVal = (newFilesSummary == null || newFilesSummary.isBlank()) ? null : newFilesSummary.trim();
            historyService.recordAttachmentHistory(
                    InfrastructureType.COSPAS_SARSAT_STATION,
                    id,
                    InfrastructureHistoryStatus.ATTACHMENT_DELETED,
                    "Tài liệu đính kèm",
                    oldVal != null ? oldVal : "—",
                    newVal != null ? newVal : "—",
                    "Xóa tệp: " + fileName,
                    userId,
                    LocalDateTime.now()
            );
        }
    }

    public com.hanghai.kchtg.common.entity.InfrastructureAttachment getAttachment(UUID id, UUID attachmentId) {
        return attachmentRepository.findByIdAndRefIdAndRefType(attachmentId, id, InfrastructureType.COSPAS_SARSAT_STATION)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm với ID: " + attachmentId));
    }

    private CoastalStationCospasSarsatAttachmentResponse toAttachmentResponse(com.hanghai.kchtg.common.entity.InfrastructureAttachment a) {
        String uploadedByName = a.getUploadedBy() != null
                ? userRepository.findById(a.getUploadedBy()).map(User::getFullName).orElse(a.getUploadedBy().toString())
                : null;
        return CoastalStationCospasSarsatAttachmentResponse.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .filePath("/api/v1/stations/cospas-sarsat/" + a.getRefId()
                        + "/attachments/" + a.getId() + "/download")
                .fileSize(a.getFileSize())
                .documentType(a.getFileType() != null ? a.getFileType().name() : null)
                .uploadedBy(a.getUploadedBy())
                .uploadedByName(uploadedByName)
                .uploadedDate(a.getUploadedDate())
                .build();
    }
}
