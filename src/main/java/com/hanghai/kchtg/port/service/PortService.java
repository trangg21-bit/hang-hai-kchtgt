package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.dashboard.service.KchtAssetCountService;
import com.hanghai.kchtg.port.dto.port.PortResponse;
import com.hanghai.kchtg.port.dto.port.CreatePortRequest;
import com.hanghai.kchtg.port.dto.port.UpdatePortRequest;
import com.hanghai.kchtg.port.entity.Port;
import java.math.BigDecimal;
import com.hanghai.kchtg.port.repository.BerthRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.repository.WaterZoneRepository;
import com.hanghai.kchtg.port.service.shared.ChangeTrackingService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

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
    private final KchtAssetCountService kchtCountService;
    private final WaterZoneRepository waterZoneRepository;
    private final PierRepository pierRepository;
    private final ChangeTrackingService changeTrackingService;
    private final UserResolverService userResolverService;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;
    private final com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    // ── CREATE ──────────────────────────────────────────────────

    @Transactional
    public PortResponse create(CreatePortRequest request) {
        if (portRepository.existsByPortCode(request.getPortCode())) {
            throw new IllegalArgumentException("Mã " + request.getPortCode() + " đã tồn tại");
        }

        Port entity = Port.builder()
                .portCode(request.getPortCode())
                .portName(request.getPortName())
                .province(request.getProvince())
                .area(request.getArea())
                .maxVesselCapacity(request.getMaxVesselCapacity())
                .operationalStatus(request.getOperationalStatus())
                .approvalStatus(ApprovalStatus.PENDING)
                .orgUnitId(request.getOrgUnitId())
                .portGroup(request.getPortGroup())
                .mapSymbolId(request.getMapSymbolId())
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

        log.info("Created Port [{}] code={}", saved.getId(), saved.getPortCode());
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
        return findAll(page, size, orgUnitId, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<PortResponse> findAll(int page, int size, UUID orgUnitId,
                                          String portCode, String portName, String province,
                                          String operationalStatus, String approvalStatus,
                                          String search) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));

        OperationalStatus statusEnum = operationalStatus != null ? OperationalStatus.fromString(operationalStatus) : null;
        ApprovalStatus approvalEnum = approvalStatus != null ? ApprovalStatus.fromString(approvalStatus) : null;
        Page<Port> results = portRepository.searchPorts(
                orgUnitId, portCode, portName, province, statusEnum, approvalEnum, search, pageable);

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

    // ── UPDATE ──────────────────────────────────────────────────

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
                .orgUnitId(entity.getOrgUnitId())
                .portGroup(entity.getPortGroup())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
                .mapSymbolId(entity.getMapSymbolId())
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
        entity.setOperationalStatus(request.getOperationalStatus() != null ? request.getOperationalStatus() : entity.getOperationalStatus());
        entity.setApprovalStatus(ApprovalStatus.PENDING);

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

        entity.softDelete(com.hanghai.kchtg.security.SecurityUtils.getCurrentUserId());
        portRepository.save(entity);
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        log.info("Soft-deleted Port [{}] code={}", entity.getId(), entity.getPortCode());
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

        PortResponse.PortResponseBuilder builder = PortResponse.builder()
                .id(entity.getId())
                .portCode(entity.getPortCode())
                .portName(entity.getPortName())
                .province(entity.getProvince())

                .area(entity.getArea())
                .maxVesselCapacity(entity.getMaxVesselCapacity())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
                .orgUnitId(entity.getOrgUnitId())
                .portGroup(entity.getPortGroup())
                .mapSymbolId(entity.getMapSymbolId())
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
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
        return builder.build();
    }
}
