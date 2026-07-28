package com.hanghai.kchtg.station.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.station.dto.buoy.BuoyStationResponse;
import com.hanghai.kchtg.station.dto.buoy.CreateBuoyStationRequest;
import com.hanghai.kchtg.station.dto.buoy.UpdateBuoyStationRequest;
import com.hanghai.kchtg.station.entity.BuoyStation;
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

/**
 * Service cho CRUD + quy trinh phe duyet nha tram phao (F-080 den F-085).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BuoyStationService {

    private final BuoyStationRepository phaoRepo;
    private final LighthouseStationRepository denRepo;
    private final StationHistoryRepository historyRepo;
    private final PointObjectSyncService pointObjectSyncService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    // -- READ --

    public List<BuoyStationResponse> findAll() {
        return phaoRepo.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    public BuoyStationResponse findById(UUID id) {
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));
        return toResponse(entity);
    }

    public List<BuoyStationResponse> search(
            String name, String code, String type, String status) {
        return phaoRepo.searchFiltered(name, code, type, status).stream()
                .map(this::toResponse)
                .toList();
    }

    // -- CREATE --

    @Transactional
    public BuoyStationResponse create(CreateBuoyStationRequest request) {
        if (phaoRepo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã nhà trạm phao tiêu đã tồn tại: " + request.getCode());
        }

        validateCoordinates(request.getLongitude(), request.getLatitude());
        validateInspectionDates(request.getLastInspectionDate(), request.getNextInspectionDate());

        BuoyStation entity = BuoyStation.builder()
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
                .status(StationStatus.DRAFT)
                .approvalStatus(StationApprovalStatus.PENDING)
                .build();

        if (entity.getUnitId() == null) {
            entity.setUnitId(getCurrentUserUnitId());
        }

        if ("submit".equals(request.getAction())) {
            entity.setStatus(com.hanghai.kchtg.station.entity.StationStatus.PENDING_APPROVAL);
            entity.setApprovalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_1);
        }

        entity = phaoRepo.save(entity);

        String coordinates = request.getToaDo();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (coordinates != null && !coordinates.trim().isEmpty()) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
            GisSpatialObjectType objType = GisSpatialObjectType.POINT_BUOY;
            UUID refId = entity.getId();
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    entity.getName(),
                    "PHAOTIEU_" + entity.getCode(),
                    geomType,
                    objType,
                    coordinates,
                    refId,
                    InfrastructureType.BUOY
            );
            entity.setSpatialId(spatialObj.getId());
            if (geomType == GisGeometryType.POINT) {
                try {
                    String clean = coordinates.replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                    }
                } catch (Exception e) {
                    // ignore
                }
            }
            entity = phaoRepo.save(entity);
        }

        logHistory(entity, "CREATE", null, null, toJson(entity));
        notificationService.sendApprovalNotificationPhao(entity);

        return toResponse(entity);
    }

    // -- UPDATE --

    @Transactional
    public BuoyStationResponse update(UUID id, UpdateBuoyStationRequest request) {
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));

        if (StationStatus.DELETED.equals(entity.getStatus())) {
            throw new EntityNotFoundException("Nhà trạm phao đã bị xóa");
        }

        String oldJson = toJson(entity);

        if (request.getName() != null) entity.setName(request.getName());

        if (request.getType() != null && !request.getType().equals(entity.getType())) {
            if (isApprovedStatus(entity.getStatus())) {
                throw new IllegalArgumentException(
                        "Loại nhà trạm phao không thể thay đổi khi đã được phê duyệt.");
            }
            entity.setType(request.getType());
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

        if (request.getLongitude() != null && request.getLatitude() != null) {
            validateCoordinates(request.getLongitude(), request.getLatitude());
        }

        if (isApprovedStatus(entity.getStatus())) {
            entity.setStatus(StationStatus.DRAFT);
            entity.setApprovalStatus(StationApprovalStatus.PENDING);
            entity.setApprovalLevel(ApprovalLevel.LEVEL_1);
        }

        phaoRepo.save(entity);

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (coordinates != null && !coordinates.trim().isEmpty()) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
            GisSpatialObjectType objType = GisSpatialObjectType.POINT_BUOY;
            UUID refId = entity.getId();
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    entity.getSpatialId(),
                    entity.getName(),
                    "PHAOTIEU_" + entity.getCode(),
                    geomType,
                    objType,
                    coordinates,
                    refId,
                    InfrastructureType.BUOY
            );
            entity.setSpatialId(spatialObj.getId());
        }

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
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));

        if ("DELETED".equals(entity.getStatus())) {
            throw new IllegalArgumentException("Nhà trạm phao này đã bị xóa trước đó");
        }

        if (isInApprovalProcess(entity.getStatus())) {
            throw new IllegalStateException(
                    "Không thể xóa nhà trạm phao đang chờ phê duyệt");
        }

        entity.setStatus(StationStatus.DELETED);
        entity.softDelete(com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId());
        phaoRepo.save(entity);
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }

        logHistory(entity, "SOFT_DELETE", null, null, toJson(entity));

        pointObjectSyncService.hideFromMapPhao(entity);
    }

    // -- APPROVAL --

    @Transactional
    public void submitForApproval(UUID id) {
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));

        if (!StationStatus.DRAFT.equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Chỉ có thể gửi phê duyệt khi status = DRAFT");
        }

        entity.setStatus(com.hanghai.kchtg.station.entity.StationStatus.PENDING_APPROVAL);
        entity.setApprovalStatus(com.hanghai.kchtg.station.entity.StationApprovalStatus.PENDING);
        entity.setApprovalLevel(com.hanghai.kchtg.common.enums.ApprovalLevel.LEVEL_1);
        phaoRepo.save(entity);

        notificationService.sendApprovalNotificationPhao(entity);
    }

    @Transactional
    public BuoyStationResponse approveL1(UUID id, java.util.UUID approverId) {
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));

        if (entity.getStatus() != com.hanghai.kchtg.station.entity.StationStatus.PENDING_APPROVAL) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L1");
        }

        String creatorId = resolveCreatedBy(entity);
        if (creatorId != null && creatorId.equals(approverId != null ? approverId.toString() : null)) {
            throw new IllegalStateException(
                    "Bạn không thể phê duyệt bản do chính mình gửi");
        }

        entity.setStatus(com.hanghai.kchtg.station.entity.StationStatus.APPROVED_L1);
        entity.setApprovalStatus(com.hanghai.kchtg.station.entity.StationApprovalStatus.APPROVED_L1);
        entity.setApprovedBy(approverId != null ? approverId.toString() : null);
        entity.setApprovedDate(LocalDateTime.now());
        phaoRepo.save(entity);

        logHistory(entity, "APPROVE_L1", null, null, null);
        notificationService.sendL2ApprovalNotificationPhao(entity);

        return toResponse(entity);
    }

    @Transactional
    public BuoyStationResponse approveL2(UUID id, java.util.UUID approverId) {
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));

        if (entity.getStatus() != com.hanghai.kchtg.station.entity.StationStatus.APPROVED_L1) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L2");
        }

        entity.setStatus(com.hanghai.kchtg.station.entity.StationStatus.PUBLISHED);
        entity.setApprovalStatus(com.hanghai.kchtg.station.entity.StationApprovalStatus.APPROVED_L1);
        entity.setApprovedBy(approverId != null ? approverId.toString() : null);
        entity.setApprovedDate(LocalDateTime.now());
        phaoRepo.save(entity);

        logHistory(entity, "APPROVE_L2", null, null, null);

        pointObjectSyncService.syncToMapPhao(entity);

        return toResponse(entity);
    }

    @Transactional
    public BuoyStationResponse reject(UUID id, String rejectReason, java.util.UUID approverId) {
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));

        if (rejectReason == null || rejectReason.length() < 10) {
            throw new IllegalArgumentException(
                    "Lý do từ chối phải có ít nhất 10 ký tự");
        }

        entity.setStatus(com.hanghai.kchtg.station.entity.StationStatus.DRAFT);
        entity.setApprovalStatus(com.hanghai.kchtg.station.entity.StationApprovalStatus.REJECTED);
        entity.setRejectionReason(rejectReason);
        phaoRepo.save(entity);

        logHistory(entity, "REJECT", null, null, rejectReason);
        notificationService.sendRejectionNotificationPhao(entity, rejectReason);

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

    private void logHistory(BuoyStation entity,
                            String action, String fields, String previousJson, String newJson) {
        StationHistory entry = StationHistory.builder()
                .stationType("PHAO")
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

    private BuoyStationResponse toResponse(BuoyStation entity) {
        BuoyStationResponse.BuoyStationResponseBuilder builder = BuoyStationResponse.builder()
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
                .lastInspectionDate(entity.getLastInspectionDate())
                .nextInspectionDate(entity.getNextInspectionDate())
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

        private boolean isInApprovalProcess(Object status) {
        if (status == null) return false;
        String name = status instanceof Enum ? ((Enum<?>) status).name() : status.toString();
        return "PENDING_APPROVAL".equals(name);
    }

    private java.util.UUID getCurrentUserUnitId() {
        return null;
    }

    private Long resolveCurrentUserId() {
        return 1L;
    }

    private String resolveCreatedBy(BuoyStation entity) {
        return entity.getApprovedBy();
    }

    // -- JSON Comparison --

    private String toJson(BuoyStation entity) {
        try {
            return objectMapper.writeValueAsString(toResponse(entity));
        } catch (Exception e) {
            return "{}";
        }
    }

    private boolean compareJsonNodes(String json1, String json2) {
        try {
            JsonNode node1 = objectMapper.readTree(json1);
            JsonNode node2 = objectMapper.readTree(json2);
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




