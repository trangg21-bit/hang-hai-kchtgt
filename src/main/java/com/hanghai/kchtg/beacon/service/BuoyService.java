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
 * Service for Buoy CRUD + approval workflow (F-074 to F-077).
 * Parallel structure to BeaconLightService.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("null")
public class BuoyService {

    private final BuoyRepository buoyRepo;
    private final BeaconLightRepository beaconLightRepo;
    private final BeaconHistoryRepository historyRepo;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final OrgUnitCacheService orgUnitCacheService;

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
            String name, String code, String type, String status) {
        return buoyRepo.searchFiltered(
                name,
                code,
                type,
                status
        ).stream()
                .map(this::toResponse)
                .toList();
    }

    // -- CREATE --

    @Transactional
    public BuoyResponse create(CreateBuoyRequest request) {
        if (buoyRepo.existsByCode(request.getCode())
                || beaconLightRepo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Đã tồn tại: " + request.getCode());
        }

        validateInspectionDates(request.getLastInspectionDate(), request.getNextInspectionDate());

        Buoy entity = Buoy.builder()
                .code(request.getCode())
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
                .status("DRAFT")
                .approvalStatus("PENDING")
                .build();

        if (entity.getUnitId() == null) {
            entity.setUnitId(getCurrentUserUnitId());
        }

        if ("submit".equals(request.getAction())) {
            entity.setStatus("PENDING_APPROVAL");
            entity.setApprovalLevel(1);
        }

        entity = buoyRepo.save(entity);

        // Create GIS spatial object when coordinates are provided
        if (request.getLatitude() != null && request.getLongitude() != null) {
            validateCoordinates(request.getLongitude(), request.getLatitude());
            String wkt = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    entity.getName(),
                    "PHAOTIEU_" + entity.getCode(),
                    GisGeometryType.POINT,
                    GisSpatialObjectType.POINT_BUOY,
                    wkt, entity.getId(),
                    InfrastructureType.BUOY
            );
            entity.setSpatialId(spatialObj.getId());
            entity = buoyRepo.save(entity);
        }

        logHistory(entity, BeaconHistoryActionType.CREATE, null, null, toJson(entity));
        notificationService.sendApprovalNotificationBuoy(entity);

        return toResponse(entity);
    }

    // -- UPDATE --

    @Transactional
    public BuoyResponse update(UUID id, UpdateBuoyRequest request) {
        Buoy entity = buoyRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Phao tiêu không tìm thấy: " + id));

        if ("DELETED".equals(entity.getStatus())) {
            throw new EntityNotFoundException("Phao tiêu đã bị xóa");
        }

        String oldJson = toJson(entity);

        // Apply mutable fields only
        if (request.getName() != null) entity.setName(request.getName());

        // Handle type field update conditionally (BR-075-02)
        if (request.getType() != null && !request.getType().equals(entity.getType())) {
            if ("APPROVED_L2".equals(entity.getStatus()) || "PUBLISHED".equals(entity.getStatus())) {
                throw new IllegalArgumentException("Loại phao tiêu không thể thay đổi khi đã được phê duyệt.");
            }
            entity.setType(request.getType());
        }

        // Handle latitude/longitude updates — prefer request values, fallback to existing spatial
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
                } catch (Exception ex) { /* ignore */ }
            }
        }
        if (currentLon != null && currentLat != null) {
            validateCoordinates(currentLon, currentLat);
        }
        String wkt = null;
        if (currentLon != null && currentLat != null) {
            wkt = "POINT(" + currentLon + " " + currentLat + ")";
        }

        if (request.getColor() != null) entity.setColor(request.getColor());
        if (request.getShape() != null) entity.setShape(request.getShape());
        if (request.getLightCharacteristic() != null) {
            entity.setLightCharacteristic(request.getLightCharacteristic());
        }
        if (request.getRange() != null) entity.setRange(request.getRange());
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        if (request.getUnitId() != null) entity.setUnitId(request.getUnitId());
        if (request.getLastInspectionDate() != null) {
            entity.setLastInspectionDate(request.getLastInspectionDate());
        }
        if (request.getNextInspectionDate() != null) {
            entity.setNextInspectionDate(request.getNextInspectionDate());
        }
        if (request.getIsActive() != null) entity.setIsActive(request.getIsActive());

        // Status revert logic for approved states (same as BeaconLight)
        if (isApprovedStatus(entity.getStatus())) {
            entity.setStatus("DRAFT");
            entity.setApprovalStatus("PENDING");
            entity.setApprovalLevel(1);
        }

        entity = buoyRepo.save(entity);

        // Sync GIS spatial object
        if (wkt != null) {
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    entity.getSpatialId(),
                    entity.getName(),
                    "PHAOTIEU_" + entity.getCode(),
                    GisGeometryType.POINT,
                    GisSpatialObjectType.POINT_BUOY,
                    wkt, entity.getId(),
                    InfrastructureType.BUOY
            );
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

        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
    }

    // -- APPROVAL --

    @Transactional
    public void submitForApproval(UUID id) {
        Buoy entity = buoyRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Phao tiêu không tìm thấy: " + id));

        if (!"DRAFT".equals(entity.getStatus()) && !"REJECTED".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Chỉ có thể gửi phê duyệt khi status = DRAFT hoặc REJECTED");
        }

        entity.setStatus("PENDING_APPROVAL");
        entity.setApprovalStatus("PENDING");
        entity.setApprovalLevel(1);
        buoyRepo.save(entity);

        notificationService.sendApprovalNotificationBuoy(entity);
    }

    @Transactional
    public BuoyResponse approveL1(UUID id, java.util.UUID approverId) {
        Buoy entity = buoyRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Phao tiêu không tìm thấy: " + id));

        if (!"PENDING_APPROVAL".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L1");
        }

        // Self-approval: allowed per user request (BR-077-09 relaxed)
        entity.setStatus("APPROVED_L1");
        entity.setApprovalStatus("APPROVED");
        entity.setApprovedBy(approverId);
        entity.setApprovedDate(LocalDateTime.now());
        entity.setLevel1ApprovedBy(approverId);
        entity.setLevel1ApprovedDate(LocalDateTime.now());
        buoyRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.APPROVE_L1, null, null, null);
        notificationService.sendL2ApprovalNotificationBuoy(entity);

        return toResponse(entity);
    }

    @Transactional
    public BuoyResponse approveL2(UUID id, java.util.UUID approverId) {
        Buoy entity = buoyRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Phao tiêu không tìm thấy: " + id));

        if (!"APPROVED_L1".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L2");
        }

        entity.setStatus("PUBLISHED");
        entity.setApprovalStatus("APPROVED");
        entity.setApprovedBy(approverId);
        entity.setApprovedDate(LocalDateTime.now());
        entity.setLevel2ApprovedBy(approverId);
        entity.setLevel2ApprovedDate(LocalDateTime.now());
        buoyRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.APPROVE_L2, null, null, null);

        return toResponse(entity);
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
        entity.setApprovalStatus("REJECTED");
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
                .changedField(fields)
                .previousValue(previousJson)
                .newValue(newJson != null ? newJson : (action == BeaconHistoryActionType.REJECT ? "REJECTED" : null))
                .changedBy(resolveCurrentUserId())
                .changedAt(LocalDateTime.now())
                .reason(action == BeaconHistoryActionType.REJECT ? newJson : null)
                .build();
        historyRepo.save(entry);
    }

    private BuoyResponse toResponse(Buoy entity) {
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
                .unitName(unitName)
                .latitude(latitude)
                .longitude(longitude)
                .lastInspectionDate(entity.getLastInspectionDate())
                .nextInspectionDate(entity.getNextInspectionDate())
                .isActive(entity.getIsActive())
                .status(entity.getStatus())
                .approvalStatus(entity.getApprovalStatus())
                .approvalLevel(ApprovalLevel.fromInt(entity.getApprovalLevel()))
                .approvedBy(entity.getApprovedBy())
                .approvedDate(entity.getApprovedDate())
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
