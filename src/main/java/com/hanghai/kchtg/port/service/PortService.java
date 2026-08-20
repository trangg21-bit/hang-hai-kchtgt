package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.port.dto.port.PortAttachmentDto;
import com.hanghai.kchtg.port.dto.port.PortCoordinateDto;
import com.hanghai.kchtg.port.dto.port.PortInfrastructureDto;
import com.hanghai.kchtg.port.dto.berth.AttachmentDto;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.dto.port.PortResponse;
import com.hanghai.kchtg.port.dto.port.PortOptionResponse;
import com.hanghai.kchtg.port.dto.port.CreatePortRequest;
import com.hanghai.kchtg.port.dto.port.UpdatePortRequest;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.entity.PortAttachment;
import com.hanghai.kchtg.port.entity.PortInfrastructure;
import java.math.BigDecimal;
import com.hanghai.kchtg.port.repository.BerthRepository;
import com.hanghai.kchtg.port.repository.PortAttachmentRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.repository.WaterZoneRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.ChangeTrackingService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.port.service.PortCacheService;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service core for Port CRUD operations.
 * Covers F-008 (create), F-009 (update), F-010 (soft-delete).
 * <p>
 * Business rules:
 * - Code (portCode) is immutable after creation — duplicate detection on create
 * - Approval status always set to PENDING on create/update
 * - Cannot soft-delete if active children (Berth, WaterZone) exist
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PortService {

    private final PortRepository portRepository;
    private final BerthRepository berthRepository;
    private final WaterZoneRepository waterZoneRepository;
    private final PierRepository pierRepository;
    private final ChangeTrackingService changeTrackingService;
    private final ChangeHistoryService changeHistoryService;
    private final UserResolverService userResolverService;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;
    private final com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;
    private final AttachmentRepository attachmentRepository;
    private final PortAttachmentRepository portAttachmentRepository;
    private final PortCacheService portCacheService;
    private final OrgUnitCacheService orgUnitCacheService;

    @Value("${app.upload.attachment-path:uploads/port-attachments}")
    private String uploadPath;

    // ── GENERATE CODE ───────────────────────────────────────────

    /**
     * Sinh mã cảng tự động theo định dạng CB-XXXXXX (6 số).
     * Dùng MAX(portCode) từ DB, tăng dần.
     */
    @Transactional(readOnly = true)
    public String generatePortCode() {
        String maxCode = portRepository.findMaxPortCode().orElse(null);
        int nextNumber = 1;
        if (maxCode != null && maxCode.startsWith("CB-")) {
            try {
                String numPart = maxCode.substring(3);
                nextNumber = Integer.parseInt(numPart) + 1;
            } catch (NumberFormatException e) {
                log.warn("Mã cảng không đúng định dạng CB-XXXXXX: {}, bắt đầu từ 1", maxCode);
            }
        }
        String code = String.format("CB-%06d", nextNumber);
        log.info("Sinh mã cảng: {}", code);
        return code;
    }

    // ── CREATE ──────────────────────────────────────────────────

    @Transactional
    public PortResponse create(CreatePortRequest request) {
        return create(request, request.getAction());
    }

    @Transactional
    public PortResponse create(CreatePortRequest request, String action) {
        FieldWriteGuard.validateObject(request);
        if (action == null || action.trim().isEmpty()) {
            action = "submit";
        }
        if (!"draft".equals(action) && !"submit".equals(action) && !"approve".equals(action)) {
            throw new IllegalArgumentException("Action không hợp lệ: " + action + ". Chỉ chấp nhận 'draft', 'submit' hoặc 'approve'");
        }

        boolean isDraft = "draft".equals(action);
        boolean isApprove = "approve".equals(action);

        if (portRepository.existsByPortCode(request.getPortCode())) {
            throw new IllegalArgumentException("Mã " + request.getPortCode() + " đã tồn tại");
        }

        String portCode = request.getPortCode();
        if (portCode == null || portCode.trim().isEmpty()) {
            portCode = generatePortCode();
            log.info("Auto-generated port code: {}", portCode);
        }

        RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel() : RecordSecurityLevel.NORMAL;
        RecordSecurityLevel.validateAssignment(secLevel, "port", SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());

        Port entity = Port.builder()
                .securityLevel(secLevel)
                .portCode(portCode)
                .portName(request.getPortName())
                .province(request.getProvince())
                .area(request.getArea())
                .maxVesselCapacity(request.getMaxVesselCapacity())
                .operationalStatus(request.getOperationalStatus())
                .approvalStatus(isDraft ? ApprovalStatus.DRAFT : isApprove ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING_APPROVAL)
                .orgUnitId(request.getOrgUnitId())
                .portGroup(request.getPortGroup())
                .mapSymbolId(request.getMapSymbolId())
                .spatialId(request.getSpatialId())
                // Extended fields
                .detailedLocation(request.getDetailedLocation())
                .portClass(request.getPortClass())
                .coordinateSystem(request.getCoordinateSystem())
                .displayRule(request.getDisplayRule())
                // zobjDataSub fields
                .waterAreaScope(request.getWaterAreaScope())
                .totalBerths(request.getTotalBerths())
                .totalAnchoragesTransshipment(request.getTotalAnchoragesTransshipment())
                .totalPublicChannels(request.getTotalPublicChannels())
                .totalDedicatedChannels(request.getTotalDedicatedChannels())
                .totalPublicChannelLength(request.getTotalPublicChannelLength())
                .totalDedicatedChannelLength(request.getTotalDedicatedChannelLength())
                .totalBuoysBeacons(request.getTotalBuoysBeacons())
                .totalDikes(request.getTotalDikes())
                .totalDikeLength(request.getTotalDikeLength())
                .totalLighthouses(request.getTotalLighthouses())
                .buoyBerthCount(request.getBuoyBerthCount())
                .anchorageCount(request.getAnchorageCount())
                .transshipmentCount(request.getTransshipmentCount())
                .otherWaterAreas(request.getOtherWaterAreas())
                .remarks(request.getRemarks())
                .build();

        Port saved = portRepository.save(entity);

        // ── Handle PortInfrastructure list ────────────────────────────
        if (request.getInfrastructureList() != null && !request.getInfrastructureList().isEmpty()) {
            for (PortInfrastructureDto dto : request.getInfrastructureList()) {
                PortInfrastructure infra = new PortInfrastructure();
                infra.setPort(saved);
                infra.setStt(dto.getStt());
                infra.setInfraName(dto.getInfraName());
                infra.setQuantity(dto.getQuantity());
                saved.getInfrastructureList().add(infra);
            }
            saved = portRepository.save(saved);
        }

        // ── Handle PortAttachment list ────────────────────────────────
        if (request.getAttachments() != null && !request.getAttachments().isEmpty()) {
            for (PortAttachmentDto dto : request.getAttachments()) {
                PortAttachment att = new PortAttachment();
                att.setPort(saved);
                att.setFileName(dto.getFileName());
                att.setFilePath(dto.getFilePath());
                att.setFileSize(dto.getFileSize());
                att.setContentType(dto.getContentType());
                att.setUploadedBy(dto.getUploadedBy());
                saved.getAttachments().add(att);
            }
            saved = portRepository.save(saved);
        }

        // ── Spatial sync ──────────────────────────────────────────────
        // Only auto-create a GIS spatial object when NO spatialId was provided in the request.
        // When a spatialId is provided, the pre-created GIS object (created via the GIS map) is
        // the single source of truth for coordinates and is linked directly (see builder above).
        if (request.getSpatialId() == null) {
            String coordinates = request.getCoordinates();
            // Derive WKT from coordinateList if no top-level coordinates provided
            if ((request.getCoordinates() == null || request.getCoordinates().trim().isEmpty())
                    && request.getLatitude() == null && request.getLongitude() == null
                    && request.getCoordinateList() != null && !request.getCoordinateList().isEmpty()) {
                PortCoordinateDto first = request.getCoordinateList().get(0);
                if (request.getCoordinateList().size() == 1) {
                    coordinates = "POINT(" + first.getLongitude() + " " + first.getLatitude() + ")";
                } else {
                    // Build POLYGON or LINESTRING from all coordinates
                    StringBuilder sb = new StringBuilder("POLYGON((");
                    for (int i = 0; i < request.getCoordinateList().size(); i++) {
                        PortCoordinateDto c = request.getCoordinateList().get(i);
                        if (i > 0) sb.append(", ");
                        sb.append(c.getLongitude()).append(" ").append(c.getLatitude());
                    }
                    // Close the polygon
                    PortCoordinateDto firstCoord = request.getCoordinateList().get(0);
                    sb.append(", ").append(firstCoord.getLongitude()).append(" ").append(firstCoord.getLatitude());
                    sb.append("))");
                    coordinates = sb.toString();
                }
            }
            if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null && request.getLatitude() != null) {
                coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
            }

            if (coordinates != null && !coordinates.trim().isEmpty()) {
                com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
                com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_PORT;
                UUID refId = saved.getId();
                com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        null,
                        saved.getPortName(),
                        "PORT_" + saved.getPortCode(),
                        geomType,
                        objType,
                        coordinates,
                        refId,
                        com.hanghai.kchtg.gis.search.dto.InfrastructureType.SEAPORT
                );
                saved.setSpatialId(spatialObj.getId());
                saved = portRepository.save(saved);
            }
        }

        // Record all fields as new in change history
        Port emptySnapshot = new Port();
        changeTrackingService.recordChanges("Port", saved.getId().toString(), "system", emptySnapshot, saved);

        log.info("Created Port [{}] code={}", saved.getId(), saved.getPortCode());
        portCacheService.evictAfterCommit();
        return toResponse(saved);
    }

    // ── READ ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PortResponse getById(UUID id) {
        Port entity = portRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public Page<PortResponse> findAll(int page, int size, UUID orgUnitId) {
        return findAll(page, size, orgUnitId, null, null, null, null, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<PortResponse> findAll(int page, int size, UUID orgUnitId,
                                          String portCode, String portName, String province,
                                          String operationalStatus, String approvalStatus,
                                          Integer portGroup, Integer portClass,
                                          String updatedFrom, String updatedTo,
                                          String search) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));

        OperationalStatus statusEnum = operationalStatus != null ? OperationalStatus.fromString(operationalStatus) : null;
        ApprovalStatus approvalEnum = approvalStatus != null ? ApprovalStatus.fromString(approvalStatus) : null;
        LocalDateTime updatedFromDt = null;
        if (updatedFrom != null && !updatedFrom.trim().isEmpty()) {
            try {
                updatedFromDt = LocalDateTime.parse(updatedFrom.replace(" ", "T"));
            } catch (Exception e) { /* ignore */ }
        }
        LocalDateTime updatedToDt = null;
        if (updatedTo != null && !updatedTo.trim().isEmpty()) {
            try {
                updatedToDt = LocalDateTime.parse(updatedTo.replace(" ", "T"));
            } catch (Exception e) { /* ignore */ }
        }
        Page<Port> results = portRepository.searchPorts(
                orgUnitId, portCode, portName, province, statusEnum, approvalEnum, portGroup, portClass, updatedFromDt, updatedToDt, search, pageable);

        java.util.Set<UUID> userUuids = new java.util.HashSet<>();
        results.getContent().forEach(e -> {
            try {
                if (e.getCreatedBy() != null) userUuids.add(e.getCreatedBy());
                if (e.getUpdatedBy() != null) userUuids.add(e.getUpdatedBy());
            } catch (Exception ex) {
                // ignore
            }
        });

        java.util.Map<String, String> userNamesMap = new java.util.HashMap<>();
        if (!userUuids.isEmpty()) {
            userRepository.findAllById(userUuids).forEach(usr -> {
                String displayName = usr.getFullName() != null && !usr.getFullName().trim().isEmpty()
                        ? usr.getFullName()
                        : usr.getUsername();
                userNamesMap.put(usr.getId().toString(), displayName);
            });
        }

        // The list contract does not use child collections. Avoid lazy-loading
        // infrastructure and attachments for every row (and the resulting N+1
        // queries) when the list is rendered.
        return results.map(e -> toResponse(
                e,
                userNamesMap.get(e.getCreatedBy()),
                userNamesMap.get(e.getUpdatedBy()),
                false));
    }

    @Transactional(readOnly = true)
    public List<PortOptionResponse> getOptions() {
        return portCacheService.getOptions();
    }

    // ── UPDATE ──────────────────────────────────────────────────

    @Transactional
    public PortResponse update(UpdatePortRequest request) {
        FieldWriteGuard.validateObject(request);
        Port entity = portRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + request.getId()));

        String coordinates = request.getCoordinates();
        // Derive WKT from coordinateList if no top-level coordinates provided
        if ((request.getCoordinates() == null || request.getCoordinates().trim().isEmpty())
                && request.getLatitude() == null && request.getLongitude() == null
                && request.getCoordinateList() != null && !request.getCoordinateList().isEmpty()) {
            PortCoordinateDto first = request.getCoordinateList().get(0);
            if (request.getCoordinateList().size() == 1) {
                coordinates = "POINT(" + first.getLongitude() + " " + first.getLatitude() + ")";
            } else {
                // Build POLYGON or LINESTRING from all coordinates
                StringBuilder sb = new StringBuilder("POLYGON((");
                for (int i = 0; i < request.getCoordinateList().size(); i++) {
                    PortCoordinateDto c = request.getCoordinateList().get(i);
                    if (i > 0) sb.append(", ");
                    sb.append(c.getLongitude()).append(" ").append(c.getLatitude());
                }
                // Close the polygon
                PortCoordinateDto firstCoord = request.getCoordinateList().get(0);
                sb.append(", ").append(firstCoord.getLongitude()).append(" ").append(firstCoord.getLatitude());
                sb.append("))");
                coordinates = sb.toString();
            }
        }
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        // Capture pre-mutation snapshot before applying changes
        Port preImage = Port.builder()
                .id(entity.getId())
                .portCode(entity.getPortCode())
                .portName(entity.getPortName())
                .province(entity.getProvince())

                .area(entity.getArea())
                .maxVesselCapacity(entity.getMaxVesselCapacity())
                .orgUnitId(entity.getOrgUnitId())
                .portGroup(entity.getPortGroup())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
                .mapSymbolId(entity.getMapSymbolId())
                .spatialId(entity.getSpatialId())
                // Extended fields (pre-image)
                .detailedLocation(entity.getDetailedLocation())
                .portClass(entity.getPortClass())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
                // zobjDataSub fields (pre-image)
                .waterAreaScope(entity.getWaterAreaScope())
                .totalBerths(entity.getTotalBerths())
                .totalAnchoragesTransshipment(entity.getTotalAnchoragesTransshipment())
                .totalPublicChannels(entity.getTotalPublicChannels())
                .totalDedicatedChannels(entity.getTotalDedicatedChannels())
                .totalPublicChannelLength(entity.getTotalPublicChannelLength())
                .totalDedicatedChannelLength(entity.getTotalDedicatedChannelLength())
                .totalBuoysBeacons(entity.getTotalBuoysBeacons())
                .totalDikes(entity.getTotalDikes())
                .totalDikeLength(entity.getTotalDikeLength())
                .totalLighthouses(entity.getTotalLighthouses())
                .buoyBerthCount(entity.getBuoyBerthCount())
                .anchorageCount(entity.getAnchorageCount())
                .transshipmentCount(entity.getTransshipmentCount())
                .otherWaterAreas(entity.getOtherWaterAreas())
                .remarks(entity.getRemarks())
                .build();

        // Update mutable fields — code (portCode) is immutable
        if (request.getSecurityLevel() != null) {
            RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "port", SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
            entity.setSecurityLevel(request.getSecurityLevel());
        }
        if (request.getPortName() != null) entity.setPortName(request.getPortName());
        if (request.getProvince() != null) entity.setProvince(request.getProvince());

        if (request.getArea() != null) entity.setArea(request.getArea());
        if (request.getMaxVesselCapacity() != null) entity.setMaxVesselCapacity(request.getMaxVesselCapacity());
        if (request.getOrgUnitId() != null) {
            UUID oldOrgUnitId = entity.getOrgUnitId();
            entity.setOrgUnitId(request.getOrgUnitId());
            if (!request.getOrgUnitId().equals(oldOrgUnitId)) {
                berthRepository.findByPortIdAndDeletedAtIsNull(entity.getId()).forEach(bc -> {
                    bc.setOrgUnitId(request.getOrgUnitId());
                    berthRepository.save(bc);
                    pierRepository.findByBerthIdAndDeletedAtIsNull(bc.getId()).forEach(cc -> {
                        cc.setOrgUnitId(request.getOrgUnitId());
                        pierRepository.save(cc);
                    });
                });
                waterZoneRepository.findByPortIdAndDeletedAtIsNull(entity.getId()).forEach(vn -> {
                    vn.setOrgUnitId(request.getOrgUnitId());
                    waterZoneRepository.save(vn);
                });
            }
        }
        if (request.getPortGroup() != null) entity.setPortGroup(request.getPortGroup());
        if (request.getMapSymbolId() != null) entity.setMapSymbolId(request.getMapSymbolId());
        entity.setOperationalStatus(request.getOperationalStatus() != null ? request.getOperationalStatus() : entity.getOperationalStatus());
        // Khi chỉnh sửa: nếu đang "Được phê duyệt" → quay về "Chờ phê duyệt" để duyệt lại;
        // "Nháp" giữ nguyên Nháp, các trạng thái còn lại giữ nguyên.
        if (request.getApprovalStatus() == ApprovalStatus.APPROVED) {
            entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        } else if (request.getApprovalStatus() != null) {
            entity.setApprovalStatus(request.getApprovalStatus());
        } else {
            entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        }

        // Update extended fields
        if (request.getDetailedLocation() != null) entity.setDetailedLocation(request.getDetailedLocation());
        if (request.getPortClass() != null) entity.setPortClass(request.getPortClass());
        if (request.getCoordinateSystem() != null) entity.setCoordinateSystem(request.getCoordinateSystem());
        if (request.getDisplayRule() != null) entity.setDisplayRule(request.getDisplayRule());

        // Update zobjDataSub fields
        if (request.getWaterAreaScope() != null) entity.setWaterAreaScope(request.getWaterAreaScope());
        if (request.getTotalBerths() != null) entity.setTotalBerths(request.getTotalBerths());
        if (request.getTotalAnchoragesTransshipment() != null) entity.setTotalAnchoragesTransshipment(request.getTotalAnchoragesTransshipment());
        if (request.getTotalPublicChannels() != null) entity.setTotalPublicChannels(request.getTotalPublicChannels());
        if (request.getTotalDedicatedChannels() != null) entity.setTotalDedicatedChannels(request.getTotalDedicatedChannels());
        if (request.getTotalPublicChannelLength() != null) entity.setTotalPublicChannelLength(request.getTotalPublicChannelLength());
        if (request.getTotalDedicatedChannelLength() != null) entity.setTotalDedicatedChannelLength(request.getTotalDedicatedChannelLength());
        if (request.getTotalBuoysBeacons() != null) entity.setTotalBuoysBeacons(request.getTotalBuoysBeacons());
        if (request.getTotalDikes() != null) entity.setTotalDikes(request.getTotalDikes());
        if (request.getTotalDikeLength() != null) entity.setTotalDikeLength(request.getTotalDikeLength());
        if (request.getTotalLighthouses() != null) entity.setTotalLighthouses(request.getTotalLighthouses());
        if (request.getBuoyBerthCount() != null) entity.setBuoyBerthCount(request.getBuoyBerthCount());
        if (request.getAnchorageCount() != null) entity.setAnchorageCount(request.getAnchorageCount());
        if (request.getTransshipmentCount() != null) entity.setTransshipmentCount(request.getTransshipmentCount());
        if (request.getOtherWaterAreas() != null) entity.setOtherWaterAreas(request.getOtherWaterAreas());
        if (request.getRemarks() != null) entity.setRemarks(request.getRemarks());

        // ── Handle PortInfrastructure list (replace) ──────────────────
        if (request.getInfrastructureList() != null) {
            entity.getInfrastructureList().clear();
            for (PortInfrastructureDto dto : request.getInfrastructureList()) {
                PortInfrastructure infra = new PortInfrastructure();
                infra.setPort(entity);
                infra.setStt(dto.getStt());
                infra.setInfraName(dto.getInfraName());
                infra.setQuantity(dto.getQuantity());
                entity.getInfrastructureList().add(infra);
            }
        }

        // ── Handle PortAttachment list (replace) ──────────────────────
        if (request.getAttachments() != null) {
            entity.getAttachments().clear();
            for (PortAttachmentDto dto : request.getAttachments()) {
                PortAttachment att = new PortAttachment();
                att.setPort(entity);
                att.setFileName(dto.getFileName());
                att.setFilePath(dto.getFilePath());
                att.setFileSize(dto.getFileSize());
                att.setContentType(dto.getContentType());
                att.setUploadedBy(dto.getUploadedBy());
                entity.getAttachments().add(att);
            }
        }

        Port saved = portRepository.save(entity);

        if (coordinates != null && !coordinates.trim().isEmpty()) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_PORT;
            UUID refId = saved.getId();
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getSpatialId(),
                    saved.getPortName(),
                    "PORT_" + saved.getPortCode(),
                    geomType,
                    objType,
                    coordinates,
                    refId,
                    com.hanghai.kchtg.gis.search.dto.InfrastructureType.SEAPORT
            );
            saved.setSpatialId(spatialObj.getId());
            saved = portRepository.save(saved);
        }

        // Record field-level change history
        changeTrackingService.recordChanges("Port", saved.getId().toString(), "system", preImage, saved);

        log.info("Updated Port [{}] code={}", saved.getId(), saved.getPortCode());
        portCacheService.evictAfterCommit();
        return toResponse(saved);
    }

    // ── DELETE ──────────────────────────────────────────────────

    @Transactional
    public void softDelete(UUID id) {
        Port entity = portRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));
        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT) {
            throw new IllegalArgumentException("Chỉ được xóa cảng biển ở trạng thái Nháp");
        }

        // Guard: cannot soft-delete if children exist
        long berthCount = countBerthByPortId(id);
        long waterZoneCount = countWaterZoneByPortId(id);

        if (berthCount > 0 || waterZoneCount > 0) {
            StringBuilder msg = new StringBuilder("Không thể xóa: còn ");
            if (berthCount > 0) msg.append(berthCount).append(" bến cảng đang hoạt động");
            if (berthCount > 0 && waterZoneCount > 0) msg.append(", ");
            if (waterZoneCount > 0) msg.append(waterZoneCount).append(" vùng nước đang hoạt động");
            throw new IllegalArgumentException(msg.toString());
        }

        // Capture snapshot before soft-delete for change history
        Port snapshot = Port.builder()
                .id(entity.getId()).portCode(entity.getPortCode()).portName(entity.getPortName())
                .province(entity.getProvince()).area(entity.getArea()).maxVesselCapacity(entity.getMaxVesselCapacity())
                .orgUnitId(entity.getOrgUnitId()).portGroup(entity.getPortGroup())
                .operationalStatus(entity.getOperationalStatus()).approvalStatus(entity.getApprovalStatus())
                .mapSymbolId(entity.getMapSymbolId()).spatialId(entity.getSpatialId())
                .detailedLocation(entity.getDetailedLocation()).portClass(entity.getPortClass())
                .coordinateSystem(entity.getCoordinateSystem()).displayRule(entity.getDisplayRule())
                .waterAreaScope(entity.getWaterAreaScope()).totalBerths(entity.getTotalBerths())
                .totalAnchoragesTransshipment(entity.getTotalAnchoragesTransshipment())
                .totalPublicChannels(entity.getTotalPublicChannels()).totalDedicatedChannels(entity.getTotalDedicatedChannels())
                .totalPublicChannelLength(entity.getTotalPublicChannelLength()).totalDedicatedChannelLength(entity.getTotalDedicatedChannelLength())
                .totalBuoysBeacons(entity.getTotalBuoysBeacons()).totalDikes(entity.getTotalDikes())
                .totalDikeLength(entity.getTotalDikeLength()).totalLighthouses(entity.getTotalLighthouses())
                .buoyBerthCount(entity.getBuoyBerthCount()).anchorageCount(entity.getAnchorageCount())
                .transshipmentCount(entity.getTransshipmentCount()).otherWaterAreas(entity.getOtherWaterAreas())
                .remarks(entity.getRemarks()).build();

        entity.softDelete(com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId());
        portRepository.save(entity);
        changeTrackingService.recordChanges("Port", entity.getId().toString(), "system", snapshot, entity);
        changeHistoryService.insertChangeRecord("Port", entity.getId(), "Trạng thái", null, "Đã xóa", "system");
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        log.info("Soft-deleted Port [{}] code={}", entity.getId(), entity.getPortCode());
        portCacheService.evictAfterCommit();
    }

    // ── CHILD GUARD (Feature 1) ────────────────────────────

    /**
     * Đếm số lượng berth và water_zone active của một port.
     * Dùng cho child-guard check ở UI.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getChildCounts(UUID id) {
        if (!portRepository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id);
        }

        long berthCount = countBerthByPortId(id);
        long waterZoneCount = countWaterZoneByPortId(id);

        Map<String, Object> result = new HashMap<>();
        result.put("hasChildren", berthCount > 0 || waterZoneCount > 0);
        result.put("berthCount", berthCount);
        result.put("waterZoneCount", waterZoneCount);
        log.info("Port [{}] children: berthCount={}, waterZoneCount={}", id, berthCount, waterZoneCount);
        return result;
    }

    // ── SOFT-DELETE RESTORE (Feature 2) ─────────────────────

    /**
     * Khôi phục cảng biển đã xóa mềm.
     * Chỉ restore nếu deletedAt không null và trong vòng 90 ngày.
     * Sử dụng native query để bypass @SQLRestriction.
     */
    @Transactional
    public PortResponse restore(UUID id) {
        // Tìm port đã xóa (native query bypasses @SQLRestriction)
        Object[] deletedInfo = portRepository.findDeletedPortById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển đã xóa với id: " + id));

        LocalDateTime deletedAt = (LocalDateTime) deletedInfo[1];

        // Kiểm tra 90 ngày
        if (deletedAt.isBefore(LocalDateTime.now().minusDays(90))) {
            throw new IllegalArgumentException("Cảng biển đã bị xóa quá 90 ngày (từ " + deletedAt + "), không thể khôi phục");
        }

        // Thực hiện restore
        int updated = portRepository.restorePortById(id);
        if (updated == 0) {
            throw new IllegalStateException("Không thể khôi phục cảng biển: không tìm thấy bản ghi đã xóa");
        }

        // Tải lại entity đã khôi phục (now deleted_at = NULL, @SQLRestriction matches)
        Port restored = portRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không thể tải cảng biển sau khi khôi phục"));

        log.info("Restored Port [{}] code={}", restored.getId(), restored.getPortCode());
        portCacheService.evictAfterCommit();
        return toResponse(restored);
    }

    // ── Count helpers ──────────────────────────────────────

    private long countBerthByPortId(UUID portId) {
        return berthRepository.countByPortIdAndDeletedAtIsNull(portId);
    }

    private long countWaterZoneByPortId(UUID portId) {
        return waterZoneRepository.countByPortIdAndDeletedAtIsNull(portId);
    }

    // ── Internal helpers ─────────────────────────────────────────────────

    private PortResponse toResponse(Port entity) {
        return toResponse(entity, null, null, true);
    }

    private PortResponse toResponse(Port entity, String preResolvedCreatorName, String preResolvedUpdaterName) {
        return toResponse(entity, preResolvedCreatorName, preResolvedUpdaterName, true);
    }

    private PortResponse toResponse(Port entity, String preResolvedCreatorName, String preResolvedUpdaterName,
                                    boolean includeChildCollections) {
        String createdBy = preResolvedCreatorName != null ? preResolvedCreatorName 
                : userResolverService.resolveName(entity.getCreatedBy());
        String updatedBy = preResolvedUpdaterName != null ? preResolvedUpdaterName 
                : userResolverService.resolveName(entity.getUpdatedBy());
        // Fallback to UUID substring if name resolution returns null
        if (createdBy == null && entity.getCreatedBy() != null) createdBy = entity.getCreatedBy().toString().substring(0, 8);
        if (updatedBy == null && entity.getUpdatedBy() != null) updatedBy = entity.getUpdatedBy().toString().substring(0, 8);

        PortResponse.PortResponseBuilder builder = PortResponse.builder()
                .id(entity.getId())
                .securityLevel(entity.getSecurityLevel())
                .portCode(entity.getPortCode())
                .portName(entity.getPortName())
                .province(entity.getProvince())
                .area(entity.getArea())
                .maxVesselCapacity(entity.getMaxVesselCapacity())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
                .orgUnitId(entity.getOrgUnitId()).orgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))
                .portGroup(entity.getPortGroup())
                .mapSymbolId(entity.getMapSymbolId())
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .createdByName(createdBy)
                .updatedByName(updatedBy)
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                // Extended fields
                .detailedLocation(entity.getDetailedLocation())
                .portClass(entity.getPortClass())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
                // zobjDataSub fields
                .waterAreaScope(entity.getWaterAreaScope())
                .totalBerths(entity.getTotalBerths())
                .totalAnchoragesTransshipment(entity.getTotalAnchoragesTransshipment())
                .totalPublicChannels(entity.getTotalPublicChannels())
                .totalDedicatedChannels(entity.getTotalDedicatedChannels())
                .totalPublicChannelLength(entity.getTotalPublicChannelLength())
                .totalDedicatedChannelLength(entity.getTotalDedicatedChannelLength())
                .totalBuoysBeacons(entity.getTotalBuoysBeacons())
                .totalDikes(entity.getTotalDikes())
                .totalDikeLength(entity.getTotalDikeLength())
                .totalLighthouses(entity.getTotalLighthouses())
                .buoyBerthCount(entity.getBuoyBerthCount())
                .anchorageCount(entity.getAnchorageCount())
                .transshipmentCount(entity.getTransshipmentCount())
                .otherWaterAreas(entity.getOtherWaterAreas())
                .remarks(entity.getRemarks());

        if (entity.getSpatialId() != null) {
            builder.spatialId(entity.getSpatialId());
            gisSpatialObjectService.findById(entity.getSpatialId()).ifPresent(spatialObj -> {
                builder.geometryType(spatialObj.getGeometryType());
                builder.coordinates(spatialObj.getCoordinates());
                try {
                    String clean = spatialObj.getCoordinates().replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        builder.longitude(new BigDecimal(parts[0]));
                        builder.latitude(new BigDecimal(parts[1]));
                    }
                } catch (Exception ex) {
                    // ignore
                }
            });
        }

        // Parse coordinateList from spatial WKT (single source of truth: gis_spatial_objects)
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.findById(entity.getSpatialId()).ifPresent(spatialObj -> {
                String wkt = spatialObj.getCoordinates();
                if (wkt != null && !wkt.trim().isEmpty()) {
                    List<PortCoordinateDto> coordList = new ArrayList<>();
                    try {
                        String clean = wkt.trim();
                        if (clean.startsWith("POINT")) {
                            String inner = clean.replace("POINT", "").replace("(", "").replace(")", "").trim();
                            String[] parts = inner.split("\\s+");
                            if (parts.length == 2) {
                                PortCoordinateDto dto = new PortCoordinateDto();
                                dto.setLongitude(new BigDecimal(parts[0]));
                                dto.setLatitude(new BigDecimal(parts[1]));
                                dto.setSortOrder(0);
                                coordList.add(dto);
                            }
                        } else if (clean.startsWith("POLYGON")) {
                            String inner = clean.replace("POLYGON", "").replace("((", "").replace("))", "").trim();
                            String[] pointStrings = inner.split(",");
                            int idx = 0;
                            for (String ps : pointStrings) {
                                String[] parts = ps.trim().split("\\s+");
                                if (parts.length >= 2) {
                                    PortCoordinateDto dto = new PortCoordinateDto();
                                    dto.setLongitude(new BigDecimal(parts[0]));
                                    dto.setLatitude(new BigDecimal(parts[1]));
                                    dto.setSortOrder(idx);
                                    coordList.add(dto);
                                    idx++;
                                }
                            }
                            // Remove last point if it closes back to first (polygon closure)
                            if (coordList.size() >= 2) {
                                PortCoordinateDto last = coordList.get(coordList.size() - 1);
                                PortCoordinateDto first = coordList.get(0);
                                if (last.getLatitude().compareTo(first.getLatitude()) == 0
                                        && last.getLongitude().compareTo(first.getLongitude()) == 0) {
                                    coordList.remove(coordList.size() - 1);
                                }
                            }
                        }
                    } catch (Exception ex) {
                        log.warn("Không thể parse WKT thành coordinateList: {}", ex.getMessage());
                    }
                    if (!coordList.isEmpty()) {
                        builder.coordinateList(coordList);
                    }
                }
            });
        }
        // Child collections are needed for detail/create/update responses, but
        // not for the paged list response. Keeping them out of the list avoids
        // lazy-loading one query per port and keeps list reads independent from
        // attachment-table privileges.
        if (includeChildCollections && entity.getInfrastructureList() != null) {
            builder.infrastructureList(entity.getInfrastructureList().stream().map(infra -> {
                PortInfrastructureDto dto = new PortInfrastructureDto();
                dto.setStt(infra.getStt()); dto.setInfraName(infra.getInfraName()); dto.setQuantity(infra.getQuantity());
                return dto;
            }).collect(Collectors.toList()));
        }
        if (includeChildCollections && entity.getAttachments() != null) {
            builder.attachments(entity.getAttachments().stream().map(att -> {
                PortAttachmentDto dto = new PortAttachmentDto();
                dto.setId(att.getId()); dto.setFileName(att.getFileName()); dto.setFilePath(att.getFilePath());
                dto.setFileSize(att.getFileSize()); dto.setContentType(att.getContentType());
                return dto;
            }).collect(Collectors.toList()));
        }
        return builder.build();
    }

    // ── Attachment operations ──────────────────────────────────────────

    private static final long MAX_FILE_SIZE = 20971520; // 20MB
    private static final long MAX_FILES_PER_PORT = 10;

    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/tiff"
    );

    private static final List<String> ALLOWED_EXTENSIONS = List.of(
            "pdf", "doc", "docx", "xls", "xlsx", "jpg", "jpeg", "png", "tiff", "tif"
    );

    @Transactional
    public List<PortAttachmentDto> uploadAttachments(UUID portId, List<MultipartFile> files, UUID userId) {
        Port port = portRepository.findById(portId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + portId));

        // Validate total file count per port
        long existingCount = portAttachmentRepository.countByPortId(portId);
        if (existingCount + files.size() > MAX_FILES_PER_PORT) {
            throw new IllegalArgumentException(
                    String.format("Số lượng file đính kèm vượt quá giới hạn (tối đa %d file). Hiện có: %d, đang tải lên: %d",
                            MAX_FILES_PER_PORT, existingCount, files.size()));
        }

        List<PortAttachment> savedAttachments = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                throw new IllegalArgumentException("File '" + file.getOriginalFilename() + "' không được để trống");
            }

            validateFile(file);

            String originalFilename = Objects.requireNonNullElse(file.getOriginalFilename(), "unknown");
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmssSSS"));
            String storagePath = saveFileToDisk(portId, timestamp, originalFilename, file);

            PortAttachment attachment = new PortAttachment();
            attachment.setPort(port);
            attachment.setFileName(originalFilename);
            attachment.setFilePath(storagePath);
            attachment.setFileSize(file.getSize());
            attachment.setContentType(file.getContentType());
            attachment.setUploadedBy(userId);

            PortAttachment saved = portAttachmentRepository.save(attachment);
            savedAttachments.add(saved);
            log.info("Saved PortAttachment [{}] for Port [{}]: fileName={}, size={}",
                    saved.getId(), portId, originalFilename, file.getSize());
        }

        return savedAttachments.stream().map(this::toAttachmentDto).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<PortAttachmentDto> listAttachments(UUID portId) {
        List<PortAttachment> attachments = portAttachmentRepository.findByPortIdOrderByUploadedAtDesc(portId);
        return attachments.stream().map(this::toAttachmentDto).collect(Collectors.toList());
    }

    @Transactional
    public void deleteAttachment(UUID portId, UUID attachmentId, UUID userId) {
        Port port = portRepository.findById(portId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + portId));

        // Only allow deletion when port is in draft/pending state
        if (port.getApprovalStatus() != null && port.getApprovalStatus() == com.hanghai.kchtg.common.entity.ApprovalStatus.APPROVED) {
            throw new IllegalArgumentException("Chỉ có thể xóa file đính kèm khi cảng biển ở trạng thái nháp");
        }

        PortAttachment attachment = portAttachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file đính kèm với id: " + attachmentId));

        if (!attachment.getPort().getId().equals(portId)) {
            throw new IllegalArgumentException("File đính kèm không thuộc về cảng biển này");
        }

        // Delete file from disk
        try {
            Path filePath = Paths.get(attachment.getFilePath());
            Files.deleteIfExists(filePath);
            log.info("Deleted file from disk: {}", attachment.getFilePath());
        } catch (IOException e) {
            log.warn("Không thể xóa file từ đĩa: {}", attachment.getFilePath(), e);
        }

        portAttachmentRepository.delete(attachment);
        log.info("Deleted PortAttachment [{}] for Port [{}]", attachmentId, portId);
    }

    private void validateFile(MultipartFile file) {
        // Validate file size
        if (file.getSize() <= 0) {
            throw new IllegalArgumentException("Kích thước file không hợp lệ");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            long maxMB = MAX_FILE_SIZE / (1024 * 1024);
            long fileMB = file.getSize() / (1024 * 1024);
            throw new IllegalArgumentException(
                    String.format("File '%s' quá lớn (%d MB). Kích thước tối đa: %d MB",
                            file.getOriginalFilename(), fileMB, maxMB));
        }

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            // Fallback: validate by file extension
            String originalFilename = file.getOriginalFilename();
            if (originalFilename != null) {
                String ext = originalFilename.substring(originalFilename.lastIndexOf('.') + 1).toLowerCase();
                if (!ALLOWED_EXTENSIONS.contains(ext)) {
                    throw new IllegalArgumentException(
                            "Định dạng file '" + originalFilename + "' không được hỗ trợ. "
                                    + "Chỉ chấp nhận: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, TIFF");
                }
            } else {
                throw new IllegalArgumentException("Không xác định được loại file");
            }
        }
    }

    private String saveFileToDisk(UUID portId, String timestamp, String originalFilename, MultipartFile file) {
        try {
            String dirPath = uploadPath + "/" + portId.toString();
            Path dir = Paths.get(dirPath);
            Files.createDirectories(dir);

            String safeName = timestamp + "_" + originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
            Path targetPath = dir.resolve(safeName);
            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            log.info("Saved file to disk: {}", targetPath.toString());
            return targetPath.toString();
        } catch (IOException e) {
            throw new RuntimeException("Không thể lưu file: " + originalFilename, e);
        }
    }

    private PortAttachmentDto toAttachmentDto(PortAttachment entity) {
        PortAttachmentDto dto = new PortAttachmentDto();
        dto.setId(entity.getId());
        dto.setFileName(entity.getFileName());
        dto.setFilePath(entity.getFilePath());
        dto.setFileSize(entity.getFileSize());
        dto.setContentType(entity.getContentType());
        dto.setUploadedBy(entity.getUploadedBy());
        dto.setUploadedAt(entity.getUploadedAt());
        return dto;
    }

    // ── Generic attachment operations (shared attachments table) ────────

    @Transactional
    public List<AttachmentDto> uploadAttachmentsGeneric(UUID portId, List<MultipartFile> files, UUID userId) {
        long count = attachmentRepository.countByEntityTypeAndEntityId("PORT", portId);
        if (count + files.size() > 10) throw new IllegalArgumentException("Tối đa 10 file");
        List<Attachment> saved = new ArrayList<>();
        java.nio.file.Path basePath = java.nio.file.Paths.get(uploadPath).toAbsolutePath().normalize();
        for (MultipartFile f : files) {
            String fn = f.getOriginalFilename() != null ? f.getOriginalFilename() : "unknown";
            String storageFileName = System.currentTimeMillis() + "_" + fn;
            java.nio.file.Path dir = basePath.resolve("PORT").resolve(portId.toString());
            java.nio.file.Path filePath = dir.resolve(storageFileName);
            try { java.nio.file.Files.createDirectories(dir); f.transferTo(filePath.toFile()); }
            catch (Exception e) { throw new RuntimeException("Không thể lưu: " + fn); }
            String sp = filePath.toString();
            Attachment a = new Attachment(); a.setEntityType("PORT"); a.setEntityId(portId); a.setFileName(fn); a.setFilePath(sp); a.setFileSize(f.getSize()); a.setContentType(f.getContentType()); a.setUploadedBy(userId);
            saved.add(attachmentRepository.save(a));
        }
        return saved.stream().map(this::toAttachmentDto2).collect(Collectors.toList());
    }

    public List<AttachmentDto> listAttachmentsGeneric(UUID portId) {
        return attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("PORT", portId)
                .stream().map(this::toAttachmentDto2).collect(Collectors.toList());
    }

    @Transactional
    public void deleteAttachmentGeneric(UUID portId, UUID attId, UUID userId) {
        Attachment a = attachmentRepository.findById(attId).orElseThrow(() -> new EntityNotFoundException("Không tìm thấy: " + attId));
        try { java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(a.getFilePath())); } catch (Exception e) { log.warn("Xóa thất bại: {}", a.getFilePath()); }
        attachmentRepository.delete(a);
    }

    private AttachmentDto toAttachmentDto2(Attachment e) {
        AttachmentDto d = new AttachmentDto(); d.setId(e.getId()); d.setEntityType(e.getEntityType()); d.setEntityId(e.getEntityId());
        d.setFileName(e.getFileName()); d.setFilePath(e.getFilePath()); d.setFileSize(e.getFileSize()); d.setContentType(e.getContentType());
        d.setUploadedBy(e.getUploadedBy()); d.setUploadedAt(e.getUploadedAt()); return d;
    }
}
