package com.hanghai.kchtg.station.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.station.dto.buoy.BuoyStationResponse;
import com.hanghai.kchtg.station.dto.buoy.CreateBuoyStationRequest;
import com.hanghai.kchtg.station.dto.buoy.UpdateBuoyStationRequest;
import com.hanghai.kchtg.station.entity.BuoyStation;
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
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
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

        entity = phaoRepo.save(entity);

        String toaDo = request.getToaDo();
        if ((toaDo == null || toaDo.trim().isEmpty()) && request.getLongitude() != null && request.getLatitude() != null) {
            toaDo = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (toaDo != null && !toaDo.trim().isEmpty()) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_BUOY;
            UUID refId = entity.getId();
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    entity.getName(),
                    "PHAOTIEU_" + entity.getCode(),
                    geomType,
                    objType,
                    toaDo,
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.PHAOTIEU
            );
            entity.setKhongGianId(spatialObj.getId());
            if (geomType == com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT) {
                try {
                    String clean = toaDo.replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        entity.setLongitude(Double.parseDouble(parts[0]));
                        entity.setLatitude(Double.parseDouble(parts[1]));
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

        if ("DELETED".equals(entity.getStatus())) {
            throw new EntityNotFoundException("Nhà trạm phao đã bị xóa");
        }

        String oldJson = toJson(entity);

        // Apply mutable fields only
        if (request.getName() != null) entity.setName(request.getName());

        // Handle type field update conditionally
        if (request.getType() != null && !request.getType().equals(entity.getType())) {
            if (isApprovedStatus(entity.getStatus())) {
                throw new IllegalArgumentException(
                        "Loại nhà trạm phao không thể thay đổi khi đã được phê duyệt.");
            }
            entity.setType(request.getType());
        }

        // Handle latitude/longitude updates
        if (request.getLongitude() != null || request.getLatitude() != null) {
            Double finalLon = request.getLongitude() != null ? request.getLongitude() : entity.getLongitude();
            Double finalLat = request.getLatitude() != null ? request.getLatitude() : entity.getLatitude();
            validateCoordinates(finalLon, finalLat);
            entity.setLongitude(finalLon);
            entity.setLatitude(finalLat);
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

        // Status revert logic for approved states
        if (isApprovedStatus(entity.getStatus())) {
            entity.setStatus("DRAFT");
            entity.setApprovalStatus("PENDING");
            entity.setApprovalLevel(1);
        }

        phaoRepo.save(entity);

        // Sync to GisSpatialObject
        String toaDo = request.getToaDo();
        if ((toaDo == null || toaDo.trim().isEmpty()) && request.getLongitude() != null && request.getLatitude() != null) {
            toaDo = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (toaDo != null && !toaDo.trim().isEmpty()) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_BUOY;
            UUID refId = entity.getId();
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    entity.getKhongGianId(),
                    entity.getName(),
                    "PHAOTIEU_" + entity.getCode(),
                    geomType,
                    objType,
                    toaDo,
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.PHAOTIEU
            );
            entity.setKhongGianId(spatialObj.getId());
            if (geomType == com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT) {
                try {
                    String clean = toaDo.replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        entity.setLongitude(Double.parseDouble(parts[0]));
                        entity.setLatitude(Double.parseDouble(parts[1]));
                    }
                } catch (Exception e) {
                    // ignore
                }
            }
            phaoRepo.save(entity);
        } else if (entity.getKhongGianId() != null) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getLoaiHinhHoc() != null ? request.getLoaiHinhHoc() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_BUOY;
            gisSpatialObjectService.createOrUpdate(
                    entity.getKhongGianId(),
                    entity.getName(),
                    "PHAOTIEU_" + entity.getCode(),
                    geomType,
                    objType,
                    "POINT(" + entity.getLongitude() + " " + entity.getLatitude() + ")",
                    entity.getId(),
                    com.hanghai.kchtg.gis.search.dto.KchtType.PHAOTIEU
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

        entity.setStatus("DELETED");
        entity.softDelete();
        phaoRepo.save(entity);
        if (entity.getKhongGianId() != null) {
            gisSpatialObjectService.delete(entity.getKhongGianId());
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

        if (!"DRAFT".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Chỉ có thể gửi phê duyệt khi status = DRAFT");
        }

        entity.setStatus("PENDING_APPROVAL");
        entity.setApprovalStatus("PENDING");
        entity.setApprovalLevel(1);
        phaoRepo.save(entity);

        notificationService.sendApprovalNotificationPhao(entity);
    }

    @Transactional
    public BuoyStationResponse approveL1(UUID id, String approverId) {
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));

        if (!"PENDING_APPROVAL".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L1");
        }

        String creatorId = resolveCreatedBy(entity);
        if (creatorId != null && creatorId.equals(approverId)) {
            throw new IllegalStateException(
                    "Bạn không thể phê duyệt bản do chính mình gửi");
        }

        entity.setStatus("APPROVED_L1");
        entity.setApprovalStatus("APPROVED");
        entity.setApprovedBy(approverId);
        entity.setApprovedDate(LocalDateTime.now());
        phaoRepo.save(entity);

        logHistory(entity, "APPROVE_L1", null, null, null);
        notificationService.sendL2ApprovalNotificationPhao(entity);

        return toResponse(entity);
    }

    @Transactional
    public BuoyStationResponse approveL2(UUID id, String approverId) {
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));

        if (!"APPROVED_L1".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L2");
        }

        entity.setStatus("PUBLISHED");
        entity.setApprovalStatus("APPROVED");
        entity.setApprovedBy(approverId);
        entity.setApprovedDate(LocalDateTime.now());
        phaoRepo.save(entity);

        logHistory(entity, "APPROVE_L2", null, null, null);

        pointObjectSyncService.syncToMapPhao(entity);

        return toResponse(entity);
    }

    @Transactional
    public BuoyStationResponse reject(UUID id, String rejectReason, String approverId) {
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));

        if (rejectReason == null || rejectReason.length() < 10) {
            throw new IllegalArgumentException(
                    "Lý do từ chối phải có ít nhất 10 ký tự");
        }

        entity.setStatus("DRAFT");
        entity.setApprovalStatus("REJECTED");
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
                .tramType("PHAO")
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
                .latitude(entity.getLatitude())
                .longitude(entity.getLongitude())
                .color(entity.getColor())
                .shape(entity.getShape())
                .lightCharacteristic(entity.getLightCharacteristic())
                .range(entity.getRange())
                .description(entity.getDescription())
                .unitId(entity.getUnitId())
                .lastInspectionDate(entity.getLastInspectionDate())
                .nextInspectionDate(entity.getNextInspectionDate())
                .isActive(entity.getIsActive())
                .status(entity.getStatus())
                .approvalStatus(entity.getApprovalStatus())
                .approvalLevel(entity.getApprovalLevel())
                .approvedBy(entity.getApprovedBy())
                .approvedDate(entity.getApprovedDate())
                .rejectionReason(entity.getRejectionReason())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt());

        if (entity.getKhongGianId() != null) {
            builder.khongGianId(entity.getKhongGianId());
            gisSpatialObjectService.findById(entity.getKhongGianId()).ifPresent(spatialObj -> {
                builder.loaiHinhHoc(spatialObj.getGeometryType());
                builder.toaDo(spatialObj.getCoordinates());
            });
        }
        return builder.build();
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
