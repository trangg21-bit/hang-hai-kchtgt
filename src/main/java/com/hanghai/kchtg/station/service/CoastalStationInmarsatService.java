package com.hanghai.kchtg.station.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperatingOrganization;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.repository.OperatingOrganizationRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.vtssystem.entity.ConditionStatus;
import com.hanghai.kchtg.station.dto.inmarsat.*;
import com.hanghai.kchtg.station.entity.CoastalStationInmarsat;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.station.entity.StationHistoryActionType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.station.repository.CoastalStationInmarsatRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
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
    private final OperatingOrganizationRepository operatingOrganizationRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Value("${app.upload.attachment-path:uploads/inmarsat-attachments}")
    private String attachmentPath;

    private UUID resolveSymbolId(String symbolId, String symbol) {
        String raw = (symbolId != null && !symbolId.isBlank()) ? symbolId.trim()
                : ((symbol != null && !symbol.isBlank()) ? symbol.trim() : null);
        if (raw == null) return null;
        try {
            return UUID.fromString(raw);
        } catch (IllegalArgumentException e) {
            try {
                List<UUID> ids = jdbcTemplate.queryForList(
                        "SELECT id FROM map_symbols WHERE code = ? LIMIT 1", UUID.class, raw);
                if (!ids.isEmpty() && ids.get(0) != null) {
                    return ids.get(0);
                }
            } catch (Exception ignored) {}
            return null;
        }
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

    private void validateAllowedOrgUnit(UUID orgUnitId) {
        Scope userScope = orgUnitScopeService.currentUserScope();
        if (!userScope.unrestricted() && (orgUnitId == null || !userScope.orgUnitIds().contains(orgUnitId))) {
            throw new AccessDeniedException("Bạn không có quyền thao tác trên đơn vị quản lý này");
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

    /**
     * Chuẩn hóa từ khóa cho vế LIKE.
     *
     * Truy vấn so sánh với {@code immutable_unaccent(LOWER(...))} — tức là chuỗi
     * ĐÃ bỏ dấu — nên từ khóa cũng phải bỏ dấu, nếu không thì gõ tiếng Việt có
     * dấu (cách gõ tự nhiên) sẽ không bao giờ khớp và màn hình luôn báo không có
     * dữ liệu.
     */
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

    public static ConditionStatus parseConditionStatus(Object val) {
        if (val == null) return null;
        if (val instanceof ConditionStatus cs) return cs;
        String s = val.toString().trim();
        if (s.isEmpty()) return null;
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

    @Transactional(readOnly = true)
    public Page<CoastalStationInmarsatResponse> searchPaged(
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

        Scope effectiveScope = resolveEffectiveScope(orgUnitId);

        Page<CoastalStationInmarsat> page = repository.searchPaged(
                !effectiveScope.unrestricted(),
                effectiveScope.orgUnitIds(),
                orgUnitId,
                toKeywordLike(keyword),
                toKeywordLike(name),
                toKeywordLike(code),
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
    public Map<String, Long> countByApprovalStatus(UUID orgUnitId, String keyword, ConditionStatus conditionStatus) {
        return countByApprovalStatus(orgUnitId, keyword, null, null, conditionStatus, null, null, null);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> countByApprovalStatus(
            UUID orgUnitId,
            String keyword,
            String name,
            String code,
            ConditionStatus conditionStatus,
            Integer provinceId,
            LocalDateTime updatedFrom,
            LocalDateTime updatedTo) {
        Scope effectiveScope = resolveEffectiveScope(orgUnitId);

        List<Object[]> rows = repository.countByApprovalStatus(
                !effectiveScope.unrestricted(),
                effectiveScope.orgUnitIds(),
                orgUnitId,
                toKeywordLike(keyword),
                toKeywordLike(name),
                toKeywordLike(code),
                conditionStatus,
                provinceId,
                updatedFrom,
                updatedTo
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
        entity.setName(effectiveName);
        entity.setOrgUnitId(effectiveOrgUnitId);
        entity.setOperatingOrgId(request.getOperatingOrgId());
        entity.setProvinceId(request.getProvinceId());
        String effectiveLocation = request.getLocationAddress() != null && !request.getLocationAddress().isBlank()
                ? request.getLocationAddress().trim()
                : (request.getLocationDetail() != null ? request.getLocationDetail().trim() : null);
        entity.setLocationAddress(effectiveLocation);
        entity.setConditionStatus(request.getConditionStatus() != null ? request.getConditionStatus() : ConditionStatus.OPERATIONAL);
        entity.setIsActive(true);

        // Thông số Inmarsat
        entity.setCoverageArea(request.getCoverageArea() != null ? request.getCoverageArea() : request.getCoverageZone());
        entity.setServices(request.getServices());
        entity.setFrequency(request.getFrequency());
        entity.setNotes(request.getNotes() != null ? request.getNotes() : request.getDescription());

        // GIS
        entity.setSpatialId(request.getSpatialId());
        UUID resolvedSym = resolveSymbolId(request.getSymbolId(), request.getSymbol());
        entity.setSymbolId(resolvedSym);
        entity.setLatitude(request.getLatitude());
        entity.setLongitude(request.getLongitude());

        CoastalStationInmarsat saved = repository.save(entity);

        if (request.getCoordinates() != null && !request.getCoordinates().isBlank()) {
            UUID spatialId = gisSpatialObjectService.syncSpatialObject(
                    null,
                    "Đài Inmarsat " + saved.getName(),
                    "INMARSAT_" + saved.getId(),
                    "LINE".equalsIgnoreCase(request.getObjectType()) ? GisGeometryType.LINE : ("POLYGON".equalsIgnoreCase(request.getObjectType()) ? GisGeometryType.POLYGON : GisGeometryType.POINT),
                    request.getCoordinates(),
                    saved.getId(),
                    InfrastructureType.INMARSAT_STATION);
            saved.setSpatialId(spatialId);
            saved = repository.save(saved);
        }

        return saved;
    }

    public CoastalStationInmarsat updateStation(UUID id, CoastalStationInmarsatUpdateRequest request) {
        FieldWriteGuard.validateObject(request);
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đài Inmarsat với id: " + id));

        validateAllowedOrgUnit(entity.getOrgUnitId() != null ? entity.getOrgUnitId() : entity.getUnitId());

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
                String oldName = entity.getOperatingOrgId() != null ? resolveOperatingOrgName(entity.getOperatingOrgId()) : "—";
                oldValues.put("Đơn vị khai thác", oldName != null ? oldName : "—");
            }
            if (request.getProvinceId() != null && !Objects.equals(request.getProvinceId(), entity.getProvinceId())) {
                oldValues.put("Địa điểm (Tỉnh/TP)", entity.getProvinceId() != null ? String.valueOf(entity.getProvinceId()) : "—");
            }
            String newLocation = request.getLocationAddress() != null && !request.getLocationAddress().isBlank()
                    ? request.getLocationAddress().trim()
                    : (request.getLocationDetail() != null ? request.getLocationDetail().trim() : null);
            if (newLocation != null && !Objects.equals(newLocation, entity.getLocationAddress())) {
                oldValues.put("Địa điểm chi tiết", entity.getLocationAddress() != null ? entity.getLocationAddress() : "—");
            }
            if (request.getConditionStatus() != null && !Objects.equals(request.getConditionStatus(), entity.getConditionStatus())) {
                oldValues.put("Tình trạng", entity.getConditionStatus() != null ? resolveConditionStatusLabel(entity.getConditionStatus()) : "—");
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
            if (request.getNotes() != null && !Objects.equals(request.getNotes(), entity.getNotes())) {
                oldValues.put("Ghi chú", entity.getNotes() != null ? entity.getNotes() : "—");
            }

            // GIS fields tracking
            if (request.getObjectType() != null && !Objects.equals(request.getObjectType(), entity.getObjectType())) {
                oldValues.put("Loại đối tượng GIS", formatObjectTypeDisplay(entity.getObjectType()));
            }
            UUID newSym = resolveSymbolId(request.getSymbolId(), request.getSymbol());
            if ((request.getSymbolId() != null || request.getSymbol() != null) && !Objects.equals(newSym, entity.getSymbolId())) {
                oldValues.put("Biểu tượng", resolveSymbolDisplayName(entity.getSymbolId()));
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

        validateCoordinates(request.getLongitude(), request.getLatitude());

        if (request.getOrgUnitId() != null) {
            validateAllowedOrgUnit(request.getOrgUnitId());
            entity.setOrgUnitId(request.getOrgUnitId());
        }

        if (request.getOperatingOrgId() != null) {
            entity.setOperatingOrgId(request.getOperatingOrgId());
        }

        if (request.getEffectiveName() != null) {
            entity.setName(request.getEffectiveName());
        }

        if (request.getProvinceId() != null) {
            entity.setProvinceId(request.getProvinceId());
        }

        String effectiveLoc = request.getLocationAddress() != null && !request.getLocationAddress().isBlank()
                ? request.getLocationAddress().trim()
                : (request.getLocationDetail() != null ? request.getLocationDetail().trim() : null);
        if (effectiveLoc != null) {
            entity.setLocationAddress(effectiveLoc);
        }
        if (request.getConditionStatus() != null) entity.setConditionStatus(request.getConditionStatus());

        if (request.getCoverageArea() != null) {
            entity.setCoverageArea(request.getCoverageArea());
        } else if (request.getCoverageZone() != null) {
            entity.setCoverageArea(request.getCoverageZone());
        }
        if (request.getServices() != null) entity.setServices(request.getServices());
        if (request.getFrequency() != null) entity.setFrequency(request.getFrequency());
        if (request.getNotes() != null) {
            entity.setNotes(request.getNotes());
        } else if (request.getDescription() != null) {
            entity.setNotes(request.getDescription());
        }

        if (request.getSpatialId() != null) entity.setSpatialId(request.getSpatialId());
        if (request.getSymbolId() != null || request.getSymbol() != null) {
            UUID resolvedSym = resolveSymbolId(request.getSymbolId(), request.getSymbol());
            entity.setSymbolId(resolvedSym);
        }
        if (request.getLatitude() != null) entity.setLatitude(request.getLatitude());
        if (request.getLongitude() != null) entity.setLongitude(request.getLongitude());

        if (request.getCoordinates() != null && !request.getCoordinates().isBlank()) {
            UUID spatialId = gisSpatialObjectService.syncSpatialObject(
                    entity.getSpatialId(),
                    "Đài Inmarsat " + entity.getName(),
                    "INMARSAT_" + entity.getId(),
                    "LINE".equalsIgnoreCase(request.getObjectType()) ? GisGeometryType.LINE : ("POLYGON".equalsIgnoreCase(request.getObjectType()) ? GisGeometryType.POLYGON : GisGeometryType.POINT),
                    request.getCoordinates(),
                    entity.getId(),
                    InfrastructureType.INMARSAT_STATION);
            entity.setSpatialId(spatialId);
        }

        CoastalStationInmarsat saved = repository.save(entity);
        if (wasApproved && !oldValues.isEmpty()) {
            final CoastalStationInmarsat finalSaved = saved;
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            historyService.recordDeltaChanges(
                    InfrastructureType.INMARSAT_STATION,
                    finalSaved.getId(),
                    oldValues,
                    field -> getNewValueDisplay(field, finalSaved),
                    currentUserId);
        }
        return saved;
    }

    private String getNewValueDisplay(String fieldName, CoastalStationInmarsat entity) {
        if (entity == null || fieldName == null) return "—";
        return switch (fieldName) {
            case "Tên đài" -> entity.getName() != null ? entity.getName() : "—";
            case "Đơn vị quản lý" -> entity.getOrgUnitId() != null ? orgUnitCacheService.getName(entity.getOrgUnitId()) : "—";
            case "Đơn vị khai thác" -> entity.getOperatingOrgId() != null ? resolveOperatingOrgName(entity.getOperatingOrgId()) : "—";
            case "Địa điểm (Tỉnh/TP)" -> entity.getProvinceId() != null ? String.valueOf(entity.getProvinceId()) : "—";
            case "Địa điểm chi tiết" -> entity.getLocationDetail() != null ? entity.getLocationDetail() : "—";
            case "Tình trạng" -> entity.getConditionStatus() != null ? resolveConditionStatusLabel(entity.getConditionStatus()) : "—";
            case "Vùng phủ sóng" -> entity.getCoverageZone() != null ? entity.getCoverageZone() : "—";
            case "Khu vực phủ sóng" -> entity.getCoverageArea() != null ? entity.getCoverageArea() : "—";
            case "Dịch vụ cung cấp" -> entity.getServices() != null ? entity.getServices() : "—";
            case "Tần số" -> entity.getFrequency() != null ? entity.getFrequency() : "—";
            case "Ghi chú" -> entity.getNotes() != null ? entity.getNotes() : "—";
            case "Loại đối tượng", "Loại đối tượng GIS" -> formatObjectTypeDisplay(entity.getObjectType());
            case "Biểu tượng" -> resolveSymbolDisplayName(entity.getSymbolId());
            case "Hệ quy chiếu" -> entity.getCoordinateSystem() != null ? entity.getCoordinateSystem() : "—";
            case "Quy tắc hiển thị" -> "Độ, phút, giây (DMS)";
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

    private String resolveSymbolDisplayName(UUID symbolId) {
        if (symbolId == null) return "—";
        try {
            List<String> names = jdbcTemplate.queryForList("SELECT name FROM map_symbols WHERE id = ?", String.class, symbolId);
            return (!names.isEmpty() && names.get(0) != null) ? names.get(0) : symbolId.toString();
        } catch (Exception e) {
            return symbolId.toString();
        }
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

        entity.softDelete(SecurityUtils.getCurrentUserId());
        entity.setApprovalStatus(ApprovalStatus.ARCHIVED);
        repository.save(entity);
    }

    @Transactional(readOnly = true)
    public CoastalStationInmarsat getStationById(UUID id) {
        CoastalStationInmarsat entity = repository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đài Inmarsat với id: " + id));
        // Kiểm tra cả khi hồ sơ chưa gán đơn vị: bỏ qua thì bản ghi org_unit_id NULL
        // trở thành cửa hậu — danh sách đã lọc nó ra khỏi tầm nhìn của người dùng bị
        // giới hạn phạm vi, nhưng truy cập thẳng theo ID vẫn lọt.
        validateAllowedOrgUnit(entity.getOrgUnitId() != null ? entity.getOrgUnitId() : entity.getUnitId());
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
        LocalDateTime now = LocalDateTime.now();
        entity.setApproverLevel1(currentUserId);
        entity.setApprovedDateLevel1(now);
        entity.setLevel1ApprovalContent("Đã phê duyệt cấp Cảng vụ/Chi cục");
        syncStationStatus(entity);
        return repository.save(entity);
    }

    public CoastalStationInmarsat approveLevel2(UUID id) {
        CoastalStationInmarsat entity = getStationById(id);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        approvalService.approveC2(entity, InfrastructureType.INMARSAT_STATION, "APPROVED", null, currentUserId);
        LocalDateTime now = LocalDateTime.now();
        entity.setApproverLevel2(currentUserId);
        entity.setApprovedDateLevel2(now);
        entity.setApprovedBy(currentUserId);
        entity.setApprovedDate(now);
        entity.setLevel2ApprovalContent("Đã phê duyệt cấp Cục");

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
            entity.setLevel2ApprovalContent(rejectionReason.trim());
        } else {
            approvalService.approveC1(entity, InfrastructureType.INMARSAT_STATION, "REJECTED",
                    rejectionReason.trim(), currentUserId);
            entity.setLevel1ApprovalContent(rejectionReason.trim());
        }
        syncStationStatus(entity);
        return repository.save(entity);
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
            case DRAFT, PROPOSED, PENDING_APPROVAL -> entity.setApprovalLevel(ApprovalLevel.LEVEL_0);
            case APPROVED_LEVEL1 -> entity.setApprovalLevel(ApprovalLevel.LEVEL_1);
            case APPROVED_LEVEL2, APPROVED -> entity.setApprovalLevel(ApprovalLevel.LEVEL_2);
            case REJECTED, REJECTED_LEVEL1, REJECTED_LEVEL2 -> entity.setApprovalLevel(ApprovalLevel.LEVEL_0);
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
        return getHistory(id, null, null, null, null, null);
    }

    /**
     * Nhật ký thay đổi, lọc và phân trang Ở SERVER.
     *
     * Trước đây hàm này tải TOÀN BỘ nhật ký rồi lọc bằng Java và không hề phân
     * trang — hồ sơ sửa nhiều lần là drawer nặng dần. Các điều kiện loại dòng của
     * quy trình phê duyệt (theo trạng thái và theo mẫu câu của dữ liệu cũ), từ
     * khóa và khoảng ngày đều đã đẩy xuống CSDL nên biên trang chính xác.
     */
    @Transactional(readOnly = true)
    public List<CoastalStationInmarsatHistoryResponse> getHistory(UUID id, Integer page, Integer pageSize,
            String keyword, LocalDateTime fromDate, LocalDateTime toDate) {
        CoastalStationInmarsat entity = getStationById(id);
        String code = entity.getCode() != null ? entity.getCode() : entity.getDeviceCode();

        Pageable pageable = (page != null && pageSize != null && page >= 0 && pageSize > 0)
                ? PageRequest.of(page, pageSize)
                : Pageable.unpaged();

        return historyService.getHistory(
                        InfrastructureType.INMARSAT_STATION, entity.getId(), code,
                        // Khớp đúng tập dòng mà CommonHistoryDrawer vốn tự ẩn (tạo mới /
                        // phê duyệt / từ chối) — phải loại ngay ở CSDL, nếu để drawer lọc
                        // sau khi phân trang thì trang bị hụt và cuộn-tải-thêm dừng sớm.
                        List.of(InfrastructureHistoryStatus.CREATED,
                                InfrastructureHistoryStatus.APPROVED,
                                InfrastructureHistoryStatus.REJECTED),
                        new String[] { "Thông tin", "Phê duyệt", "Cập nhật thông tin đài Inmarsat" },
                        keyword, fromDate, toDate, pageable)
                .stream()
                .filter(h -> h.getActionType() != null)
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

    private String resolveOperatingOrgName(UUID operatingOrgId) {
        if (operatingOrgId == null) return null;
        return operatingOrganizationRepository.findById(operatingOrgId)
                .map(OperatingOrganization::getName)
                .orElseGet(() -> orgUnitCacheService.getName(operatingOrgId));
    }

    // --- BUILD RESPONSE DTO ---

    public CoastalStationInmarsatResponse buildResponse(CoastalStationInmarsat entity) {
        UUID effectiveOrgUnitId = entity.getOrgUnitId();
        String orgUnitName = effectiveOrgUnitId != null ? orgUnitCacheService.getName(effectiveOrgUnitId) : null;
        String operatingOrgName = resolveOperatingOrgName(entity.getOperatingOrgId());

        String createdByName = resolveUserName(entity.getCreatedBy());
        String updatedByName = resolveUserName(entity.getUpdatedBy());
        UUID effectiveSubmittedBy = entity.getSubmittedBy() != null ? entity.getSubmittedBy() : entity.getCreatedBy();
        String submittedByName = resolveUserName(effectiveSubmittedBy);
        String approverNameL1 = resolveUserName(entity.getApproverLevel1());
        String approverNameL2 = resolveUserName(entity.getApproverLevel2());
        String approvedByName = resolveUserName(entity.getApprovedBy());

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

        return CoastalStationInmarsatResponse.builder()
                .id(entity.getId())
                .orgUnitId(effectiveOrgUnitId)
                .orgUnitName(orgUnitName)
                .operatingOrgId(entity.getOperatingOrgId())
                .operatingOrgName(operatingOrgName)
                .code(entity.getCode())
                .deviceCode(entity.getCode())
                .name(entity.getName())
                .stationName(entity.getName())
                .provinceId(entity.getProvinceId())
                .locationAddress(entity.getLocationAddress())
                .locationDetail(entity.getLocationDetail())
                .conditionStatus(entity.getConditionStatus())
                .conditionStatusLabel(resolveConditionStatusLabel(entity.getConditionStatus()))
                .isActive(entity.getIsActive())
                .coverageZone(entity.getCoverageArea())
                .coverageArea(entity.getCoverageArea())
                .services(entity.getServices())
                .frequency(entity.getFrequency())
                .notes(entity.getNotes())
                .description(entity.getNotes())
                .spatialId(entity.getSpatialId())
                .symbolId(entity.getSymbolId() != null ? entity.getSymbolId().toString() : null)
                .objectType(resolvedGeomType)
                .geometryType(resolvedGeomType)
                .symbol(entity.getSymbolId() != null ? entity.getSymbolId().toString() : null)
                .coordinateSystem(entity.getCoordinateSystem() != null ? entity.getCoordinateSystem() : "WGS84")
                .displayRule(entity.getDisplayRule() != null ? entity.getDisplayRule() : "Độ, phút, giây (DMS)")
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .coordinates(coords)
                .approvalStatus(entity.getApprovalStatus())
                .approvalLevel(entity.getApprovalLevel())
                .submittedAt(entity.getSubmittedAt() != null ? entity.getSubmittedAt() : entity.getCreatedAt())
                .submittedBy(effectiveSubmittedBy)
                .submittedByName(submittedByName)
                .approverLevel1(entity.getApproverLevel1())
                .approverNameLevel1(approverNameL1)
                .approverLevel1Name(approverNameL1)
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approverLevel2(entity.getApproverLevel2())
                .approverNameLevel2(approverNameL2)
                .approverLevel2Name(approverNameL2)
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .approvedBy(entity.getApprovedBy())
                .approvedByName(approvedByName)
                .approvedDate(entity.getApprovedDate())
                .rejectionReason(entity.getRejectionReason())
                .level1ApprovalContent(entity.getLevel1ApprovalContent())
                .level2ApprovalContent(entity.getLevel2ApprovalContent())
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

            boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                    || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;
            if (historyService != null && wasApproved) {
                historyService.recordHistory(
                        InfrastructureType.INMARSAT_STATION,
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
    public List<CoastalStationInmarsatAttachmentResponse> listAttachments(UUID id) {
        return attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.INMARSAT_STATION)
                .stream().map(this::toAttachmentResponse).toList();
    }

    public void deleteAttachment(UUID id, UUID attachmentId, UUID userId) {
        CoastalStationInmarsat entity = getStationById(id);
        validateAllowedOrgUnit(entity.getOrgUnitId());

        com.hanghai.kchtg.common.entity.InfrastructureAttachment attachment = attachmentRepository.findByIdAndRefIdAndRefType(attachmentId, id, InfrastructureType.INMARSAT_STATION)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm với ID: " + attachmentId));
        String fileName = attachment.getFileName();
        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
        } catch (Exception e) {
            log.warn("Không thể xóa file vật lý {}: {}", attachment.getFilePath(), e.getMessage());
        }
        attachmentRepository.delete(attachment);

        boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;
        if (historyService != null && wasApproved) {
            historyService.recordHistory(
                    InfrastructureType.INMARSAT_STATION,
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

    private String resolveConditionStatusLabel(ConditionStatus status) {
        if (status == null) return "—";
        return switch (status) {
            case OPERATIONAL -> "Đang hoạt động";
            case STOPPED -> "Dừng hoạt động";
            case MAINTENANCE -> "Đang bảo trì";
            case UNDER_CONSTRUCTION -> "Đang xây dựng";
        };
    }
}
