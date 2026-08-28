package com.hanghai.kchtg.station.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.repository.ChangeLogRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.station.dto.buoy.BuoyStationResponse;
import com.hanghai.kchtg.station.dto.buoy.CreateBuoyStationRequest;
import com.hanghai.kchtg.station.dto.buoy.UpdateBuoyStationRequest;
import com.hanghai.kchtg.station.entity.BuoyStation;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.station.entity.StationStatus;
import com.hanghai.kchtg.station.repository.BuoyStationRepository;
import com.hanghai.kchtg.beacon.repository.BuoyRepository;
import com.hanghai.kchtg.station.dto.buoy.StationBuoySummary;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.user.entity.User;
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
    private final PointObjectSyncService pointObjectSyncService;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final ChangeHistoryService changeHistoryService;
    private final ChangeLogRepository changeLogRepository;
    private final PortRepository portRepository;
    private final UserRepository userRepository;
    private final BuoyRepository buoyRepository;

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

    public List<StationBuoySummary> listStationBuoys(UUID id) {
        phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));
        return buoyRepository.findByBuoyStationId(id).stream()
                .map(b -> StationBuoySummary.builder()
                        .id(b.getId() != null ? b.getId().toString() : null)
                        .code(b.getCode())
                        .name(b.getName())
                        .classification(b.getClassification())
                        .classificationBuoy(b.getClassificationBuoy())
                        .classificationMark(b.getClassificationMark())
                        .build())
                .toList();
    }

    public List<BuoyStationResponse> search(
            String name, String code, String type, String status,
            UUID unitId, String province, UUID portId, UUID operatingOrgId) {
        // Frontend gửi status dạng String (DRAFT/PENDING_APPROVAL/APPROVED_L1/PUBLISHED/REJECTED) —
        // convert sang StationStatus enum trước khi bind (cột status là smallint enum, Hibernate từ chối String)
        StationStatus statusEnum = null;
        if (status != null && !status.isBlank()) {
            try {
                statusEnum = StationStatus.valueOf(status.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                // Giá trị không hợp lệ → bỏ lọc trạng thái, tránh lỗi bind
                statusEnum = null;
            }
        }
        return phaoRepo.searchFiltered(name, code, type, statusEnum, unitId, province, portId, operatingOrgId).stream()
                .map(this::toResponse)
                .toList();
    }

    /**
     * Sinh mã nhà trạm phao tiêu tự động theo cảng biển chủ.
     * Format: {portCode}-NTPT{2 số} (mẫu BerthService.generateBerthCode).
     */
    public String generateCode(UUID portId) {
        if (portId != null) {
            portRepository.findById(portId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển"));
        }
        // CSV: mã tự sinh NT-{seq} — đếm toàn bộ nhà trạm (không phụ thuộc prefix cảng)
        int maxNum = 0;
        for (BuoyStation b : phaoRepo.findAll()) {
            if (b.getCode() != null && b.getCode().startsWith("NT-")) {
                try {
                    int n = Integer.parseInt(b.getCode().substring(3));
                    if (n > maxNum) maxNum = n;
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return "NT-" + (maxNum + 1);
    }

    // -- CREATE --

    @Transactional
    public BuoyStationResponse create(CreateBuoyStationRequest request) {
        FieldWriteGuard.validateObject(request);
        if (request.getCode() == null || request.getCode().isBlank()) {
            request.setCode(generateCode(request.getPortId()));
        }
        if (phaoRepo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã nhà trạm phao tiêu đã tồn tại: " + request.getCode());
        }

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
                .operatingOrgId(request.getOperatingOrgId())
                .portId(request.getPortId())
                .waterwayId(request.getWaterwayId())
                .waterwayRouteId(request.getWaterwayRouteId())
                .province(request.getProvince())
                .address(request.getAddress())
                .constructionDate(request.getConstructionDate())
                .totalArea(request.getTotalArea())
                .usableArea(request.getUsableArea())
                .staffCount(request.getStaffCount())
                .lastMaintenanceYear(request.getLastMaintenanceYear())
                .note(request.getNote())
                .objectType(request.getObjectType())
                .icon(request.getIcon())
                .coordinateSystem(request.getCoordinateSystem())
                .displayFormat(request.getDisplayFormat())
                .lastInspectionDate(request.getLastInspectionDate())
                .nextInspectionDate(request.getNextInspectionDate())
                .lastRepairDate(request.getLastRepairDate())
                .condition(request.getCondition())
                .isActive(request.getIsActive())
                .status(StationStatus.DRAFT)
                .approvalStatus(ApprovalStatus.DRAFT)
                .build();

        if (entity.getUnitId() == null) {
            entity.setUnitId(getCurrentUserUnitId());
        }

        if ("submit".equals(request.getAction())) {
            entity.setStatus(StationStatus.PENDING_APPROVAL);
            entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
            entity.setApprovalLevel(ApprovalLevel.LEVEL_1);
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            entity.setSentApprovedBy(currentUserId);
            entity.setSentApprovedDate(LocalDateTime.now());
        } else if ("approved".equals(request.getAction())) {
            // "Lưu và phê duyệt" — duyệt thẳng
            entity.setStatus(StationStatus.PUBLISHED);
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setApprovalLevel(ApprovalLevel.LEVEL_2);
            UUID uid = SecurityUtils.getCurrentUserId();
            entity.setSentApprovedBy(uid);
            entity.setSentApprovedDate(LocalDateTime.now());
            entity.setApprovedBy(uid);
            entity.setApprovedDate(LocalDateTime.now());
            entity.setLevel1ApprovedBy(uid);
            entity.setLevel1ApprovedDate(LocalDateTime.now());
            entity.setLevel2ApprovedBy(uid);
            entity.setLevel2ApprovedDate(LocalDateTime.now());
        }

        entity = phaoRepo.save(entity);

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null
                && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (coordinates != null && !coordinates.trim().isEmpty()) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType()
                    : GisGeometryType.POINT;
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
                    InfrastructureType.BUOY);
            entity.setSpatialId(spatialObj.getId());
            entity = phaoRepo.save(entity);
        }

        changeHistoryService.recordChanges("BuoyStation", entity.getId().toString(),
                entity.getCreatedBy() != null ? entity.getCreatedBy().toString() : "system",
                new BuoyStation(), entity);
        notificationService.sendApprovalNotificationPhao(entity);

        return toResponse(entity);
    }

    // -- UPDATE --

    @Transactional
    public BuoyStationResponse update(UUID id, UpdateBuoyStationRequest request) {
        FieldWriteGuard.validateObject(request);
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));

        if (StationStatus.DELETED.equals(entity.getStatus())) {
            throw new EntityNotFoundException("Nhà trạm phao đã bị xóa");
        }

        BuoyStation snapshot = BuoyStation.builder()
                .code(entity.getCode()).name(entity.getName()).type(entity.getType())
                .color(entity.getColor()).shape(entity.getShape())
                .lightCharacteristic(entity.getLightCharacteristic()).range(entity.getRange())
                .description(entity.getDescription()).unitId(entity.getUnitId())
                .operatingOrgId(entity.getOperatingOrgId()).portId(entity.getPortId())
                .waterwayId(entity.getWaterwayId()).waterwayRouteId(entity.getWaterwayRouteId())
                .province(entity.getProvince()).address(entity.getAddress())
                .constructionDate(entity.getConstructionDate()).totalArea(entity.getTotalArea())
                .usableArea(entity.getUsableArea()).staffCount(entity.getStaffCount())
                .lastMaintenanceYear(entity.getLastMaintenanceYear()).note(entity.getNote())
                .objectType(entity.getObjectType()).icon(entity.getIcon())
                .coordinateSystem(entity.getCoordinateSystem()).displayFormat(entity.getDisplayFormat())
                .lastInspectionDate(entity.getLastInspectionDate()).nextInspectionDate(entity.getNextInspectionDate())
                .lastRepairDate(entity.getLastRepairDate())
                .condition(entity.getCondition()).isActive(entity.getIsActive()).status(entity.getStatus())
                .approvalStatus(entity.getApprovalStatus()).approvalLevel(entity.getApprovalLevel())
                .spatialId(entity.getSpatialId()).provinceId(entity.getProvinceId())
                .rejectionReason(entity.getRejectionReason())
                .build();

        if (request.getName() != null) entity.setName(request.getName());
        if (request.getType() != null) {
            if (isApprovedStatus(entity.getStatus())) {
                throw new IllegalArgumentException("Loại nhà trạm phao không thể thay đổi khi đã được phê duyệt.");
            }
            entity.setType(request.getType());
        }
        if (request.getColor() != null) entity.setColor(request.getColor());
        if (request.getShape() != null) entity.setShape(request.getShape());
        if (request.getLightCharacteristic() != null) entity.setLightCharacteristic(request.getLightCharacteristic());
        if (request.getRange() != null) entity.setRange(request.getRange());
        if (request.getDescription() != null) entity.setDescription(request.getDescription());
        if (request.getUnitId() != null) entity.setUnitId(request.getUnitId());
        if (request.getOperatingOrgId() != null) entity.setOperatingOrgId(request.getOperatingOrgId());
        if (request.getPortId() != null) entity.setPortId(request.getPortId());
        if (request.getWaterwayId() != null) entity.setWaterwayId(request.getWaterwayId());
        if (request.getWaterwayRouteId() != null) entity.setWaterwayRouteId(request.getWaterwayRouteId());
        if (request.getProvince() != null) entity.setProvince(request.getProvince());
        if (request.getAddress() != null) entity.setAddress(request.getAddress());
        if (request.getConstructionDate() != null) entity.setConstructionDate(request.getConstructionDate());
        if (request.getTotalArea() != null) entity.setTotalArea(request.getTotalArea());
        if (request.getUsableArea() != null) entity.setUsableArea(request.getUsableArea());
        if (request.getStaffCount() != null) entity.setStaffCount(request.getStaffCount());
        if (request.getLastMaintenanceYear() != null) entity.setLastMaintenanceYear(request.getLastMaintenanceYear());
        if (request.getNote() != null) entity.setNote(request.getNote());
        if (request.getObjectType() != null) entity.setObjectType(request.getObjectType());
        if (request.getIcon() != null) entity.setIcon(request.getIcon());
        if (request.getCoordinateSystem() != null) entity.setCoordinateSystem(request.getCoordinateSystem());
        if (request.getDisplayFormat() != null) entity.setDisplayFormat(request.getDisplayFormat());
        if (request.getLastInspectionDate() != null) entity.setLastInspectionDate(request.getLastInspectionDate());
        if (request.getNextInspectionDate() != null) entity.setNextInspectionDate(request.getNextInspectionDate());
        if (request.getLastRepairDate() != null) entity.setLastRepairDate(request.getLastRepairDate());
        if (request.getCondition() != null) entity.setCondition(request.getCondition());
        if (request.getIsActive() != null) entity.setIsActive(request.getIsActive());

        phaoRepo.save(entity);

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null
                && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (coordinates != null && !coordinates.trim().isEmpty()) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType()
                    : GisGeometryType.POINT;
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
                    InfrastructureType.BUOY);
            entity.setSpatialId(spatialObj.getId());
        }

        changeHistoryService.recordChanges("BuoyStation", entity.getId().toString(),
                SecurityUtils.getCurrentUserId() != null ? SecurityUtils.getCurrentUserId().toString() : "system",
                snapshot, entity);

        return toResponse(entity);
    }

    // -- DELETE (Soft) --

    @Transactional
    public void delete(UUID id) {
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));

        if (StationStatus.DELETED.equals(entity.getStatus())) {
            throw new IllegalArgumentException("Nhà trạm phao này đã bị xóa trước đó");
        }

        if (isInApprovalProcess(entity.getStatus())) {
            throw new IllegalStateException(
                    "Không thể xóa nhà trạm phao đang chờ phê duyệt");
        }

        entity.setStatus(StationStatus.DELETED);
        entity.softDelete(SecurityUtils.getCurrentUserId());
        phaoRepo.save(entity);
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }

        changeHistoryService.insertChangeRecord("BuoyStation", entity.getId(), "Trạng thái", null, "Đã xóa",
                SecurityUtils.getCurrentUserId() != null ? SecurityUtils.getCurrentUserId().toString() : "system");

        pointObjectSyncService.hideFromMapPhao(entity);
    }

    // -- APPROVAL --

    @Transactional
    public void submitForApproval(UUID id) {
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));

        if (!StationStatus.DRAFT.equals(entity.getStatus()) && !StationStatus.REJECTED.equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Chỉ có thể gửi phê duyệt khi status = DRAFT hoặc REJECTED");
        }

        entity.setStatus(StationStatus.PENDING_APPROVAL);
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        entity.setApprovalLevel(ApprovalLevel.LEVEL_1);
        UUID currentUserId = SecurityUtils.getCurrentUserId();
        entity.setSentApprovedBy(currentUserId);
        entity.setSentApprovedDate(LocalDateTime.now());
        phaoRepo.save(entity);

        notificationService.sendApprovalNotificationPhao(entity);
    }

    @Transactional
    public BuoyStationResponse approveL1(UUID id, UUID approverId, String content) {
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));

        if (entity.getStatus() != StationStatus.PENDING_APPROVAL) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L1");
        }

        entity.setStatus(StationStatus.APPROVED_L1);
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setApprovedBy(approverId);
        entity.setApprovedDate(LocalDateTime.now());
        entity.setLevel1ApprovedBy(approverId);
        entity.setLevel1ApprovedDate(LocalDateTime.now());
        if (content != null && !content.isBlank()) entity.setLevel1ApprovalContent(content.trim());
        phaoRepo.save(entity);

        notificationService.sendL2ApprovalNotificationPhao(entity);

        return toResponse(entity);
    }

    @Transactional
    public BuoyStationResponse approveL2(UUID id, UUID approverId, String content) {
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));

        if (entity.getStatus() != StationStatus.APPROVED_L1) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L2");
        }

        entity.setStatus(StationStatus.PUBLISHED);
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setApprovedBy(approverId);
        entity.setApprovedDate(LocalDateTime.now());
        entity.setLevel2ApprovedBy(approverId);
        entity.setLevel2ApprovedDate(LocalDateTime.now());
        if (content != null && !content.isBlank()) entity.setLevel2ApprovalContent(content.trim());
        phaoRepo.save(entity);

        pointObjectSyncService.syncToMapPhao(entity);

        return toResponse(entity);
    }

    @Transactional
    public BuoyStationResponse reject(UUID id, String rejectReason, UUID approverId) {
        BuoyStation entity = phaoRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Nhà trạm phao không tìm thấy: " + id));

        if (rejectReason == null || rejectReason.length() < 10) {
            throw new IllegalArgumentException(
                    "Lý do từ chối phải có ít nhất 10 ký tự");
        }

        entity.setStatus(StationStatus.REJECTED);
        entity.setApprovalStatus(ApprovalStatus.REJECTED_LEVEL1);
        entity.setRejectionReason(rejectReason);
        phaoRepo.save(entity);

        notificationService.sendRejectionNotificationPhao(entity, rejectReason);

        return toResponse(entity);
    }

    // -- HELPERS --

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
                .operatingOrgId(entity.getOperatingOrgId())
                .portId(entity.getPortId())
                .waterwayId(entity.getWaterwayId())
                .waterwayRouteId(entity.getWaterwayRouteId())
                .province(entity.getProvince())
                .address(entity.getAddress())
                .constructionDate(entity.getConstructionDate())
                .totalArea(entity.getTotalArea())
                .usableArea(entity.getUsableArea())
                .staffCount(entity.getStaffCount())
                .lastMaintenanceYear(entity.getLastMaintenanceYear())
                .note(entity.getNote())
                .objectType(entity.getObjectType())
                .icon(entity.getIcon())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayFormat(entity.getDisplayFormat())
                .lastInspectionDate(entity.getLastInspectionDate())
                .nextInspectionDate(entity.getNextInspectionDate())
                .lastRepairDate(entity.getLastRepairDate())
                .condition(entity.getCondition())
                .isActive(entity.getIsActive())
                .status(entity.getStatus() != null ? entity.getStatus().name() : null)
                .approvalStatus(entity.getApprovalStatus() != null ? entity.getApprovalStatus().name() : null)
                .approvalLevel(entity.getApprovalLevel())
                .approvedBy(entity.getApprovedBy())
                .approvedDate(entity.getApprovedDate())
                .level1ApprovedBy(entity.getLevel1ApprovedBy())
                .level1ApprovedDate(entity.getLevel1ApprovedDate())
                .level2ApprovedBy(entity.getLevel2ApprovedBy())
                .level2ApprovedDate(entity.getLevel2ApprovedDate())
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
                .rejectionReason(entity.getRejectionReason())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .createdBy(entity.getCreatedBy() != null ? entity.getCreatedBy().toString() : null)
                .createdByName(entity.getCreatedBy() != null ? this.getUserNameById(entity.getCreatedBy()) : null)
                .updatedByName(entity.getUpdatedBy() != null ? this.getUserNameById(entity.getUpdatedBy()) : null)
                .sentApprovedBy(entity.getSentApprovedBy())
                .sentApprovedDate(entity.getSentApprovedDate());

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
                    } catch (Exception ignored) {
                    }
                }
            });
        }
        return builder.build();
    }

    private boolean isApprovedStatus(Object status) {
        if (status == null)
            return false;
        String name = status instanceof Enum ? ((Enum<?>) status).name() : status.toString();
        return "APPROVED_L1".equals(name) || "PUBLISHED".equals(name);
    }

    private boolean isInApprovalProcess(Object status) {
        if (status == null)
            return false;
        String name = status instanceof Enum ? ((Enum<?>) status).name() : status.toString();
        return "PENDING_APPROVAL".equals(name);
    }

    private UUID getCurrentUserUnitId() {
        return null;
    }

    private String getUserNameById(UUID userId) {
        if (userId == null) return null;
        return userRepository.findById(userId)
                .map(User::getFullName)
                .orElse(null);
    }

    // -- JSON Comparison --

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
