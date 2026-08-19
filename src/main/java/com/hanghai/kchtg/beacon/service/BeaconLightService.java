package com.hanghai.kchtg.beacon.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.beacon.dto.beacon_light.BeaconLightResponse;
import com.hanghai.kchtg.beacon.dto.beacon_light.CreateBeaconLightRequest;
import com.hanghai.kchtg.beacon.dto.beacon_light.UpdateBeaconLightRequest;
import com.hanghai.kchtg.beacon.entity.BeaconHistory;
import com.hanghai.kchtg.beacon.entity.BeaconHistoryActionType;
import com.hanghai.kchtg.beacon.entity.BeaconLight;
import com.hanghai.kchtg.beacon.entity.BeaconType;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.beacon.repository.BeaconHistoryRepository;
import com.hanghai.kchtg.beacon.repository.BeaconLightRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.security.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Service for BeaconLight CRUD + approval workflow (F-068 to F-072).
 * Follows M-007 PointObjectService pattern exactly.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class BeaconLightService {

    private final BeaconLightRepository beaconLightRepo;
    private final BuoyRepository buoyRepo;
    private final BeaconHistoryRepository historyRepo;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final OrgUnitCacheService orgUnitCacheService;

    // -- READ --

    public List<BeaconLightResponse> findAll() {
        return beaconLightRepo.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public BeaconLightResponse findById(UUID id) {
        BeaconLight entity = beaconLightRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));
        return toResponse(entity);
    }

    public List<BeaconLightResponse> search(
            String name, String code, String type, String status) {
        return beaconLightRepo.searchFiltered(
                name,
                code,
                type,
                status
        ).stream()
                .map(this::toResponse)
                .toList();
    }

    public org.springframework.data.domain.Page<BeaconLightResponse> searchPaged(
            String name, String code, String type, String status,
            org.springframework.data.domain.Pageable pageable) {
        return beaconLightRepo.searchFilteredPaged(name, code, type, status, pageable)
                .map(this::toResponse);
    }

    // -- CREATE --

    @Transactional
    public BeaconLightResponse create(CreateBeaconLightRequest request) {
        if (beaconLightRepo.existsByCode(request.getCode())
                || buoyRepo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã đã tồn tại: " + request.getCode());
        }

        validateMaintenanceDates(request.getLastRepairDate(), request.getCommissionedDate());

        BeaconLight entity = BeaconLight.builder()
                .code(request.getCode())
                .name(request.getName())
                .type(request.getType())
                .lightRange(request.getLightRange())
                .towerColor(request.getTowerColor())
                .primaryLightModel(request.getPrimaryLightModel())
                .area(request.getArea())
                .location(request.getLocation())
                .unitId(request.getUnitId())
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
                .status("DRAFT")
                .approvalLevel(1)
                .approvalStatus(ApprovalStatus.PROPOSED)
                .build();

        if (entity.getUnitId() == null) {
            entity.setUnitId(getCurrentUserUnitId());
        }

        if ("submit".equals(request.getAction())) {
            entity.setStatus("PENDING_APPROVAL");
            entity.setApprovalLevel(1);
        }

        entity = beaconLightRepo.save(entity);

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
    public BeaconLightResponse update(UUID id, UpdateBeaconLightRequest request) {
        BeaconLight entity = beaconLightRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));

        if ("DELETED".equals(entity.getStatus())) {
            throw new EntityNotFoundException("Đèn biển đã bị xóa");
        }

        String oldJson = toJson(entity);

        // Apply mutable fields only
        if (request.getName() != null) entity.setName(request.getName());

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

        if (request.getTowerColor() != null) entity.setTowerColor(request.getTowerColor());
        if (request.getPrimaryLightModel() != null) {
            entity.setPrimaryLightModel(request.getPrimaryLightModel());
        }
        // BUG FIX #2: Apply lightRange on update
        if (request.getLightRange() != null) entity.setLightRange(request.getLightRange());
        if (request.getArea() != null) entity.setArea(request.getArea());
        if (request.getLocation() != null) entity.setLocation(request.getLocation());
        if (request.getUnitId() != null) entity.setUnitId(request.getUnitId());
        if (request.getLastRepairDate() != null) {
            entity.setLastRepairDate(request.getLastRepairDate());
        }
        if (request.getCommissionedDate() != null) {
            entity.setCommissionedDate(request.getCommissionedDate());
        }
        if (request.getIsActive() != null) entity.setIsActive(request.getIsActive());

        if (request.getShape() != null) entity.setShape(request.getShape());
        if (request.getStructure() != null) entity.setStructure(request.getStructure());
        if (request.getTowerHeight() != null) entity.setTowerHeight(request.getTowerHeight());
        if (request.getLightHeight() != null) entity.setLightHeight(request.getLightHeight());
        if (request.getGeographicRange() != null) entity.setGeographicRange(request.getGeographicRange());
        if (request.getBackupLightModel() != null) entity.setBackupLightModel(request.getBackupLightModel());
        if (request.getPowerSupply() != null) entity.setPowerSupply(request.getPowerSupply());
        if (request.getStaffCount() != null) entity.setStaffCount(request.getStaffCount());
        if (request.getStationArea() != null) entity.setStationArea(request.getStationArea());

        // Status revert logic for approved states
        if (isApprovedStatus(entity.getStatus())) {
            entity.setStatus("DRAFT");
            entity.setApprovalStatus(ApprovalStatus.PROPOSED);
            entity.setApprovalLevel(1);
        }

        entity = beaconLightRepo.save(entity);

        // Sync GIS spatial object
        if (wkt != null) {
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    entity.getSpatialId(),
                    entity.getName(),
                    "DENBIEN_" + entity.getCode(),
                    GisGeometryType.POINT,
                    GisSpatialObjectType.POINT_LIGHTHOUSE,
                    wkt, entity.getId(),
                    InfrastructureType.LIGHTHOUSE
            );
            if (entity.getSpatialId() == null) {
                entity.setSpatialId(spatialObj.getId());
                beaconLightRepo.save(entity);
            }
        }

        // BUG FIX #1: Use JsonNode.equals() for reliable comparison (not string equals)
        // BUG FIX #3: Use real field diff instead of static "fields_updated"
        String newJson = toJson(entity);
        if (!compareJsonNodes(oldJson, newJson)) {
            logHistory(entity, BeaconHistoryActionType.UPDATE,
                    getChangedFields(oldJson, newJson), oldJson, newJson);
        }
        return toResponse(entity);
    }

    // -- DELETE (Soft) --

    @Transactional
    public void delete(UUID id) {
        BeaconLight entity = beaconLightRepo.findById(id)
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
        beaconLightRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.SOFT_DELETE, null, null, toJson(entity));

        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
    }

    // -- APPROVAL --

    @Transactional
    public void submitForApproval(UUID id) {
        BeaconLight entity = beaconLightRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));

        if (!"DRAFT".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Chỉ có thể gửi phê duyệt khi status = DRAFT");
        }

        entity.setStatus("PENDING_APPROVAL");
        entity.setApprovalStatus(ApprovalStatus.PROPOSED);
        entity.setApprovalLevel(1);
        beaconLightRepo.save(entity);

        notificationService.sendApprovalNotification(entity);
    }

    @Transactional
    public BeaconLightResponse approveL1(UUID id, java.util.UUID approverId) {
        BeaconLight entity = beaconLightRepo.findById(id)
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

        entity.setStatus("APPROVED_L1");
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setApprovedBy(approverId);
        entity.setApprovedDate(LocalDateTime.now());
        beaconLightRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.APPROVE_L1, null, null, null);
        notificationService.sendL2ApprovalNotification(entity);

        return toResponse(entity);
    }

    @Transactional
    public BeaconLightResponse approveL2(UUID id, java.util.UUID approverId) {
        BeaconLight entity = beaconLightRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));

        if (!"APPROVED_L1".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L2");
        }

        entity.setStatus("PUBLISHED");
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setApprovedBy(approverId);
        entity.setApprovedDate(LocalDateTime.now());
        beaconLightRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.APPROVE_L2, null, null, null);

        return toResponse(entity);
    }

    @Transactional
    public BeaconLightResponse reject(UUID id, String rejectReason, java.util.UUID approverId) {
        BeaconLight entity = beaconLightRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));

        if (rejectReason == null || rejectReason.length() < 10) {
            throw new IllegalArgumentException(
                    "Lý do từ chối phải có ít nhất 10 ký tự");
        }

        entity.setStatus("DRAFT");
        entity.setApprovalStatus(ApprovalStatus.REJECTED);
        entity.setRejectionReason(rejectReason);
        beaconLightRepo.save(entity);

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

    private void logHistory(BeaconLight entity,
                            BeaconHistoryActionType action, String fields, String previousJson, String newJson) {
        BeaconHistory entry = BeaconHistory.builder()
                .beaconType(BeaconType.BEACON_LIGHT)
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

    private BeaconLightResponse toResponse(BeaconLight entity) {
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

        return BeaconLightResponse.builder()
                .id(entity.getId())
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
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
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
        return null;
    }

    private Long resolveCurrentUserId() {
        return 1L;
    }

    private java.util.UUID resolveCreatedBy(BeaconLight entity) {
        return entity.getCreatedBy();
    }

    // -- BUG FIX #1: Shared ObjectMapper + JsonNode comparison --

    private String toJson(BeaconLight entity) {
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
