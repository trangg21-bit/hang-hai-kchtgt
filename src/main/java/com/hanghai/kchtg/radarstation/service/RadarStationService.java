package com.hanghai.kchtg.radarstation.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureAttachment;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.AttachmentFileType;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureAttachmentRepository;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
import com.hanghai.kchtg.common.util.InfrastructureHistoryUtils;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService.Scope;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.radarstation.dto.*;
import com.hanghai.kchtg.radarstation.entity.RadarStation;
import com.hanghai.kchtg.radarstation.repository.RadarStationRepository;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.vtssystem.entity.VtsSystem;
import com.hanghai.kchtg.vtssystem.repository.VtsSystemRepository;
import com.hanghai.kchtg.vtssystem.dto.HistoryEntry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.text.Normalizer;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RadarStationService {

    private final RadarStationRepository repository;
    private final InfrastructureHistoryRepository historyRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final VtsSystemRepository vtsSystemRepository;
    private final PortRepository portRepository;
    private final OrgUnitCacheService orgUnitCacheService;
    private final InfrastructureAttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final InfrastructureApprovalService approvalService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final JdbcTemplate jdbcTemplate;

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    private Scope resolveEffectiveScope(UUID selectedOrgUnitId) {
        Scope userScope = orgUnitScopeService.currentUserScope();
        if (selectedOrgUnitId == null) {
            return userScope;
        }
        if (!userScope.unrestricted() && !userScope.allows(selectedOrgUnitId)) {
            return Scope.restricted(List.of());
        }
        List<UUID> selectedSubtree = orgUnitScopeService.resolveSubtreeIds(selectedOrgUnitId);
        if (userScope.unrestricted()) {
            return Scope.restricted(selectedSubtree);
        }
        List<UUID> intersected = selectedSubtree.stream()
                .filter(userScope::allows)
                .toList();
        return Scope.restricted(intersected);
    }

    private void validateAllowedOrgUnit(UUID orgUnitId) {
        Scope userScope = orgUnitScopeService.currentUserScope();
        if (!userScope.unrestricted() && (orgUnitId == null || !userScope.allows(orgUnitId))) {
            throw new AccessDeniedException("Bạn không có quyền thao tác trên đơn vị quản lý này");
        }
    }

    @Transactional(readOnly = true)
    public String generateCode() {
        long next = repository.count() + 1;
        String code = String.format("RADAR-%06d", next);
        while (repository.existsByCode(code)) {
            next++;
            code = String.format("RADAR-%06d", next);
        }
        return code;
    }

    public RadarStationResponse create(RadarStationCreateRequest request, UUID createdBy) {
        validateAllowedOrgUnit(request.getOrgUnitId());

        String action = request.getAction() != null ? request.getAction().trim().toLowerCase() : "draft";
        if (!"draft".equals(action) && !"submit".equals(action)) {
            throw new IllegalArgumentException("Action không hợp lệ: " + action + ". Chỉ chấp nhận 'draft' hoặc 'submit'");
        }

        String code = generateCode();
        // Tạo mới luôn khởi tạo Lưu tạm (DRAFT); nhánh action=submit được áp qua
        // approvalService.submit() cuối phương thức — Rule 14: người cấp Cục gửi vào thẳng
        // APPROVED_LEVEL1 ('Chờ Cục duyệt'), cấp Cảng vụ/Chi cục vào PENDING_APPROVAL.
        ApprovalStatus initialStatus = ApprovalStatus.DRAFT;

        RadarStation entity = RadarStation.builder()
                .code(code)
                .stationName(trimToNull(request.getStationName()))
                .location(trimToNull(request.getLocation()))
                .stationType(trimToNull(request.getStationType()))
                .coverage(trimToNull(request.getCoverage()))
                .emissionArea(request.getEmissionArea())
                .source(trimToNull(request.getSource()))
                .conditionStatus(request.getConditionStatus() != null ? request.getConditionStatus().trim() : "1")
                .orgUnitId(request.getOrgUnitId())
                .seaportId(request.getSeaportId())
                .vtsSystemId(request.getVtsSystemId())
                .vtsOperationCenterId(request.getVtsOperationCenterId())
                .operatingUnitId(request.getOperatingUnitId())
                .provinceId(request.getProvinceId())
                .unitOfMeasure(trimToNull(request.getUnitOfMeasure()))
                .quantity(request.getQuantity())
                .note(trimToNull(request.getNote()))
                .towerHeight(request.getTowerHeight())
                .radarRange(request.getRadarRange())
                .mapIcon(request.getMapIcon())
                .approvalStatus(initialStatus)
                .build();

        RadarStation saved = repository.save(entity);

        String coordinates = trimToNull(request.getCoordinates());
        if (coordinates == null && request.getLongitude() != null && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (coordinates != null) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
            GisSpatialObjectType objType = GisSpatialObjectType.POINT_OTHER;
            UUID refId = saved.getId();
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    saved.getStationName(),
                    "RADAR_" + saved.getId(),
                    geomType,
                    objType,
                    coordinates,
                    refId,
                    InfrastructureType.RADAR_STATION_LEGACY
            );
            saved.setSpatialId(spatialObj.getId());
            saved = repository.save(saved);
        }

        if ("submit".equals(action)) {
            // 'Lưu và gửi phê duyệt' khi tạo mới: đi qua đúng luồng submit chuẩn (Rule 14),
            // ghi submittedAt/submittedBy + set trạng thái theo cấp đơn vị người gửi.
            approvalService.submit(saved, InfrastructureType.RADAR_STATION, createdBy);
            saved = repository.save(saved);
        }

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public RadarStationResponse getById(UUID id) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<RadarStationResponse> findByApprovalStatus(ApprovalStatus approvalStatus) {
        return repository.findByApprovalStatusAndDeletedAtIsNull(approvalStatus).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<RadarStationResponse> findAll(int page, int size) {
        return repository.findByApprovalStatusAndDeletedAtIsNull(ApprovalStatus.APPROVED).stream()
                .map(this::toResponse)
                .toList();
    }

    public RadarStationResponse update(UUID id, RadarStationUpdateRequest request, UUID updatedBy) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        if (entity.getDeletedAt() != null || entity.getApprovalStatus() == ApprovalStatus.ARCHIVED) {
            throw new RuntimeException("Không thể cập nhật bản ghi đã bị xóa với ID: " + id);
        }

        // Quy tắc 12 (approval-2-level-spec.md mục 3.9): cấm sửa khi hồ sơ đang trong vòng duyệt
        approvalService.assertEditable(entity);

        validateAllowedOrgUnit(entity.getOrgUnitId());
        if (request.getOrgUnitId() != null) {
            validateAllowedOrgUnit(request.getOrgUnitId());
        }

        ApprovalStatus previousApprovalStatus = entity.getApprovalStatus();
        boolean wasApproved = previousApprovalStatus == ApprovalStatus.APPROVED
                || previousApprovalStatus == ApprovalStatus.APPROVED_LEVEL2;

        Map<String, String> previousValues = new LinkedHashMap<>();
        applyIfChanged("stationName", entity.getStationName(), request.getStationName() != null ? request.getStationName().trim() : null, entity::setStationName, previousValues);
        applyIfChanged("stationType", entity.getStationType(), request.getStationType() != null ? request.getStationType().trim() : null, entity::setStationType, previousValues);
        applyIfChanged("location", entity.getLocation(), request.getLocation() != null ? request.getLocation().trim() : null, entity::setLocation, previousValues);
        applyIfChanged("coverage", entity.getCoverage(), request.getCoverage() != null ? request.getCoverage().trim() : null, entity::setCoverage, previousValues);
        applyIfChanged("emissionArea", entity.getEmissionArea(), request.getEmissionArea(), entity::setEmissionArea, previousValues);
        applyIfChanged("source", entity.getSource(), request.getSource() != null ? request.getSource().trim() : null, entity::setSource, previousValues);
        applyIfChanged("conditionStatus", entity.getConditionStatus(), request.getConditionStatus() != null ? request.getConditionStatus().trim() : null, entity::setConditionStatus, previousValues);
        applyIfChanged("orgUnitId", entity.getOrgUnitId(), request.getOrgUnitId(), entity::setOrgUnitId, previousValues);
        applyIfChanged("seaportId", entity.getSeaportId(), request.getSeaportId(), entity::setSeaportId, previousValues);
        applyIfChanged("vtsSystemId", entity.getVtsSystemId(), request.getVtsSystemId(), entity::setVtsSystemId, previousValues);
        applyIfChanged("vtsOperationCenterId", entity.getVtsOperationCenterId(), request.getVtsOperationCenterId(), entity::setVtsOperationCenterId, previousValues);
        applyIfChanged("operatingUnitId", entity.getOperatingUnitId(), request.getOperatingUnitId(), entity::setOperatingUnitId, previousValues);
        applyIfChanged("provinceId", entity.getProvinceId(), request.getProvinceId(), entity::setProvinceId, previousValues);
        applyIfChanged("unitOfMeasure", entity.getUnitOfMeasure(), request.getUnitOfMeasure() != null ? request.getUnitOfMeasure().trim() : null, entity::setUnitOfMeasure, previousValues);
        applyIfChanged("quantity", entity.getQuantity(), request.getQuantity(), entity::setQuantity, previousValues);
        applyIfChanged("towerHeight", entity.getTowerHeight(), request.getTowerHeight(), entity::setTowerHeight, previousValues);
        applyIfChanged("radarRange", entity.getRadarRange(), request.getRadarRange(), entity::setRadarRange, previousValues);
        applyIfChanged("note", entity.getNote(), request.getNote() != null ? request.getNote().trim() : null, entity::setNote, previousValues);
        applyIfChanged("mapIcon", entity.getMapIcon(), request.getMapIcon() != null ? request.getMapIcon().trim() : null, entity::setMapIcon, previousValues);

        String oldCoord = entity.getSpatialId() != null ? gisSpatialObjectService.getCoordinatesBySpatialId(entity.getSpatialId()) : null;
        GisGeometryType oldGeom = null;
        if (entity.getSpatialId() != null) {
            Optional<GisSpatialObject> sp = gisSpatialObjectService.findById(entity.getSpatialId());
            if (sp.isPresent()) oldGeom = sp.get().getGeometryType();
        }
        String newCoord = trimToNull(request.getCoordinates());
        if (newCoord == null && request.getLongitude() != null && request.getLatitude() != null) {
            newCoord = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }
        if (newCoord != null && !Objects.equals(newCoord, oldCoord)) {
            previousValues.put("coordinates", oldCoord != null ? oldCoord : "Chưa có");
        }
        if (request.getGeometryType() != null && !Objects.equals(request.getGeometryType(), oldGeom)) {
            previousValues.put("geometryType", oldGeom != null ? oldGeom.name() : "Chưa có");
        }

        if (wasApproved) {
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
        }

        RadarStation saved = repository.save(entity);

        if (newCoord != null) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
            GisSpatialObjectType objType = GisSpatialObjectType.POINT_OTHER;
            UUID refId = saved.getId();
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getSpatialId(),
                    saved.getStationName(),
                    "RADAR_" + saved.getId(),
                    geomType,
                    objType,
                    newCoord,
                    refId,
                    InfrastructureType.RADAR_STATION_LEGACY
            );
            if (saved.getSpatialId() == null) {
                saved.setSpatialId(spatialObj.getId());
                saved = repository.save(saved);
            }
        }

        if (wasApproved) {
            if (!previousValues.isEmpty()) {
                for (Map.Entry<String, String> entry : previousValues.entrySet()) {
                    String field = entry.getKey();
                    String fieldName = getFieldDisplayName(field);
                    String oldVal = entry.getValue() != null ? entry.getValue() : "";
                    Object rawNew;
                    if ("coordinates".equals(field)) {
                        rawNew = newCoord;
                    } else if ("geometryType".equals(field)) {
                        rawNew = request.getGeometryType() != null ? request.getGeometryType().name() : null;
                    } else {
                        rawNew = getEntityFieldValue(saved, field);
                    }
                    String newVal = rawNew != null ? String.valueOf(rawNew) : null;
                    historyRepository.save(InfrastructureHistory.builder()
                            .refId(saved.getId())
                            .refType(InfrastructureType.RADAR_STATION)
                            .approvalLevel(ApprovalLevel.LEVEL_2)
                            .status(InfrastructureHistoryStatus.UPDATED)
                            .approvedBy(updatedBy)
                            .changedField(fieldName)
                            .previousValue(formatDisplayValue(field, oldVal))
                            .newValue(formatDisplayValue(field, newVal))
                            .reason("Cập nhật " + fieldName)
                            .build());
                }
            } else {
                historyRepository.save(InfrastructureHistory.builder()
                        .refId(saved.getId())
                        .refType(InfrastructureType.RADAR_STATION)
                        .approvalLevel(ApprovalLevel.LEVEL_2)
                        .status(InfrastructureHistoryStatus.UPDATED)
                        .approvedBy(updatedBy)
                        .reason("Cập nhật sau phê duyệt")
                        .build());
            }
        }

        return toResponse(saved);
    }

    private <T> void applyIfChanged(String field, T oldVal, T newVal, java.util.function.Consumer<T> setter,
            Map<String, String> previousValues) {
        if (newVal == null) return;
        if (Objects.equals(newVal, oldVal)) return;
        previousValues.put(field, oldVal != null ? String.valueOf(oldVal) : "Chưa có");
        setter.accept(newVal);
    }

    private String getFieldDisplayName(String field) {
        if ("stationName".equals(field)) return "Tên trạm radar";
        if ("stationType".equals(field)) return "Loại trạm";
        if ("location".equals(field)) return "Địa điểm chi tiết";
        if ("coverage".equals(field)) return "Vùng phủ sóng";
        if ("emissionArea".equals(field)) return "Diện tích phát xạ";
        if ("source".equals(field)) return "Nguồn dữ liệu";
        if ("conditionStatus".equals(field)) return "Tình trạng hoạt động";
        if ("orgUnitId".equals(field)) return "Đơn vị quản lý";
        if ("seaportId".equals(field)) return "Thuộc cảng biển";
        if ("vtsSystemId".equals(field)) return "Hệ thống VTS";
        if ("vtsOperationCenterId".equals(field)) return "Trung tâm điều hành VTS";
        if ("operatingUnitId".equals(field)) return "Đơn vị vận hành";
        if ("provinceId".equals(field)) return "Địa điểm (Tỉnh/TP)";
        if ("unitOfMeasure".equals(field)) return "Đơn vị tính";
        if ("quantity".equals(field)) return "Số lượng";
        if ("towerHeight".equals(field)) return "Chiều cao tháp";
        if ("radarRange".equals(field)) return "Tầm phủ radar";
        if ("note".equals(field)) return "Ghi chú";
        if ("mapIcon".equals(field)) return "Biểu tượng";
        if ("coordinates".equals(field)) return "Tọa độ";
        if ("geometryType".equals(field)) return "Loại đối tượng (GIS)";
        return field;
    }

    private Object getEntityFieldValue(RadarStation entity, String field) {
        return switch (field) {
            case "stationName" -> entity.getStationName();
            case "stationType" -> entity.getStationType();
            case "location" -> entity.getLocation();
            case "coverage" -> entity.getCoverage();
            case "emissionArea" -> entity.getEmissionArea();
            case "source" -> entity.getSource();
            case "conditionStatus" -> entity.getConditionStatus();
            case "orgUnitId" -> entity.getOrgUnitId();
            case "seaportId" -> entity.getSeaportId();
            case "vtsSystemId" -> entity.getVtsSystemId();
            case "vtsOperationCenterId" -> entity.getVtsOperationCenterId();
            case "operatingUnitId" -> entity.getOperatingUnitId();
            case "provinceId" -> entity.getProvinceId();
            case "unitOfMeasure" -> entity.getUnitOfMeasure();
            case "quantity" -> entity.getQuantity();
            case "towerHeight" -> entity.getTowerHeight();
            case "radarRange" -> entity.getRadarRange();
            case "note" -> entity.getNote();
            case "mapIcon" -> entity.getMapIcon();
            default -> null;
        };
    }

    public void delete(UUID id, UUID userId) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        validateAllowedOrgUnit(entity.getOrgUnitId());

        InfrastructureHistoryUtils.recordSoftDelete(historyRepository, entity.getId(), InfrastructureType.RADAR_STATION, userId, "Xóa trạm radar");
        entity.setDeletedAt(LocalDateTime.now());
        entity.setDeletedBy(userId);
        entity.setApprovalStatus(ApprovalStatus.ARCHIVED);
        repository.save(entity);
    }

    public RadarStationResponse submitForApproval(UUID id, UUID userId) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.submit(entity, InfrastructureType.RADAR_STATION, userId);
        return toResponse(repository.save(entity));
    }

    public RadarStationResponse approveLevel1(UUID id, UUID userId, String note) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC1(entity, InfrastructureType.RADAR_STATION, "APPROVED", note, userId);
        return toResponse(repository.save(entity));
    }

    public RadarStationResponse approveLevel2(UUID id, UUID userId, String note) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC2(entity, InfrastructureType.RADAR_STATION, "APPROVED", note, userId);
        return toResponse(repository.save(entity));
    }

    public RadarStationResponse rejectLevel1(UUID id, UUID userId, String reason) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC1(entity, InfrastructureType.RADAR_STATION, "REJECTED", reason, userId);
        return toResponse(repository.save(entity));
    }

    public RadarStationResponse rejectLevel2(UUID id, UUID userId, String reason) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());
        approvalService.approveC2(entity, InfrastructureType.RADAR_STATION, "REJECTED", reason, userId);
        return toResponse(repository.save(entity));
    }

    // Aliases for legacy controllers
    public RadarStationResponse approveL1(UUID id, UUID approverId) {
        return approveLevel1(id, approverId, "Phê duyệt cấp Chi cục trạm radar");
    }

    public RadarStationResponse reject(UUID id, String rejectReason, UUID approverId) {
        return rejectLevel1(id, approverId, rejectReason);
    }

    @Transactional(readOnly = true)
    public List<RadarStationOptionResponse> getOptions(UUID orgUnitId) {
        return repository.findAllApprovedOptions(orgUnitId).stream()
                .map(r -> RadarStationOptionResponse.builder()
                        .id(r.getId())
                        .code(r.getCode())
                        .stationName(r.getStationName())
                        .orgUnitId(r.getOrgUnitId())
                        .build())
                .toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getTabCounts(UUID orgUnitId, String keyword, String conditionStatus) {
        return getTabCounts(orgUnitId, keyword, null, conditionStatus);
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getTabCounts(UUID orgUnitId, String keyword, String stationName, String conditionStatus) {
        Scope scope = resolveEffectiveScope(orgUnitId);
        String keywordPattern = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + normalizeSearchKeyword(keyword) + "%"
                : null;
        String stationNamePattern = (stationName != null && !stationName.trim().isEmpty())
                ? "%" + normalizeSearchKeyword(stationName) + "%"
                : null;
        List<Object[]> rows = repository.countByApprovalStatus(
                !scope.unrestricted(), scope.orgUnitIds(), keywordPattern, stationNamePattern, conditionStatus);

        Map<String, Long> counts = new HashMap<>();
        counts.put("", 0L);
        counts.put("DRAFT", 0L);
        counts.put("PENDING_APPROVAL", 0L);
        counts.put("APPROVED_LEVEL1", 0L);
        counts.put("REJECTED_LEVEL1", 0L);
        counts.put("REJECTED_LEVEL2", 0L);
        counts.put("APPROVED", 0L);
        counts.put("DELETED", 0L);

        long total = 0L;
        for (Object[] row : rows) {
            if (row[0] == null) continue;
            ApprovalStatus st = (ApprovalStatus) row[0];
            long count = ((Number) row[1]).longValue();
            total += count;

            switch (st) {
                case DRAFT, PROPOSED -> counts.put("DRAFT", counts.get("DRAFT") + count);
                case PENDING_APPROVAL -> counts.put("PENDING_APPROVAL", counts.get("PENDING_APPROVAL") + count);
                case APPROVED_LEVEL1 -> counts.put("APPROVED_LEVEL1", counts.get("APPROVED_LEVEL1") + count);
                case REJECTED_LEVEL1, REJECTED -> counts.put("REJECTED_LEVEL1", counts.get("REJECTED_LEVEL1") + count);
                case REJECTED_LEVEL2 -> counts.put("REJECTED_LEVEL2", counts.get("REJECTED_LEVEL2") + count);
                case APPROVED, APPROVED_LEVEL2 -> counts.put("APPROVED", counts.get("APPROVED") + count);
                default -> {}
            }
        }

        long deletedCount = repository.countDeleted(
                !scope.unrestricted(), scope.orgUnitIds(), keywordPattern, stationNamePattern, conditionStatus);
        counts.put("DELETED", deletedCount);
        total += deletedCount;

        counts.put("", total);
        return counts;
    }

    @Transactional(readOnly = true)
    public Page<RadarStationResponse> searchPaged(String keyword, String code, UUID orgUnitId, UUID seaportId,
                                                   UUID vtsSystemId, UUID vtsOperationCenterId,
                                                   UUID operatingUnitId, Integer provinceId,
                                                   String conditionStatus, String approvalStatusStr,
                                                   String legacyStatus, UUID updatedBy, LocalDateTime updatedFrom, LocalDateTime updatedTo,
                                                   Pageable pageable) {
        return searchPaged(keyword, null, code, orgUnitId, seaportId, vtsSystemId, vtsOperationCenterId,
                operatingUnitId, provinceId, conditionStatus, approvalStatusStr, legacyStatus, updatedBy, updatedFrom, updatedTo, pageable);
    }

    @Transactional(readOnly = true)
    public Page<RadarStationResponse> searchPaged(String keyword, String stationName, String code, UUID orgUnitId, UUID seaportId,
                                                   UUID vtsSystemId, UUID vtsOperationCenterId,
                                                   UUID operatingUnitId, Integer provinceId,
                                                   String conditionStatus, String approvalStatusStr,
                                                   String legacyStatus, UUID updatedBy, LocalDateTime updatedFrom, LocalDateTime updatedTo,
                                                   Pageable pageable) {
        Scope scope = resolveEffectiveScope(orgUnitId);
        String keywordPattern = (keyword != null && !keyword.trim().isEmpty())
                ? "%" + normalizeSearchKeyword(keyword) + "%"
                : null;
        String stationNamePattern = (stationName != null && !stationName.trim().isEmpty())
                ? "%" + normalizeSearchKeyword(stationName) + "%"
                : null;
        String codePattern = (code != null && !code.trim().isEmpty())
                ? "%" + normalizeSearchKeyword(code) + "%"
                : null;
        boolean deletedOnly = "DELETED".equalsIgnoreCase(approvalStatusStr != null ? approvalStatusStr.trim() : null);
        ApprovalStatus statusEnum = (approvalStatusStr != null && !approvalStatusStr.trim().isEmpty() && !deletedOnly)
                ? ApprovalStatus.fromString(approvalStatusStr)
                : null;

        return repository.searchPaged(
                !scope.unrestricted(), scope.orgUnitIds(), keywordPattern, stationNamePattern, codePattern,
                seaportId, vtsSystemId, vtsOperationCenterId, operatingUnitId, provinceId,
                conditionStatus, statusEnum, deletedOnly, updatedBy, updatedFrom, updatedTo, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public List<RadarStationResponse> search(UUID orgUnitId, String keyword, String conditionStatus, String approvalStatusStr) {
        return searchPaged(keyword, null, orgUnitId, null, null, null, null, null,
                conditionStatus, approvalStatusStr, null, null, null, null, Pageable.unpaged())
                .getContent();
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID radarStationId) {
        return getHistory(radarStationId, null, null);
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID radarStationId, Integer page, Integer pageSize) {
        return getHistory(radarStationId, page, pageSize, null, (LocalDateTime) null, (LocalDateTime) null);
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID radarStationId, Integer page, Integer pageSize, String keyword,
            String fromDate, String toDate) {
        return getHistory(radarStationId, page, pageSize, keyword, parseFromDate(fromDate), parseToDate(toDate));
    }

    @Transactional(readOnly = true)
    public List<HistoryEntry> getHistory(UUID radarStationId, Integer page, Integer pageSize, String keyword,
            LocalDateTime fromDate, LocalDateTime toDate) {
        RadarStation parent = repository.findById(radarStationId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + radarStationId));
        validateAllowedOrgUnit(parent.getOrgUnitId());

        String normalizedKeyword = normalizeSearchKeyword(keyword);
        boolean paged = page != null && pageSize != null && pageSize > 0;
        List<InfrastructureHistory> historyList;
        if (normalizedKeyword == null && fromDate == null && toDate == null) {
            historyList = paged
                    ? historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                            InfrastructureType.RADAR_STATION, radarStationId, PageRequest.of(page, pageSize))
                    : historyRepository.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                            InfrastructureType.RADAR_STATION, radarStationId);
        } else {
            historyList = historyRepository.searchHistory(
                    InfrastructureType.RADAR_STATION, radarStationId, normalizedKeyword, fromDate, toDate,
                    paged ? PageRequest.of(page, pageSize) : Pageable.unpaged());
        }

        Set<UUID> userIds = historyList.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, User> userMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllByIdInWithOrgUnit(userIds).stream()
                        .collect(Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        return historyList.stream().map(h -> {
            User u = h.getApprovedBy() != null ? userMap.get(h.getApprovedBy()) : null;
            // list-screen-ui-standard §3: chỉ Họ và tên (hoặc tên đăng nhập);
            // không để lộ email hay UUID ra giao diện.
            String userName = u != null
                    ? (u.getFullName() != null && !u.getFullName().trim().isEmpty() ? u.getFullName()
                            : (u.getUsername() != null && !u.getUsername().trim().isEmpty() ? u.getUsername() : null))
                    : null;
            String orgUnitName = null;
            if (u != null) {
                if (u.getOrgUnit() != null && u.getOrgUnit().getName() != null && !u.getOrgUnit().getName().isBlank()) {
                    orgUnitName = u.getOrgUnit().getName();
                } else if (u.getDepartment() != null && !u.getDepartment().isBlank()) {
                    orgUnitName = u.getDepartment();
                } else {
                    orgUnitName = "Cục Hàng hải Việt Nam";
                }
            }
            if (orgUnitName == null) {
                orgUnitName = "Cục Hàng hải Việt Nam";
            }
            return HistoryEntry.builder()
                    .id(h.getId())
                    .approvalLevel(h.getApprovalLevel())
                    .status(h.getStatus() != null ? h.getStatus().getCode() : null)
                    .approvedBy(userName)
                    .orgUnitName(orgUnitName)
                    .approvedDate(h.getApprovedDate())
                    .reason(h.getReason())
                    .changedField(h.getChangedField())
                    .previousValue(formatDisplayValue(h.getChangedField(), h.getPreviousValue()))
                    .newValue(formatDisplayValue(h.getChangedField(), h.getNewValue()))
                    .build();
        }).toList();
    }

    private LocalDateTime parseFromDate(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        try {
            String v = value.trim();
            if (v.length() == 10) {
                return LocalDate.parse(v).atStartOfDay();
            }
            return LocalDateTime.parse(v.replace(" ", "T"));
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDateTime parseToDate(String value) {
        if (value == null || value.trim().isEmpty()) return null;
        try {
            String v = value.trim();
            if (v.length() == 10) {
                return LocalDate.parse(v).atTime(LocalTime.MAX);
            }
            return LocalDateTime.parse(v.replace(" ", "T"));
        } catch (Exception e) {
            return null;
        }
    }

    public String formatDisplayValue(String field, String rawValue) {
        if (rawValue == null || rawValue.isEmpty() || "null".equalsIgnoreCase(rawValue) || "Chưa có".equals(rawValue)) {
            return "Chưa có";
        }
        if ("mapIcon".equals(field) || "Biểu tượng".equals(field) || "Biểu tượng bản đồ".equals(field) || "symbolId".equals(field)) {
            try {
                UUID symId = UUID.fromString(rawValue);
                List<String> names = jdbcTemplate.queryForList("SELECT name FROM map_symbols WHERE id = ?", String.class, symId);
                return (!names.isEmpty() && names.get(0) != null) ? names.get(0) : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if ("orgUnitId".equals(field) || "Đơn vị quản lý".equals(field)) {
            try {
                String name = orgUnitCacheService.getName(UUID.fromString(rawValue));
                return name != null ? name : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if ("seaportId".equals(field) || "Thuộc cảng biển".equals(field)) {
            try {
                UUID pId = UUID.fromString(rawValue);
                return portRepository.findById(pId).map(Port::getPortName).orElse(rawValue);
            } catch (Exception e) {
                return rawValue;
            }
        }
        if ("vtsSystemId".equals(field) || "Hệ thống VTS".equals(field) || "Thuộc hệ thống VTS".equals(field)) {
            try {
                UUID sid = UUID.fromString(rawValue);
                return vtsSystemRepository.findById(sid).map(VtsSystem::getSystemName).orElse(rawValue);
            } catch (Exception e) {
                return rawValue;
            }
        }
        if ("vtsOperationCenterId".equals(field) || "Trung tâm điều hành VTS".equals(field)) {
            try {
                UUID cid = UUID.fromString(rawValue);
                List<String> names = jdbcTemplate.queryForList("SELECT name FROM vts_operation_centers WHERE id = ? AND deleted_at IS NULL", String.class, cid);
                if (!names.isEmpty() && names.get(0) != null) {
                    return names.get(0);
                }
                return vtsSystemRepository.findById(cid).map(VtsSystem::getSystemName).orElse(rawValue);
            } catch (Exception e) {
                return rawValue;
            }
        }
        if ("operatingUnitId".equals(field) || "Đơn vị vận hành".equals(field) || "Đơn vị khai thác".equals(field)) {
            try {
                UUID uid = UUID.fromString(rawValue);
                String name = orgUnitCacheService.getName(uid);
                if (name != null && !name.equals(rawValue)) {
                    return name;
                }
                List<String> names = jdbcTemplate.queryForList("SELECT name FROM operating_units WHERE id = ?", String.class, uid);
                if (!names.isEmpty() && names.get(0) != null) {
                    return names.get(0);
                }
                names = jdbcTemplate.queryForList("SELECT name FROM operating_organizations WHERE id = ?", String.class, uid);
                if (!names.isEmpty() && names.get(0) != null) {
                    return names.get(0);
                }
                return rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if ("provinceId".equals(field) || "Địa điểm (Tỉnh/TP)".equals(field) || "Tỉnh / Thành phố".equals(field)) {
            try {
                int pid = Integer.parseInt(rawValue);
                List<String> names = jdbcTemplate.queryForList("SELECT name FROM provinces WHERE id = ?", String.class, pid);
                return (!names.isEmpty() && names.get(0) != null) ? names.get(0) : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if ("stationType".equals(field) || "Loại trạm".equals(field)) {
            if ("INDEPENDENT".equalsIgnoreCase(rawValue) || "1".equals(rawValue)) return "Trạm độc lập";
            if ("DEPENDENT".equalsIgnoreCase(rawValue) || "2".equals(rawValue)) return "Trạm phụ thuộc";
            return rawValue;
        }
        if ("conditionStatus".equals(field) || "Tình trạng".equals(field) || "Tình trạng hoạt động".equals(field)) {
            if ("1".equals(rawValue) || "OPERATIONAL".equalsIgnoreCase(rawValue)) return "Đang khai thác/vận hành";
            if ("2".equals(rawValue) || "MAINTENANCE".equalsIgnoreCase(rawValue)) return "Đang bảo trì";
            if ("3".equals(rawValue) || "STOPPED".equalsIgnoreCase(rawValue)) return "Dừng khai thác/vận hành";
            if ("4".equals(rawValue) || "UNDER_CONSTRUCTION".equalsIgnoreCase(rawValue)) return "Đang xây dựng";
            return rawValue;
        }
        if ("geometryType".equals(field) || "Loại đối tượng (GIS)".equals(field) || "Loại đối tượng GIS".equals(field)) {
            if (GisGeometryType.POINT.name().equalsIgnoreCase(rawValue)) return "Đối tượng điểm";
            if (GisGeometryType.LINE.name().equalsIgnoreCase(rawValue) || "LINESTRING".equalsIgnoreCase(rawValue)) return "Đối tượng đường";
            if (GisGeometryType.POLYGON.name().equalsIgnoreCase(rawValue)) return "Đối tượng vùng";
            return rawValue;
        }
        if ("approvalStatus".equals(field) || "Trạng thái phê duyệt".equals(field)) {
            if (ApprovalStatus.DRAFT.name().equalsIgnoreCase(rawValue) || "DRAFT".equalsIgnoreCase(rawValue)) return "Lưu tạm";
            if (ApprovalStatus.PROPOSED.name().equalsIgnoreCase(rawValue) || ApprovalStatus.PENDING_APPROVAL.name().equalsIgnoreCase(rawValue) || "PENDING_APPROVAL".equalsIgnoreCase(rawValue)) return "Chờ Cảng vụ duyệt";
            if (ApprovalStatus.APPROVED_LEVEL1.name().equalsIgnoreCase(rawValue) || "APPROVED_LEVEL1".equalsIgnoreCase(rawValue)) return "Chờ Cục duyệt";
            if (ApprovalStatus.APPROVED.name().equalsIgnoreCase(rawValue) || ApprovalStatus.APPROVED_LEVEL2.name().equalsIgnoreCase(rawValue) || "APPROVED".equalsIgnoreCase(rawValue)) return "Đã duyệt";
            if (ApprovalStatus.REJECTED_LEVEL1.name().equalsIgnoreCase(rawValue) || "REJECTED_LEVEL1".equalsIgnoreCase(rawValue)) return "Bị Cảng vụ trả về";
            if (ApprovalStatus.REJECTED_LEVEL2.name().equalsIgnoreCase(rawValue) || ApprovalStatus.REJECTED.name().equalsIgnoreCase(rawValue) || "REJECTED".equalsIgnoreCase(rawValue)) return "Bị Cục trả về";
            return rawValue;
        }
        if ("coordinateSystem".equals(field) || "Hệ tọa độ".equals(field) || "Hệ quy chiếu".equals(field)) {
            if ("1".equals(rawValue) || "4326".equals(rawValue)) return "WGS 84";
            if ("2".equals(rawValue)) return "VN-2000";
            return rawValue;
        }
        if ("coordinates".equals(field) || "Tọa độ".equals(field) || "Tọa độ GIS".equals(field)) {
            if (rawValue == null || rawValue.trim().isEmpty() || "Chưa có".equals(rawValue) || "null".equalsIgnoreCase(rawValue)) {
                return "Chưa có";
            }
            return rawValue.trim();
        }
        return rawValue;
    }

    private static String normalizeSearchKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) return null;
        return Normalizer.normalize(keyword.trim().toLowerCase(java.util.Locale.ROOT), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
    }

    // ── Attachment operations ─────────────────────────────────────────

    public List<RadarStationAttachmentResponse> uploadAttachments(UUID id, List<MultipartFile> files, UUID userId) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));

        validateAllowedOrgUnit(entity.getOrgUnitId());

        long existingCount = attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.RADAR_STATION).size();
        if (existingCount + files.size() > 10) {
            throw new IllegalArgumentException("Tối đa 10 file đính kèm");
        }

        java.nio.file.Path basePath = java.nio.file.Paths.get(attachmentPath).toAbsolutePath().normalize();
        List<InfrastructureAttachment> savedAttachments = new ArrayList<>();
        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
            String storageFileName = System.currentTimeMillis() + "_" + originalFilename;

            try {
                java.nio.file.Path dir = basePath.resolve(InfrastructureType.RADAR_STATION.name()).resolve(id.toString());
                java.nio.file.Files.createDirectories(dir);
                java.nio.file.Path filePath = dir.resolve(storageFileName);
                file.transferTo(filePath.toFile());
            } catch (Exception e) {
                log.warn("Không thể lưu file {} cho trạm radar {}: {}", originalFilename, id, e.getMessage());
                throw new RuntimeException("Không thể lưu file: " + originalFilename);
            }

            InfrastructureAttachment attachment = InfrastructureAttachment.builder()
                    .refId(id)
                    .refType(InfrastructureType.RADAR_STATION)
                    .fileName(originalFilename)
                    .filePath(basePath.resolve(InfrastructureType.RADAR_STATION.name()).resolve(id.toString()).resolve(storageFileName).toString())
                    .fileSize(file.getSize())
                    .fileType(AttachmentFileType.fromValue(file.getContentType()))
                    .uploadedBy(userId)
                    .build();
            savedAttachments.add(attachmentRepository.save(attachment));

            if (historyRepository != null) {
                historyRepository.save(InfrastructureHistory.builder()
                        .refId(id)
                        .refType(InfrastructureType.RADAR_STATION)
                        .approvalLevel(ApprovalLevel.LEVEL_0)
                        .status(InfrastructureHistoryStatus.ATTACHMENT_UPLOADED)
                        .approvedBy(userId)
                        .approvedDate(LocalDateTime.now())
                        .reason("Tải lên tài liệu đính kèm: " + originalFilename)
                        .changedField("Tài liệu đính kèm")
                        .previousValue("—")
                        .newValue(originalFilename)
                        .build());
            }
        }
        return savedAttachments.stream().map(this::toAttachmentResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<RadarStationAttachmentResponse> listAttachments(UUID id) {
        return attachmentRepository.findByRefIdAndRefTypeOrderByUploadedDateDesc(id, InfrastructureType.RADAR_STATION)
                .stream().map(this::toAttachmentResponse).toList();
    }

    public void deleteAttachment(UUID id, UUID attachmentId, UUID userId) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());

        InfrastructureAttachment attachment = attachmentRepository.findByIdAndRefIdAndRefType(attachmentId, id, InfrastructureType.RADAR_STATION)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm với ID: " + attachmentId));
        String fileName = attachment.getFileName();
        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
        } catch (Exception e) {
            log.warn("Không thể xóa file vật lý {}: {}", attachment.getFilePath(), e.getMessage());
        }
        attachmentRepository.delete(attachment);

        if (historyRepository != null) {
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(id)
                    .refType(InfrastructureType.RADAR_STATION)
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(InfrastructureHistoryStatus.ATTACHMENT_DELETED)
                    .approvedBy(userId)
                    .approvedDate(LocalDateTime.now())
                    .reason("Xóa tài liệu đính kèm: " + fileName)
                    .changedField("Tài liệu đính kèm")
                    .previousValue(fileName)
                    .newValue("—")
                    .build());
        }
    }

    @Transactional(readOnly = true)
    public InfrastructureAttachment getAttachment(UUID id, UUID attId) {
        RadarStation entity = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy Trạm Radar với ID: " + id));
        validateAllowedOrgUnit(entity.getOrgUnitId());

        return attachmentRepository.findByIdAndRefIdAndRefType(attId, id, InfrastructureType.RADAR_STATION)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy file đính kèm với ID: " + attId));
    }

    private RadarStationAttachmentResponse toAttachmentResponse(InfrastructureAttachment a) {
        return RadarStationAttachmentResponse.builder()
                .id(a.getId())
                .fileName(a.getFileName())
                .filePath("/api/v1/radar-stations/" + a.getRefId()
                        + "/attachments/" + a.getId() + "/download")
                .fileSize(a.getFileSize())
                .documentType(a.getFileType() != null ? a.getFileType().getCode() : "OTHER")
                .uploadedBy(a.getUploadedBy() != null ? a.getUploadedBy().toString() : null)
                .uploadedDate(a.getUploadedDate())
                .build();
    }

    private RadarStationResponse toResponse(RadarStation entity) {
        List<RadarStationAttachmentResponse> attachments = attachmentRepository
                .findByRefIdAndRefTypeOrderByUploadedDateDesc(entity.getId(), InfrastructureType.RADAR_STATION)
                .stream().map(this::toAttachmentResponse).toList();

        // Gom người dùng (tạo / sửa / gửi duyệt / duyệt C1 / duyệt C2 / xóa) vào một truy vấn.
        Set<UUID> relatedUserIds = Stream
                .of(entity.getCreatedBy(), entity.getUpdatedBy(), entity.getApproverLevel1(),
                        entity.getApproverLevel2(), entity.getSubmittedBy(), entity.getDeletedBy())
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<UUID, String> relatedUserNames = new HashMap<>();
        if (!relatedUserIds.isEmpty()) {
            userRepository.findAllById(relatedUserIds).stream()
                    .forEach(u -> relatedUserNames.put(u.getId(),
                            u.getFullName() != null && !u.getFullName().isBlank()
                                    ? u.getFullName().trim() : u.getUsername()));
        }

        String createdByName = relatedUserNames.get(entity.getCreatedBy());
        String updatedByName = relatedUserNames.get(entity.getUpdatedBy());
        String submittedByName = relatedUserNames.get(entity.getSubmittedBy());
        String approverLevel1Name = relatedUserNames.get(entity.getApproverLevel1());
        String approverLevel2Name = relatedUserNames.get(entity.getApproverLevel2());
        String deletedByName = relatedUserNames.get(entity.getDeletedBy());

        RadarStationResponse.RadarStationResponseBuilder builder = RadarStationResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .stationName(entity.getStationName())
                .location(entity.getLocation())
                .stationType(entity.getStationType())
                .coverage(entity.getCoverage())
                .emissionArea(entity.getEmissionArea())
                .source(entity.getSource())
                .conditionStatus(entity.getConditionStatus())
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))
                .seaportId(entity.getSeaportId())
                .seaportName(entity.getSeaportId() != null ?
                        portRepository.findById(entity.getSeaportId()).map(Port::getPortName).orElse("") : "")
                .vtsSystemId(entity.getVtsSystemId())
                .vtsSystemName(entity.getVtsSystemId() != null ?
                        vtsSystemRepository.findById(entity.getVtsSystemId()).map(VtsSystem::getSystemName).orElse("") : "")
                .vtsOperationCenterId(entity.getVtsOperationCenterId())
                .vtsOperationCenterName(entity.getVtsOperationCenterId() != null ?
                        vtsSystemRepository.findById(entity.getVtsOperationCenterId()).map(VtsSystem::getSystemName).orElse("") : "")
                .operatingUnitId(entity.getOperatingUnitId())
                .operatingUnitName(orgUnitCacheService.getName(entity.getOperatingUnitId()))
                .provinceId(entity.getProvinceId())
                .unitOfMeasure(entity.getUnitOfMeasure())
                .quantity(entity.getQuantity())
                .note(entity.getNote())
                .approvalStatus(entity.getApprovalStatus())
                .status(entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : "DRAFT")
                .approverLevel1(entity.getApproverLevel1())
                .approverLevel1Name(approverLevel1Name)
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approvedLevel1(entity.getApproverLevel1() != null)
                .approverLevel2(entity.getApproverLevel2())
                .approverLevel2Name(approverLevel2Name)
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .approvedLevel2(entity.getApproverLevel2() != null)
                .rejectionReason(entity.getRejectionReason())
                .level1ApprovalContent(entity.getLevel1ApprovalContent())
                .level2ApprovalContent(entity.getLevel2ApprovalContent())
                .submittedForApprovalBy(entity.getSubmittedBy())
                .submittedForApprovalAt(entity.getSubmittedAt())
                .submittedByName(submittedByName)
                .createdBy(entity.getCreatedBy())
                .createdByName(createdByName)
                .createdDate(entity.getCreatedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedByName(updatedByName)
                .updatedDate(entity.getUpdatedAt())
                .attachments(attachments)
                .deletedBy(entity.getDeletedBy())
                .deletedByName(deletedByName)
                .deletedAt(entity.getDeletedAt())
                .towerHeight(entity.getTowerHeight())
                .radarRange(entity.getRadarRange())
                .mapIcon(entity.getMapIcon());

        if (entity.getSpatialId() != null) {
            builder.spatialId(entity.getSpatialId());
            gisSpatialObjectService.findById(entity.getSpatialId()).ifPresent(spatialObj -> {
                builder.geometryType(spatialObj.getGeometryType());
                builder.coordinates(spatialObj.getCoordinates());
                try {
                    String clean = spatialObj.getCoordinates().replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        builder.longitude(new BigDecimal(parts[0]));
                        builder.latitude(new BigDecimal(parts[1]));
                    }
                } catch (Exception ex) {
                    // ignore
                }
            });
        }
        return builder.build();
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
