package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.dto.vungnuoc.*;
import com.hanghai.kchtg.cangben.entity.WaterZone;
import com.hanghai.kchtg.cangben.entity.LoaiVungNuoc;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.cangben.repository.WaterZoneRepository;
import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
import com.hanghai.kchtg.cangben.service.shared.UserResolverService;
import com.hanghai.kchtg.cangben.entity.Port;
import com.hanghai.kchtg.cangben.repository.PortRepository;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class WaterZoneService {

    private final WaterZoneRepository waterZoneRepository;
    private final PortRepository portRepository;
    private final LichSuThayDoiService lichSuThayDoiService;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final UserResolverService userResolverService;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;
    private final com.hanghai.kchtg.gis.spatial.repository.GisSpatialObjectRepository gisSpatialObjectRepository;

    @Transactional
    public WaterZoneResponse create(CreateWaterZoneRequest request) {
        if (waterZoneRepository.existsByWaterZoneCode(request.getWaterZoneCode())) {
            throw new IllegalArgumentException("MÃ£ " + request.getWaterZoneCode() + " Ä‘Ã£ tá»“n táº¡i");
        }
        Port parent = portRepository.findById(request.getPortId())
                .orElseThrow(() -> new EntityNotFoundException("Cáº£ng biá»ƒn khÃ´ng tá»“n táº¡i: " + request.getPortId()));

        UUID waterZoneId = UUID.randomUUID();
        UUID spatialId = null;

        if (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POLYGON;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    request.getWaterZoneName(),
                    request.getWaterZoneCode(),
                    geomType,
                    objType,
                    request.getCoordinates(),
                    waterZoneId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.VUNGNUOC
            );
            spatialId = spatialObj.getId();
        }

        WaterZone entity = WaterZone.builder()
                .id(waterZoneId)
                .waterZoneCode(request.getWaterZoneCode()).waterZoneName(request.getWaterZoneName())
                .portId(request.getPortId()).area(request.getArea())
                .maxDepth(request.getMaxDepth()).avgDepth(request.getAvgDepth())
                .waterZoneType(request.getWaterZoneType()).operationalStatus(request.getOperationalStatus())
                .orgUnitId(parent.getOrgUnitId())
                .approvalStatus(ApprovalStatus.PENDING)
                .mapSymbolId(request.getMapSymbolId())
                .spatialId(spatialId)
                .build();
        WaterZone saved = waterZoneRepository.save(entity);
        log.info("Created WaterZone [{}] code={}", saved.getId(), saved.getWaterZoneCode());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public WaterZoneResponse getById(UUID id) {
        return toResponse(waterZoneRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng nước với id: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<WaterZoneResponse> findAll(int page, int size, UUID orgUnitId) {
        return findAll(page, size, orgUnitId, null);
    }

    @Transactional(readOnly = true)
    public Page<WaterZoneResponse> findAll(int page, int size, UUID orgUnitId, UUID portId) {
        return findAll(page, size, orgUnitId, portId, null, (LoaiVungNuoc) null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<WaterZoneResponse> findAll(int page, int size, UUID orgUnitId, UUID portId,
                                          String search, String status, String approvalStatus) {
        return findAll(page, size, orgUnitId, portId, search, (LoaiVungNuoc) null, status, approvalStatus);
    }

    @Transactional(readOnly = true)
    public Page<WaterZoneResponse> findAll(int page, int size, UUID orgUnitId, UUID portId,
                                          String search, LoaiVungNuoc waterZoneType, String status, String approvalStatus) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));
        TrangThaiHoatDong statusEnum = status != null ? TrangThaiHoatDong.fromString(status) : null;
        ApprovalStatus approvalEnum = approvalStatus != null ? ApprovalStatus.fromString(approvalStatus) : null;
        Page<WaterZone> pageResult = waterZoneRepository.searchWaterZones(orgUnitId, portId, search, waterZoneType, statusEnum, approvalEnum, pageable);

        java.util.List<UUID> parentIds = pageResult.getContent().stream()
                .map(WaterZone::getPortId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        java.util.Map<UUID, String> parentNameMap = new java.util.HashMap<>();
        if (!parentIds.isEmpty()) {
            portRepository.findAllById(parentIds).forEach(cb -> {
                parentNameMap.put(cb.getId(), cb.getPortName());
            });
        }

        java.util.Set<UUID> userUuids = new java.util.HashSet<>();
        pageResult.getContent().forEach(e -> {
            try {
                if (e.getCreatedBy() != null) userUuids.add(UUID.fromString(e.getCreatedBy()));
                if (e.getUpdatedBy() != null) userUuids.add(UUID.fromString(e.getUpdatedBy()));
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

        java.util.List<UUID> spatialIds = pageResult.getContent().stream()
                .map(WaterZone::getSpatialId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        java.util.Map<UUID, com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject> spatialMap = new java.util.HashMap<>();
        if (!spatialIds.isEmpty()) {
            gisSpatialObjectRepository.findAllById(spatialIds).forEach(so -> {
                spatialMap.put(so.getId(), so);
            });
        }

        return pageResult.map(e -> toResponse(e, 
                parentNameMap.get(e.getPortId()),
                userNamesMap.get(e.getCreatedBy()),
                userNamesMap.get(e.getUpdatedBy()),
                spatialMap.get(e.getSpatialId())
        ));
    }

    @Transactional(readOnly = true)
    public WaterZoneResponse findByCode(String waterZoneCode) {
        return toResponse(waterZoneRepository.findByWaterZoneCode(waterZoneCode)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng nước vá»›i mÃ£: " + waterZoneCode)));
    }

    @Transactional
    public WaterZoneResponse update(UpdateWaterZoneRequest request) {
        WaterZone entity = waterZoneRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng nước với id: " + request.getId()));

        WaterZone snapshot = WaterZone.builder()
                .waterZoneCode(entity.getWaterZoneCode())
                .waterZoneName(entity.getWaterZoneName()).portId(entity.getPortId())
                .area(entity.getArea()).maxDepth(entity.getMaxDepth())
                .avgDepth(entity.getAvgDepth()).waterZoneType(entity.getWaterZoneType())
                .operationalStatus(entity.getOperationalStatus()).approvalStatus(entity.getApprovalStatus())
                .orgUnitId(entity.getOrgUnitId())
                .mapSymbolId(entity.getMapSymbolId())
                .build();

        if (request.getWaterZoneName() != null) entity.setWaterZoneName(request.getWaterZoneName());
        if (request.getPortId() != null) {
            entity.setPortId(request.getPortId());
            Port parent = portRepository.findById(request.getPortId())
                    .orElseThrow(() -> new EntityNotFoundException("Cáº£ng biá»ƒn khÃ´ng tá»“n táº¡i: " + request.getPortId()));
            entity.setOrgUnitId(parent.getOrgUnitId());
        } else if (entity.getOrgUnitId() == null && entity.getPortId() != null) {
            portRepository.findById(entity.getPortId()).ifPresent(p -> {
                entity.setOrgUnitId(p.getOrgUnitId());
            });
        }
        if (request.getArea() != null) entity.setArea(request.getArea());
        if (request.getMaxDepth() != null) entity.setMaxDepth(request.getMaxDepth());
        if (request.getAvgDepth() != null) entity.setAvgDepth(request.getAvgDepth());
        if (request.getWaterZoneType() != null) entity.setWaterZoneType(request.getWaterZoneType());
        if (request.getOperationalStatus() != null) entity.setOperationalStatus(request.getOperationalStatus());
        entity.setMapSymbolId(request.getMapSymbolId());

        if (request.getCoordinates() != null) {
            if (request.getCoordinates().trim().isEmpty()) {
                if (entity.getSpatialId() != null) {
                    gisSpatialObjectService.delete(entity.getSpatialId());
                    entity.setSpatialId(null);
                }
            } else {
                GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POLYGON;
                GisSpatialObjectType objType = getSpatialObjectType(geomType);
                GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        entity.getSpatialId(),
                        entity.getWaterZoneName(),
                        entity.getWaterZoneCode(),
                        geomType,
                        objType,
                        request.getCoordinates(),
                        entity.getId(),
                        com.hanghai.kchtg.gis.search.dto.KchtType.VUNGNUOC
                );
                entity.setSpatialId(spatialObj.getId());
            }
        } else if (entity.getSpatialId() != null && request.getWaterZoneName() != null) {
            gisSpatialObjectService.findById(entity.getSpatialId()).ifPresent(spatialObj -> {
                gisSpatialObjectService.createOrUpdate(
                        spatialObj.getId(),
                        request.getWaterZoneName(),
                        spatialObj.getCode(),
                        spatialObj.getGeometryType(),
                        spatialObj.getObjectType(),
                        spatialObj.getCoordinates(),
                        entity.getId(),
                        com.hanghai.kchtg.gis.search.dto.KchtType.VUNGNUOC
                );
            });
        }

        entity.setApprovalStatus(ApprovalStatus.PENDING);

        WaterZone saved = waterZoneRepository.save(entity);

        lichSuThayDoiService.recordChanges("WaterZone", saved.getId().toString(), "system", snapshot, saved);

        log.info("Updated WaterZone [{}] code={}", saved.getId(), saved.getWaterZoneCode());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        WaterZone entity = waterZoneRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy vùng nước với id: " + id));
        entity.softDelete();
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        waterZoneRepository.save(entity);
        log.info("Soft-deleted WaterZone [{}] code={}", entity.getId(), entity.getWaterZoneCode());
    }


    private WaterZoneResponse toResponse(WaterZone e) {
        return toResponse(e, null, null, null, null);
    }

    private WaterZoneResponse toResponse(WaterZone e, String preResolvedPortName) {
        return toResponse(e, preResolvedPortName, null, null, null);
    }

    private WaterZoneResponse toResponse(WaterZone e, String preResolvedPortName, String preResolvedCreatorName, String preResolvedUpdaterName) {
        return toResponse(e, preResolvedPortName, preResolvedCreatorName, preResolvedUpdaterName, null);
    }

    private WaterZoneResponse toResponse(WaterZone e, String preResolvedPortName, String preResolvedCreatorName, String preResolvedUpdaterName, com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject preResolvedSpatial) {
        GisGeometryType geomType = null;
        String coords = null;
        
        com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatial = preResolvedSpatial;
        if (spatial == null && e.getSpatialId() != null) {
            spatial = gisSpatialObjectRepository.findById(e.getSpatialId()).orElse(null);
        }
        
        if (spatial != null) {
            geomType = spatial.getGeometryType();
            coords = spatial.getCoordinates();
        }

        String portName = preResolvedPortName;
        if (portName == null && e.getPortId() != null) {
            portName = portRepository.findById(e.getPortId()).map(Port::getPortName).orElse(null);
        }

        String createdBy = preResolvedCreatorName != null ? preResolvedCreatorName : userResolverService.resolveName(e.getCreatedBy());
        String updatedBy = preResolvedUpdaterName != null ? preResolvedUpdaterName : userResolverService.resolveName(e.getUpdatedBy());

        return WaterZoneResponse.builder()
                .id(e.getId()).waterZoneCode(e.getWaterZoneCode()).waterZoneName(e.getWaterZoneName())
                .portId(e.getPortId())
                .portName(portName)
                .area(e.getArea())
                .maxDepth(e.getMaxDepth()).avgDepth(e.getAvgDepth())
                .waterZoneType(e.getWaterZoneType()).operationalStatus(e.getOperationalStatus())
                .approvalStatus(e.getApprovalStatus()).orgUnitId(e.getOrgUnitId())
                .mapSymbolId(e.getMapSymbolId())
                .spatialId(e.getSpatialId())
                .geometryType(geomType)
                .coordinates(coords)
                .createdBy(createdBy)
                .updatedBy(updatedBy)
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt()).build();
    }

    private GisGeometryType parseGeometryType(String typeStr) {
        if (typeStr == null) return GisGeometryType.POLYGON;
        try {
            return GisGeometryType.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return GisGeometryType.POLYGON;
        }
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT) return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.LINE) return GisSpatialObjectType.LINE_OTHER;
        return GisSpatialObjectType.POLYGON_WATER_ZONE;
    }
}
