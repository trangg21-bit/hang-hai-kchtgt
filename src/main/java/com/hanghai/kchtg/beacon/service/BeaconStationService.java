package com.hanghai.kchtg.beacon.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.beacon.dto.beacon_station.BeaconStationResponse;
import com.hanghai.kchtg.beacon.dto.beacon_station.CreateBeaconStationRequest;
import com.hanghai.kchtg.beacon.dto.beacon_station.UpdateBeaconStationRequest;
import com.hanghai.kchtg.beacon.entity.BeaconHistory;
import com.hanghai.kchtg.beacon.entity.BeaconHistoryActionType;
import com.hanghai.kchtg.beacon.entity.BeaconStation;
import com.hanghai.kchtg.beacon.entity.BeaconType;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.beacon.repository.BeaconHistoryRepository;
import com.hanghai.kchtg.beacon.repository.BeaconStationRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.dto.berth.AttachmentDto;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.entity.User;
import org.springframework.security.access.AccessDeniedException;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for BeaconStation CRUD + approval workflow (F-068 to F-072).
 * Follows M-007 PointObjectService pattern exactly.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class BeaconStationService {

    private final BeaconStationRepository beaconStationRepo;
    private final BuoyRepository buoyRepo;
    private final BeaconHistoryRepository historyRepo;
    private final InfrastructureHistoryRepository infraHistoryRepo;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final AttachmentRepository attachmentRepository;

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    // -- READ --

    public List<BeaconStationResponse> findAll() {
        return beaconStationRepo.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public String generateBeaconStationCode() {
        String maxCode = beaconStationRepo.findMaxCode();
        int nextNumber = 1;
        if (maxCode != null && maxCode.startsWith("DBNT-")) {
            try {
                String numPart = maxCode.substring(5);
                nextNumber = Integer.parseInt(numPart) + 1;
            } catch (NumberFormatException e) {
                // mã không đúng định dạng DBNT-XXXXXX, bắt đầu từ 1
            }
        }
        return String.format("DBNT-%06d", nextNumber);
    }

    public BeaconStationResponse findById(UUID id) {
        BeaconStation entity = beaconStationRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));
        return toResponse(entity);
    }

    public List<BeaconStationResponse> search(
            String name, String code, String type, String status,
            UUID unitId, UUID seaportId, String operator, Integer provinceId,
            Integer operationalStatus, Double stationArea, String approvalStatus, UUID updatedBy,
            String commissionedFrom, String commissionedTo,
            String updatedFrom, String updatedTo) {
        return beaconStationRepo.searchFiltered(
                name,
                code,
                type,
                status,
                unitId,
                seaportId,
                operator,
                provinceId,
                operationalStatus,
                stationArea,
                parseApprovalStatus(approvalStatus),
                updatedBy,
                parseLocalDate(commissionedFrom),
                parseLocalDate(commissionedTo),
                parseLocalDateTime(updatedFrom),
                parseLocalDateTime(updatedTo)).stream()
                .map(this::toResponse)
                .toList();
    }

    public org.springframework.data.domain.Page<BeaconStationResponse> searchPaged(
            String name, String code, String type, String status,
            UUID unitId, UUID seaportId, String operator, Integer provinceId,
            Integer operationalStatus, Double stationArea, String approvalStatus, UUID updatedBy,
            String commissionedFrom, String commissionedTo,
            String updatedFrom, String updatedTo,
            org.springframework.data.domain.Pageable pageable) {
        return beaconStationRepo.searchFilteredPaged(
                name, code, type, status,
                unitId, seaportId, operator, provinceId,
                operationalStatus, stationArea, parseApprovalStatus(approvalStatus), updatedBy,
                parseLocalDate(commissionedFrom), parseLocalDate(commissionedTo),
                parseLocalDateTime(updatedFrom), parseLocalDateTime(updatedTo),
                pageable)
                .map(this::toResponse);
    }

    // -- CREATE --

    @Transactional
    public BeaconStationResponse create(CreateBeaconStationRequest request) {
        FieldWriteGuard.validateObject(request);
        if (beaconStationRepo.existsByCode(request.getCode())
                || buoyRepo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã đã tồn tại: " + request.getCode());
        }

        validateMaintenanceDates(request.getLastRepairDate(), request.getCommissionedDate());

        RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
                : RecordSecurityLevel.NORMAL;
        RecordSecurityLevel.validateAssignment(secLevel, "beaconstation", SecurityUtils.getCurrentUserPermissions(),
                SecurityUtils.isElevatedAdministrator());

        BeaconStation entity = BeaconStation.builder()
                .securityLevel(secLevel)
                .code(request.getCode())
                .name(request.getName())
                .type(request.getType())
                .lightRange(request.getLightRange())
                .towerColor(request.getTowerColor())
                .primaryLightModel(request.getPrimaryLightModel())
                .area(request.getArea())
                .location(request.getLocation())
                .unitId(request.getUnitId())
                .provinceId(request.getProvinceId())
                .lastRepairDate(request.getLastRepairDate())
                .commissionedDate(request.getCommissionedDate())
                .isActive(request.getIsActive())
                .shape(request.getShape())
                .structure(request.getStructure())
                .towerHeight(request.getTowerHeight())
                .lightHeight(request.getLightHeight())
                .geographicRange(request.getGeographicRange())
                .backupLightModel(request.getBackupLightModel())
                .powerSupply(request.getPowerSupply())
                .staffCount(request.getStaffCount())
                .stationArea(request.getStationArea())
                .seaportId(request.getSeaportId())
                .operator(request.getOperator())
                .detailedLocation(request.getDetailedLocation())
                .operationalStatus(request.getOperationalStatus())
                .region(request.getRegion())
                .identifyingFeature(request.getIdentifyingFeature())
                .note(request.getNote())
                .geometryType(request.getGeometryType())
                .mapSymbolId(request.getMapSymbolId())
                .coordinateSystem(request.getCoordinateSystem())
                .displayRule(request.getDisplayRule())
                .status("DRAFT")
                .approvalLevel(1)
                .approvalStatus(ApprovalStatus.PROPOSED)
                .build();

        if (entity.getUnitId() == null) {
            entity.setUnitId(getCurrentUserUnitId());
        }
        if (entity.getUnitId() == null || !orgUnitScopeService.currentUserScope().allows(entity.getUnitId())) {
            throw new AccessDeniedException("Bạn không có quyền tạo đèn biển ngoài phạm vi đơn vị được phân quyền");
        }

        if ("submit".equals(request.getAction())) {
            entity.setStatus("PENDING_APPROVAL");
            entity.setApprovalLevel(1);
        }

        entity = beaconStationRepo.save(entity);

        // No GIS sync on create: coordinates no longer travel on the create request
        // (they were moved out to the spatial object). They arrive via update, which
        // creates the spatial object once a real position is known. Writing one here
        // would persist a meaningless "POINT(null null)".

        logHistory(entity, BeaconHistoryActionType.CREATE, null, null, toJson(entity));
        notificationService.sendApprovalNotification(entity);

        return toResponse(entity);
    }

    // -- UPDATE --

    @Transactional
    public BeaconStationResponse update(UUID id, UpdateBeaconStationRequest request) {
        FieldWriteGuard.validateObject(request);
        BeaconStation entity = beaconStationRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));

        if ("DELETED".equals(entity.getStatus())) {
            throw new EntityNotFoundException("Đèn biển đã bị xóa");
        }

        String oldJson = toJson(entity);

        // Apply mutable fields only
        if (request.getName() != null)
            entity.setName(request.getName());

        // Handle type field update conditionally (BR-069-02)
        if (request.getType() != null && !request.getType().equals(entity.getType())) {
            if ("APPROVED_L2".equals(entity.getStatus()) || "PUBLISHED".equals(entity.getStatus())) {
                throw new IllegalArgumentException("Loại đèn biển không thể thay đổi khi đèn biển đã được phê duyệt.");
            }
            entity.setType(request.getType());
        }

        // Handle latitude/longitude updates
        Double currentLon = null;
        Double currentLat = null;
        if (entity.getSpatialId() != null) {
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
                    // ignore
                }
            }
        }
        // The update request no longer carries coordinates, so the existing spatial
        // position is the only source; keep it as-is.
        String wkt = null;
        if (currentLon != null && currentLat != null) {
            wkt = "POINT(" + currentLon + " " + currentLat + ")";
        }

        if (request.getSecurityLevel() != null) {
            RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "beaconstation",
                    SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
            entity.setSecurityLevel(request.getSecurityLevel());
        }
        if (request.getTowerColor() != null)
            entity.setTowerColor(request.getTowerColor());
        if (request.getPrimaryLightModel() != null) {
            entity.setPrimaryLightModel(request.getPrimaryLightModel());
        }
        // BUG FIX #2: Apply lightRange on update
        if (request.getLightRange() != null)
            entity.setLightRange(request.getLightRange());
        if (request.getArea() != null)
            entity.setArea(request.getArea());
        if (request.getLocation() != null)
            entity.setLocation(request.getLocation());
        if (request.getUnitId() != null)
            entity.setUnitId(request.getUnitId());
        if (request.getProvinceId() != null)
            entity.setProvinceId(request.getProvinceId());
        if (request.getLastRepairDate() != null) {
            entity.setLastRepairDate(request.getLastRepairDate());
        }
        if (request.getCommissionedDate() != null) {
            entity.setCommissionedDate(request.getCommissionedDate());
        }
        if (request.getIsActive() != null)
            entity.setIsActive(request.getIsActive());

        if (request.getShape() != null)
            entity.setShape(request.getShape());
        if (request.getStructure() != null)
            entity.setStructure(request.getStructure());
        if (request.getTowerHeight() != null)
            entity.setTowerHeight(request.getTowerHeight());
        if (request.getLightHeight() != null)
            entity.setLightHeight(request.getLightHeight());
        if (request.getGeographicRange() != null)
            entity.setGeographicRange(request.getGeographicRange());
        if (request.getBackupLightModel() != null)
            entity.setBackupLightModel(request.getBackupLightModel());
        if (request.getPowerSupply() != null)
            entity.setPowerSupply(request.getPowerSupply());
        if (request.getStaffCount() != null)
            entity.setStaffCount(request.getStaffCount());
        if (request.getStationArea() != null)
            entity.setStationArea(request.getStationArea());

        if (request.getSeaportId() != null)
            entity.setSeaportId(request.getSeaportId());
        if (request.getOperator() != null)
            entity.setOperator(request.getOperator());
        if (request.getDetailedLocation() != null)
            entity.setDetailedLocation(request.getDetailedLocation());
        if (request.getOperationalStatus() != null)
            entity.setOperationalStatus(request.getOperationalStatus());
        if (request.getRegion() != null)
            entity.setRegion(request.getRegion());
        if (request.getIdentifyingFeature() != null)
            entity.setIdentifyingFeature(request.getIdentifyingFeature());
        if (request.getNote() != null)
            entity.setNote(request.getNote());
        if (request.getGeometryType() != null)
            entity.setGeometryType(request.getGeometryType());
        if (request.getMapSymbolId() != null)
            entity.setMapSymbolId(request.getMapSymbolId());
        if (request.getCoordinateSystem() != null)
            entity.setCoordinateSystem(request.getCoordinateSystem());
        boolean wasApproved = isApprovedStatus(entity.getStatus())
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        if (wasApproved) {
            entity.setStatus("APPROVED_L2");
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
        }

        entity = beaconStationRepo.save(entity);

        // Sync GIS spatial object
        if (wkt != null) {
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    entity.getSpatialId(),
                    entity.getName(),
                    "DENBIEN_" + entity.getCode(),
                    GisGeometryType.POINT,
                    GisSpatialObjectType.POINT_LIGHTHOUSE,
                    wkt, entity.getId(),
                    InfrastructureType.LIGHTHOUSE);
            if (entity.getSpatialId() == null) {
                entity.setSpatialId(spatialObj.getId());
                beaconStationRepo.save(entity);
            }
        }

        // Only record history when the record is already approved
        String newJson = toJson(entity);
        if (wasApproved && !compareJsonNodes(oldJson, newJson)) {
            logHistory(entity, BeaconHistoryActionType.UPDATE,
                    getChangedFields(oldJson, newJson), oldJson, newJson);
        }
        return toResponse(entity);
    }

    // -- DELETE (Soft) --

    @Transactional
    public void delete(UUID id) {
        BeaconStation entity = beaconStationRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));

        if ("DELETED".equals(entity.getStatus())) {
            throw new IllegalArgumentException("Đèn biển này đã bị xóa trước đó");
        }

        if (isInApprovalProcess(entity.getStatus())) {
            throw new IllegalStateException(
                    "Không thể xóa đèn biển đang chờ phê duyệt");
        }

        entity.setStatus("DELETED");
        entity.softDelete(SecurityUtils.getCurrentUserId());
        beaconStationRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.SOFT_DELETE, null, null, toJson(entity));

        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
    }

    // -- APPROVAL --

    @Transactional
    public void submitForApproval(UUID id) {
        BeaconStation entity = beaconStationRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));

        if (!"DRAFT".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Chỉ có thể gửi phê duyệt khi status = DRAFT");
        }

        entity.setStatus("PENDING_APPROVAL");
        entity.setApprovalStatus(ApprovalStatus.PROPOSED);
        entity.setApprovalLevel(1);
        beaconStationRepo.save(entity);

        notificationService.sendApprovalNotification(entity);
    }

    @Transactional
    public BeaconStationResponse approveL1(UUID id, java.util.UUID approverId) {
        BeaconStation entity = beaconStationRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));

        if (!"PENDING_APPROVAL".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L1");
        }

        java.util.UUID creatorId = resolveCreatedBy(entity);
        if (creatorId != null && creatorId.equals(approverId)) {
            throw new IllegalStateException(
                    "Bạn không thể phê duyệt bản do chính mình gửi");
        }

        entity.setStatus("APPROVED");
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setApprovedBy(approverId);
        entity.setApprovedDate(LocalDateTime.now());
        beaconStationRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.APPROVE_L1, null, null, null);

        return toResponse(entity);
    }

    @Transactional
    public BeaconStationResponse reject(UUID id, String rejectReason, java.util.UUID approverId) {
        BeaconStation entity = beaconStationRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));

        if (rejectReason == null || rejectReason.length() < 10) {
            throw new IllegalArgumentException(
                    "Lý do từ chối phải có ít nhất 10 ký tự");
        }

        entity.setStatus("DRAFT");
        entity.setApprovalStatus(ApprovalStatus.REJECTED);
        entity.setRejectionReason(rejectReason);
        beaconStationRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.REJECT, null, null, rejectReason);
        notificationService.sendRejectionNotification(entity, rejectReason);

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

    private void validateMaintenanceDates(LocalDate last, LocalDate next) {
        if (last != null && last.isAfter(LocalDate.now())) {
            throw new IllegalArgumentException(
                    "Ngày bảo trì gần nhất không được lớn hơn ngày hiện tại");
        }
    }

    private ApprovalStatus parseApprovalStatus(String approvalStatus) {
        return approvalStatus != null ? ApprovalStatus.fromString(approvalStatus) : null;
    }

    private LocalDate parseLocalDate(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim());
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDateTime parseLocalDateTime(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }
        try {
            String v = value.trim();
            if (v.length() == 10) {
                v = v + "T00:00:00";
            } else {
                v = v.replace(" ", "T");
            }
            return LocalDateTime.parse(v);
        } catch (Exception e) {
            return null;
        }
    }

    private void logHistory(BeaconStation entity,
            BeaconHistoryActionType action, String fields, String previousJson, String newJson) {
        Long legacyUserId = resolveCurrentUserId();
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        BeaconHistory entry = BeaconHistory.builder()
                .beaconType(BeaconType.BEACON_LIGHT)
                .entityId(entity.getId())
                .actionType(action)
                .changedField(fields != null && fields.length() > 255 ? fields.substring(0, 255) : fields)
                .previousValue(previousJson)
                .newValue(newJson != null ? newJson : (action == BeaconHistoryActionType.REJECT ? "REJECTED" : null))
                .changedBy(legacyUserId)
                .changedAt(LocalDateTime.now())
                .reason(action == BeaconHistoryActionType.REJECT ? newJson : null)
                .build();
        if (historyRepo != null) {
            historyRepo.save(entry);
        }

        if (infraHistoryRepo != null && entity.getId() != null) {
            InfrastructureHistoryStatus status = switch (action) {
                case CREATE -> InfrastructureHistoryStatus.CREATED;
                case UPDATE -> InfrastructureHistoryStatus.UPDATED;
                case SOFT_DELETE -> InfrastructureHistoryStatus.DELETED;
                case APPROVE_L1, APPROVE_L2 -> InfrastructureHistoryStatus.APPROVED;
                case REJECT -> InfrastructureHistoryStatus.REJECTED;
                default -> InfrastructureHistoryStatus.UPDATED;
            };
            infraHistoryRepo.save(InfrastructureHistory.builder()
                    .refId(entity.getId())
                    .refType(InfrastructureType.LIGHTHOUSE)
                    .approvalLevel(action == BeaconHistoryActionType.APPROVE_L2
                            ? ApprovalLevel.LEVEL_2
                            : (action == BeaconHistoryActionType.APPROVE_L1
                                    ? ApprovalLevel.LEVEL_1
                                    : ApprovalLevel.LEVEL_0))
                    .status(status)
                    .approvedBy(currentUserId)
                    .approvedDate(LocalDateTime.now())
                    .changedField(fields)
                    .previousValue(previousJson)
                    .newValue(newJson)
                    .reason(action == BeaconHistoryActionType.REJECT ? newJson : null)
                    .build());
        }
    }

    private BeaconStationResponse toResponse(BeaconStation entity) {
        String unitName = orgUnitCacheService.getName(entity.getUnitId());

        Double latitude = null;
        Double longitude = null;
        if (entity.getSpatialId() != null) {
            Optional<GisSpatialObject> spatialObjOpt = gisSpatialObjectService.findById(entity.getSpatialId());
            if (spatialObjOpt.isPresent()) {
                String coordsStr = spatialObjOpt.get().getCoordinates();
                try {
                    String clean = coordsStr.replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        longitude = Double.parseDouble(parts[0]);
                        latitude = Double.parseDouble(parts[1]);
                    }
                } catch (Exception ex) {
                    // ignore
                }
            }
        }

        return BeaconStationResponse.builder()
                .id(entity.getId())
                .securityLevel(entity.getSecurityLevel())
                .code(entity.getCode())
                .name(entity.getName())
                .type(entity.getType())
                .lightRange(entity.getLightRange())
                .towerColor(entity.getTowerColor())
                .primaryLightModel(entity.getPrimaryLightModel())
                .area(entity.getArea())
                .location(entity.getLocation())
                .unitId(entity.getUnitId())
                .unitName(unitName)
                .provinceId(entity.getProvinceId())
                .lastRepairDate(entity.getLastRepairDate())
                .commissionedDate(entity.getCommissionedDate())
                .isActive(entity.getIsActive())
                .status(entity.getStatus())
                .approvalStatus(entity.getApprovalStatus().name())
                .approvalLevel(ApprovalLevel.fromInt(entity.getApprovalLevel()))
                .approvedBy(entity.getApprovedBy())
                .approvedDate(entity.getApprovedDate())
                .rejectionReason(entity.getRejectionReason())
                .shape(entity.getShape())
                .structure(entity.getStructure())
                .towerHeight(entity.getTowerHeight())
                .lightHeight(entity.getLightHeight())
                .geographicRange(entity.getGeographicRange())
                .backupLightModel(entity.getBackupLightModel())
                .powerSupply(entity.getPowerSupply())
                .staffCount(entity.getStaffCount())
                .stationArea(entity.getStationArea())
                .seaportId(entity.getSeaportId())
                .operator(entity.getOperator())
                .detailedLocation(entity.getDetailedLocation())
                .operationalStatus(entity.getOperationalStatus())
                .region(entity.getRegion())
                .identifyingFeature(entity.getIdentifyingFeature())
                .note(entity.getNote())
                .geometryType(entity.getGeometryType())
                .mapSymbolId(entity.getMapSymbolId())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .updatedBy(entity.getUpdatedBy())
                .build();
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
        User currentUser = SecurityUtils.getCurrentUser();
        return currentUser != null && currentUser.getOrgUnit() != null
                ? currentUser.getOrgUnit().getId()
                : null;
    }

    private Long resolveCurrentUserId() {
        return 1L;
    }

    private java.util.UUID resolveCreatedBy(BeaconStation entity) {
        return entity.getCreatedBy();
    }

    // -- BUG FIX #1: Shared ObjectMapper + JsonNode comparison --

    private String toJson(BeaconStation entity) {
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

    // -- ATTACHMENTS --

    @Transactional
    public List<AttachmentDto> uploadAttachments(UUID entityId, List<MultipartFile> files, UUID userId) {
        final String entityType = "BEACON_LIGHT";
        long existingCount = attachmentRepository.countByEntityTypeAndEntityId(entityType, entityId);
        if (existingCount + files.size() > 10) {
            throw new IllegalArgumentException("Tối đa 10 file đính kèm");
        }
        List<Attachment> saved = new ArrayList<>();
        java.nio.file.Path basePath = java.nio.file.Paths.get(attachmentPath).toAbsolutePath().normalize();
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
        }
        return saved.stream().map(this::toAttachmentDto).toList();
    }

    public List<AttachmentDto> listAttachments(UUID entityId) {
        return attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("BEACON_LIGHT", entityId)
                .stream().map(this::toAttachmentDto).toList();
    }

    @Transactional
    public void deleteAttachment(UUID entityId, UUID attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
        if (!attachment.getEntityId().equals(entityId)) {
            throw new IllegalArgumentException("File không thuộc đèn biển này");
        }
        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
        } catch (Exception e) {
            // ignore file deletion failure; the DB record is still removed
        }
        attachmentRepository.delete(attachment);
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
