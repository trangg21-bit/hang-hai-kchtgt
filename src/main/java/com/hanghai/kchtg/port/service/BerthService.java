package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.port.dto.berth.*;
import com.hanghai.kchtg.port.entity.*;
import com.hanghai.kchtg.port.repository.*;
import com.hanghai.kchtg.port.service.shared.AuditLogService;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
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
 * Service core for Berth CRUD operations.
 * Uses unified PortStatus (replaces OperationalStatus + ApprovalStatus).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BerthService {

    private final BerthRepository berthRepository;
    private final PortRepository portRepository;
    private final PierRepository pierRepository;
    private final ChangeHistoryService changeHistoryService;
    private final AuditLogService auditLogService;
    private final UserResolverService userResolverService;
    private final com.hanghai.kchtg.user.repository.UserRepository userRepository;
    private final com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService gisSpatialObjectService;

    // ── CODE GENERATION ─────────────────────────────────────────────

    /**
     * Generate the next berth code in format "BC-XXXXXX".
     */
    public Map<String, String> generateCode() {
        Integer maxNum = berthRepository.findMaxBerthCodeNumber();
        int nextNum = (maxNum != null ? maxNum : 0) + 1;
        String code = String.format("BC-%06d", nextNum);
        return Map.of("code", code);
    }

    @Transactional
    public BerthResponse create(CreateBerthRequest request) {
        // Validate action
        String action = request.getAction();
        if (!"draft".equals(action) && !"submit".equals(action)) {
            throw new IllegalArgumentException("Action phải là 'draft' hoặc 'submit'");
        }

        // Validate berth code length
        String generatedCode = generateCode().get("code");
        if (generatedCode.length() < 6 || generatedCode.length() > 10) {
            throw new IllegalArgumentException("Mã bến phải từ 6 đến 10 ký tự");
        }

        // Validate length > 0 and ≤ 2000m
        if (request.getLength() != null) {
            if (request.getLength().compareTo(java.math.BigDecimal.ZERO) <= 0) {
                throw new IllegalArgumentException("Chiều dài bến phải lớn hơn 0");
            }
            if (request.getLength().compareTo(new java.math.BigDecimal("2000")) > 0) {
                throw new IllegalArgumentException("Chiều dài bến tối đa 2000m");
            }
        }

        // Validate channelDepth ≥ 3m (if provided)
        if (request.getChannelDepth() != null) {
            if (request.getChannelDepth().compareTo(new java.math.BigDecimal("3")) < 0) {
                throw new IllegalArgumentException("Độ sâu luồng tối thiểu 3m");
            }
        }

        // Generate berth code (already generated in validation above)
        String berthCode = generatedCode;

        Port parent = portRepository.findById(request.getPortId())
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));

        // Parent must be in DA_PHE_DUYET or TAM_NGUNG status to create berths
        if (parent.getPortStatus() != PortStatus.DA_PHE_DUYET && parent.getPortStatus() != PortStatus.TAM_NGUNG) {
            throw new IllegalArgumentException("Cảng mẹ phải ở trạng thái Hiện hành hoặc Tạm ngừng");
        }

        // Set initial status
        PortStatus initialStatus = "submit".equals(action) ? PortStatus.CHO_PHE_DUYET : PortStatus.NHAP;

        Berth entity = Berth.builder()
                .berthCode(berthCode).berthName(request.getBerthName())
                .portId(request.getPortId()).waterway(request.getWaterway())
                .length(request.getLength()).width(request.getWidth())
                .berthType(request.getBerthType()).channelDepth(request.getChannelDepth())
                .operationalFunction(request.getOperationalFunction())
                .portStatus(initialStatus)
                .orgUnitId(parent.getOrgUnitId())
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

        // Sync unified portStatus → legacy DB columns before save
        entity.syncOldFieldsFromPortStatus();

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
                    com.hanghai.kchtg.gis.search.dto.InfrastructureType.PORT_TERMINAL
            );
            saved.setSpatialId(spatialObj.getId());
            saved = berthRepository.save(saved);
        }

        log.info("Created Berth [{}] code={}, status={}", saved.getId(), saved.getBerthCode(), saved.getPortStatus());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public BerthResponse getById(UUID id) {
        return toResponse(berthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<BerthResponse> findAll(int page, int size, UUID orgUnitId) {
        return findAll(page, size, orgUnitId, null, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<BerthResponse> findAll(int page, int size, UUID orgUnitId,
            String berthCode, String berthName, UUID portId,
            String waterway, String berthType,
            String portStatus, String search) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")));
        PortStatus statusEnum = portStatus != null ? PortStatus.fromString(portStatus) : null;
        com.hanghai.kchtg.port.entity.BerthType berthTypeEnum = null;
        if (berthType != null && !berthType.trim().isEmpty()) {
            try {
                berthTypeEnum = com.hanghai.kchtg.port.entity.BerthType.valueOf(berthType.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                // ignore
            }
        }

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
                    break;
            }
        }
        Page<Berth> pageResult = berthRepository.searchBerths(orgUnitId, search, berthCode, berthName, portId,
                waterway, berthTypeEnum, approvalStatusParam, operationalStatusParam, operationalStatusNull, pageable);

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
                if (e.getCreatedBy() != null) userUuids.add(e.getCreatedBy());
                if (e.getUpdatedBy() != null) userUuids.add(e.getUpdatedBy());
            } catch (Exception ex) {
                // ignore
            }
        });

        java.util.Map<java.util.UUID, String> userNamesMap = new java.util.HashMap<>();
        if (!userUuids.isEmpty()) {
            userRepository.findAllById(userUuids).forEach(usr -> {
                String displayName = usr.getFullName() != null && !usr.getFullName().trim().isEmpty()
                        ? usr.getFullName()
                        : usr.getUsername();
                userNamesMap.put(usr.getId(), displayName);
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
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với mã: " + berthCode)));
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
                .portStatus(entity.getPortStatus())
                .orgUnitId(entity.getOrgUnitId())
                .mapSymbolId(entity.getMapSymbolId())
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
                            () -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));
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

        // Auto-reset status on update
        if (entity.getPortStatus() != PortStatus.NHAP) {
            entity.setPortStatus(PortStatus.CHO_PHE_DUYET);
        }

        // Sync unified portStatus → legacy DB columns before save
        entity.syncOldFieldsFromPortStatus();

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
                    com.hanghai.kchtg.gis.search.dto.InfrastructureType.PORT_TERMINAL
            );
            saved.setSpatialId(spatialObj.getId());
            saved = berthRepository.save(saved);
        }

        log.info("Updated Berth [{}] code={}, status={}", saved.getId(), saved.getBerthCode(), saved.getPortStatus());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        Berth entity = berthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id));

        // Guard: check if berth has piers
        long pierCount = countPierByBerthId(id);
        if (pierCount > 0) {
            throw new IllegalArgumentException("Không thể xóa: còn " + pierCount + " cầu cảng đang hoạt động");
        }

        entity.setPortStatus(PortStatus.DA_XOA);
        entity.syncOldFieldsFromPortStatus();
        entity.softDelete(SecurityUtils.getCurrentUserId());
        berthRepository.save(entity);
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        log.info("Soft-deleted Berth [{}] code={}", entity.getId(), entity.getBerthCode());
    }

    @Transactional(readOnly = true)
    public Map<String, Long> getChildrenCount(UUID id) {
        if (!berthRepository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id);
        }
        long pierCount = countPierByBerthId(id);
        Map<String, Long> result = new java.util.LinkedHashMap<>();
        result.put("piers", pierCount);
        return result;
    }

    private long countPierByBerthId(UUID berthId) {
        return pierRepository.countByBerthIdAndDeletedAtIsNull(berthId);
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
                .width(e.getWidth()).berthType(e.getBerthType())
                .channelDepth(e.getChannelDepth()).operationalFunction(e.getOperationalFunction())
                .portStatus(e.getPortStatus()).orgUnitId(e.getOrgUnitId())
                .mapSymbolId(e.getMapSymbolId())
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
                .createdBy(e.getCreatedBy())
                .updatedBy(e.getUpdatedBy())
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
