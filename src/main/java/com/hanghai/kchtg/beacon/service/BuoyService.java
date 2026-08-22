package com.hanghai.kchtg.beacon.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.beacon.dto.buoy.BuoyResponse;
import com.hanghai.kchtg.beacon.dto.buoy.CreateBuoyRequest;
import com.hanghai.kchtg.beacon.dto.buoy.UpdateBuoyRequest;
import com.hanghai.kchtg.beacon.entity.BeaconHistory;
import com.hanghai.kchtg.beacon.entity.BeaconHistoryActionType;
import com.hanghai.kchtg.beacon.entity.BeaconType;
import com.hanghai.kchtg.beacon.entity.Buoy;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.beacon.repository.BeaconHistoryRepository;
import com.hanghai.kchtg.beacon.repository.BeaconStationRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.station.entity.BuoyStation;
import com.hanghai.kchtg.station.repository.BuoyStationRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.port.entity.ChangeLog;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

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
    private final BeaconStationRepository beaconStationRepo;
    private final BeaconHistoryRepository historyRepo;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final OrgUnitRepository orgUnitRepo;
    private final BuoyStationRepository buoyStationRepo;
    private final ChangeHistoryService changeHistoryService;
    private final PointObjectSyncService pointObjectSyncService;
    private final ChangeLogRepository changeLogRepository;

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
        return buoyRepo.searchFiltered(
                name,
                code,
                type,
                status,
                condition,
                provinceId,
                locationDetail,
                approvalStatus
        ).stream()
                .map(this::toResponse)
                .toList();
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
        while (buoyRepo.existsByCode(code) || beaconStationRepo.existsByCode(code)) {
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
        while (buoyRepo.existsByCode(code) || beaconStationRepo.existsByCode(code)) {
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

        if (buoyRepo.existsByCode(code)
                || beaconStationRepo.existsByCode(code)) {
            throw new IllegalArgumentException("Đã tồn tại: " + code);
        }

        validateInspectionDates(request.getLastInspectionDate(), request.getNextInspectionDate());

        RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
                : RecordSecurityLevel.NORMAL;
        RecordSecurityLevel.validateAssignment(secLevel, "buoy", SecurityUtils.getCurrentUserPermissions(),
                SecurityUtils.isElevatedAdministrator());

        Buoy entity = Buoy.builder()
                .securityLevel(secLevel)
                .code(code)
                .name(request.getName())
                .type(request.getType())
                .color(request.getColor())
                .shape(request.getShape())
                .lightCharacteristic(request.getLightCharacteristic())
                .range(request.getRange())
                .description(request.getDescription())
                .unitId(request.getUnitId())
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
                .condition(request.getCondition())
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
                .approvalStatus(ApprovalStatus.PROPOSED)
                .build();

        if (entity.getUnitId() == null) {
            entity.setUnitId(getCurrentUserUnitId());
        }

        if ("submit".equals(request.getAction())) {
            entity.setStatus("PENDING_APPROVAL");
            entity.setApprovalLevel(1);
            entity.setSubmittedForApprovalBy(SecurityUtils.getCurrentUserId());
            entity.setSubmittedForApprovalAt(LocalDateTime.now());
        } else if ("approved".equals(request.getAction())) {
            // "Lưu và phê duyệt" — duyệt thẳng 2 cấp (mirror BerthService.applySaveAction APPROVED)
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

        logHistory(entity, BeaconHistoryActionType.CREATE, null, null, toJson(entity));
        Buoy emptySnapshot = new Buoy();
        changeHistoryService.recordChanges("Buoy", entity.getId().toString(),
                entity.getCreatedBy() != null ? entity.getCreatedBy().toString() : "system", emptySnapshot, entity);
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

        String oldJson = toJson(entity);

        // Create snapshot for ChangeLog before modifications
        Buoy snapshot = Buoy.builder()
                .code(entity.getCode()).name(entity.getName()).type(entity.getType())
                .color(entity.getColor()).shape(entity.getShape())
                .lightCharacteristic(entity.getLightCharacteristic()).range(entity.getRange())
                .description(entity.getDescription()).unitId(entity.getUnitId())
                .lastInspectionDate(entity.getLastInspectionDate()).nextInspectionDate(entity.getNextInspectionDate())
                .isActive(entity.getIsActive()).status(entity.getStatus())
                .approvalStatus(entity.getApprovalStatus()).approvalLevel(entity.getApprovalLevel())
                .spatialId(entity.getSpatialId())
                .provinceId(entity.getProvinceId())
                .rejectionReason(entity.getRejectionReason())
                .approvedBy(entity.getApprovedBy()).approvedDate(entity.getApprovedDate())
                .submittedForApprovalBy(entity.getSubmittedForApprovalBy()).submittedForApprovalAt(entity.getSubmittedForApprovalAt())
                .level1ApprovedBy(entity.getLevel1ApprovedBy()).level1ApprovedDate(entity.getLevel1ApprovedDate())
                .level2ApprovedBy(entity.getLevel2ApprovedBy()).level2ApprovedDate(entity.getLevel2ApprovedDate())
                .geometryType(entity.getGeometryType()).mapSymbolId(entity.getMapSymbolId())
                .coordinateSystem(entity.getCoordinateSystem()).displayRule(entity.getDisplayRule())
                .buoyStationId(entity.getBuoyStationId())
                .classification(entity.getClassification()).classificationBuoy(entity.getClassificationBuoy())
                .classificationMark(entity.getClassificationMark()).locationDetail(entity.getLocationDetail())
                .condition(entity.getCondition()).structure(entity.getStructure())
                .area(entity.getArea()).bodyHeight(entity.getBodyHeight()).diameter(entity.getDiameter())
                .beaconLight(entity.getBeaconLight()).towerHeight(entity.getTowerHeight()).lightHeight(entity.getLightHeight())
                .lightModel(entity.getLightModel()).towerColor(entity.getTowerColor()).powerSupply(entity.getPowerSupply())
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
        // existing spatial
        Double currentLon = request.getLongitude();
        Double currentLat = request.getLatitude();
        if ((currentLon == null || currentLat == null) && entity.getSpatialId() != null) {
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
        String wkt = buildBuoyWkt(request.getCoordinates(), currentLon, currentLat);

        if (request.getSecurityLevel() != null) {
            RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "buoy",
                    SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
            entity.setSecurityLevel(request.getSecurityLevel());
        }
        if (request.getColor() != null)
            entity.setColor(request.getColor());
        if (request.getShape() != null)
            entity.setShape(request.getShape());
        if (request.getLightCharacteristic() != null) {
            entity.setLightCharacteristic(request.getLightCharacteristic());
        }
        if (request.getRange() != null)
            entity.setRange(request.getRange());
        if (request.getDescription() != null)
            entity.setDescription(request.getDescription());
        if (request.getUnitId() != null)
            entity.setUnitId(request.getUnitId());
        if (request.getLastInspectionDate() != null) {
            entity.setLastInspectionDate(request.getLastInspectionDate());
        }
        if (request.getIsActive() != null)
            entity.setIsActive(request.getIsActive());
        if (request.getGeometryType() != null)
            entity.setGeometryType(request.getGeometryType());
        if (request.getMapSymbolId() != null)
            entity.setMapSymbolId(request.getMapSymbolId());
        if (request.getCoordinateSystem() != null)
            entity.setCoordinateSystem(request.getCoordinateSystem());
        if (request.getDisplayRule() != null)
            entity.setDisplayRule(request.getDisplayRule());

        // Các trường bổ sung theo đặc tả CSV 'QL Phao tiêu' (form chỉnh sửa)
        if (request.getBuoyStationId() != null)
            entity.setBuoyStationId(request.getBuoyStationId());
        // Mã phao, tiêu sinh lại khi đổi nhà trạm QLVH — vẫn đảm bảo duy nhất (BR-001)
        if (request.getCode() != null && !request.getCode().trim().isEmpty()
                && !request.getCode().trim().equals(entity.getCode())) {
            String newCode = request.getCode().trim();
            if (buoyRepo.existsByCode(newCode) || beaconStationRepo.existsByCode(newCode)) {
                throw new IllegalArgumentException("Đã tồn tại mã phao, tiêu: " + newCode);
            }
            entity.setCode(newCode);
        }
        if (request.getClassification() != null)
            entity.setClassification(request.getClassification());
        if (request.getClassificationBuoy() != null)
            entity.setClassificationBuoy(request.getClassificationBuoy());
        if (request.getClassificationMark() != null)
            entity.setClassificationMark(request.getClassificationMark());
        if (request.getProvinceId() != null)
            entity.setProvinceId(request.getProvinceId());
        if (request.getLocationDetail() != null)
            entity.setLocationDetail(request.getLocationDetail());
        if (request.getCondition() != null)
            entity.setCondition(request.getCondition());
        if (request.getStructure() != null)
            entity.setStructure(request.getStructure());
        if (request.getArea() != null)
            entity.setArea(request.getArea());
        if (request.getBodyHeight() != null)
            entity.setBodyHeight(request.getBodyHeight());
        if (request.getDiameter() != null)
            entity.setDiameter(request.getDiameter());
        if (request.getBeaconLight() != null)
            entity.setBeaconLight(request.getBeaconLight());
        if (request.getTowerHeight() != null)
            entity.setTowerHeight(request.getTowerHeight());
        if (request.getLightHeight() != null)
            entity.setLightHeight(request.getLightHeight());
        if (request.getLightModel() != null)
            entity.setLightModel(request.getLightModel());
        if (request.getTowerColor() != null)
            entity.setTowerColor(request.getTowerColor());
        if (request.getPowerSupply() != null)
            entity.setPowerSupply(request.getPowerSupply());
        if (request.getCommissionedDate() != null)
            entity.setCommissionedDate(request.getCommissionedDate());
        if (request.getLastRepairDate() != null)
            entity.setLastRepairDate(request.getLastRepairDate());
        if (request.getLightColor() != null)
            entity.setLightColor(request.getLightColor());
        if (request.getFlashType() != null)
            entity.setFlashType(request.getFlashType());
        if (request.getPeriod() != null)
            entity.setPeriod(request.getPeriod());

        // Status revert logic for approved states: cập nhật bản đã phê duyệt → chờ Cảng vụ duyệt (user 2026-08-20)
        if (isApprovedStatus(entity.getStatus())) {
            entity.setStatus("PENDING_APPROVAL");
            entity.setApprovalStatus(ApprovalStatus.PROPOSED);
            entity.setApprovalLevel(1);
            entity.setSubmittedForApprovalBy(SecurityUtils.getCurrentUserId());
            entity.setSubmittedForApprovalAt(LocalDateTime.now());
        }

        entity = buoyRepo.save(entity);

        // Sync GIS spatial object
        if (wkt != null) {
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
        }

        // BUG FIX #1: Use JsonNode.equals() for reliable comparison (not string equals)
        // BUG FIX #3: Use real field diff instead of static "fields_updated"
        String newJson = toJson(entity);
        if (!compareJsonNodes(oldJson, newJson)) {
            logHistory(entity, BeaconHistoryActionType.UPDATE,
                    getChangedFields(oldJson, newJson), oldJson, newJson);
        }
        changeHistoryService.recordChanges("Buoy", entity.getId().toString(),
                "system", snapshot, entity);
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

        entity.setStatus("DELETED");
        entity.softDelete(SecurityUtils.getCurrentUserId());
        buoyRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.SOFT_DELETE, null, null, toJson(entity));
        changeHistoryService.insertChangeRecord("Buoy", entity.getId(), "Trạng thái", null, "Đã xóa", "system");

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
                && !"PENDING_APPROVAL".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Chỉ có thể gửi phê duyệt khi status = DRAFT, REJECTED hoặc PENDING_APPROVAL");
        }

        entity.setStatus("PENDING_APPROVAL");
        entity.setApprovalStatus(ApprovalStatus.PROPOSED);
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
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setApprovedBy(approverId);
        entity.setApprovedDate(LocalDateTime.now());
        entity.setLevel1ApprovedBy(approverId);
        entity.setLevel1ApprovedDate(LocalDateTime.now());
        if (content != null && !content.isBlank()) {
            entity.setLevel1ApprovalContent(content.trim());
        }
        buoyRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.APPROVE_L1, null, null, null);
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

        logHistory(entity, BeaconHistoryActionType.APPROVE_L2, null, null, null);
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

        entity.setStatus("REJECTED");
        entity.setApprovalStatus(ApprovalStatus.REJECTED);
        entity.setRejectionReason(rejectReason);
        buoyRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.REJECT, null, null, rejectReason);
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
            BeaconHistoryActionType action, String fields, String previousJson, String newJson) {
        BeaconHistory entry = BeaconHistory.builder()
                .beaconType(BeaconType.BUOY)
                .entityId(entity.getId())
                .actionType(action)
                .changedField(fields != null && fields.length() > 255 ? fields.substring(0, 255) : fields)
                .previousValue(previousJson)
                .newValue(newJson != null ? newJson : (action == BeaconHistoryActionType.REJECT ? "REJECTED" : null))
                .changedBy(resolveCurrentUserId())
                .changedAt(LocalDateTime.now())
                .reason(action == BeaconHistoryActionType.REJECT ? newJson : null)
                .build();
        historyRepo.save(entry);
    }

    private BuoyResponse toResponse(Buoy entity) {
        String unitName = null;
        if (entity.getUnitId() != null) {
            unitName = orgUnitRepo.findById(entity.getUnitId())
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
                .securityLevel(entity.getSecurityLevel())
                .code(entity.getCode())
                .name(entity.getName())
                .type(entity.getType())
                .color(entity.getColor())
                .shape(entity.getShape())
                .lightCharacteristic(entity.getLightCharacteristic())
                .range(entity.getRange())
                .description(entity.getDescription())
                .unitId(entity.getUnitId())
                .unitName(unitName)
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
                .condition(entity.getCondition())
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

    private Long resolveCurrentUserId() {
        return 1L;
    }

    private java.util.UUID resolveCreatedBy(Buoy entity) {
        return entity.getCreatedBy();
    }

    // -- BUG FIX #1: Shared ObjectMapper + JsonNode comparison --

    private String toJson(Buoy entity) {
        try {
            return objectMapper.writeValueAsString(toResponse(entity));
        } catch (Exception e) {
            return "{}";
        }
    }

    /**
     * Compare two JSON strings by converting to JsonNode and using equals().
     * This avoids string comparison issues where the same data serializes
     * to different string representations.
     */
    private boolean compareJsonNodes(String json1, String json2) {
        try {
            JsonNode node1 = objectMapper.readTree(json1);
            JsonNode node2 = objectMapper.readTree(json2);
            return node1.equals(node2);
        } catch (Exception e) {
            return true;
        }
    }

    // -- BUG FIX #3: Actual field diff instead of static string --

    @SuppressWarnings("unchecked")
    private String getChangedFields(String oldJson, String newJson) {
        try {
            Map<String, Object> oldMap = objectMapper.readValue(oldJson, Map.class);
            Map<String, Object> newMap = objectMapper.readValue(newJson, Map.class);
            List<String> changed = new ArrayList<>();
            for (String key : newMap.keySet()) {
                Object oldVal = oldMap.get(key);
                Object newVal = newMap.get(key);
                if (!Objects.equals(oldVal, newVal)) {
                    changed.add(key);
                }
            }
            return changed.isEmpty() ? "fields_updated" : String.join(", ", changed);
        } catch (Exception e) {
            return "fields_updated";
        }
    }
}
