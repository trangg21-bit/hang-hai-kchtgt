package com.hanghai.kchtg.beacon.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.beacon.dto.beacon_light.BeaconLightResponse;
import com.hanghai.kchtg.beacon.dto.beacon_light.CreateBeaconLightRequest;
import com.hanghai.kchtg.beacon.dto.beacon_light.UpdateBeaconLightRequest;
import com.hanghai.kchtg.beacon.entity.*;
import com.hanghai.kchtg.beacon.repository.BeaconHistoryRepository;
import com.hanghai.kchtg.beacon.repository.BeaconLightRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.orgunit.repository.OrgUnitRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;

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
    private final OrgUnitRepository orgUnitRepo;

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
            String name, String code, BeaconLightType type, BeaconStatus status) {
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
            String name, String code, BeaconLightType type, BeaconStatus status,
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

        validateCoordinates(request.getLongitude(), request.getLatitude());
        validateMaintenanceDates(request.getLastMaintenanceDate(), request.getNextMaintenanceDate());

        BeaconLight entity = BeaconLight.builder()
                .code(request.getCode())
                .name(request.getName())
                .type(request.getType())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .lightRange(request.getLightRange())
                .lightColor(request.getLightColor())
                .lightCharacteristic(request.getLightCharacteristic())
                .range(request.getRange())
                .description(request.getDescription())
                .unitId(request.getUnitId())
                .lastMaintenanceDate(request.getLastMaintenanceDate())
                .nextMaintenanceDate(request.getNextMaintenanceDate())
                .isActive(request.getIsActive())
                .hinhDang(request.getHinhDang())
                .ketCau(request.getKetCau())
                .chieuCaoThapDen(request.getChieuCaoThapDen())
                .chieuCaoTamSang(request.getChieuCaoTamSang())
                .tamHieuLucDiaLy(request.getTamHieuLucDiaLy())
                .chungLoaiDenDuPhong(request.getChungLoaiDenDuPhong())
                .nguonCungCapNangLuongChoDen(request.getNguonCungCapNangLuongChoDen())
                .soLuongNhanSuBoTri(request.getSoLuongNhanSuBoTri())
                .dienTichSuDungTram(request.getDienTichSuDungTram())
                .status(BeaconStatus.DRAFT)
                .approvalLevel(1)
                .approvalStatus(BeaconApprovalStatus.PENDING)
                .build();

        if (entity.getUnitId() == null) {
            entity.setUnitId(getCurrentUserUnitId());
        }

        if ("submit".equals(request.getAction())) {
            entity.setStatus(BeaconStatus.PENDING_APPROVAL);
            entity.setApprovalLevel(1);
        }

        entity = beaconLightRepo.save(entity);

        // Sync GIS spatial object
        String wkt = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                null,
                entity.getName(),
                "DENBIEN_" + entity.getCode(),
                com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT,
                com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_LIGHTHOUSE,
                wkt, entity.getId(),
                com.hanghai.kchtg.gis.search.dto.KchtType.DENBIEN
        );
        entity.setKhongGianId(spatialObj.getId());
        entity = beaconLightRepo.save(entity);

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

        if (entity.getStatus() == BeaconStatus.DELETED) {
            throw new EntityNotFoundException("Đèn biển đã bị xóa");
        }

        String oldJson = toJson(entity);

        // Apply mutable fields only
        if (request.getName() != null) entity.setName(request.getName());

        // Handle type field update conditionally (BR-069-02)
        if (request.getType() != null && request.getType() != entity.getType()) {
            if (entity.getStatus() == BeaconStatus.APPROVED_L2 || entity.getStatus() == BeaconStatus.PUBLISHED) {
                throw new IllegalArgumentException("Loại đèn biển không thể thay đổi khi đèn biển đã được phê duyệt.");
            }
            entity.setType(request.getType());
        }

        // Handle latitude/longitude updates
        Double currentLon = null;
        Double currentLat = null;
        if (entity.getKhongGianId() != null) {
            Optional<com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject> spatialObjOpt = gisSpatialObjectService.findById(entity.getKhongGianId());
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
        Double finalLon = request.getLongitude() != null ? request.getLongitude() : currentLon;
        Double finalLat = request.getLatitude() != null ? request.getLatitude() : currentLat;
        String wkt = null;
        if (finalLon != null && finalLat != null) {
            validateCoordinates(finalLon, finalLat);
            wkt = "POINT(" + finalLon + " " + finalLat + ")";
        }

        if (request.getLightColor() != null) entity.setLightColor(request.getLightColor());
        if (request.getLightCharacteristic() != null) {
            entity.setLightCharacteristic(request.getLightCharacteristic());
        }
        // BUG FIX #2: Apply lightRange on update
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

        if (request.getHinhDang() != null) entity.setHinhDang(request.getHinhDang());
        if (request.getKetCau() != null) entity.setKetCau(request.getKetCau());
        if (request.getChieuCaoThapDen() != null) entity.setChieuCaoThapDen(request.getChieuCaoThapDen());
        if (request.getChieuCaoTamSang() != null) entity.setChieuCaoTamSang(request.getChieuCaoTamSang());
        if (request.getTamHieuLucDiaLy() != null) entity.setTamHieuLucDiaLy(request.getTamHieuLucDiaLy());
        if (request.getChungLoaiDenDuPhong() != null) entity.setChungLoaiDenDuPhong(request.getChungLoaiDenDuPhong());
        if (request.getNguonCungCapNangLuongChoDen() != null) entity.setNguonCungCapNangLuongChoDen(request.getNguonCungCapNangLuongChoDen());
        if (request.getSoLuongNhanSuBoTri() != null) entity.setSoLuongNhanSuBoTri(request.getSoLuongNhanSuBoTri());
        if (request.getDienTichSuDungTram() != null) entity.setDienTichSuDungTram(request.getDienTichSuDungTram());

        // Status revert logic for approved states
        if (isApprovedStatus(entity.getStatus())) {
            entity.setStatus(BeaconStatus.DRAFT);
            entity.setApprovalStatus(BeaconApprovalStatus.PENDING);
            entity.setApprovalLevel(1);
        }

        entity = beaconLightRepo.save(entity);

        // Sync GIS spatial object
        if (wkt != null) {
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    entity.getKhongGianId(),
                    entity.getName(),
                    "DENBIEN_" + entity.getCode(),
                    com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT,
                    com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_LIGHTHOUSE,
                    wkt, entity.getId(),
                    com.hanghai.kchtg.gis.search.dto.KchtType.DENBIEN
            );
            if (entity.getKhongGianId() == null) {
                entity.setKhongGianId(spatialObj.getId());
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

        if (entity.getStatus() == BeaconStatus.DELETED) {
            throw new IllegalArgumentException("Đèn biển này đã bị xóa trước đó");
        }

        if (isInApprovalProcess(entity.getStatus())) {
            throw new IllegalStateException(
                    "Không thể xóa đèn biển đang chờ phê duyệt");
        }

        entity.setStatus(BeaconStatus.DELETED);
        entity.softDelete();
        beaconLightRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.SOFT_DELETE, null, null, toJson(entity));

        if (entity.getKhongGianId() != null) {
            gisSpatialObjectService.delete(entity.getKhongGianId());
        }
    }

    // -- APPROVAL --

    @Transactional
    public void submitForApproval(UUID id) {
        BeaconLight entity = beaconLightRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));

        if (entity.getStatus() != BeaconStatus.DRAFT) {
            throw new IllegalStateException(
                    "Chỉ có thể gửi phê duyệt khi status = DRAFT");
        }

        entity.setStatus(BeaconStatus.PENDING_APPROVAL);
        entity.setApprovalStatus(BeaconApprovalStatus.PENDING);
        entity.setApprovalLevel(1);
        beaconLightRepo.save(entity);

        notificationService.sendApprovalNotification(entity);
    }

    @Transactional
    public BeaconLightResponse approveL1(UUID id, String approverId) {
        BeaconLight entity = beaconLightRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));

        if (entity.getStatus() != BeaconStatus.PENDING_APPROVAL) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L1");
        }

        String creatorId = resolveCreatedBy(entity);
        if (creatorId != null && creatorId.equals(approverId)) {
            throw new IllegalStateException(
                    "Bạn không thể phê duyệt bản do chính mình gửi");
        }

        entity.setStatus(BeaconStatus.APPROVED_L1);
        entity.setApprovalStatus(BeaconApprovalStatus.APPROVED);
        entity.setApprovedBy(approverId);
        entity.setApprovedDate(LocalDateTime.now());
        beaconLightRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.APPROVE_L1, null, null, null);
        notificationService.sendL2ApprovalNotification(entity);

        return toResponse(entity);
    }

    @Transactional
    public BeaconLightResponse approveL2(UUID id, String approverId) {
        BeaconLight entity = beaconLightRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));

        if (entity.getStatus() != BeaconStatus.APPROVED_L1) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L2");
        }

        entity.setStatus(BeaconStatus.PUBLISHED);
        entity.setApprovalStatus(BeaconApprovalStatus.APPROVED);
        entity.setApprovedBy(approverId);
        entity.setApprovedDate(LocalDateTime.now());
        beaconLightRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.APPROVE_L2, null, null, null);

        return toResponse(entity);
    }

    @Transactional
    public BeaconLightResponse reject(UUID id, String rejectReason, String approverId) {
        BeaconLight entity = beaconLightRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));

        if (rejectReason == null || rejectReason.length() < 10) {
            throw new IllegalArgumentException(
                    "Lý do từ chối phải có ít nhất 10 ký tự");
        }

        entity.setStatus(BeaconStatus.DRAFT);
        entity.setApprovalStatus(BeaconApprovalStatus.REJECTED);
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
                .changedField(fields)
                .previousValue(previousJson)
                .newValue(newJson != null ? newJson : (action == BeaconHistoryActionType.REJECT ? "REJECTED" : null))
                .changedBy(resolveCurrentUserId())
                .changedAt(LocalDateTime.now())
                .reason(action == BeaconHistoryActionType.REJECT ? newJson : null)
                .build();
        historyRepo.save(entry);
    }

    private BeaconLightResponse toResponse(BeaconLight entity) {
        String unitName = null;
        if (entity.getUnitId() != null) {
            unitName = orgUnitRepo.findById(entity.getUnitId())
                    .map(unit -> unit.getName())
                    .orElse(null);
        }

        Double latitude = null;
        Double longitude = null;
        if (entity.getKhongGianId() != null) {
            Optional<com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject> spatialObjOpt = gisSpatialObjectService.findById(entity.getKhongGianId());
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
                .latitude(latitude)
                .longitude(longitude)
                .lightRange(entity.getLightRange())
                .lightColor(entity.getLightColor())
                .lightCharacteristic(entity.getLightCharacteristic())
                .range(entity.getRange())
                .description(entity.getDescription())
                .unitId(entity.getUnitId())
                .unitName(unitName)
                .lastMaintenanceDate(entity.getLastMaintenanceDate())
                .nextMaintenanceDate(entity.getNextMaintenanceDate())
                .isActive(entity.getIsActive())
                .status(entity.getStatus())
                .approvalStatus(entity.getApprovalStatus())
                .approvalLevel(entity.getApprovalLevel())
                .approvedBy(entity.getApprovedBy())
                .approvedDate(entity.getApprovedDate())
                .rejectionReason(entity.getRejectionReason())
                .hinhDang(entity.getHinhDang())
                .ketCau(entity.getKetCau())
                .chieuCaoThapDen(entity.getChieuCaoThapDen())
                .chieuCaoTamSang(entity.getChieuCaoTamSang())
                .tamHieuLucDiaLy(entity.getTamHieuLucDiaLy())
                .chungLoaiDenDuPhong(entity.getChungLoaiDenDuPhong())
                .nguonCungCapNangLuongChoDen(entity.getNguonCungCapNangLuongChoDen())
                .soLuongNhanSuBoTri(entity.getSoLuongNhanSuBoTri())
                .dienTichSuDungTram(entity.getDienTichSuDungTram())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }

    private boolean isApprovedStatus(BeaconStatus status) {
        return status == BeaconStatus.APPROVED_L1
                || status == BeaconStatus.APPROVED_L2
                || status == BeaconStatus.PUBLISHED;
    }

    private boolean isInApprovalProcess(BeaconStatus status) {
        return status == BeaconStatus.PENDING_APPROVAL
                || status == BeaconStatus.APPROVED_L1
                || status == BeaconStatus.APPROVED_L2;
    }

    private java.util.UUID getCurrentUserUnitId() {
        return null;
    }

    private Long resolveCurrentUserId() {
        return 1L;
    }

    private String resolveCreatedBy(BeaconLight entity) {
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
