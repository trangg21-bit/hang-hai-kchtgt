package com.hanghai.kchtg.beacon.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.beacon.dto.buoy.BuoyResponse;
import com.hanghai.kchtg.beacon.dto.buoy.CreateBuoyRequest;
import com.hanghai.kchtg.beacon.dto.buoy.UpdateBuoyRequest;
import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.entity.BuoyStation;
import com.hanghai.kchtg.station.repository.BuoyStationRepository;
import com.hanghai.kchtg.port.dto.berth.AttachmentDto;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for Buoy CRUD + approval workflow (F-074 to F-077).
 * Parallel structure to BeaconStationService.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class BuoyService {

    private final BuoyRepository buoyRepo;
    private final InfrastructureHistoryRepository infraHistoryRepo;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final OrgUnitRepository orgUnitRepo;
    private final BuoyStationRepository buoyStationRepo;
    private final ChangeHistoryService changeHistoryService;
    private final PointObjectSyncService pointObjectSyncService;
    private final AttachmentRepository attachmentRepository;

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    // -- READ --

    public List<BuoyResponse> findAll() {
        return buoyRepo.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public BuoyResponse findById(UUID id) {
        Buoy entity = buoyRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Phao tiêu không tìm thấy: " + id));
        return toResponse(entity);
    }

    public List<BuoyResponse> search(
            String name, String code, String type, String status,
            String condition, Integer provinceId, String locationDetail, String approvalStatus) {
        return search(name, code, type, status, condition, provinceId, locationDetail, approvalStatus,
                null, null);
    }

    public List<BuoyResponse> search(
            String name, String code, String type, String status,
            String condition, Integer provinceId, String locationDetail, String approvalStatus,
            String sortBy, String sortDir) {
        Sort sort = buildSort(sortBy, sortDir);
        return buoyRepo.searchFiltered(
                name != null && !name.trim().isEmpty() ? name.trim() : null,
                code != null && !code.trim().isEmpty() ? code.trim() : null,
                type != null && !type.trim().isEmpty() ? type.trim() : null,
                status != null && !status.trim().isEmpty() ? status.trim() : null,
                condition != null && !condition.trim().isEmpty() ? normalizeCondition(condition) : null,
                provinceId,
                locationDetail != null && !locationDetail.trim().isEmpty() ? locationDetail.trim() : null,
                approvalStatus != null && !approvalStatus.trim().isEmpty() ? approvalStatus.trim() : null,
                sort).stream()
                .map(this::toResponse)
                .toList();
    }

    public static String normalizeCondition(String condition) {
        if (condition == null || condition.trim().isEmpty()) {
            return null;
        }
        String s = condition.trim();
        if ("\u0110ang khai th\u00e1c/v\u1eadn h\u00e0nh".equalsIgnoreCase(s)
                || "Ch\u01b0a khai th\u00e1c/v\u1eadn h\u00e0nh".equalsIgnoreCase(s)
                || "D\u1eebng khai th\u00e1c/v\u1eadn h\u00e0nh".equalsIgnoreCase(s)
                || "Đang khai thác/vận hành".equalsIgnoreCase(s)
                || "Chưa khai thác/vận hành".equalsIgnoreCase(s)
                || "Dừng khai thác/vận hành".equalsIgnoreCase(s)) {
            return s;
        }
        String lower = s.toLowerCase();
        if (lower.contains("d\u1eebng") || lower.contains("dung") || lower.contains("h\u1ecfng") || lower.contains("hong")) {
            return "\u0110ang khai th\u00e1c/v\u1eadn h\u00e0nh".equals(s) ? s : "D\u1eebng khai th\u00e1c/v\u1eadn h\u00e0nh";
        }
        if (lower.contains("b\u00e3i") || lower.contains("bai") || lower.contains("ch\u01b0a") || lower.contains("chua")) {
            return "Ch\u01b0a khai th\u00e1c/v\u1eadn h\u00e0nh";
        }
        if (lower.contains("lu\u1ed3ng") || lower.contains("luong") || lower.contains("ho\u1ea1t \u0111\u1ed9ng") || lower.contains("hoat dong")
                || lower.contains("g\u1eafn \u0111\u00e8n") || lower.contains("gan den") || lower.contains("\u0111ang") || lower.contains("dang")) {
            return "\u0110ang khai th\u00e1c/v\u1eadn h\u00e0nh";
        }
        return s;
    }

    private Sort buildSort(String sortBy, String sortDir) {
        Map<String, String> allowedFields = Map.ofEntries(
                Map.entry("name", "name"),
                Map.entry("unitId", "unitId"),
                Map.entry("buoyStationId", "buoyStationId"),
                Map.entry("navigationChannelId", "navigationChannelId"),
                Map.entry("provinceId", "provinceId"),
                Map.entry("condition", "condition"),
                Map.entry("status", "status"),
                Map.entry("updatedAt", "updatedAt"),
                Map.entry("submittedForApprovalAt", "submittedForApprovalAt"),
                Map.entry("level1ApprovedDate", "level1ApprovedDate"),
                Map.entry("level2ApprovedDate", "level2ApprovedDate"));
        String field = sortBy == null ? null : allowedFields.get(sortBy);
        Sort fallback = Sort.by(Sort.Order.desc("updatedAt"), Sort.Order.desc("createdAt"), Sort.Order.asc("id"));
        if (field == null) {
            return fallback;
        }
        Sort.Direction direction = "ascend".equalsIgnoreCase(sortDir) || "asc".equalsIgnoreCase(sortDir)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Sort requested = Sort.by(new Sort.Order(direction, field));
        if ("updatedAt".equals(field)) {
            return requested.and(Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));
        }
        return requested.and(fallback);
    }

    public List<BuoyResponse> search(String name, String code, String type, String status) {
        return search(name, code, type, status, null, null, null, null);
    }

    // -- GENERATE CODE --

    /**
     * Sinh mã phao tiêu tự động theo định dạng PT-XXXXXX (6 số).
     * Dùng MAX(code) từ DB, tăng dần; kiểm tra trùng với cả bảng buoy và
     * beacon_light.
     */
    public String generateCode(java.util.UUID stationId) {
        if (stationId == null) {
            return generateGenericCode();
        }
        BuoyStation station = buoyStationRepo.findById(stationId)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao tiêu không tìm thấy: " + stationId));
        String prefix = station.getCode() + "-PT-";
        int nextNumber = 1;
        String maxCode = buoyRepo.findMaxCode().orElse(null);
        if (maxCode != null && maxCode.startsWith(prefix)) {
            try {
                nextNumber = Integer.parseInt(maxCode.substring(prefix.length())) + 1;
            } catch (NumberFormatException e) {
                log.warn("Mã phao tiêu không đúng định dạng {}-PT-XXX: {}, bắt đầu từ 1", station.getCode(), maxCode);
            }
        }
        String code = prefix + String.format("%03d", nextNumber);
        while (buoyRepo.existsByCode(code)) {
            nextNumber++;
            code = prefix + String.format("%03d", nextNumber);
        }
        log.info("Sinh mã phao tiêu: {}", code);
        return code;
    }

    /**
     * Sinh mã phao tiêu dạng PT-XXXXXX khi chưa chọn nhà trạm (khiếm khuyết dữ
     * liệu).
     */
    private String generateGenericCode() {
        String maxCode = buoyRepo.findMaxCode().orElse(null);
        int nextNumber = 1;
        if (maxCode != null && maxCode.startsWith("PT-")) {
            try {
                nextNumber = Integer.parseInt(maxCode.substring(3)) + 1;
            } catch (NumberFormatException e) {
                log.warn("Mã phao tiêu không đúng định dạng PT-XXXXXX: {}, bắt đầu từ 1", maxCode);
            }
        }
        String code = String.format("PT-%06d", nextNumber);
        while (buoyRepo.existsByCode(code)) {
            nextNumber++;
            code = String.format("PT-%06d", nextNumber);
        }
        log.info("Sinh mã phao tiêu dự phòng: {}", code);
        return code;
    }

    // -- CREATE --

    @Transactional
    public BuoyResponse create(CreateBuoyRequest request) {
        FieldWriteGuard.validateObject(request);
        String code = request.getCode();
        if (code == null || code.trim().isEmpty()) {
            code = generateCode(request.getBuoyStationId());
            log.info("Auto-generated buoy code: {}", code);
        }

        if (buoyRepo.existsByCode(code)) {
            throw new IllegalArgumentException("Đã tồn tại: " + code);
        }

        validateInspectionDates(request.getLastInspectionDate(), request.getNextInspectionDate());

        Buoy entity = Buoy.builder()
                .code(code)
                .name(request.getName())
                .type(request.getType())
                .color(request.getColor())
                .shape(request.getShape())
                .lightCharacteristic(request.getLightCharacteristic())
                .range(request.getRange())
                .description(request.getDescription())
                .unitId(request.getUnitId() != null ? request.getUnitId() : request.getOrgUnitId())
                .orgUnitId(request.getOrgUnitId() != null ? request.getOrgUnitId() : request.getUnitId())
                .navigationChannelId(request.getNavigationChannelId())
                .lastInspectionDate(request.getLastInspectionDate())
                .nextInspectionDate(request.getNextInspectionDate())
                .isActive(request.getIsActive())
                .geometryType(request.getGeometryType())
                .mapSymbolId(request.getMapSymbolId())
                .coordinateSystem(request.getCoordinateSystem())
                .displayRule(request.getDisplayRule())
                .buoyStationId(request.getBuoyStationId())
                .classification(request.getClassification())
                .classificationBuoy(request.getClassificationBuoy())
                .classificationMark(request.getClassificationMark())
                .provinceId(request.getProvinceId())
                .locationDetail(request.getLocationDetail())
                .condition(normalizeCondition(request.getCondition()))
                .structure(request.getStructure())
                .area(request.getArea())
                .bodyHeight(request.getBodyHeight())
                .diameter(request.getDiameter())
                .beaconLight(request.getBeaconLight())
                .towerHeight(request.getTowerHeight())
                .lightHeight(request.getLightHeight())
                .lightModel(request.getLightModel())
                .towerColor(request.getTowerColor())
                .powerSupply(request.getPowerSupply())
                .commissionedDate(request.getCommissionedDate())
                .lastRepairDate(request.getLastRepairDate())
                .lightColor(request.getLightColor())
                .flashType(request.getFlashType())
                .period(request.getPeriod())
                .status("DRAFT")
                .approvalStatus(ApprovalStatus.DRAFT)
                .build();

        java.util.UUID effectiveUnitId = entity.getUnitId() != null ? entity.getUnitId() : getCurrentUserUnitId();
        entity.setUnitId(effectiveUnitId);
        entity.setOrgUnitId(effectiveUnitId);

        if ("submit".equals(request.getAction())) {
            entity.setStatus("PENDING_APPROVAL");
            entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
            entity.setApprovalLevel(1);
            entity.setSubmittedForApprovalBy(SecurityUtils.getCurrentUserId());
            entity.setSubmittedForApprovalAt(LocalDateTime.now());
        } else if ("approved".equals(request.getAction())) {
            // "Lưu và phê duyệt" — duyệt thẳng 2 cấp (mirror BerthService.applySaveAction
            // APPROVED)
            entity.setStatus("PUBLISHED");
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setApprovalLevel(2);
            java.util.UUID uid = SecurityUtils.getCurrentUserId();
            entity.setSubmittedForApprovalBy(uid);
            entity.setSubmittedForApprovalAt(LocalDateTime.now());
            entity.setApprovedBy(uid);
            entity.setApprovedDate(LocalDateTime.now());
            entity.setLevel1ApprovedBy(uid);
            entity.setLevel1ApprovedDate(LocalDateTime.now());
            entity.setLevel2ApprovedBy(uid);
            entity.setLevel2ApprovedDate(LocalDateTime.now());
        }

        entity = buoyRepo.save(entity);

        // Create GIS spatial object when coordinates are provided
        String wkt = buildBuoyWkt(request.getCoordinates(), request.getLongitude(), request.getLatitude());
        if (wkt != null) {
            if (request.getLatitude() != null && request.getLongitude() != null) {
                validateCoordinates(request.getLongitude(), request.getLatitude());
            }
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    entity.getName(),
                    "PHAOTIEU_" + entity.getCode(),
                    resolveGeometryType(request.getGeometryType()),
                    GisSpatialObjectType.POINT_BUOY,
                    wkt, entity.getId(),
                    InfrastructureType.BUOY);
            entity.setSpatialId(spatialObj.getId());
            entity = buoyRepo.save(entity);
        }

        logHistory(entity, InfrastructureHistoryStatus.CREATED, ApprovalLevel.LEVEL_0, null, null, toJson(entity), null);
        notificationService.sendApprovalNotificationBuoy(entity);

        return toResponse(entity);
    }

    // -- GIS helpers --

    private String buildBuoyWkt(String coordinates, Double longitude, Double latitude) {
        if (coordinates != null && !coordinates.trim().isEmpty()) {
            return coordinates.trim();
        }
        if (longitude != null && latitude != null) {
            return "POINT(" + longitude + " " + latitude + ")";
        }
        return null;
    }

    private GisGeometryType resolveGeometryType(String type) {
        if (type == null || type.trim().isEmpty())
            return GisGeometryType.POINT;
        try {
            return GisGeometryType.valueOf(type.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return GisGeometryType.POINT;
        }
    }

    /** Nhãn hiển thị loại hình GIS theo chuẩn Cảng biển (dùng cho lịch sử thay đổi). */
    // -- UPDATE --

    @Transactional
    public BuoyResponse update(UUID id, UpdateBuoyRequest request) {
        FieldWriteGuard.validateObject(request);
        Buoy entity = buoyRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Phao tiêu không tìm thấy: " + id));

        if ("DELETED".equals(entity.getStatus())) {
            throw new EntityNotFoundException("Phao tiêu đã bị xóa");
        }

        // Create snapshot for ChangeLog before modifications
        Buoy snapshot = Buoy.builder()
                .code(entity.getCode()).name(entity.getName()).type(entity.getType())
                .color(entity.getColor()).shape(entity.getShape())
                .lightCharacteristic(entity.getLightCharacteristic()).range(entity.getRange())
                .description(entity.getDescription()).unitId(entity.getUnitId())
                .orgUnitId(entity.getOrgUnitId())
                .navigationChannelId(entity.getNavigationChannelId())
                .lastInspectionDate(entity.getLastInspectionDate()).nextInspectionDate(entity.getNextInspectionDate())
                .isActive(entity.getIsActive()).status(entity.getStatus())
                .approvalStatus(entity.getApprovalStatus()).approvalLevel(entity.getApprovalLevel())
                .spatialId(entity.getSpatialId())
                .provinceId(entity.getProvinceId())
                .rejectionReason(entity.getRejectionReason())
                .approvedBy(entity.getApprovedBy()).approvedDate(entity.getApprovedDate())
                .submittedForApprovalBy(entity.getSubmittedForApprovalBy())
                .submittedForApprovalAt(entity.getSubmittedForApprovalAt())
                .level1ApprovedBy(entity.getLevel1ApprovedBy()).level1ApprovedDate(entity.getLevel1ApprovedDate())
                .level2ApprovedBy(entity.getLevel2ApprovedBy()).level2ApprovedDate(entity.getLevel2ApprovedDate())
                .geometryType(entity.getGeometryType()).mapSymbolId(entity.getMapSymbolId())
                .coordinateSystem(entity.getCoordinateSystem()).displayRule(entity.getDisplayRule())
                .buoyStationId(entity.getBuoyStationId())
                .classification(entity.getClassification()).classificationBuoy(entity.getClassificationBuoy())
                .classificationMark(entity.getClassificationMark()).locationDetail(entity.getLocationDetail())
                .condition(entity.getCondition()).structure(entity.getStructure())
                .area(entity.getArea()).bodyHeight(entity.getBodyHeight()).diameter(entity.getDiameter())
                .beaconLight(entity.getBeaconLight()).towerHeight(entity.getTowerHeight())
                .lightHeight(entity.getLightHeight())
                .lightModel(entity.getLightModel()).towerColor(entity.getTowerColor())
                .powerSupply(entity.getPowerSupply())
                .commissionedDate(entity.getCommissionedDate()).lastRepairDate(entity.getLastRepairDate())
                .lightColor(entity.getLightColor()).flashType(entity.getFlashType()).period(entity.getPeriod())
                .level1ApprovalContent(entity.getLevel1ApprovalContent())
                .level2ApprovalContent(entity.getLevel2ApprovalContent())
                .operationPlanCode(entity.getOperationPlanCode())
                .operationPlanName(entity.getOperationPlanName())
                .operationStartDate(entity.getOperationStartDate())
                .operationEndDate(entity.getOperationEndDate())
                .maintenancePlanCode(entity.getMaintenancePlanCode())
                .maintenancePlanName(entity.getMaintenancePlanName())
                .maintenanceStartTime(entity.getMaintenanceStartTime())
                .maintenanceEndTime(entity.getMaintenanceEndTime())
                .incidentCode(entity.getIncidentCode())
                .incidentType(entity.getIncidentType())
                .incidentLocation(entity.getIncidentLocation())
                .incidentTime(entity.getIncidentTime())
                .build();

        // Apply mutable fields only
        if (request.getName() != null)
            entity.setName(request.getName());

        // Handle type field update conditionally (BR-075-02)
        if (request.getType() != null && !request.getType().equals(entity.getType())) {
            if ("APPROVED_L2".equals(entity.getStatus()) || "PUBLISHED".equals(entity.getStatus())) {
                throw new IllegalArgumentException("Loại phao tiêu không thể thay đổi khi đã được phê duyệt.");
            }
            entity.setType(request.getType());
        }

        // Handle latitude/longitude updates — prefer request values, fallback to
        // existing spatial ONLY when geometry type is still set (non-null).
        // If geometryType is explicitly null (user cleared it), skip the fallback
        // so that the spatial object is deleted below.
        Double currentLon = request.getLongitude();
        Double currentLat = request.getLatitude();
        boolean geometryTypeCleared = request.getGeometryType() == null
                && request.getCoordinates() == null;
        if (!geometryTypeCleared && (currentLon == null || currentLat == null) && entity.getSpatialId() != null) {
            Optional<GisSpatialObject> spatialObjOpt = gisSpatialObjectService.findById(entity.getSpatialId());
            if (spatialObjOpt.isPresent()) {
                String coordsStr = spatialObjOpt.get().getCoordinates();
                try {
                    String clean = coordsStr.replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        currentLon = Double.parseDouble(parts[0]);
                        currentLat = Double.parseDouble(parts[1]);
                    }
                } catch (Exception ex) {
                    /* ignore */ }
            }
        }
        if (currentLon != null && currentLat != null) {
            validateCoordinates(currentLon, currentLat);
        }
        String wkt = geometryTypeCleared ? null : buildBuoyWkt(request.getCoordinates(), currentLon, currentLat);

        entity.setColor(request.getColor());
        entity.setShape(request.getShape());
        entity.setLightCharacteristic(request.getLightCharacteristic());
        entity.setRange(request.getRange());
        entity.setDescription(request.getDescription());
        java.util.UUID updateUnitId = request.getOrgUnitId() != null ? request.getOrgUnitId() : request.getUnitId();
        if (updateUnitId != null) {
            entity.setUnitId(updateUnitId);
            entity.setOrgUnitId(updateUnitId);
        }
        entity.setNavigationChannelId(request.getNavigationChannelId());
        entity.setLastInspectionDate(request.getLastInspectionDate());
        if (request.getIsActive() != null)
            entity.setIsActive(request.getIsActive());
        entity.setGeometryType(request.getGeometryType());
        entity.setMapSymbolId(request.getMapSymbolId());
        entity.setCoordinateSystem(request.getCoordinateSystem());
        entity.setDisplayRule(request.getDisplayRule());

        // Các trường bổ sung theo đặc tả CSV 'QL Phao tiêu' (form chỉnh sửa)
        entity.setBuoyStationId(request.getBuoyStationId());
        // Mã phao, tiêu sinh lại khi đổi nhà trạm QLVH — vẫn đảm bảo duy nhất (BR-001)
        if (request.getCode() != null && !request.getCode().trim().isEmpty()
                && !request.getCode().trim().equals(entity.getCode())) {
            String newCode = request.getCode().trim();
            if (buoyRepo.existsByCode(newCode)) {
                throw new IllegalArgumentException("Đã tồn tại mã phao, tiêu: " + newCode);
            }
            entity.setCode(newCode);
        }
        entity.setClassification(request.getClassification());
        entity.setClassificationBuoy(request.getClassificationBuoy());
        entity.setClassificationMark(request.getClassificationMark());
        entity.setProvinceId(request.getProvinceId());
        entity.setLocationDetail(request.getLocationDetail());
        entity.setCondition(normalizeCondition(request.getCondition()));
        entity.setStructure(request.getStructure());
        entity.setArea(request.getArea());
        entity.setBodyHeight(request.getBodyHeight());
        entity.setDiameter(request.getDiameter());
        entity.setBeaconLight(request.getBeaconLight());
        entity.setTowerHeight(request.getTowerHeight());
        entity.setLightHeight(request.getLightHeight());
        entity.setLightModel(request.getLightModel());
        entity.setTowerColor(request.getTowerColor());
        entity.setPowerSupply(request.getPowerSupply());
        entity.setCommissionedDate(request.getCommissionedDate());
        entity.setLastRepairDate(request.getLastRepairDate());
        entity.setLightColor(request.getLightColor());
        entity.setFlashType(request.getFlashType());
        entity.setPeriod(request.getPeriod());

        boolean wasApproved = isApprovedStatus(entity.getStatus())
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        // "Lưu và gửi phê duyệt" / "Lưu và phê duyệt" (mirror create: action submit/approved)
        String action = request.getAction();
        if ("submit".equals(action)) {
            entity.setStatus("PENDING_APPROVAL");
            entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
            entity.setApprovalLevel(1);
            java.util.UUID uid = SecurityUtils.getCurrentUserId();
            entity.setSubmittedForApprovalBy(uid);
            entity.setSubmittedForApprovalAt(LocalDateTime.now());
        } else if ("approved".equals(action)) {
            entity.setStatus("PUBLISHED");
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setApprovalLevel(2);
            java.util.UUID uid = SecurityUtils.getCurrentUserId();
            entity.setSubmittedForApprovalBy(uid);
            if (entity.getSubmittedForApprovalAt() == null) {
                entity.setSubmittedForApprovalAt(LocalDateTime.now());
            }
            entity.setApprovedBy(uid);
            if (entity.getApprovedDate() == null) {
                entity.setApprovedDate(LocalDateTime.now());
            }
            entity.setLevel1ApprovedBy(uid);
            if (entity.getLevel1ApprovedDate() == null) {
                entity.setLevel1ApprovedDate(LocalDateTime.now());
            }
            entity.setLevel2ApprovedBy(uid);
            if (entity.getLevel2ApprovedDate() == null) {
                entity.setLevel2ApprovedDate(LocalDateTime.now());
            }
        } else if (wasApproved) {
            entity.setStatus(entity.getStatus() != null ? entity.getStatus() : "PUBLISHED");
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
        }

        entity = buoyRepo.save(entity);

        // Actor thật từ SecurityContext — truyền "system" làm ChangeHistoryService fallback
        // auth.getName() (= username, không phải UUID) → approvedBy null → drawer hiện "—".
        java.util.UUID operatorId = SecurityUtils.getCurrentUserId();
        String actorId = operatorId != null ? operatorId.toString() : "system";

        // Sync GIS spatial object
        if (wkt != null) {
            // Lấy tọa độ + loại hình cũ (WKT) trước khi createOrUpdate ghi đè spatial object
            GisGeometryType oldGeomType = null;
            String oldWkt = null;
            if (entity.getSpatialId() != null) {
                GisSpatialObject oldSpatial = gisSpatialObjectService
                        .findById(entity.getSpatialId()).orElse(null);
                if (oldSpatial != null) {
                    oldWkt = oldSpatial.getCoordinates();
                    oldGeomType = oldSpatial.getGeometryType();
                }
            }

            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    entity.getSpatialId(),
                    entity.getName(),
                    "PHAOTIEU_" + entity.getCode(),
                    resolveGeometryType(entity.getGeometryType()),
                    GisSpatialObjectType.POINT_BUOY,
                    wkt, entity.getId(),
                    InfrastructureType.BUOY);
            if (entity.getSpatialId() == null) {
                entity.setSpatialId(spatialObj.getId());
                buoyRepo.save(entity);
            }

            // Lịch sử vị trí theo chuẩn Cảng biển: 2 dòng đọc được
            // "Tọa độ GIS" + "Loại đối tượng GIS", approvedBy = user thật.
            if (wasApproved) {
                String newWkt = wkt.trim();
                GisGeometryType newGeomType = resolveGeometryType(entity.getGeometryType());
                boolean wktChanged = oldWkt == null || !com.hanghai.kchtg.common.util.WktCoordinateUtils.coordinatesEqual(newWkt, oldWkt);
                boolean typeChanged = oldGeomType != newGeomType;
                if (wktChanged) {
                    changeHistoryService.insertChangeRecord("Buoy", entity.getId(), "Tọa độ GIS",
                            (oldWkt == null || oldWkt.trim().isEmpty()) ? null : oldWkt.trim(),
                            newWkt, actorId);
                }
                if (typeChanged) {
                    changeHistoryService.insertChangeRecord("Buoy", entity.getId(), "geometryType",
                            oldGeomType != null ? oldGeomType.name() : null,
                            newGeomType != null ? newGeomType.name() : null, actorId);
                }
            }
        } else if (geometryTypeCleared && entity.getSpatialId() != null) {
            // User đã xóa Loại đối tượng → xóa GIS spatial object và clear spatialId
            if (wasApproved) {
                GisSpatialObject oldSpatial = gisSpatialObjectService
                        .findById(entity.getSpatialId()).orElse(null);
                if (oldSpatial != null) {
                    String oldWkt = oldSpatial.getCoordinates();
                    GisGeometryType oldGeomType = oldSpatial.getGeometryType();
                    if (oldWkt != null && !oldWkt.trim().isEmpty()) {
                        changeHistoryService.insertChangeRecord("Buoy", entity.getId(), "Tọa độ GIS",
                                oldWkt.trim(), null, actorId);
                    }
                    if (oldGeomType != null) {
                        changeHistoryService.insertChangeRecord("Buoy", entity.getId(), "geometryType",
                                oldGeomType.name(), null, actorId);
                    }
                }
            }
            gisSpatialObjectService.delete(entity.getSpatialId());
            entity.setSpatialId(null);
            buoyRepo.save(entity);
        }

        // Approved records use the centralized per-field audit trail only. Writing an
        // additional aggregate JSON row makes the history drawer unreadable and duplicates
        // every actual field change.
        if (wasApproved) {
            changeHistoryService.recordChanges("Buoy", entity.getId().toString(),
                    actorId, snapshot, entity);
        }
        return toResponse(entity);
    }

    // -- DELETE (Soft) --

    @Transactional
    public void delete(UUID id) {
        Buoy entity = buoyRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Phao tiêu không tìm thấy: " + id));

        if ("DELETED".equals(entity.getStatus())) {
            throw new IllegalArgumentException("Phao tiêu này đã bị xóa trước đó");
        }

        if (isInApprovalProcess(entity.getStatus())) {
            throw new IllegalStateException(
                    "Không thể xóa phao tiêu đang chờ phê duyệt");
        }

        boolean wasApproved = "APPROVED".equals(entity.getStatus()) || "APPROVED_L2".equals(entity.getStatus())
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        entity.setStatus("DELETED");
        entity.softDelete(SecurityUtils.getCurrentUserId());
        buoyRepo.save(entity);

        // Actor thật từ SecurityContext — truyền "system" làm approvedBy null (drawer "—").
        java.util.UUID operatorId = SecurityUtils.getCurrentUserId();
        String actorId = operatorId != null ? operatorId.toString() : "system";

        logHistory(entity, InfrastructureHistoryStatus.DELETED, ApprovalLevel.LEVEL_0, null, null, toJson(entity), null);
        if (wasApproved) {
            changeHistoryService.insertChangeRecord("Buoy", entity.getId(), "Trạng thái", null, "Đã xóa", actorId);
        }

        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        pointObjectSyncService.hideFromMapBuoy(entity);
    }

    // -- APPROVAL --

    @Transactional
    public void submitForApproval(UUID id) {
        Buoy entity = buoyRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Phao tiêu không tìm thấy: " + id));

        if (!"DRAFT".equals(entity.getStatus()) && !"REJECTED".equals(entity.getStatus())
                && !"REJECTED_L1".equals(entity.getStatus()) && !"REJECTED_L2".equals(entity.getStatus())
                && !"PENDING_APPROVAL".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Chỉ có thể gửi phê duyệt khi status = DRAFT, REJECTED, REJECTED_L1, REJECTED_L2 hoặc PENDING_APPROVAL");
        }

        entity.setStatus("PENDING_APPROVAL");
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        entity.setApprovalLevel(1);
        entity.setSubmittedForApprovalBy(SecurityUtils.getCurrentUserId());
        entity.setSubmittedForApprovalAt(LocalDateTime.now());
        buoyRepo.save(entity);

        notificationService.sendApprovalNotificationBuoy(entity);
    }

    @Transactional
    public BuoyResponse approveL1(UUID id, java.util.UUID approverId, String content) {
        Buoy entity = buoyRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Phao tiêu không tìm thấy: " + id));

        if (!"PENDING_APPROVAL".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L1");
        }

        // Self-approval: allowed per user request (BR-077-09 relaxed)
        entity.setStatus("APPROVED_L1");
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setApprovedBy(approverId);
        entity.setApprovedDate(LocalDateTime.now());
        entity.setLevel1ApprovedBy(approverId);
        entity.setLevel1ApprovedDate(LocalDateTime.now());
        if (content != null && !content.isBlank()) {
            entity.setLevel1ApprovalContent(content.trim());
        }
        buoyRepo.save(entity);

        logHistory(entity, InfrastructureHistoryStatus.APPROVED, ApprovalLevel.LEVEL_1, null, null, null, null);
        notificationService.sendL2ApprovalNotificationBuoy(entity);

        return toResponse(entity);
    }

    @Transactional
    public BuoyResponse approveL2(UUID id, java.util.UUID approverId, String content) {
        Buoy entity = buoyRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Phao tiêu không tìm thấy: " + id));

        if (!"APPROVED_L1".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L2");
        }

        entity.setStatus("PUBLISHED");
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setApprovedBy(approverId);
        entity.setApprovedDate(LocalDateTime.now());
        entity.setLevel2ApprovedBy(approverId);
        entity.setLevel2ApprovedDate(LocalDateTime.now());
        if (content != null && !content.isBlank()) {
            entity.setLevel2ApprovalContent(content.trim());
        }
        buoyRepo.save(entity);

        logHistory(entity, InfrastructureHistoryStatus.APPROVED, ApprovalLevel.LEVEL_2, null, null, null, null);
        pointObjectSyncService.syncToMapBuoy(entity);

        return toResponse(entity);
    }

    @Transactional
    public BuoyResponse approveL1(UUID id, java.util.UUID approverId) {
        return approveL1(id, approverId, null);
    }

    @Transactional
    public BuoyResponse approveL2(UUID id, java.util.UUID approverId) {
        return approveL2(id, approverId, null);
    }

    @Transactional
    public BuoyResponse reject(UUID id, String rejectReason, java.util.UUID approverId) {
        Buoy entity = buoyRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Phao tiêu không tìm thấy: " + id));

        if (rejectReason == null || rejectReason.length() < 10) {
            throw new IllegalArgumentException(
                    "Lý do từ chối phải có ít nhất 10 ký tự");
        }

        boolean rejectedAtC2 = "APPROVED_L1".equals(entity.getStatus())
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1;
        entity.setStatus(rejectedAtC2 ? "REJECTED_L2" : "REJECTED_L1");
        entity.setApprovalStatus(rejectedAtC2 ? ApprovalStatus.REJECTED_LEVEL2 : ApprovalStatus.REJECTED_LEVEL1);
        entity.setRejectionReason(rejectReason);
        buoyRepo.save(entity);

        logHistory(entity, InfrastructureHistoryStatus.REJECTED,
                rejectedAtC2 ? ApprovalLevel.LEVEL_2 : ApprovalLevel.LEVEL_1, null, null, null, rejectReason);
        notificationService.sendRejectionNotificationBuoy(entity, rejectReason);

        return toResponse(entity);
    }

    // -- HELPERS --

    private void validateCoordinates(Double longitude, Double latitude) {
        if (longitude == null || latitude == null) {
            throw new IllegalArgumentException("Tọa độ không được để trống");
        }
        if (longitude < -180.0 || longitude > 180.0) {
            throw new IllegalArgumentException(
                    "Kinh độ phải trong khoảng -180~180 (WGS84)");
        }
        if (latitude < -90.0 || latitude > 90.0) {
            throw new IllegalArgumentException(
                    "Vĩ độ phải trong khoảng -90~90 (WGS84)");
        }
    }

    private void validateInspectionDates(LocalDate last, LocalDate next) {
        if (last != null && last.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Ngày kiểm tra gần nhất không được lớn hơn ngày hiện tại");
        }
        if (last != null && next != null && next.isBefore(last)) {
            throw new IllegalArgumentException(
                    "Ngày kiểm tra kế tiếp không được nhỏ hơn ngày kiểm tra gần nhất");
        }
    }

    private void logHistory(Buoy entity,
            InfrastructureHistoryStatus status, ApprovalLevel level,
            String fields, String previousJson, String newJson, String reason) {
        if (infraHistoryRepo != null && entity.getId() != null) {
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            infraHistoryRepo.save(InfrastructureHistory.builder()
                    .refId(entity.getId())
                    .refType(InfrastructureType.BUOY)
                    .approvalLevel(level != null ? level : ApprovalLevel.LEVEL_0)
                    .status(status != null ? status : InfrastructureHistoryStatus.UPDATED)
                    .approvedBy(currentUserId)
                    .approvedDate(LocalDateTime.now())
                    .changedField(fields != null && fields.length() > 255 ? fields.substring(0, 255) : fields)
                    .previousValue(previousJson)
                    .newValue(newJson)
                    .build());
        }
    }

    private BuoyResponse toResponse(Buoy entity) {
        String unitName = null;
        UUID effectiveUnitId = entity.getUnitId() != null ? entity.getUnitId() : entity.getOrgUnitId();
        if (effectiveUnitId != null) {
            unitName = orgUnitRepo.findById(effectiveUnitId)
                    .map(unit -> unit.getName())
                    .orElse(null);
        }

        Double latitude = null;
        Double longitude = null;
        String coordinates = null;
        if (entity.getSpatialId() != null) {
            Optional<GisSpatialObject> spatialObjOpt = gisSpatialObjectService.findById(entity.getSpatialId());
            if (spatialObjOpt.isPresent()) {
                String coordsStr = spatialObjOpt.get().getCoordinates();
                coordinates = coordsStr;
                try {
                    java.util.regex.Matcher m = java.util.regex.Pattern
                            .compile("(-?\\d+(?:\\.\\d+)?)\\s+(-?\\d+(?:\\.\\d+)?)").matcher(coordsStr);
                    if (m.find()) {
                        longitude = Double.parseDouble(m.group(1));
                        latitude = Double.parseDouble(m.group(2));
                    }
                } catch (Exception ex) {
                    // ignore
                }
            }
        }

        return BuoyResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .type(entity.getType())
                .color(entity.getColor())
                .shape(entity.getShape())
                .lightCharacteristic(entity.getLightCharacteristic())
                .range(entity.getRange())
                .description(entity.getDescription())
                .unitId(entity.getUnitId())
                .orgUnitId(entity.getOrgUnitId() != null ? entity.getOrgUnitId() : entity.getUnitId())
                .navigationChannelId(entity.getNavigationChannelId())
                .unitName(unitName)
                .orgUnitName(unitName)
                .latitude(latitude)
                .longitude(longitude)
                .coordinates(coordinates)
                .geometryType(entity.getGeometryType())
                .mapSymbolId(entity.getMapSymbolId())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
                .buoyStationId(entity.getBuoyStationId())
                .buoyStationName(resolveBuoyStationName(entity.getBuoyStationId()))
                .classification(entity.getClassification())
                .classificationBuoy(entity.getClassificationBuoy())
                .classificationMark(entity.getClassificationMark())
                .provinceId(entity.getProvinceId())
                .locationDetail(entity.getLocationDetail())
                .condition(normalizeCondition(entity.getCondition()))
                .structure(entity.getStructure())
                .area(entity.getArea())
                .bodyHeight(entity.getBodyHeight())
                .diameter(entity.getDiameter())
                .beaconLight(entity.getBeaconLight())
                .towerHeight(entity.getTowerHeight())
                .lightHeight(entity.getLightHeight())
                .lightModel(entity.getLightModel())
                .towerColor(entity.getTowerColor())
                .powerSupply(entity.getPowerSupply())
                .commissionedDate(entity.getCommissionedDate())
                .lastRepairDate(entity.getLastRepairDate())
                .lightColor(entity.getLightColor())
                .flashType(entity.getFlashType())
                .period(entity.getPeriod())
                .level1ApprovalContent(entity.getLevel1ApprovalContent())
                .level2ApprovalContent(entity.getLevel2ApprovalContent())
                .operationPlanCode(entity.getOperationPlanCode())
                .operationPlanName(entity.getOperationPlanName())
                .operationStartDate(entity.getOperationStartDate())
                .operationEndDate(entity.getOperationEndDate())
                .maintenancePlanCode(entity.getMaintenancePlanCode())
                .maintenancePlanName(entity.getMaintenancePlanName())
                .maintenanceStartTime(entity.getMaintenanceStartTime())
                .maintenanceEndTime(entity.getMaintenanceEndTime())
                .incidentCode(entity.getIncidentCode())
                .incidentType(entity.getIncidentType())
                .incidentLocation(entity.getIncidentLocation())
                .incidentTime(entity.getIncidentTime())
                .lastInspectionDate(entity.getLastInspectionDate())
                .nextInspectionDate(entity.getNextInspectionDate())
                .isActive(entity.getIsActive())
                .status(entity.getStatus())
                .approvalStatus(entity.getApprovalStatus().name())
                .approvalLevel(ApprovalLevel.fromInt(entity.getApprovalLevel()))
                .approvedBy(entity.getApprovedBy())
                .approvedDate(entity.getApprovedDate())
                .submittedForApprovalBy(entity.getSubmittedForApprovalBy())
                .submittedForApprovalAt(entity.getSubmittedForApprovalAt())
                .level1ApprovedBy(entity.getLevel1ApprovedBy())
                .level1ApprovedDate(entity.getLevel1ApprovedDate())
                .level2ApprovedBy(entity.getLevel2ApprovedBy())
                .level2ApprovedDate(entity.getLevel2ApprovedDate())
                .rejectionReason(entity.getRejectionReason())
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private String resolveBuoyStationName(java.util.UUID stationId) {
        if (stationId == null)
            return null;
        return buoyStationRepo.findById(stationId)
                .map(BuoyStation::getName)
                .orElse(null);
    }

    private boolean isApprovedStatus(String status) {
        return "APPROVED_L1".equals(status)
                || "APPROVED_L2".equals(status)
                || "PUBLISHED".equals(status);
    }

    private boolean isInApprovalProcess(String status) {
        return "PENDING_APPROVAL".equals(status)
                || "APPROVED_L1".equals(status)
                || "APPROVED_L2".equals(status);
    }

    private java.util.UUID getCurrentUserUnitId() {
        return null;
    }

    private String toJson(Buoy entity) {
        try {
            return objectMapper.writeValueAsString(toResponse(entity));
        } catch (Exception e) {
            return "{}";
        }
    }

    // -- ATTACHMENTS (Chuẩn /beacon-stations) --

    @Transactional
    public List<AttachmentDto> uploadAttachments(UUID entityId, List<MultipartFile> files, UUID userId) {
        final String entityType = "BUOY";
        long existingCount = attachmentRepository.countByEntityTypeAndEntityId(entityType, entityId);
        if (existingCount + files.size() > 10) {
            throw new IllegalArgumentException("Tối đa 10 file đính kèm");
        }
        List<Attachment> saved = new ArrayList<>();
        java.nio.file.Path basePath = java.nio.file.Paths.get(attachmentPath).toAbsolutePath().normalize();

        // 1. Snapshot danh sách file trước khi upload
        List<Attachment> existingAtts = attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc(entityType, entityId);
        List<String> fileListBefore = existingAtts.stream()
                .map(Attachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.toList());
        String oldFilesSummary = String.join(", ", fileListBefore);
        List<String> uploadedFileNames = new ArrayList<>();

        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
            String storageFileName = System.currentTimeMillis() + "_" + originalFilename;
            try {
                java.nio.file.Path dir = basePath.resolve(entityType).resolve(entityId.toString());
                java.nio.file.Files.createDirectories(dir);
                java.nio.file.Path filePath = dir.resolve(storageFileName);
                file.transferTo(filePath.toFile());
            } catch (Exception e) {
                throw new RuntimeException("Không thể lưu file: " + originalFilename);
            }
            String storagePath = basePath.resolve(entityType).resolve(entityId.toString()).resolve(storageFileName)
                    .toString();
            Attachment attachment = new Attachment();
            attachment.setEntityType(entityType);
            attachment.setEntityId(entityId);
            attachment.setFileName(originalFilename);
            attachment.setFilePath(storagePath);
            attachment.setFileSize(file.getSize());
            attachment.setContentType(file.getContentType());
            attachment.setUploadedBy(userId);
            saved.add(attachmentRepository.save(attachment));
            uploadedFileNames.add(originalFilename);
        }

        // 2. Snapshot danh sách file sau khi upload
        List<String> fileListAfter = new ArrayList<>(fileListBefore);
        for (String fn : uploadedFileNames) {
            if (fn != null && !fn.isBlank() && !fileListAfter.contains(fn.trim())) {
                fileListAfter.add(fn.trim());
            }
        }
        String newFilesSummary = String.join(", ", fileListAfter);

        // Ghi nhật ký "Tài liệu đính kèm" (chuẩn /beacon-stations) — chỉ khi bản ghi ĐÃ DUYỆT
        Buoy buoy = buoyRepo.findById(entityId).orElse(null);
        boolean isNewlyCreated = buoy != null && (buoy.getCreatedAt() == null
                || Math.abs(java.time.Duration.between(buoy.getCreatedAt(), LocalDateTime.now()).toSeconds()) <= 30);
        boolean wasApproved = !isNewlyCreated && buoy != null
                && (isApprovedStatus(buoy.getStatus())
                        || buoy.getApprovalStatus() == ApprovalStatus.APPROVED
                        || buoy.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2);
        if (wasApproved && !uploadedFileNames.isEmpty()) {
            String oldVal = (oldFilesSummary == null || oldFilesSummary.isBlank()) ? null : oldFilesSummary.trim();
            String newVal = (newFilesSummary == null || newFilesSummary.isBlank()) ? null : newFilesSummary.trim();
            if (!Objects.equals(oldVal, newVal) && infraHistoryRepo != null) {
                infraHistoryRepo.save(InfrastructureHistory.builder()
                        .refId(entityId)
                        .refType(InfrastructureType.BUOY)
                        .approvalLevel(ApprovalLevel.LEVEL_0)
                        .status(InfrastructureHistoryStatus.ATTACHMENT_UPLOADED)
                        .approvedBy(userId)
                        .approvedDate(LocalDateTime.now())
                        .changedField("Tài liệu đính kèm")
                        .approvalContent("Tải lên tệp: " + String.join(", ", uploadedFileNames))
                        .previousValue(oldVal != null ? oldVal : "—")
                        .newValue(newVal != null ? newVal : "—")
                        .build());
            }
        }
        return saved.stream().map(this::toAttachmentDto).toList();
    }

    public List<AttachmentDto> listAttachments(UUID entityId) {
        return attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("BUOY", entityId)
                .stream().map(this::toAttachmentDto).toList();
    }

    @Transactional
    public void deleteAttachment(UUID entityId, UUID attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
        if (!attachment.getEntityId().equals(entityId)) {
            throw new IllegalArgumentException("File không thuộc phao tiêu này");
        }
        String fileName = attachment.getFileName();
        final String entityType = "BUOY";
        List<Attachment> existingAtts = attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc(entityType, entityId);
        String oldFilesSummary = existingAtts.stream()
                .map(Attachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));

        String newFilesSummary = existingAtts.stream()
                .filter(att -> !att.getId().equals(attachmentId))
                .map(Attachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));

        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
        } catch (Exception e) {
            // ignore file deletion failure; the DB record is still removed
        }
        attachmentRepository.delete(attachment);

        // Ghi nhật ký xóa "Tài liệu đính kèm" (chuẩn /beacon-stations) — chỉ khi bản ghi ĐÃ DUYỆT
        Buoy buoy = buoyRepo.findById(entityId).orElse(null);
        if (buoy != null && (isApprovedStatus(buoy.getStatus())
                || buoy.getApprovalStatus() == ApprovalStatus.APPROVED
                || buoy.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2)) {
            if (infraHistoryRepo != null) {
                String oldVal = (oldFilesSummary == null || oldFilesSummary.isBlank()) ? null : oldFilesSummary.trim();
                String newVal = (newFilesSummary == null || newFilesSummary.isBlank()) ? null : newFilesSummary.trim();
                infraHistoryRepo.save(InfrastructureHistory.builder()
                        .refId(entityId)
                        .refType(InfrastructureType.BUOY)
                        .approvalLevel(ApprovalLevel.LEVEL_0)
                        .status(InfrastructureHistoryStatus.ATTACHMENT_DELETED)
                        .approvedBy(SecurityUtils.getCurrentUserId())
                        .approvedDate(LocalDateTime.now())
                        .changedField("Tài liệu đính kèm")
                        .approvalContent("Xóa tệp: " + fileName)
                        .previousValue(oldVal != null ? oldVal : "—")
                        .newValue(newVal != null ? newVal : "—")
                        .build());
            }
        }
    }

    public Attachment getAttachment(UUID entityId, UUID attachmentId) {
        buoyRepo.findById(entityId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy phao tiêu: " + entityId));
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
        if (!"BUOY".equalsIgnoreCase(attachment.getEntityType()) || !attachment.getEntityId().equals(entityId)) {
            throw new IllegalArgumentException("File không thuộc phao tiêu này");
        }
        return attachment;
    }

    private AttachmentDto toAttachmentDto(Attachment entity) {
        AttachmentDto dto = new AttachmentDto();
        dto.setId(entity.getId());
        dto.setEntityType(entity.getEntityType());
        dto.setEntityId(entity.getEntityId());
        dto.setFileName(entity.getFileName());
        dto.setFilePath(entity.getFilePath());
        dto.setFileSize(entity.getFileSize());
        dto.setContentType(entity.getContentType());
        dto.setUploadedBy(entity.getUploadedBy());
        dto.setUploadedAt(entity.getUploadedAt());
        return dto;
    }

}
