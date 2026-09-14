package com.hanghai.kchtg.beacon.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hanghai.kchtg.beacon.dto.BeaconHistoryEntry;
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
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.port.service.PortCacheService;
import com.hanghai.kchtg.user.entity.User;
import com.hanghai.kchtg.user.repository.UserRepository;
import com.hanghai.kchtg.common.util.InfrastructureHistoryUtils;
import org.springframework.jdbc.core.JdbcTemplate;
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
    private final UserResolverService userResolverService;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;
    private final PortCacheService portCacheService;

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
            String name, String code, String type, String primaryLightModel, String status,
            UUID unitId, UUID seaportId, String operator, Integer provinceId,
            Integer operationalStatus, Double stationArea, String approvalStatus, UUID updatedBy,
            String commissionedFrom, String commissionedTo,
            String updatedFrom, String updatedTo) {
        boolean includeAll = unitId == null;
        List<UUID> orgUnitIds = unitId != null
                ? orgUnitScopeService.resolveSubtreeIds(unitId)
                : List.of();
        return beaconStationRepo.searchFiltered(
                name,
                code,
                type,
                primaryLightModel,
                status,
                includeAll,
                orgUnitIds,
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
            String name, String code, String type, String primaryLightModel, String status,
            UUID unitId, UUID seaportId, String operator, Integer provinceId,
            Integer operationalStatus, Double stationArea, String approvalStatus, UUID updatedBy,
            String commissionedFrom, String commissionedTo,
            String updatedFrom, String updatedTo,
            org.springframework.data.domain.Pageable pageable) {
        boolean includeAll = unitId == null;
        List<UUID> orgUnitIds = unitId != null
                ? orgUnitScopeService.resolveSubtreeIds(unitId)
                : List.of();
        return beaconStationRepo.searchFilteredPaged(
                name, code, type, primaryLightModel, status,
                includeAll, orgUnitIds,
                seaportId, operator, provinceId,
                operationalStatus, stationArea, parseApprovalStatus(approvalStatus), updatedBy,
                parseLocalDate(commissionedFrom), parseLocalDate(commissionedTo),
                parseLocalDateTime(updatedFrom), parseLocalDateTime(updatedTo),
                pageable)
                .map(this::toResponse);
    }

    // -- CREATE --

    @Transactional
    public BeaconHistoryEntry toHistoryEntry(InfrastructureHistory h) {
        return toHistoryEntry(h, Collections.emptyMap());
    }

    public BeaconHistoryEntry toHistoryEntry(InfrastructureHistory h, Map<UUID, User> userMap) {
        User u = h.getApprovedBy() != null ? userMap.get(h.getApprovedBy()) : null;
        String userName = u != null
                ? (u.getFullName() != null && !u.getFullName().trim().isEmpty() ? u.getFullName()
                        : (u.getUsername() != null && !u.getUsername().trim().isEmpty() ? u.getUsername() : null))
                : (h.getApprovedBy() != null ? userResolverService.resolveName(h.getApprovedBy()) : null);
        String orgUnitName = null;
        if (u != null) {
            if (u.getOrgUnit() != null && u.getOrgUnit().getName() != null && !u.getOrgUnit().getName().isBlank()) {
                orgUnitName = u.getOrgUnit().getName();
            } else if (u.getDepartment() != null && !u.getDepartment().isBlank()) {
                orgUnitName = u.getDepartment();
            } else {
                orgUnitName = "Cục Hàng hải Việt Nam";
            }
        }
        if (orgUnitName == null) {
            orgUnitName = "Cục Hàng hải Việt Nam";
        }
        BeaconHistoryEntry entry = new BeaconHistoryEntry();
        entry.setId(h.getId());
        entry.setApprovalLevel(h.getApprovalLevel());
        entry.setStatus(h.getStatus() != null ? h.getStatus().getCode() : null);
        entry.setApprovedBy(userName);
        entry.setOrgUnitName(orgUnitName);
        entry.setApprovedDate(h.getApprovedDate());
        entry.setReason(h.getReason());
        entry.setChangedField(h.getChangedField());
        entry.setPreviousValue(formatDisplayValue(h.getChangedField(), h.getPreviousValue()));
        entry.setNewValue(formatDisplayValue(h.getChangedField(), h.getNewValue()));
        return entry;
    }

    /**
     * Nhật ký thay đổi/phê duyệt của một đèn biển — đọc từ bảng dùng chung
     * infrastructure_history (refType = LIGHTHOUSE), lọc + phân trang Ở SERVER
     * giống /vts-operation-center & /vts-system.
     */
    @Transactional(readOnly = true)
    public List<BeaconHistoryEntry> getHistory(UUID id, Integer page, Integer pageSize, String keyword,
            String fromDate, String toDate) {
        beaconStationRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Đèn biển không tìm thấy: " + id));
        String normalizedKeyword = normalizeHistoryKeyword(keyword);
        boolean paged = page != null && pageSize != null && pageSize > 0;
        java.time.LocalDateTime from = parseLocalDateTime(fromDate);
        java.time.LocalDateTime to = parseLocalDateTime(toDate);
        List<InfrastructureHistory> list;
        if (normalizedKeyword == null && from == null && to == null) {
            list = paged
                    ? infraHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                            InfrastructureType.LIGHTHOUSE, id,
                            org.springframework.data.domain.PageRequest.of(page, pageSize))
                    : infraHistoryRepo.findByRefTypeAndRefIdOrderByApprovedDateDesc(
                            InfrastructureType.LIGHTHOUSE, id);
        } else {
            list = infraHistoryRepo.searchHistory(
                    InfrastructureType.LIGHTHOUSE, id, normalizedKeyword, from, to,
                    paged ? org.springframework.data.domain.PageRequest.of(page, pageSize)
                            : org.springframework.data.domain.Pageable.unpaged());
        }

        Set<UUID> userIds = list.stream()
                .map(InfrastructureHistory::getApprovedBy)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toSet());
        Map<UUID, User> userMap = userIds.isEmpty() ? Collections.emptyMap() :
                userRepository.findAllByIdInWithOrgUnit(userIds).stream()
                        .collect(java.util.stream.Collectors.toMap(User::getId, u -> u, (a, b) -> a));

        return list.stream().map(h -> toHistoryEntry(h, userMap)).collect(java.util.stream.Collectors.toList());
    }

    private static String normalizeHistoryKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return null;
        }
        return java.text.Normalizer
                .normalize(keyword.trim().toLowerCase(java.util.Locale.ROOT), java.text.Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "")
                .replace('đ', 'd');
    }

    @Transactional
    public BeaconStationResponse create(CreateBeaconStationRequest request) {
        FieldWriteGuard.validateObject(request);
        if (beaconStationRepo.existsByCode(request.getCode())
                || buoyRepo.existsByCode(request.getCode())) {
            throw new IllegalArgumentException("Mã đã tồn tại: " + request.getCode());
        }

        validateMaintenanceDates(request.getLastRepairDate(), request.getCommissionedDate());

        BeaconStation entity = BeaconStation.builder()
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
        if (entity.getOrgUnitId() == null) {
            entity.setOrgUnitId(entity.getUnitId());
        }
        if (entity.getUnitId() == null || !orgUnitScopeService.currentUserScope().allows(entity.getUnitId())) {
            throw new AccessDeniedException("Bạn không có quyền tạo đèn biển ngoài phạm vi đơn vị được phân quyền");
        }

        if ("submit".equals(request.getAction())) {
            entity.setStatus("PENDING_APPROVAL");
            entity.setApprovalLevel(1);
            entity.setSubmittedBy(SecurityUtils.getCurrentUserId());
            entity.setSubmittedAt(LocalDateTime.now());
        } else if ("approved".equals(request.getAction())) {
            // "Lưu và phê duyệt" — duyệt thẳng 2 cấp (chuẩn KCHT, mirror BuoyService.create)
            requireApproveC2Permission();
            entity.setStatus("APPROVED");
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setApprovalLevel(2);
            java.util.UUID uid = SecurityUtils.getCurrentUserId();
            entity.setSubmittedBy(uid);
            entity.setSubmittedAt(LocalDateTime.now());
            entity.setApproverLevel1(uid);
            entity.setApprovedDateLevel1(LocalDateTime.now());
            entity.setApproverLevel2(uid);
            entity.setApprovedDateLevel2(LocalDateTime.now());
        }

        entity = beaconStationRepo.save(entity);

        // Đồng bộ tọa độ GIS ngay khi tạo (chuẩn /vts-operation-center): coordinates = WKT từ form.
        // Chỉ tạo spatial object khi đã có vị trí thật — không ghi "POINT(null null)".
        if (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = resolveGisGeometryType(request.getGeometryType(), request.getCoordinates());
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    entity.getName(),
                    "DENBIEN_" + entity.getCode(),
                    geomType,
                    resolveSpatialObjectType(geomType),
                    request.getCoordinates().trim(),
                    entity.getId(),
                    InfrastructureType.LIGHTHOUSE);
            entity.setSpatialId(spatialObj.getId());
            entity = beaconStationRepo.save(entity);
        }

        // Chuẩn phê duyệt M-1006 mục 5 (Ca sử dụng 8): màn Lịch sử chỉ hiển thị các
        // thay đổi của hồ sơ ĐÃ DUYỆT (ghi bản cũ khi sửa hồ sơ đã duyệt) và các mốc duyệt —
        // KHÔNG ghi khi tạo mới rồi chỉ chọn "Lưu tạm" (DRAFT).
        // Ở create: chỉ ghi khi hồ sơ được tạo và đi thẳng vào luồng phê duyệt
        // ("Lưu và gửi phê duyệt" / "Lưu và phê duyệt").
        if ("submit".equals(request.getAction()) || "approved".equals(request.getAction())) {
            logHistory(entity, BeaconHistoryActionType.CREATE, null, null, toJson(entity));
        }
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

        // Tọa độ GIS (chuẩn /vts-operation-center): nhận coordinates = WKT từ form;
        // nếu trống → giữ vị trí spatial hiện có (chỉ đổi khi người dùng chọn vị trí mới).
        String requestedWkt = request.getCoordinates() != null ? request.getCoordinates().trim() : "";
        String existingWkt = null;
        if (entity.getSpatialId() != null) {
            Optional<GisSpatialObject> spatialObjOpt = gisSpatialObjectService.findById(entity.getSpatialId());
            if (spatialObjOpt.isPresent()) {
                existingWkt = spatialObjOpt.get().getCoordinates();
            }
        }
        String wkt = !requestedWkt.isEmpty() ? requestedWkt : existingWkt;
        GisGeometryType updateGeomType = !requestedWkt.isEmpty()
                ? resolveGisGeometryType(request.getGeometryType(), requestedWkt)
                : (existingWkt != null ? resolveGisGeometryType(entity.getGeometryType(), existingWkt) : GisGeometryType.POINT);

        Map<String, String> previousValues = new LinkedHashMap<>();
        if (request.getName() != null && !Objects.equals(request.getName(), entity.getName())) {
            previousValues.put("name", entity.getName());
            entity.setName(request.getName());
        }
        if (request.getType() != null && !Objects.equals(request.getType(), entity.getType())) {
            if ("APPROVED_L2".equals(entity.getStatus()) || "PUBLISHED".equals(entity.getStatus())) {
                throw new IllegalArgumentException("Loại đèn biển không thể thay đổi khi đèn biển đã được phê duyệt.");
            }
            previousValues.put("type", entity.getType());
            entity.setType(request.getType());
        }
        if (request.getTowerColor() != null && !Objects.equals(request.getTowerColor(), entity.getTowerColor())) {
            previousValues.put("towerColor", entity.getTowerColor());
            entity.setTowerColor(request.getTowerColor());
        }
        if (request.getPrimaryLightModel() != null && !Objects.equals(request.getPrimaryLightModel(), entity.getPrimaryLightModel())) {
            previousValues.put("primaryLightModel", entity.getPrimaryLightModel());
            entity.setPrimaryLightModel(request.getPrimaryLightModel());
        }
        if (request.getBackupLightModel() != null && !Objects.equals(request.getBackupLightModel(), entity.getBackupLightModel())) {
            previousValues.put("backupLightModel", entity.getBackupLightModel());
            entity.setBackupLightModel(request.getBackupLightModel());
        }
        if (request.getLightRange() != null && !Objects.equals(request.getLightRange(), entity.getLightRange())) {
            previousValues.put("lightRange", entity.getLightRange() != null ? String.valueOf(entity.getLightRange()) : null);
            entity.setLightRange(request.getLightRange());
        }
        if (request.getArea() != null && !Objects.equals(request.getArea(), entity.getArea())) {
            previousValues.put("area", entity.getArea() != null ? String.valueOf(entity.getArea()) : null);
            entity.setArea(request.getArea());
        }
        if (request.getLocation() != null && !Objects.equals(request.getLocation(), entity.getLocation())) {
            previousValues.put("location", entity.getLocation());
            entity.setLocation(request.getLocation());
        }
        if (request.getDetailedLocation() != null && !Objects.equals(request.getDetailedLocation(), entity.getDetailedLocation())) {
            previousValues.put("detailedLocation", entity.getDetailedLocation());
            entity.setDetailedLocation(request.getDetailedLocation());
        }
        if (request.getUnitId() != null && !Objects.equals(request.getUnitId(), entity.getUnitId())) {
            previousValues.put("unitId", entity.getUnitId() != null ? entity.getUnitId().toString() : null);
            entity.setUnitId(request.getUnitId());
            entity.setOrgUnitId(request.getUnitId());
        }
        if (request.getProvinceId() != null && !Objects.equals(request.getProvinceId(), entity.getProvinceId())) {
            previousValues.put("provinceId", entity.getProvinceId() != null ? String.valueOf(entity.getProvinceId()) : null);
            entity.setProvinceId(request.getProvinceId());
        }
        if (request.getSeaportId() != null && !Objects.equals(request.getSeaportId(), entity.getSeaportId())) {
            previousValues.put("seaportId", entity.getSeaportId() != null ? entity.getSeaportId().toString() : null);
            entity.setSeaportId(request.getSeaportId());
        }
        if (request.getOperator() != null && !Objects.equals(request.getOperator(), entity.getOperator())) {
            previousValues.put("operator", entity.getOperator());
            entity.setOperator(request.getOperator());
        }
        if (request.getLastRepairDate() != null && !Objects.equals(request.getLastRepairDate(), entity.getLastRepairDate())) {
            previousValues.put("lastRepairDate", entity.getLastRepairDate() != null ? entity.getLastRepairDate().toString() : null);
            entity.setLastRepairDate(request.getLastRepairDate());
        }
        if (request.getCommissionedDate() != null && !Objects.equals(request.getCommissionedDate(), entity.getCommissionedDate())) {
            previousValues.put("commissionedDate", entity.getCommissionedDate() != null ? entity.getCommissionedDate().toString() : null);
            entity.setCommissionedDate(request.getCommissionedDate());
        }
        if (request.getIsActive() != null && !Objects.equals(request.getIsActive(), entity.getIsActive())) {
            previousValues.put("isActive", entity.getIsActive() != null ? String.valueOf(entity.getIsActive()) : null);
            entity.setIsActive(request.getIsActive());
        }
        if (request.getShape() != null && !Objects.equals(request.getShape(), entity.getShape())) {
            previousValues.put("shape", entity.getShape());
            entity.setShape(request.getShape());
        }
        if (request.getStructure() != null && !Objects.equals(request.getStructure(), entity.getStructure())) {
            previousValues.put("structure", entity.getStructure());
            entity.setStructure(request.getStructure());
        }
        if (request.getTowerHeight() != null && !Objects.equals(request.getTowerHeight(), entity.getTowerHeight())) {
            previousValues.put("towerHeight", entity.getTowerHeight() != null ? String.valueOf(entity.getTowerHeight()) : null);
            entity.setTowerHeight(request.getTowerHeight());
        }
        if (request.getLightHeight() != null && !Objects.equals(request.getLightHeight(), entity.getLightHeight())) {
            previousValues.put("lightHeight", entity.getLightHeight() != null ? String.valueOf(entity.getLightHeight()) : null);
            entity.setLightHeight(request.getLightHeight());
        }
        if (request.getGeographicRange() != null && !Objects.equals(request.getGeographicRange(), entity.getGeographicRange())) {
            previousValues.put("geographicRange", entity.getGeographicRange());
            entity.setGeographicRange(request.getGeographicRange());
        }
        if (request.getPowerSupply() != null && !Objects.equals(request.getPowerSupply(), entity.getPowerSupply())) {
            previousValues.put("powerSupply", entity.getPowerSupply());
            entity.setPowerSupply(request.getPowerSupply());
        }
        if (request.getStaffCount() != null && !Objects.equals(request.getStaffCount(), entity.getStaffCount())) {
            previousValues.put("staffCount", entity.getStaffCount() != null ? String.valueOf(entity.getStaffCount()) : null);
            entity.setStaffCount(request.getStaffCount());
        }
        if (request.getStationArea() != null && !Objects.equals(request.getStationArea(), entity.getStationArea())) {
            previousValues.put("stationArea", entity.getStationArea() != null ? String.valueOf(entity.getStationArea()) : null);
            entity.setStationArea(request.getStationArea());
        }
        if (request.getOperationalStatus() != null && !Objects.equals(request.getOperationalStatus(), entity.getOperationalStatus())) {
            previousValues.put("operationalStatus", entity.getOperationalStatus() != null ? String.valueOf(entity.getOperationalStatus()) : null);
            entity.setOperationalStatus(request.getOperationalStatus());
        }
        if (request.getRegion() != null && !Objects.equals(request.getRegion(), entity.getRegion())) {
            previousValues.put("region", entity.getRegion());
            entity.setRegion(request.getRegion());
        }
        if (request.getIdentifyingFeature() != null && !Objects.equals(request.getIdentifyingFeature(), entity.getIdentifyingFeature())) {
            previousValues.put("identifyingFeature", entity.getIdentifyingFeature());
            entity.setIdentifyingFeature(request.getIdentifyingFeature());
        }
        if (request.getNote() != null && !Objects.equals(request.getNote(), entity.getNote())) {
            previousValues.put("note", entity.getNote());
            entity.setNote(request.getNote());
        }
        if (request.getGeometryType() != null && !Objects.equals(request.getGeometryType(), entity.getGeometryType())) {
            previousValues.put("geometryType", entity.getGeometryType());
            entity.setGeometryType(request.getGeometryType());
        }
        if (request.getMapSymbolId() != null && !Objects.equals(request.getMapSymbolId(), entity.getMapSymbolId())) {
            previousValues.put("mapSymbolId", entity.getMapSymbolId() != null ? entity.getMapSymbolId().toString() : null);
            entity.setMapSymbolId(request.getMapSymbolId());
        }
        if (request.getCoordinateSystem() != null && !Objects.equals(request.getCoordinateSystem(), entity.getCoordinateSystem())) {
            previousValues.put("coordinateSystem", entity.getCoordinateSystem() != null ? String.valueOf(entity.getCoordinateSystem()) : null);
            entity.setCoordinateSystem(request.getCoordinateSystem());
        }
        if (request.getDisplayRule() != null && !Objects.equals(request.getDisplayRule(), entity.getDisplayRule())) {
            previousValues.put("displayRule", entity.getDisplayRule());
            entity.setDisplayRule(request.getDisplayRule());
        }
        if (!requestedWkt.isEmpty() && !Objects.equals(requestedWkt, existingWkt != null ? existingWkt.trim() : null)) {
            previousValues.put("coordinates", existingWkt != null ? existingWkt : "Chưa có");
        }

        boolean wasApproved = isApprovedStatus(entity.getStatus())
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

        // Chuyển trạng thái theo action lưu (chuẩn 2 cấp KCHT):
        //   approved → APPROVED ("Lưu và phê duyệt", cấp Cục — giữ nguyên hiệu lực)
        //   submit   → PENDING_APPROVAL ("Cập nhật và gửi phê duyệt")
        //   draft    → giữ nguyên trạng thái (Lưu tạm / Bị trả về vẫn ở trạng thái sửa được)
        if ("approved".equals(request.getAction())) {
            requireApproveC2Permission();
            entity.setStatus("APPROVED");
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            entity.setApprovalLevel(2);
            java.util.UUID uid = SecurityUtils.getCurrentUserId();
            entity.setSubmittedBy(uid);
            entity.setSubmittedAt(LocalDateTime.now());
            // Duyệt thẳng từ Lưu tạm/Bị trả về: đánh dấu luôn người duyệt cấp Cảng vụ/Chi cục (đủ 2 cấp)
            if (entity.getApproverLevel1() == null) {
                entity.setApproverLevel1(uid);
                entity.setApprovedDateLevel1(LocalDateTime.now());
            }
            entity.setApproverLevel2(uid);
            entity.setApprovedDateLevel2(LocalDateTime.now());
        } else if ("submit".equals(request.getAction())) {
            entity.setStatus("PENDING_APPROVAL");
            entity.setApprovalStatus(ApprovalStatus.PROPOSED);
            entity.setApprovalLevel(1);
            entity.setSubmittedBy(SecurityUtils.getCurrentUserId());
            entity.setSubmittedAt(LocalDateTime.now());
        } else if (wasApproved) {
            entity.setStatus("APPROVED");
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
        }

        entity = beaconStationRepo.save(entity);

        // Sync GIS spatial object (chuẩn /vts-operation-center: tạo khi chưa có, cập nhật WKT/loại hình)
        if (wkt != null) {
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    entity.getSpatialId(),
                    entity.getName(),
                    "DENBIEN_" + entity.getCode(),
                    updateGeomType,
                    resolveSpatialObjectType(updateGeomType),
                    wkt, entity.getId(),
                    InfrastructureType.LIGHTHOUSE);
            if (entity.getSpatialId() == null) {
                entity.setSpatialId(spatialObj.getId());
                beaconStationRepo.save(entity);
            }
        }

        // Ghi nhật ký từng trường thay đổi (chuẩn /vts-operation-center)
        if (wasApproved && !previousValues.isEmpty()) {
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            LocalDateTime now = LocalDateTime.now();
            for (Map.Entry<String, String> entry : previousValues.entrySet()) {
                String field = entry.getKey();
                String fieldName = getFieldDisplayName(field);
                String oldVal = formatDisplayValue(field, entry.getValue());
                Object rawNew = getEntityFieldValue(entity, field, request);
                String newVal = formatDisplayValue(field, rawNew != null ? String.valueOf(rawNew) : null);
                infraHistoryRepo.save(InfrastructureHistory.builder()
                        .refId(entity.getId())
                        .refType(InfrastructureType.LIGHTHOUSE)
                        .approvalLevel(ApprovalLevel.LEVEL_2)
                        .status(InfrastructureHistoryStatus.UPDATED)
                        .approvedBy(currentUserId)
                        .approvedDate(now)
                        .changedField(field)
                        .previousValue(oldVal)
                        .newValue(newVal)
                        .reason("Cập nhật thông tin " + fieldName)
                        .build());
            }
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

        InfrastructureHistoryUtils.recordSoftDelete(
                infraHistoryRepo,
                id,
                InfrastructureType.LIGHTHOUSE,
                SecurityUtils.getCurrentUserId(),
                "Xóa đèn biển: " + entity.getName());

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

        if (!"DRAFT".equals(entity.getStatus())
                && !"REJECTED_LEVEL1".equals(entity.getStatus())
                && !"REJECTED_LEVEL2".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Chỉ có thể gửi phê duyệt khi đèn biển ở trạng thái Lưu tạm hoặc bị trả về");
        }

        entity.setStatus("PENDING_APPROVAL");
        entity.setApprovalStatus(ApprovalStatus.PROPOSED);
        entity.setApprovalLevel(1);
        entity.setSubmittedBy(SecurityUtils.getCurrentUserId());
        entity.setSubmittedAt(LocalDateTime.now());
        beaconStationRepo.save(entity);

        notificationService.sendApprovalNotification(entity);
    }

    @Transactional
    public BeaconStationResponse approveL1(UUID id, java.util.UUID approverId, String note) {
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

        ApprovalStatus previousApprovalStatus = entity.getApprovalStatus();
        entity.setStatus("APPROVED_LEVEL1");
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setApprovalLevel(1);
        entity.setApproverLevel1(approverId);
        entity.setApprovedDateLevel1(LocalDateTime.now());
        entity.setApprovalContentLevel1(note);
        beaconStationRepo.save(entity);

        // Ghi nội dung chuyển trạng thái (chuẩn /vts-operation-center) — tránh log rỗng không có khối thông tin
        logHistory(entity, BeaconHistoryActionType.APPROVE_L1, "Trạng thái phê duyệt",
                previousApprovalStatus != null ? previousApprovalStatus.getLabel() : null,
                entity.getApprovalStatus().getLabel(), note);

        return toResponse(entity);
    }

    @Transactional
    public BeaconStationResponse approveL2(UUID id, java.util.UUID approverId, String note) {
        BeaconStation entity = beaconStationRepo.findById(id)
                .orElseThrow(() -> new EntityNotFoundException(
                        "Đèn biển không tìm thấy: " + id));

        if (!"APPROVED_LEVEL1".equals(entity.getStatus())) {
            throw new IllegalStateException(
                    "Không ở trạng thái chờ phê duyệt L2");
        }

        java.util.UUID creatorId = resolveCreatedBy(entity);
        if (creatorId != null && creatorId.equals(approverId)) {
            throw new IllegalStateException(
                    "Bạn không thể phê duyệt bản do chính mình gửi");
        }

        ApprovalStatus previousApprovalStatus = entity.getApprovalStatus();
        entity.setStatus("APPROVED");
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setApprovalLevel(2);
        entity.setApproverLevel2(approverId);
        entity.setApprovedDateLevel2(LocalDateTime.now());
        entity.setApprovalContentLevel2(note);
        beaconStationRepo.save(entity);

        // Ghi nội dung chuyển trạng thái (chuẩn /vts-operation-center) — tránh log rỗng không có khối thông tin
        logHistory(entity, BeaconHistoryActionType.APPROVE_L2, "Trạng thái phê duyệt",
                previousApprovalStatus != null ? previousApprovalStatus.getLabel() : null,
                entity.getApprovalStatus().getLabel(), note);

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

        boolean atLevel2 = "APPROVED_LEVEL1".equals(entity.getStatus());
        entity.setStatus(atLevel2 ? "REJECTED_LEVEL2" : "REJECTED_LEVEL1");
        entity.setApprovalStatus(atLevel2 ? ApprovalStatus.REJECTED_LEVEL2 : ApprovalStatus.REJECTED_LEVEL1);
        entity.setRejectionReason(rejectReason);
        beaconStationRepo.save(entity);

        logHistory(entity, BeaconHistoryActionType.REJECT, "Trạng thái phê duyệt",
                null, entity.getApprovalStatus().getLabel(), rejectReason);
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
        logHistory(entity, action, fields, previousJson, newJson, null);
    }

    private void logHistory(BeaconStation entity,
            BeaconHistoryActionType action, String fields, String previousJson, String newJson, String customReason) {
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
                .reason(customReason != null ? customReason : (action == BeaconHistoryActionType.REJECT ? newJson : null))
                .build();

        if (infraHistoryRepo != null && entity.getId() != null) {
            InfrastructureHistoryStatus status = switch (action) {
                case CREATE -> InfrastructureHistoryStatus.CREATED;
                case UPDATE -> InfrastructureHistoryStatus.UPDATED;
                case SOFT_DELETE -> InfrastructureHistoryStatus.DELETED;
                case APPROVE_L1, APPROVE_L2 -> InfrastructureHistoryStatus.APPROVED;
                case REJECT -> InfrastructureHistoryStatus.REJECTED;
                default -> InfrastructureHistoryStatus.UPDATED;
            };
            String reason = customReason;
            if (reason == null) {
                reason = switch (action) {
                    case CREATE -> "Tạo mới hồ sơ";
                    case APPROVE_L1 -> "Phê duyệt cấp Chi cục/Cảng vụ";
                    case APPROVE_L2 -> "Phê duyệt cấp Cục";
                    case REJECT -> newJson;
                    default -> null;
                };
            }
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
                    .reason(reason)
                    .build());
        }
    }

    private BeaconStationResponse toResponse(BeaconStation entity) {
        String unitName = orgUnitCacheService.getName(entity.getUnitId());

        String coordinates = null;
        Double latitude = null;
        Double longitude = null;
        if (entity.getSpatialId() != null) {
            Optional<GisSpatialObject> spatialObjOpt = gisSpatialObjectService.findById(entity.getSpatialId());
            if (spatialObjOpt.isPresent()) {
                String coordsStr = spatialObjOpt.get().getCoordinates();
                coordinates = coordsStr;
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

        String status = entity.getStatus();
        if (entity.getDeletedAt() != null || entity.getDeletedBy() != null) {
            status = "DELETED";
        }

        return BeaconStationResponse.builder()
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
                .provinceId(entity.getProvinceId())
                .lastRepairDate(entity.getLastRepairDate())
                .commissionedDate(entity.getCommissionedDate())
                .isActive(entity.getIsActive())
                .status(status)
                .deletedAt(entity.getDeletedAt())
                .deletedBy(entity.getDeletedBy())
                .approvalStatus(entity.getApprovalStatus().name())
                .approvalLevel(ApprovalLevel.fromInt(entity.getApprovalLevel()))
                .approvedBy(entity.getApprovedBy())
                .approvedDate(entity.getApprovedDate())
                .rejectionReason(entity.getRejectionReason())
                .submittedBy(entity.getSubmittedBy())
                .submittedAt(entity.getSubmittedAt())
                .submittedByName(userResolverService.resolveName(entity.getSubmittedBy()))
                .approverLevel1(entity.getApproverLevel1())
                .approverLevel1Name(userResolverService.resolveName(entity.getApproverLevel1()))
                .approvedDateLevel1(entity.getApprovedDateLevel1())
                .approvalContentLevel1(entity.getApprovalContentLevel1())
                .approverLevel2(entity.getApproverLevel2())
                .approverLevel2Name(userResolverService.resolveName(entity.getApproverLevel2()))
                .approvedDateLevel2(entity.getApprovedDateLevel2())
                .approvalContentLevel2(entity.getApprovalContentLevel2())
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
                .coordinates(coordinates)
                .latitude(latitude)
                .longitude(longitude)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .updatedBy(entity.getUpdatedBy())
                .updatedByName(userResolverService.resolveName(entity.getUpdatedBy()))
                .build();
    }

    private boolean isApprovedStatus(String status) {
        return "APPROVED".equals(status)
                || "APPROVED_L2".equals(status)
                || "APPROVED_LEVEL2".equals(status)
                || "PUBLISHED".equals(status);
    }

    private boolean isInApprovalProcess(String status) {
        return "PENDING_APPROVAL".equals(status)
                || "APPROVED_LEVEL1".equals(status)
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

    /**
     * "Lưu và phê duyệt" (action=approved) chỉ được phép cho người có quyền duyệt C2
     * hoặc quản trị nâng cao (chuẩn F-092/AC-006 — backend chặn non-Cục).
     */
    private void requireApproveC2Permission() {
        if (SecurityUtils.isElevatedAdministrator()) {
            return;
        }
        java.util.Set<String> perms = SecurityUtils.getCurrentUserPermissions();
        if (perms == null
                || !perms.contains("beaconstation:approvec2")
                && !perms.contains("beaconstation:approve")
                && !perms.contains("data:approvec2")) {
            throw new AccessDeniedException(
                    "Bạn không có quyền phê duyệt — thao tác \"Lưu và phê duyệt\" cần quyền duyệt cấp Cục");
        }
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
        // Ghi nhật ký "Tài liệu đính kèm" (chuẩn /vts-operation-center) — chỉ khi bản ghi ĐÃ DUYỆT
        BeaconStation station = beaconStationRepo.findById(entityId).orElse(null);
        if (station != null && (isApprovedStatus(station.getStatus())
                || station.getApprovalStatus() == ApprovalStatus.APPROVED
                || station.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2)) {
            String uploadedNames = files.stream()
                    .map(f -> f.getOriginalFilename() != null ? f.getOriginalFilename() : "unknown")
                    .collect(java.util.stream.Collectors.joining("; "));
            if (infraHistoryRepo != null) {
                infraHistoryRepo.save(InfrastructureHistory.builder()
                        .refId(entityId)
                        .refType(InfrastructureType.LIGHTHOUSE)
                        .approvalLevel(ApprovalLevel.LEVEL_0)
                        .status(InfrastructureHistoryStatus.UPDATED)
                        .approvedBy(userId)
                        .approvedDate(LocalDateTime.now())
                        .reason("Thêm tài liệu đính kèm: " + uploadedNames)
                        .changedField("Tài liệu đính kèm")
                        .previousValue("—")
                        .newValue(uploadedNames)
                        .build());
            }
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
        // Ghi nhật ký xóa "Tài liệu đính kèm" (chuẩn /vts-operation-center) — chỉ khi bản ghi ĐÃ DUYỆT
        BeaconStation station = beaconStationRepo.findById(entityId).orElse(null);
        if (station != null && (isApprovedStatus(station.getStatus())
                || station.getApprovalStatus() == ApprovalStatus.APPROVED
                || station.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2)) {
            if (infraHistoryRepo != null) {
                infraHistoryRepo.save(InfrastructureHistory.builder()
                        .refId(entityId)
                        .refType(InfrastructureType.LIGHTHOUSE)
                        .approvalLevel(ApprovalLevel.LEVEL_0)
                        .status(InfrastructureHistoryStatus.ATTACHMENT_DELETED)
                        .approvedBy(SecurityUtils.getCurrentUserId())
                        .approvedDate(LocalDateTime.now())
                        .reason("Xóa tài liệu đính kèm: " + attachment.getFileName())
                        .changedField("Tài liệu đính kèm")
                        .previousValue(attachment.getFileName())
                        .newValue("—")
                        .build());
            }
        }
    }

    public String getFieldDisplayName(String field) {
        if (field == null) return "";
        return switch (field) {
            case "name" -> "Tên đèn biển";
            case "code" -> "Mã đèn biển";
            case "type" -> "Cấp trạm đèn";
            case "lightRange" -> "Tầm hiệu lực ánh sáng (hải lý)";
            case "towerColor" -> "Màu sắc tháp đèn";
            case "primaryLightModel" -> "Loại đèn chính";
            case "backupLightModel" -> "Loại đèn phụ";
            case "area" -> "Vùng nước";
            case "location" -> "Vị trí đặt đèn";
            case "detailedLocation" -> "Địa điểm chi tiết";
            case "unitId", "orgUnitId" -> "Đơn vị quản lý";
            case "provinceId" -> "Địa điểm (Tỉnh/TP)";
            case "seaportId" -> "Thuộc cảng biển";
            case "operator" -> "Đơn vị khai thác";
            case "lastRepairDate" -> "Ngày sửa chữa gần nhất";
            case "commissionedDate" -> "Ngày đưa vào sử dụng";
            case "isActive" -> "Trạng thái hoạt động";
            case "shape" -> "Hình dạng tháp đèn";
            case "structure" -> "Kết cấu tháp đèn";
            case "towerHeight" -> "Chiều cao tháp đèn (m)";
            case "lightHeight" -> "Chiều cao tâm sáng (m)";
            case "geographicRange" -> "Tầm hiệu lực địa lý (hải lý)";
            case "powerSupply" -> "Nguồn năng lượng";
            case "staffCount" -> "Số lượng nhân viên";
            case "stationArea" -> "Diện tích trạm (m²)";
            case "operationalStatus" -> "Tình trạng hoạt động";
            case "region" -> "Địa bàn";
            case "identifyingFeature" -> "Đặc điểm nhận biết";
            case "note" -> "Ghi chú";
            case "geometryType" -> "Loại đối tượng GIS";
            case "mapSymbolId" -> "Biểu tượng";
            case "coordinateSystem" -> "Hệ tọa độ";
            case "displayRule" -> "Quy tắc hiển thị";
            case "coordinates" -> "Tọa độ GIS";
            case "approvalStatus", "status" -> "Trạng thái phê duyệt";
            case "attachments" -> "Tài liệu đính kèm";
            default -> field;
        };
    }

    public String formatDisplayValue(String field, String rawValue) {
        if (rawValue == null || rawValue.isEmpty() || "null".equalsIgnoreCase(rawValue) || "Chưa có".equals(rawValue)) {
            return "Chưa có";
        }
        if ("mapSymbolId".equals(field) || "Biểu tượng".equals(field)) {
            try {
                UUID symId = UUID.fromString(rawValue);
                List<String> names = jdbcTemplate.queryForList("SELECT name FROM map_symbols WHERE id = ?", String.class, symId);
                return (!names.isEmpty() && names.get(0) != null) ? names.get(0) : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if ("unitId".equals(field) || "orgUnitId".equals(field) || "Đơn vị quản lý".equals(field)) {
            try {
                String name = orgUnitCacheService.getName(UUID.fromString(rawValue));
                return name != null ? name : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if ("seaportId".equals(field) || "Thuộc cảng biển".equals(field)) {
            try {
                String name = portCacheService.getName(UUID.fromString(rawValue));
                return name != null ? name : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if ("provinceId".equals(field) || "Địa điểm (Tỉnh/TP)".equals(field) || "Tỉnh / Thành phố".equals(field)) {
            try {
                int pid = Integer.parseInt(rawValue);
                List<String> names = jdbcTemplate.queryForList("SELECT name FROM provinces WHERE id = ?", String.class, pid);
                return (!names.isEmpty() && names.get(0) != null) ? names.get(0) : rawValue;
            } catch (Exception e) {
                return rawValue;
            }
        }
        if ("operationalStatus".equals(field) || "Tình trạng hoạt động".equals(field) || "Tình trạng".equals(field)) {
            if ("0".equals(rawValue)) return "Chưa khai thác/vận hành";
            if ("1".equals(rawValue)) return "Đang khai thác/vận hành";
            if ("2".equals(rawValue)) return "Dừng khai thác/vận hành";
            return rawValue;
        }
        if ("type".equals(field) || "Cấp trạm đèn".equals(field) || "Phân loại đèn biển".equals(field)) {
            if ("LIGHTHOUSE".equals(rawValue)) return "Cấp I";
            if ("BEACON_LIGHT".equals(rawValue)) return "Cấp II";
            if ("BEACON_MARK".equals(rawValue)) return "Cấp III";
            return rawValue;
        }
        if ("coordinateSystem".equals(field) || "Hệ tọa độ".equals(field) || "Hệ quy chiếu".equals(field)) {
            if ("1".equals(rawValue) || "4326".equals(rawValue)) return "WGS 84";
            if ("2".equals(rawValue)) return "VN-2000";
            return rawValue;
        }
        if ("geometryType".equals(field) || "Loại đối tượng GIS".equals(field)) {
            if (GisGeometryType.POINT.name().equals(rawValue)) return "Đối tượng điểm";
            if (GisGeometryType.LINE.name().equals(rawValue) || "LINESTRING".equals(rawValue)) return "Đối tượng đường";
            if (GisGeometryType.POLYGON.name().equals(rawValue)) return "Đối tượng vùng";
            return rawValue;
        }
        if ("approvalStatus".equals(field) || "Trạng thái phê duyệt".equals(field) || "status".equals(field) || "Trạng thái".equals(field)) {
            if (ApprovalStatus.DRAFT.name().equals(rawValue) || "DRAFT".equals(rawValue)) return "Lưu tạm";
            if (ApprovalStatus.PROPOSED.name().equals(rawValue) || ApprovalStatus.PENDING_APPROVAL.name().equals(rawValue) || "PENDING_APPROVAL".equals(rawValue)) return "Chờ Cảng vụ duyệt";
            if (ApprovalStatus.APPROVED_LEVEL1.name().equals(rawValue) || "APPROVED_LEVEL1".equals(rawValue)) return "Chờ Cục duyệt";
            if (ApprovalStatus.APPROVED.name().equals(rawValue) || ApprovalStatus.APPROVED_LEVEL2.name().equals(rawValue) || "APPROVED".equals(rawValue)) return "Đã duyệt";
            if (ApprovalStatus.REJECTED_LEVEL1.name().equals(rawValue) || "REJECTED_LEVEL1".equals(rawValue)) return "Bị Cảng vụ trả về";
            if (ApprovalStatus.REJECTED_LEVEL2.name().equals(rawValue) || ApprovalStatus.REJECTED.name().equals(rawValue) || "REJECTED".equals(rawValue)) return "Bị Cục trả về";
            return rawValue;
        }
        if ("isActive".equals(field) || "Trạng thái hoạt động".equals(field)) {
            if ("true".equalsIgnoreCase(rawValue)) return "Hoạt động";
            if ("false".equalsIgnoreCase(rawValue)) return "Ngừng hoạt động";
            return rawValue;
        }
        if ("coordinates".equals(field) || "Tọa độ".equals(field) || "Tọa độ GIS".equals(field)) {
            if (rawValue == null || rawValue.trim().isEmpty() || "Chưa có".equals(rawValue) || "null".equalsIgnoreCase(rawValue)) {
                return "Chưa có";
            }
            return rawValue.trim();
        }
        return rawValue;
    }

    private Object getEntityFieldValue(BeaconStation entity, String field, UpdateBeaconStationRequest request) {
        if (entity == null || field == null) return null;
        return switch (field) {
            case "name" -> entity.getName();
            case "code" -> entity.getCode();
            case "type" -> entity.getType();
            case "lightRange" -> entity.getLightRange();
            case "towerColor" -> entity.getTowerColor();
            case "primaryLightModel" -> entity.getPrimaryLightModel();
            case "backupLightModel" -> entity.getBackupLightModel();
            case "area" -> entity.getArea();
            case "location" -> entity.getLocation();
            case "detailedLocation" -> entity.getDetailedLocation();
            case "unitId" -> entity.getUnitId();
            case "provinceId" -> entity.getProvinceId();
            case "seaportId" -> entity.getSeaportId();
            case "operator" -> entity.getOperator();
            case "lastRepairDate" -> entity.getLastRepairDate();
            case "commissionedDate" -> entity.getCommissionedDate();
            case "isActive" -> entity.getIsActive();
            case "shape" -> entity.getShape();
            case "structure" -> entity.getStructure();
            case "towerHeight" -> entity.getTowerHeight();
            case "lightHeight" -> entity.getLightHeight();
            case "geographicRange" -> entity.getGeographicRange();
            case "powerSupply" -> entity.getPowerSupply();
            case "staffCount" -> entity.getStaffCount();
            case "stationArea" -> entity.getStationArea();
            case "operationalStatus" -> entity.getOperationalStatus();
            case "region" -> entity.getRegion();
            case "identifyingFeature" -> entity.getIdentifyingFeature();
            case "note" -> entity.getNote();
            case "geometryType" -> entity.getGeometryType();
            case "mapSymbolId" -> entity.getMapSymbolId();
            case "coordinateSystem" -> entity.getCoordinateSystem();
            case "displayRule" -> entity.getDisplayRule();
            case "coordinates" -> request != null && request.getCoordinates() != null ? request.getCoordinates().trim() : null;
            default -> null;
        };
    }

    /**
     * Lấy file đính kèm của đèn biển (dùng cho endpoint tải xuống — chuẩn /vts-operation-center).
     */
    public Attachment getAttachment(UUID entityId, UUID attachmentId) {
      BeaconStation parent = beaconStationRepo.findById(entityId)
        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy đèn biển: " + entityId));
      orgUnitScopeService.requireOrganizationInScope(parent.getOrgUnitId());
      Attachment attachment = attachmentRepository.findById(attachmentId)
        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
      if (!"BEACON_LIGHT".equals(attachment.getEntityType()) || !attachment.getEntityId().equals(entityId)) {
        throw new IllegalArgumentException("File không thuộc đèn biển này");
      }
      return attachment;
    }

    private static GisGeometryType resolveGisGeometryType(String geometryType, String wkt) {
        String g = geometryType != null ? geometryType.trim().toUpperCase(java.util.Locale.ROOT) : "";
        if (g.contains("POLYGON")) return GisGeometryType.POLYGON;
        if (g.contains("LINE")) return GisGeometryType.LINE;
        if (g.contains("POINT")) return GisGeometryType.POINT;
        String w = wkt != null ? wkt.trim().toUpperCase(java.util.Locale.ROOT) : "";
        if (w.contains("POLYGON")) return GisGeometryType.POLYGON;
        if (w.contains("LINESTRING") || w.contains("LINE")) return GisGeometryType.LINE;
        return GisGeometryType.POINT;
    }

    private static GisSpatialObjectType resolveSpatialObjectType(GisGeometryType geomType) {
        return switch (geomType) {
            case LINE -> GisSpatialObjectType.LINE_OTHER;
            case POLYGON -> GisSpatialObjectType.POLYGON_OTHER;
            default -> GisSpatialObjectType.POINT_LIGHTHOUSE;
        };
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
