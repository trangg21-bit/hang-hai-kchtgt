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
    private final UserResolverService userResolverService;

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
        return beaconStationRepo.searchFiltered(
                name,
                code,
                type,
                primaryLightModel,
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
            String name, String code, String type, String primaryLightModel, String status,
            UUID unitId, UUID seaportId, String operator, Integer provinceId,
            Integer operationalStatus, Double stationArea, String approvalStatus, UUID updatedBy,
            String commissionedFrom, String commissionedTo,
            String updatedFrom, String updatedTo,
            org.springframework.data.domain.Pageable pageable) {
        return beaconStationRepo.searchFilteredPaged(
                name, code, type, primaryLightModel, status,
                unitId, seaportId, operator, provinceId,
                operationalStatus, stationArea, parseApprovalStatus(approvalStatus), updatedBy,
                parseLocalDate(commissionedFrom), parseLocalDate(commissionedTo),
                parseLocalDateTime(updatedFrom), parseLocalDateTime(updatedTo),
                pageable)
                .map(this::toResponse);
    }

    // -- CREATE --

    @Transactional
    public BeaconHistoryEntry toHistoryEntry(InfrastructureHistory h) {
        BeaconHistoryEntry e = new BeaconHistoryEntry();
        e.setId(h.getId());
        e.setApprovalLevel(h.getApprovalLevel());
        e.setStatus(h.getStatus() != null ? h.getStatus().getCode() : null);
        e.setApprovedBy(h.getApprovedBy() != null ? userResolverService.resolveName(h.getApprovedBy()) : null);
        e.setOrgUnitName(null);
        e.setApprovedDate(h.getApprovedDate());
        e.setReason(h.getReason());
        e.setChangedField(h.getChangedField());
        e.setPreviousValue(h.getPreviousValue());
        e.setNewValue(h.getNewValue());
        return e;
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
        return list.stream().map(this::toHistoryEntry).collect(java.util.stream.Collectors.toList());
    }

    private static String normalizeHistoryKeyword(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) return null;
        String n = java.text.Normalizer.normalize(keyword.trim().toLowerCase(java.util.Locale.ROOT),
                java.text.Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        return "%" + n + "%";
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
        logHistory(entity, BeaconHistoryActionType.APPROVE_L1, "approvalStatus",
                previousApprovalStatus != null ? previousApprovalStatus.getLabel() : null,
                entity.getApprovalStatus().getLabel());

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
        logHistory(entity, BeaconHistoryActionType.APPROVE_L2, "approvalStatus",
                previousApprovalStatus != null ? previousApprovalStatus.getLabel() : null,
                entity.getApprovalStatus().getLabel());

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
        // TODO (2026-08-26): tạm ẩn ghi beacon_history — DB đang chạy chưa có bảng này
        // (ERROR: relation "beacon_history" does not exist; migration
        // V20260803370000__repair_all_schema_types_and_columns.sql chưa được áp dụng).
        // if (historyRepo != null) {
        //     historyRepo.save(entry);
        // }

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
                .status(entity.getStatus())
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
            logHistory(station, BeaconHistoryActionType.UPDATE, "attachments", null, uploadedNames);
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
            logHistory(station, BeaconHistoryActionType.UPDATE, "attachments", attachment.getFileName(), null);
        }
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
