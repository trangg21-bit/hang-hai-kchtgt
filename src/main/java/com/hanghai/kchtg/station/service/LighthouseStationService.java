package com.hanghai.kchtg.station.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.station.dto.lighthouse.CreateLighthouseStationRequest;
import com.hanghai.kchtg.station.dto.lighthouse.LighthouseStationResponse;
import com.hanghai.kchtg.station.dto.lighthouse.UpdateLighthouseStationRequest;
import com.hanghai.kchtg.station.entity.LighthouseStation;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.entity.StationApprovalStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.station.entity.StationHistory;
import com.hanghai.kchtg.station.repository.BuoyStationRepository;
import com.hanghai.kchtg.station.repository.LighthouseStationRepository;
import com.hanghai.kchtg.station.repository.StationHistoryRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.Optional;

/**
 * Service cho CRUD + quy trình phê duyệt nhà trạm đèn (F-086 đến F-091).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LighthouseStationService {

    private final LighthouseStationRepository lighthouseRepo;
    private final BuoyStationRepository buoyRepo;
    private final StationHistoryRepository historyRepo;
    private final PointObjectSyncService pointObjectSyncService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    // -- READ --

    public List<LighthouseStationResponse> findAll() {
        return lighthouseRepo.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public LighthouseStationResponse findById(UUID id) {
        LighthouseStation entity = lighthouseRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm đèn không tìm thấy: " + id));
        return toResponse(entity);
    }

    public List<LighthouseStationResponse> search(
            String name, String code, String type, String status) {
        return lighthouseRepo.searchFiltered(name, code, type, status).stream()
                .map(this::toResponse)
                .toList();
    }

    // -- CREATE --

    @Transactional
    public LighthouseStationResponse create(CreateLighthouseStationRequest request) {
        if (lighthouseRepo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã nhà trạm đèn biển đã tồn tại: " + request.getCode());
        }

        validateCoordinates(request.getLongitude(), request.getLatitude());
        validateMaintenanceDates(request.getLastMaintenanceDate(), request.getNextMaintenanceDate());

        LighthouseStation entity = LighthouseStation.builder()
                .code(request.getCode())
                .name(request.getName())
                .type(request.getType())
                .lightRange(request.getLightRange())
                .lightColor(request.getLightColor())
                .lightCharacteristic(request.getLightCharacteristic())
                .range(request.getRange())
                .description(request.getDescription())
                .unitId(request.getUnitId())
                .lastMaintenanceDate(request.getLastMaintenanceDate())
                .nextMaintenanceDate(request.getNextMaintenanceDate())
                .isActive(request.getIsActive())
                .status(StationStatus.DRAFT)
                .approvalStatus(StationApprovalStatus.PENDING)
                .build();
        notificationService.sendApprovalNotificationDen(entity);

        return toResponse(entity);
    }

    // -- UPDATE --

    @Transactional
    public LighthouseStationResponse update(UUID id, UpdateLighthouseStationRequest request) {
        LighthouseStation entity = lighthouseRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm đèn không tìm thấy: " + id));

        if (StationStatus.DELETED.equals(entity.getStatus())) {
            throw new EntityNotFoundException("Nhà trạm đèn đã bị xóa");
        }

        String oldJson = toJson(entity);

        // Apply mutable fields only
        if (request.getName() != null) entity.setName(request.getName());

        // Handle type field update conditionally
        if (request.getType() != null && !request.getType().equals(entity.getType())) {
            if (isApprovedStatus(entity.getStatus())) {
                throw new IllegalArgumentException(
                        "Loại nhà trạm đèn không thể thay đổi khi đã được phê duyệt.");
            }
            entity.setType(request.getType());
        }

        // Handle latitude/longitude updates
        Double currentLon = null;
        Double currentLat = null;
        if (entity.getSpatialId() != null) {
            Optional<GisSpatialObject> spatialOpt = gisSpatialObjectService.findById(entity.getSpatialId());
            if (spatialOpt.isPresent()) {
                String currentCoords = spatialOpt.get().getCoordinates();
                if (currentCoords != null && currentCoords.startsWith("POINT(")) {
                    try {
                        String clean = currentCoords.replace("POINT", "").replace("(", "").replace(")", "").trim();
                        String[] parts = clean.split("\\s+");
                        currentLon = Double.parseDouble(parts[0]);
                        currentLat = Double.parseDouble(parts[1]);
                    } catch (Exception ignored) {}
                }
            }
        }

        if (request.getLongitude() != null || request.getLatitude() != null) {
            Double finalLon = request.getLongitude() != null ? request.getLongitude() : currentLon;
            Double finalLat = request.getLatitude() != null ? request.getLatitude() : currentLat;
            if (finalLon != null && finalLat != null) {
                validateCoordinates(finalLon, finalLat);
            }
        }

        if (request.getLightColor() != null) entity.setLightColor(request.getLightColor());
        if (request.getLightCharacteristic() != null) {
            entity.setLightCharacteristic(request.getLightCharacteristic());
        }
        if (request.getLightRange() != null) entity.setLightRange(request.getLightRange());
        if (request.getRange() != null) entity.setRange(request.getRange());
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        if (request.getUnitId() != null) entity.setUnitId(request.getUnitId());
        if (request.getLastMaintenanceDate() != null) {
            entity.setLastMaintenanceDate(request.getLastMaintenanceDate());
        }
        if (request.getNextMaintenanceDate() != null) {
            entity.setNextMaintenanceDate(request.getNextMaintenanceDate());
        }
        if (request.getIsActive() != null) entity.setIsActive(request.getIsActive());

        // Status revert logic for approved states
        if (isApprovedStatus(entity.getStatus())) {
            entity.setStatus(StationStatus.DRAFT);
            entity.setApprovalStatus(StationApprovalStatus.PENDING);
            entity.setApprovalLevel(ApprovalLevel.LEVEL_1);
        }

        lighthouseRepo.save(entity);

        // Sync to GisSpatialObject
        String toaDo = request.getCoordinates();
        if ((toaDo == null || toaDo.trim().isEmpty()) && request.getLongitude() != null && request.getLatitude() != null) {
            toaDo = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (toaDo != null && !toaDo.trim().isEmpty()) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
            GisSpatialObjectType objType = GisSpatialObjectType.POINT_LIGHTHOUSE;
            UUID refId = entity.getId();
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    entity.getSpatialId(),
                    entity.getName(),
                    "DENBIEN_" + entity.getCode(),
                    geomType,
                    objType,
                    toaDo,
                    refId,
                    InfrastructureType.LIGHTHOUSE
            );
            entity.setSpatialId(spatialObj.getId());

            lighthouseRepo.save(entity);
        } else if (entity.getSpatialId() != null) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
            GisSpatialObjectType objType = GisSpatialObjectType.POINT_LIGHTHOUSE;
            gisSpatialObjectService.createOrUpdate(
                    entity.getSpatialId(),
                    entity.getName(),
                    "DENBIEN_" + entity.getCode(),
                    geomType,
                    objType,
                    "POINT(" + (currentLon != null ? currentLon : 0.0) + " " + (currentLat != null ? currentLat : 0.0) + ")",
                    entity.getId(),
                    InfrastructureType.LIGHTHOUSE
            );
        }

        // Compare JSON for actual changes
        String newJson = toJson(entity);
        if (!compareJsonNodes(oldJson, newJson)) {
            logHistory(entity, "UPDATE",
                    getChangedFields(oldJson, newJson), oldJson, newJson);
        }
        return toResponse(entity);
    }

    // -- DELETE (Soft) --

    @Transactional
    public void delete(UUID id) {
        LighthouseStation entity = lighthouseRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm đèn không tìm thấy: " + id));

        if (StationStatus.DELETED.equals(entity.getStatus())) {
            throw new IllegalArgumentException("Nhà trạm đèn này đã bị xóa trước đó");
        }

        if (isInApprovalProcess(entity.getStatus())) {
            throw new IllegalStateException(
                    "Không thể xóa nhà trạm đèn đang chờ phê duyệt");
        }

        entity.setStatus(StationStatus.DELETED);
        entity.softDelete();
        lighthouseRepo.save(entity);
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }

        logHistory(entity, "SOFT_DELETE", null, null, toJson(entity));

        pointObjectSyncService.hideFromMapDen(entity);
    }

    // -- APPROVAL --

    @Transactional
    public void submitForApproval(UUID id) {
        LighthouseStation entity = lighthouseRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm đèn không tìm thấy: " + id));

        if (!"DRAFT".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Chỉ có thể gửi phê duyệt khi status = DRAFT");
        }

        entity.setStatus(StationStatus.PENDING_APPROVAL);
        entity.setApprovalStatus(StationApprovalStatus.PENDING);
        entity.setApprovalLevel(ApprovalLevel.LEVEL_1);
        lighthouseRepo.save(entity);

        notificationService.sendApprovalNotificationDen(entity);
    }

    @Transactional
    public LighthouseStationResponse approveL1(UUID id, java.util.UUID approverId) {
        LighthouseStation entity = lighthouseRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm đèn không tìm thấy: " + id));

        if (entity.getStatus() != StationStatus.PENDING_APPROVAL) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L1");
        }

        String creatorId = resolveCreatedBy(entity);
        if (creatorId != null && creatorId.equals(approverId)) {
            throw new IllegalStateException(
                    "Bạn không thể phê duyệt bản do chính mình gửi");
        }

        entity.setStatus(StationStatus.APPROVED_L1);
        entity.setApprovalStatus(StationApprovalStatus.APPROVED_L1);
        entity.setApprovedBy(approverId != null ? approverId.toString() : null);
        entity.setApprovedDate(LocalDateTime.now());
        lighthouseRepo.save(entity);

        logHistory(entity, "APPROVE_L1", null, null, null);
        notificationService.sendL2ApprovalNotificationDen(entity);

        return toResponse(entity);
    }

    @Transactional
    public LighthouseStationResponse approveL2(UUID id, java.util.UUID approverId) {
        LighthouseStation entity = lighthouseRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm đèn không tìm thấy: " + id));

        if (entity.getStatus() != StationStatus.APPROVED_L1) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L2");
        }

        entity.setStatus(StationStatus.PUBLISHED);
        entity.setApprovalStatus(StationApprovalStatus.APPROVED_L1);
        entity.setApprovedBy(approverId != null ? approverId.toString() : null);
        entity.setApprovedDate(LocalDateTime.now());
        lighthouseRepo.save(entity);

        logHistory(entity, "APPROVE_L2", null, null, null);

        pointObjectSyncService.syncToMapDen(entity);

        return toResponse(entity);
    }

    @Transactional
    public LighthouseStationResponse reject(UUID id, String rejectReason, java.util.UUID approverId) {
        LighthouseStation entity = lighthouseRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm đèn không tìm thấy: " + id));

        if (rejectReason == null || rejectReason.length() < 10) {
            throw new IllegalArgumentException(
                    "Lý do từ chối phải có ít nhất 10 ký tự");
        }

        entity.setStatus(StationStatus.DRAFT);
        entity.setApprovalStatus(StationApprovalStatus.REJECTED);
        entity.setRejectionReason(rejectReason);
        lighthouseRepo.save(entity);

        logHistory(entity, "REJECT", null, null, rejectReason);
        notificationService.sendRejectionNotificationDen(entity, rejectReason);

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
                    "Ngay bao tri gan nhat khong duoc lon hon ngay hien tai");
        }
        if (last != null && next != null && next.isBefore(last)) {
            throw new IllegalArgumentException(
                    "Ngay bao tri ke tiep khong duoc nho hon ngay bao tri gan nhat");
        }
    }

    private void logHistory(LighthouseStation entity,
                            String action, String fields, String previousJson, String newJson) {
        StationHistory entry = StationHistory.builder()
                .stationType("DEN")
                .entityId(entity.getId())
                .actionType(action)
                .changedField(fields)
                .previousValue(previousJson)
                .newValue(newJson != null ? newJson : ("REJECT".equals(action) ? "REJECTED" : null))
                .changedBy(resolveCurrentUserId())
                .changedAt(LocalDateTime.now())
                .reason("REJECT".equals(action) ? newJson : null)
                .build();
        historyRepo.save(entry);
    }

    private LighthouseStationResponse toResponse(LighthouseStation entity) {
        LighthouseStationResponse.LighthouseStationResponseBuilder builder = LighthouseStationResponse.builder()
                .id(entity.getId())
                .code(entity.getCode())
                .name(entity.getName())
                .type(entity.getType())
                .lightRange(entity.getLightRange())
                .lightColor(entity.getLightColor())
                .lightCharacteristic(entity.getLightCharacteristic())
                .range(entity.getRange())
                .description(entity.getDescription())
                .unitId(entity.getUnitId())
                .lastMaintenanceDate(entity.getLastMaintenanceDate())
                .nextMaintenanceDate(entity.getNextMaintenanceDate())
                .isActive(entity.getIsActive())
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .approvalStatus(entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : null)
                .approvalLevel(entity.getApprovalLevel())
                .approvedBy(entity.getApprovedBy() != null ? java.util.UUID.fromString(entity.getApprovedBy()) : null)
                .approvedDate(entity.getApprovedDate())
                .rejectionReason(entity.getRejectionReason())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt());

        if (entity.getSpatialId() != null) {
            builder.spatialId(entity.getSpatialId());
            gisSpatialObjectService.findById(entity.getSpatialId()).ifPresent(spatialObj -> {
                builder.geometryType(spatialObj.getGeometryType());
                builder.coordinates(spatialObj.getCoordinates());
                
                String coords = spatialObj.getCoordinates();
                if (coords != null && coords.startsWith("POINT(")) {
                    try {
                        String clean = coords.replace("POINT", "").replace("(", "").replace(")", "").trim();
                        String[] parts = clean.split("\\s+");
                        if (parts.length == 2) {
                            builder.longitude(Double.parseDouble(parts[0]));
                            builder.latitude(Double.parseDouble(parts[1]));
                        }
                    } catch (Exception ignored) {}
                }
            });
        }
        return builder.build();
    }

        private boolean isApprovedStatus(Object status) {
        if (status == null) return false;
        String name = status instanceof Enum ? ((Enum<?>) status).name() : status.toString();
        return "APPROVED_L1".equals(name) || "PUBLISHED".equals(name);
    }
    
    // Fallback signature to prevent compilation errors
    private boolean isApprovedStatus(StationStatus status) {
        return status == StationStatus.APPROVED_L1 || status == StationStatus.PUBLISHED;
    }

    private boolean isInApprovalProcess(Object status) {
        if (status == null) return false;
        String name = status instanceof Enum ? ((Enum<?>) status).name() : status.toString();
        return "PENDING_APPROVAL".equals(name) || "APPROVED_L1".equals(name) || "APPROVED_L2".equals(name);
    }
    
    private boolean isInApprovalProcess(StationStatus status) {
        return status == StationStatus.PENDING_APPROVAL || status == StationStatus.APPROVED_L1;
    }

    private java.util.UUID getCurrentUserUnitId() {
        return null;
    }

    private Long resolveCurrentUserId() {
        return 1L;
    }

    private String resolveCreatedBy(LighthouseStation entity) {
        return entity.getApprovedBy();
    }

    // -- JSON Comparison --

    private String toJson(LighthouseStation entity) {
        try {
            return objectMapper.writeValueAsString(toResponse(entity));
        } catch (Exception e) {
            return "{}";
        }
    }

    private boolean compareJsonNodes(String json1, String json2) {
        try {
            com.fasterxml.jackson.databind.JsonNode node1 = objectMapper.readTree(json1);
            com.fasterxml.jackson.databind.JsonNode node2 = objectMapper.readTree(json2);
            return node1.equals(node2);
        } catch (Exception e) {
            return true;
        }
    }

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

