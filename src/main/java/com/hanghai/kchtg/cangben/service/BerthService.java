package com.hanghai.kchtg.cangben.service;

import com.hanghai.kchtg.cangben.dto.bencang.*;
import com.hanghai.kchtg.cangben.entity.Berth;
import com.hanghai.kchtg.common.entity.TrangThaiHoatDong;
import com.hanghai.kchtg.common.entity.ApprovalStatus;
import java.math.BigDecimal;
import java.util.Optional;
import com.hanghai.kchtg.cangben.entity.Port;
import com.hanghai.kchtg.cangben.repository.BerthRepository;
import com.hanghai.kchtg.cangben.repository.PortRepository;
import com.hanghai.kchtg.cangben.repository.PierRepository;
import com.hanghai.kchtg.cangben.service.shared.AuditLogService;
import com.hanghai.kchtg.cangben.service.shared.LichSuThayDoiService;
import com.hanghai.kchtg.cangben.service.shared.UserResolverService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Service core for Berth CRUD operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BerthService {

    private final BerthRepository berthRepository;
    private final PortRepository portRepository;
    private final PierRepository pierRepository;
    private final LichSuThayDoiService lichSuThayDoiService;
    private final AuditLogService auditLogService;
    private final UserResolverService userResolverService;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;
    private final com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    @Transactional
    public BerthResponse create(CreateBerthRequest request) {
        if (berthRepository.existsByBerthCode(request.getBerthCode())) {
            throw new IllegalArgumentException("MÃ£ " + request.getBerthCode() + " Ä‘Ã£ tá»“n táº¡i");
        }
        Port parent = portRepository.findById(request.getPortId())
                .orElseThrow(() -> new EntityNotFoundException("Cáº£ng biá»ƒn khÃ´ng tá»“n táº¡i: " + request.getPortId()));

        if (parent.getOperationalStatus() != TrangThaiHoatDong.HIEN_HANH) {
            throw new IllegalArgumentException(
                    "KhÃ´ng thá»ƒ táº¡o bến cảng: cảng biển cha pháº£i á»Ÿ tráº¡ng thÃ¡i hoáº¡t Ä‘á»™ng (HIEN_HANH)");
        }

        Berth entity = Berth.builder()
                .berthCode(request.getBerthCode()).berthName(request.getBerthName())
                .portId(request.getPortId()).waterway(request.getWaterway())
                .length(request.getLength()).width(request.getWidth())
                .berthType(request.getBerthType()).channelDepth(request.getChannelDepth())
                .operationalFunction(request.getOperationalFunction())
                .operationalStatus(request.getOperationalStatus())
                .orgUnitId(parent.getOrgUnitId())
                .approvalStatus(ApprovalStatus.PENDING)
                .mapSymbolId(request.getMapSymbolId())
                // Extended fields
                .locationCode(request.getLocationCode())
                .detailedLocation(request.getDetailedLocation())
                .coordinateSystem(request.getCoordinateSystem())
                .displayRule(request.getDisplayRule())
                .operator(request.getOperator())
                .totalArea(request.getTotalArea())
                .designThroughput(request.getDesignThroughput())
                .currentThroughput(request.getCurrentThroughput())
                .maxVesselSize(request.getMaxVesselSize())
                .plannedThroughput(request.getPlannedThroughput())
                .latestCargoVolume(request.getLatestCargoVolume())
                .openingAnnouncementDate(request.getOpeningAnnouncementDate())
                .openingDecision(request.getOpeningDecision())
                .investmentAgreement(request.getInvestmentAgreement())
                .structureType(request.getStructureType())
                .build();
        Berth saved = berthRepository.save(entity);

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
                    saved.getBerthName(),
                    "BERTH_" + saved.getBerthCode(),
                    geomType,
                    objType,
                    coordinates,
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.BENCANG
            );
            saved.setSpatialId(spatialObj.getId());
            saved = berthRepository.save(saved);
        }

        log.info("Created Berth [{}] code={}", saved.getId(), saved.getBerthCode());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public BerthResponse getById(UUID id) {
        return toResponse(berthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<BerthResponse> findAll(int page, int size, UUID orgUnitId) {
        return findAll(page, size, orgUnitId, null, null, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<BerthResponse> findAll(int page, int size, UUID orgUnitId,
            String berthCode, String berthName, UUID portId,
            String waterway, String berthType,
            String operationalStatus, String approvalStatus, String search) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));
        TrangThaiHoatDong statusEnum = operationalStatus != null ? TrangThaiHoatDong.fromString(operationalStatus)
                : null;
        ApprovalStatus approvalEnum = approvalStatus != null ? ApprovalStatus.fromString(approvalStatus)
                : null;
        com.hanghai.kchtg.cangben.entity.LoaiBen berthTypeEnum = null;
        if (berthType != null && !berthType.trim().isEmpty()) {
            try {
                berthTypeEnum = com.hanghai.kchtg.cangben.entity.LoaiBen.valueOf(berthType.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                // ignore
            }
        }
        Page<Berth> pageResult = berthRepository.searchBerths(orgUnitId, search, berthCode, berthName, portId,
                waterway, berthTypeEnum, statusEnum, approvalEnum, pageable);

        java.util.List<UUID> parentIds = pageResult.getContent().stream()
                .map(Berth::getPortId)
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

        return pageResult.map(e -> toResponse(e, 
                parentNameMap.get(e.getPortId()),
                userNamesMap.get(e.getCreatedBy()),
                userNamesMap.get(e.getUpdatedBy())
        ));
    }

    @Transactional(readOnly = true)
    public BerthResponse findByCode(String berthCode) {
        return toResponse(berthRepository.findByBerthCode(berthCode)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng vá»›i mÃ£: " + berthCode)));
    }

    @Transactional(readOnly = true)
    public List<Berth> findByPortId(UUID portId) {
        return berthRepository.findByPortIdAndDeletedAtIsNull(portId);
    }

    @Transactional
    public BerthResponse update(UpdateBerthRequest request) {
        Berth entity = berthRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + request.getId()));

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        Berth snapshot = Berth.builder()
                .berthCode(entity.getBerthCode())
                .berthName(entity.getBerthName()).portId(entity.getPortId())
                .waterway(entity.getWaterway())
                .length(entity.getLength())
                .width(entity.getWidth()).berthType(entity.getBerthType())
                .channelDepth(entity.getChannelDepth()).operationalFunction(entity.getOperationalFunction())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
                .orgUnitId(entity.getOrgUnitId())
                .mapSymbolId(entity.getMapSymbolId())
                // Extended fields snapshot
                .locationCode(entity.getLocationCode())
                .detailedLocation(entity.getDetailedLocation())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
                .operator(entity.getOperator())
                .totalArea(entity.getTotalArea())
                .designThroughput(entity.getDesignThroughput())
                .currentThroughput(entity.getCurrentThroughput())
                .maxVesselSize(entity.getMaxVesselSize())
                .plannedThroughput(entity.getPlannedThroughput())
                .latestCargoVolume(entity.getLatestCargoVolume())
                .openingAnnouncementDate(entity.getOpeningAnnouncementDate())
                .openingDecision(entity.getOpeningDecision())
                .investmentAgreement(entity.getInvestmentAgreement())
                .structureType(entity.getStructureType())
                .build();

        if (request.getBerthName() != null)
            entity.setBerthName(request.getBerthName());
        if (request.getPortId() != null) {
            entity.setPortId(request.getPortId());
            Port parent = portRepository.findById(request.getPortId())
                    .orElseThrow(
                            () -> new EntityNotFoundException("Cáº£ng biá»ƒn khÃ´ng tá»“n táº¡i: " + request.getPortId()));
            entity.setOrgUnitId(parent.getOrgUnitId());
            
            pierRepository.findByBerthIdAndDeletedAtIsNull(entity.getId()).forEach(cc -> {
                cc.setOrgUnitId(parent.getOrgUnitId());
                pierRepository.save(cc);
            });
        } else if (entity.getOrgUnitId() == null && entity.getPortId() != null) {
            portRepository.findById(entity.getPortId()).ifPresent(p -> {
                entity.setOrgUnitId(p.getOrgUnitId());
                
                pierRepository.findByBerthIdAndDeletedAtIsNull(entity.getId()).forEach(cc -> {
                    cc.setOrgUnitId(p.getOrgUnitId());
                    pierRepository.save(cc);
                });
            });
        }
        if (request.getWaterway() != null)
            entity.setWaterway(request.getWaterway());

        if (request.getLength() != null)
            entity.setLength(request.getLength());
        if (request.getWidth() != null)
            entity.setWidth(request.getWidth());
        if (request.getBerthType() != null)
            entity.setBerthType(request.getBerthType());
        if (request.getChannelDepth() != null)
            entity.setChannelDepth(request.getChannelDepth());
        if (request.getOperationalFunction() != null)
            entity.setOperationalFunction(request.getOperationalFunction());
        if (request.getOperationalStatus() != null)
            entity.setOperationalStatus(request.getOperationalStatus());
        // Extended fields
        if (request.getLocationCode() != null)
            entity.setLocationCode(request.getLocationCode());
        if (request.getDetailedLocation() != null)
            entity.setDetailedLocation(request.getDetailedLocation());
        if (request.getCoordinateSystem() != null)
            entity.setCoordinateSystem(request.getCoordinateSystem());
        if (request.getDisplayRule() != null)
            entity.setDisplayRule(request.getDisplayRule());
        if (request.getOperator() != null)
            entity.setOperator(request.getOperator());
        if (request.getTotalArea() != null)
            entity.setTotalArea(request.getTotalArea());
        if (request.getDesignThroughput() != null)
            entity.setDesignThroughput(request.getDesignThroughput());
        if (request.getCurrentThroughput() != null)
            entity.setCurrentThroughput(request.getCurrentThroughput());
        if (request.getMaxVesselSize() != null)
            entity.setMaxVesselSize(request.getMaxVesselSize());
        if (request.getPlannedThroughput() != null)
            entity.setPlannedThroughput(request.getPlannedThroughput());
        if (request.getLatestCargoVolume() != null)
            entity.setLatestCargoVolume(request.getLatestCargoVolume());
        if (request.getOpeningAnnouncementDate() != null)
            entity.setOpeningAnnouncementDate(request.getOpeningAnnouncementDate());
        if (request.getOpeningDecision() != null)
            entity.setOpeningDecision(request.getOpeningDecision());
        if (request.getInvestmentAgreement() != null)
            entity.setInvestmentAgreement(request.getInvestmentAgreement());
        if (request.getStructureType() != null)
            entity.setStructureType(request.getStructureType());
        entity.setMapSymbolId(request.getMapSymbolId());
        entity.setApprovalStatus(ApprovalStatus.PENDING);

        Berth saved = berthRepository.save(entity);

        if (coordinates != null && !coordinates.trim().isEmpty()) {
            com.hanghai.kchtg.gis.spatial.entity.GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : com.hanghai.kchtg.gis.spatial.entity.GisGeometryType.POINT;
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType objType = com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType.POINT_PORT;
            UUID refId = saved.getId();
            com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getSpatialId(),
                    saved.getBerthName(),
                    "BERTH_" + saved.getBerthCode(),
                    geomType,
                    objType,
                    coordinates,
                    refId,
                    com.hanghai.kchtg.gis.search.dto.KchtType.BENCANG
            );
            saved.setSpatialId(spatialObj.getId());
            saved = berthRepository.save(saved);
        }

        lichSuThayDoiService.recordChanges("Berth", saved.getId().toString(),
                "system", snapshot, saved);

        log.info("Updated Berth [{}] code={}", saved.getId(), saved.getBerthCode());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        Berth entity = berthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id));
        entity.softDelete();
        berthRepository.save(entity);
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        log.info("Soft-deleted Berth [{}] code={}", entity.getId(), entity.getBerthCode());
    }

    private BerthResponse toResponse(Berth e) {
        return toResponse(e, null, null, null);
    }

    private BerthResponse toResponse(Berth e, String preResolvedPortName) {
        return toResponse(e, preResolvedPortName, null, null);
    }

    private BerthResponse toResponse(Berth e, String preResolvedPortName, String preResolvedCreatorName, String preResolvedUpdaterName) {
        String portName = preResolvedPortName;
        if (portName == null && e.getPortId() != null) {
            portName = portRepository.findById(e.getPortId()).map(Port::getPortName).orElse(null);
        }

        String createdBy = preResolvedCreatorName != null ? preResolvedCreatorName : userResolverService.resolveName(e.getCreatedBy());
        String updatedBy = preResolvedUpdaterName != null ? preResolvedUpdaterName : userResolverService.resolveName(e.getUpdatedBy());

        BigDecimal latitude = null;
        BigDecimal longitude = null;
        if (e.getSpatialId() != null) {
            Optional<com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject> spatialObjOpt = gisSpatialObjectService.findById(e.getSpatialId());
            if (spatialObjOpt.isPresent()) {
                String coords = spatialObjOpt.get().getCoordinates();
                try {
                    String clean = coords.replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        longitude = new BigDecimal(parts[0]);
                        latitude = new BigDecimal(parts[1]);
                    }
                } catch (Exception ex) {
                    // ignore
                }
            }
        }

        BerthResponse.BerthResponseBuilder builder = BerthResponse.builder()
                .id(e.getId()).berthCode(e.getBerthCode()).berthName(e.getBerthName())
                .portId(e.getPortId())
                .portName(portName)
                .waterway(e.getWaterway())
                .latitude(latitude).longitude(longitude).length(e.getLength())
                .width(e.getWidth()).berthType(e.getBerthType())
                .channelDepth(e.getChannelDepth()).operationalFunction(e.getOperationalFunction())
                .operationalStatus(e.getOperationalStatus())
                .approvalStatus(e.getApprovalStatus()).orgUnitId(e.getOrgUnitId())
                .mapSymbolId(e.getMapSymbolId())
                // Extended fields
                .locationCode(e.getLocationCode())
                .detailedLocation(e.getDetailedLocation())
                .coordinateSystem(e.getCoordinateSystem())
                .displayRule(e.getDisplayRule())
                .operator(e.getOperator())
                .totalArea(e.getTotalArea())
                .designThroughput(e.getDesignThroughput())
                .currentThroughput(e.getCurrentThroughput())
                .maxVesselSize(e.getMaxVesselSize())
                .plannedThroughput(e.getPlannedThroughput())
                .latestCargoVolume(e.getLatestCargoVolume())
                .openingAnnouncementDate(e.getOpeningAnnouncementDate())
                .openingDecision(e.getOpeningDecision())
                .investmentAgreement(e.getInvestmentAgreement())
                .structureType(e.getStructureType())
                .createdBy(createdBy)
                .updatedBy(updatedBy)
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt());

        if (e.getSpatialId() != null) {
            builder.spatialId(e.getSpatialId());
            gisSpatialObjectService.findById(e.getSpatialId()).ifPresent(spatialObj -> {
                builder.geometryType(spatialObj.getGeometryType());
                builder.coordinates(spatialObj.getCoordinates());
            });
        }
        return builder.build();
    }
}
