package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.dto.port.*;
import com.hanghai.kchtg.port.entity.*;
import com.hanghai.kchtg.port.repository.*;
import com.hanghai.kchtg.port.service.shared.ChangeTrackingService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.security.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Service core for Port CRUD operations.
 * Supports unified PortStatus (replaces OperationalStatus + ApprovalStatus).
 * Supports composite form: coordinates + infrastructure sub-entities.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PortService {

    private final PortRepository portRepository;
    private final BerthRepository berthRepository;
    private final WaterZoneRepository waterZoneRepository;
    private final PierRepository pierRepository;
    private final PortCoordinateRepository portCoordinateRepository;
    private final PortInfrastructureRepository portInfrastructureRepository;
    private final PortAttachmentRepository portAttachmentRepository;
    private final ChangeTrackingService changeTrackingService;
    private final UserResolverService userResolverService;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;
    private final com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    // ── CODE GENERATION ─────────────────────────────────────────────

    /**
     * Generate the next port code in format "CB-XXXXXX".
     */
    public Map<String, String> generateCode() {
        Integer maxNum = portRepository.findMaxPortCodeNumber();
        int nextNum = (maxNum != null ? maxNum : 0) + 1;
        String code = String.format("CB-%06d", nextNum);
        return Map.of("code", code);
    }

    // ── CREATE (composite form) ─────────────────────────────────

    @Transactional
    public PortResponse create(CreatePortRequest request) {
        // Validate action
        String action = request.getAction();
        if (!"draft".equals(action) && !"submit".equals(action)) {
            throw new IllegalArgumentException("Action phải là 'draft' hoặc 'submit'");
        }

        // Generate port code (use provided code, or auto-generate)
        String portCode = request.getPortCode();
        if (portCode == null || portCode.trim().isEmpty()) {
            portCode = generateCode().get("code");
        }

        // Validate for submit action
        if ("submit".equals(action)) {
            if (request.getPortName() == null || request.getPortName().trim().isEmpty()) {
                throw new IllegalArgumentException("Tên cảng không được để trống khi gửi phê duyệt");
            }
            if (request.getOrgUnitId() == null) {
                throw new IllegalArgumentException("Đơn vị không được để trống khi gửi phê duyệt");
            }
            if (request.getProvince() == null || request.getProvince().trim().isEmpty()) {
                throw new IllegalArgumentException("Tỉnh/thành phố không được để trống khi gửi phê duyệt");
            }
            if (request.getPortClass() == null) {
                throw new IllegalArgumentException("Phân cấp cảng biển không được để trống khi gửi phê duyệt");
            }
            if (request.getPortCoordinates() == null || request.getPortCoordinates().isEmpty()) {
                throw new IllegalArgumentException("Phải có ít nhất một tọa độ khi gửi phê duyệt");
            }
        }

        // Set initial status
        PortStatus initialStatus = "submit".equals(action) ? PortStatus.CHO_PHE_DUYET : PortStatus.NHAP;

        Port entity = Port.builder()
                .portCode(portCode)
                .portName(request.getPortName())
                .province(request.getProvince())
                .area(request.getArea())
                .maxVesselCapacity(request.getMaxVesselCapacity())
                .portStatus(initialStatus)
                .orgUnitId(request.getOrgUnitId())
                .portGroup(request.getPortGroup())
                .mapSymbolId(request.getMapSymbolId())
                .managingUnitId(request.getManagingUnitId())
                .notes(request.getNotes())
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

        // Sync unified portStatus → legacy DB columns before save
        entity.syncOldFieldsFromPortStatus();

        Port saved = portRepository.save(entity);

        // Save port coordinates
        if (request.getPortCoordinates() != null && !request.getPortCoordinates().isEmpty()) {
            for (CoordinateDto coordDto : request.getPortCoordinates()) {
                PortCoordinate coord = PortCoordinate.builder()
                        .portId(saved.getId())
                        .latitude(coordDto.getLatitude())
                        .longitude(coordDto.getLongitude())
                        .sortOrder(coordDto.getSortOrder() != null ? coordDto.getSortOrder() : 0)
                        .build();
                portCoordinateRepository.save(coord);
            }
        }

        // Save port infrastructures
        if (request.getPortInfrastructures() != null && !request.getPortInfrastructures().isEmpty()) {
            for (InfrastructureDto infraDto : request.getPortInfrastructures()) {
                PortInfrastructure infra = PortInfrastructure.builder()
                        .portId(saved.getId())
                        .sequenceNumber(infraDto.getSequenceNumber() != null ? infraDto.getSequenceNumber() : 0)
                        .infrastructureName(infraDto.getInfrastructureName())
                        .quantity(infraDto.getQuantity() != null ? infraDto.getQuantity() : 1)
                        .build();
                portInfrastructureRepository.save(infra);
            }
        }

        // Handle GIS spatial object
        String coordinates = request.getCoordinates();
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

        log.info("Created Port [{}] code={}, status={}", saved.getId(), saved.getPortCode(), saved.getPortStatus());
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
        return findAll(page, size, orgUnitId, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<PortResponse> findAll(int page, int size, UUID orgUnitId,
                                          String portCode, String portName, String province,
                                          String portStatus,
                                          String search) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));

        PortStatus statusEnum = portStatus != null ? PortStatus.fromString(portStatus) : null;

        // Map unified PortStatus → legacy DB columns for query
        ApprovalStatus approvalStatusParam = null;
        OperationalStatus operationalStatusParam = null;
        boolean operationalStatusNull = false;
        if (statusEnum != null) {
            switch (statusEnum) {
                case NHAP:
                    approvalStatusParam = ApprovalStatus.PENDING;
                    operationalStatusNull = true;
                    break;
                case CHO_PHE_DUYET:
                    approvalStatusParam = ApprovalStatus.PENDING;
                    operationalStatusParam = OperationalStatus.HIEN_HANH;
                    break;
                case DA_PHE_DUYET:
                    approvalStatusParam = ApprovalStatus.APPROVED;
                    break;
                case TU_CHOI:
                    approvalStatusParam = ApprovalStatus.REJECTED;
                    break;
                case TAM_NGUNG:
                    approvalStatusParam = ApprovalStatus.APPROVED;
                    operationalStatusParam = OperationalStatus.TAM_NGUNG;
                    break;
                case DA_XOA:
                    // DA_XOA items have deletedAt set — excluded by deletedAt IS NULL
                    break;
            }
        }
        Page<Port> results = portRepository.searchPorts(
                orgUnitId, portCode, portName, province,
                approvalStatusParam, operationalStatusParam, operationalStatusNull,
                search, pageable);

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

        return results.map(e -> toResponse(e, userNamesMap.get(e.getCreatedBy()), userNamesMap.get(e.getUpdatedBy())));
    }

    // ── UPDATE (composite form) ──────────────────────────────────

    @Transactional
    public PortResponse update(UpdatePortRequest request) {
        Port entity = portRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + request.getId()));

        String coordinates = request.getCoordinates();
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
                .portStatus(entity.getPortStatus())
                .orgUnitId(entity.getOrgUnitId())
                .portGroup(entity.getPortGroup())
                .managingUnitId(entity.getManagingUnitId())
                .notes(entity.getNotes())
                .mapSymbolId(entity.getMapSymbolId())
                .detailedLocation(entity.getDetailedLocation())
                .portClass(entity.getPortClass())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
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
        entity.setMapSymbolId(request.getMapSymbolId());

        // Update managing unit
        if (request.getManagingUnitId() != null) entity.setManagingUnitId(request.getManagingUnitId());
        if (request.getNotes() != null) entity.setNotes(request.getNotes());

        // Auto-reset status on update: only if not draft
        if (entity.getPortStatus() != PortStatus.NHAP) {
            entity.setPortStatus(PortStatus.CHO_PHE_DUYET);
        }

        // Sync unified portStatus → legacy DB columns before save
        entity.syncOldFieldsFromPortStatus();

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

        Port saved = portRepository.save(entity);

        // Replace port coordinates: delete old, insert new
        if (request.getPortCoordinates() != null) {
            portCoordinateRepository.deleteByPortId(saved.getId());
            for (CoordinateDto coordDto : request.getPortCoordinates()) {
                PortCoordinate coord = PortCoordinate.builder()
                        .portId(saved.getId())
                        .latitude(coordDto.getLatitude())
                        .longitude(coordDto.getLongitude())
                        .sortOrder(coordDto.getSortOrder() != null ? coordDto.getSortOrder() : 0)
                        .build();
                portCoordinateRepository.save(coord);
            }
        }

        // Replace port infrastructures: delete old, insert new
        if (request.getPortInfrastructures() != null) {
            portInfrastructureRepository.deleteByPortId(saved.getId());
            for (InfrastructureDto infraDto : request.getPortInfrastructures()) {
                PortInfrastructure infra = PortInfrastructure.builder()
                        .portId(saved.getId())
                        .sequenceNumber(infraDto.getSequenceNumber() != null ? infraDto.getSequenceNumber() : 0)
                        .infrastructureName(infraDto.getInfrastructureName())
                        .quantity(infraDto.getQuantity() != null ? infraDto.getQuantity() : 1)
                        .build();
                portInfrastructureRepository.save(infra);
            }
        }

        // Handle GIS spatial object
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

        log.info("Updated Port [{}] code={}, status={}", saved.getId(), saved.getPortCode(), saved.getPortStatus());
        return toResponse(saved);
    }

    // ── DELETE ──────────────────────────────────────────────────

    @Transactional
    public void softDelete(UUID id) {
        Port entity = portRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id));

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

        entity.setPortStatus(PortStatus.DA_XOA);
        entity.syncOldFieldsFromPortStatus();
        entity.softDelete(SecurityUtils.getCurrentUserId());
        portRepository.save(entity);
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        log.info("Soft-deleted Port [{}] code={}", entity.getId(), entity.getPortCode());
    }

    // ── CHILDREN COUNT ──────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Long> getChildrenCount(UUID id) {
        if (!portRepository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy cảng biển với id: " + id);
        }
        long berthCount = countBerthByPortId(id);
        long waterZoneCount = countWaterZoneByPortId(id);
        Map<String, Long> result = new java.util.LinkedHashMap<>();
        result.put("berths", berthCount);
        result.put("waterZones", waterZoneCount);
        return result;
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
        return toResponse(entity, null, null);
    }

    private PortResponse toResponse(Port entity, String preResolvedCreatorName, String preResolvedUpdaterName) {
        String createdBy = preResolvedCreatorName != null ? preResolvedCreatorName : userResolverService.resolveName(entity.getCreatedBy());
        String updatedBy = preResolvedUpdaterName != null ? preResolvedUpdaterName : userResolverService.resolveName(entity.getUpdatedBy());

        // Load sub-entities
        List<CoordinateResponse> coords = portCoordinateRepository
                .findByPortIdAndDeletedAtIsNullOrderBySortOrderAsc(entity.getId())
                .stream()
                .map(c -> CoordinateResponse.builder()
                        .id(c.getId())
                        .latitude(c.getLatitude())
                        .longitude(c.getLongitude())
                        .sortOrder(c.getSortOrder())
                        .build())
                .collect(Collectors.toList());

        List<InfrastructureResponse> infras = portInfrastructureRepository
                .findByPortIdAndDeletedAtIsNullOrderBySequenceNumberAsc(entity.getId())
                .stream()
                .map(i -> InfrastructureResponse.builder()
                        .id(i.getId())
                        .sequenceNumber(i.getSequenceNumber())
                        .infrastructureName(i.getInfrastructureName())
                        .quantity(i.getQuantity())
                        .build())
                .collect(Collectors.toList());

        List<AttachmentResponse> attachments = portAttachmentRepository
                .findByPortIdAndDeletedAtIsNull(entity.getId())
                .stream()
                .map(a -> AttachmentResponse.builder()
                        .id(a.getId())
                        .fileName(a.getFileName())
                        .filePath(a.getFilePath())
                        .fileSize(a.getFileSize())
                        .contentType(a.getContentType())
                        .uploadedBy(a.getUploadedBy())
                        .createdAt(a.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        PortResponse.PortResponseBuilder builder = PortResponse.builder()
                .id(entity.getId())
                .portCode(entity.getPortCode())
                .portName(entity.getPortName())
                .province(entity.getProvince())
                .area(entity.getArea())
                .maxVesselCapacity(entity.getMaxVesselCapacity())
                .portStatus(entity.getPortStatus())
                .orgUnitId(entity.getOrgUnitId())
                .managingUnitId(entity.getManagingUnitId())
                .notes(entity.getNotes())
                .portGroup(entity.getPortGroup())
                .mapSymbolId(entity.getMapSymbolId())
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .portCoordinates(coords)
                .portInfrastructures(infras)
                .attachments(attachments)
                .detailedLocation(entity.getDetailedLocation())
                .portClass(entity.getPortClass())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
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
        return builder.build();
    }
}
