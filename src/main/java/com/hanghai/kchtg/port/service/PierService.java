package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.EntityFields;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.repository.GisSpatialObjectRepository;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.port.dto.pier.CreatePierRequest;
import com.hanghai.kchtg.port.dto.pier.PierResponse;
import com.hanghai.kchtg.port.dto.pier.UpdatePierRequest;
import com.hanghai.kchtg.port.entity.Berth;
import com.hanghai.kchtg.port.entity.Pier;
import com.hanghai.kchtg.port.entity.PierType;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.BerthRepository;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.repository.UserRepository;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class PierService {

    private final PierRepository pierRepository;
    private final BerthRepository berthRepository;
    private final PortRepository portRepository;
    private final ChangeHistoryService changeHistoryService;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final UserResolverService userResolverService;
    private final UserRepository userRepository;
    private final GisSpatialObjectRepository gisSpatialObjectRepository;
    private final OrgUnitCacheService orgUnitCacheService;

    @Transactional
    public PierResponse create(CreatePierRequest request) {
        if (pierRepository.existsByPierCode(request.getPierCode())) {
            throw new IllegalArgumentException("Mã " + request.getPierCode() + " đã tồn tại");
        }
        if (pierRepository.existsByPierName(request.getPierName())) {
            throw new IllegalArgumentException("Tên cầu cảng \"" + request.getPierName() + "\" đã tồn tại");
        }

        Berth parent = berthRepository.findById(request.getBerthId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Bến cảng không tồn tại: " + request.getBerthId()));
        if (parent.getOperationalStatus() != OperationalStatus.OPERATIONAL) {
            throw new IllegalArgumentException(
                    "Không thể tạo cầu cảng: bến cảng cha phải ở trạng thái hoạt động (HIEN_HANH)");
        }

        // BR-020-02: Port must be APPROVED and OPERATIONAL if provided
        if (request.getPortId() != null) {
            Port port = portRepository.findById(request.getPortId())
                    .orElseThrow(() -> new EntityNotFoundException(
                            "Cảng biển không tồn tại: " + request.getPortId()));
            if (port.getApprovalStatus() != ApprovalStatus.APPROVED) {
                throw new IllegalArgumentException(
                        "Cảng biển phải ở trạng thái đã phê duyệt");
            }
        }

        // AC-020-06: Conditional ATHH validation
        if (Boolean.TRUE.equals(request.getReceivesLargeVessel())) {
            if (request.getDocumentNumber() == null || request.getDocumentNumber().trim().isEmpty()) {
                throw new IllegalArgumentException(
                        "Số văn bản là bắt buộc khi tiếp nhận tàu có trọng tải lớn hơn thông số QĐ công bố");
            }
            if (request.getDocumentDate() == null) {
                throw new IllegalArgumentException(
                        "Ngày văn bản là bắt buộc khi tiếp nhận tàu có trọng tải lớn hơn thông số QĐ công bố");
            }
        }

        UUID pierId = UUID.randomUUID();
        UUID spatialId = null;

        if (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty()) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.LINE;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    request.getPierName(),
                    request.getPierCode(),
                    geomType,
                    objType,
                    request.getCoordinates(),
                    pierId,
                    InfrastructureType.PIER
            );
            spatialId = spatialObj.getId();
        }

        // Default conditionStatus to 1 (Sử dụng) if not provided
        Integer conditionStatus = request.getConditionStatus() != null ? request.getConditionStatus() : 1;

        Pier entity = Pier.builder()
                .id(pierId)
                .pierCode(request.getPierCode()).pierName(request.getPierName())
                .berthId(request.getBerthId()).length(request.getLength())
                .designLoad(request.getDesignLoad()).pierType(request.getPierType())
                .operationalFunction(request.getOperationalFunction())
                .operationalStatus(request.getOperationalStatus())
                .orgUnitId(parent.getOrgUnitId())
                .approvalStatus(ApprovalStatus.DRAFT)
                .mapSymbolId(request.getMapSymbolId())
                .spatialId(spatialId)
                // ── Spec Group A: Basic info ──
                .portId(request.getPortId())
                .navigationChannelId(request.getNavigationChannelId())
                .province(request.getProvince())
                .detailedLocation(request.getDetailedLocation())
                .constructionGrade(request.getConstructionGrade())
                .structureType(request.getStructureType())
                .conditionStatus(conditionStatus)
                // ── Spec Group B: Technical ──
                .width(request.getWidth())
                .currentWaterDepth(request.getCurrentWaterDepth())
                .designBedElevation(request.getDesignBedElevation())
                .publishedVesselDWT(request.getPublishedVesselDWT())
                // ── Spec Group C: Dates ──
                .maintenanceApprovalDate(request.getMaintenanceApprovalDate())
                .safetyAssessmentDate(request.getSafetyAssessmentDate())
                .lastInspectionDate(request.getLastInspectionDate())
                // ── Spec Group D: Quantities ──
                .operatingPierCount(request.getOperatingPierCount())
                .publishedPierCount(request.getPublishedPierCount())
                .investmentAgreementPierCount(request.getInvestmentAgreementPierCount())
                .cargoThroughput(request.getCargoThroughput())
                // ── Spec Group E: ATHH ──
                .receivesLargeVessel(request.getReceivesLargeVessel())
                .documentNumber(request.getDocumentNumber())
                .documentDate(request.getDocumentDate())
                // ── Spec Group F: Opening announcement ──
                .openingAnnouncementDate(request.getOpeningAnnouncementDate())
                .openingDecision(request.getOpeningDecision())
                .investmentAgreementDoc(request.getInvestmentAgreementDoc())
                // ── Spec Group G: GIS additional ──
                .waterAreaNeutralScope(request.getWaterAreaNeutralScope())
                .build();
        Pier saved = pierRepository.save(entity);

        // BR-020-05: Auto audit log for creation
        changeHistoryService.insertChangeRecord("Pier", saved.getId(), "CREATE", null, "created", saved.getCreatedBy());

        log.info("Created Pier [{}] code={}", saved.getId(), saved.getPierCode());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public PierResponse getById(UUID id) {
        return toResponse(pierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<PierResponse> findAll(int page, int size, UUID orgUnitId) {
        return findAll(page, size, orgUnitId, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<PierResponse> findAll(int page, int size, UUID orgUnitId,
            String search, UUID berthId,
            String status, String approvalStatus) {
        return findAll(page, size, orgUnitId, search, berthId, (PierType) null, status, approvalStatus);
    }

    @Transactional(readOnly = true)
    public Page<PierResponse> findAll(int page, int size, UUID orgUnitId,
            String search, UUID berthId, PierType pierType,
            String status, String approvalStatus) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc(EntityFields.CREATED_AT), Sort.Order.asc(EntityFields.ID)));
        OperationalStatus statusEnum = status != null ? OperationalStatus.fromString(status) : null;
        ApprovalStatus approvalEnum = approvalStatus != null ? ApprovalStatus.fromString(approvalStatus) : null;
        Page<Pier> pageResult = pierRepository.searchPiers(orgUnitId, search, berthId, pierType, statusEnum, approvalEnum, pageable);

        java.util.List<UUID> parentIds = pageResult.getContent().stream()
                .map(Pier::getBerthId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        java.util.Map<UUID, String> parentNameMap = new java.util.HashMap<>();
        if (!parentIds.isEmpty()) {
            berthRepository.findAllById(parentIds).forEach(bc -> {
                parentNameMap.put(bc.getId(), bc.getBerthName());
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

        java.util.List<UUID> spatialIds = pageResult.getContent().stream()
                .map(Pier::getSpatialId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        java.util.Map<UUID, GisSpatialObject> spatialMap = new java.util.HashMap<>();
        if (!spatialIds.isEmpty()) {
            gisSpatialObjectRepository.findAllById(spatialIds).forEach(so -> {
                spatialMap.put(so.getId(), so);
            });
        }

        return pageResult.map(e -> toResponse(e,
                parentNameMap.get(e.getBerthId()),
                userNamesMap.get(e.getCreatedBy()),
                userNamesMap.get(e.getUpdatedBy()),
                spatialMap.get(e.getSpatialId())
        ));
    }

    @Transactional(readOnly = true)
    public PierResponse findByCode(String pierCode) {
        return toResponse(pierRepository.findByPierCode(pierCode)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với mã: " + pierCode)));
    }

    @Transactional
    public PierResponse update(UpdatePierRequest request) {
        Pier entity = pierRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + request.getId()));

        if (entity.getDeletedAt() != null) {
            throw new IllegalStateException("Không thể cập nhật cầu cảng đã bị xóa");
        }

        Pier snapshot = Pier.builder()
                .pierCode(entity.getPierCode())
                .pierName(entity.getPierName()).berthId(entity.getBerthId())
                .length(entity.getLength()).designLoad(entity.getDesignLoad())
                .pierType(entity.getPierType()).operationalFunction(entity.getOperationalFunction())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
                .orgUnitId(entity.getOrgUnitId())
                .mapSymbolId(entity.getMapSymbolId())
                .build();

        if (request.getPierName() != null)
            entity.setPierName(request.getPierName());
        if (request.getBerthId() != null) {
            entity.setBerthId(request.getBerthId());
            Berth parent = berthRepository.findById(request.getBerthId())
                    .orElseThrow(
                            () -> new EntityNotFoundException("Bến cảng không tồn tại: " + request.getBerthId()));
            entity.setOrgUnitId(parent.getOrgUnitId());
        } else if (entity.getOrgUnitId() == null && entity.getBerthId() != null) {
            berthRepository.findById(entity.getBerthId()).ifPresent(p -> {
                entity.setOrgUnitId(p.getOrgUnitId());
            });
        }
        if (request.getLength() != null)
            entity.setLength(request.getLength());
        if (request.getDesignLoad() != null)
            entity.setDesignLoad(request.getDesignLoad());
        if (request.getPierType() != null)
            entity.setPierType(request.getPierType());
        if (request.getOperationalFunction() != null)
            entity.setOperationalFunction(request.getOperationalFunction());
        if (request.getOperationalStatus() != null)
            entity.setOperationalStatus(request.getOperationalStatus());
        entity.setMapSymbolId(request.getMapSymbolId());

        if (request.getCoordinates() != null) {
            if (request.getCoordinates().trim().isEmpty()) {
                if (entity.getSpatialId() != null) {
                    gisSpatialObjectService.delete(entity.getSpatialId());
                    entity.setSpatialId(null);
                }
            } else {
                GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.LINE;
                GisSpatialObjectType objType = getSpatialObjectType(geomType);
                GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        entity.getSpatialId(),
                        entity.getPierName(),
                        entity.getPierCode(),
                        geomType,
                        objType,
                        request.getCoordinates(),
                        entity.getId(),
                        InfrastructureType.PIER
                );
                entity.setSpatialId(spatialObj.getId());
            }
        } else if (entity.getSpatialId() != null && request.getPierName() != null) {
            gisSpatialObjectService.findById(entity.getSpatialId()).ifPresent(spatialObj -> {
                gisSpatialObjectService.createOrUpdate(
                        spatialObj.getId(),
                        request.getPierName(),
                        spatialObj.getCode(),
                        spatialObj.getGeometryType(),
                        spatialObj.getObjectType(),
                        spatialObj.getCoordinates(),
                        entity.getId(),
                        InfrastructureType.PIER
                );
            });
        }

        entity.setApprovalStatus(ApprovalStatus.PENDING);

        Pier saved = pierRepository.save(entity);

        changeHistoryService.recordChanges("Pier", saved.getId().toString(),
                "system", snapshot, saved);

        log.info("Updated Pier [{}] code={}", saved.getId(), saved.getPierCode());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        Pier entity = pierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + id));

        if (entity.getDeletedAt() != null) {
            throw new IllegalStateException("Cầu cảng đã bị xóa trước đó");
        }
        if (entity.getApprovalStatus() != ApprovalStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể xóa cầu cảng ở trạng thái Chờ phê duyệt và chưa được gửi duyệt");
        }

        entity.softDelete(SecurityUtils.getCurrentUserId());
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        pierRepository.save(entity);
        log.info("Soft-deleted Pier [{}] code={}", entity.getId(), entity.getPierCode());
    }


    private PierResponse toResponse(Pier e) {
        return toResponse(e, null, null, null, null);
    }

    private PierResponse toResponse(Pier e, String preResolvedBerthName) {
        return toResponse(e, preResolvedBerthName, null, null, null);
    }

    private PierResponse toResponse(Pier e, String preResolvedBerthName, String preResolvedCreatorName, String preResolvedUpdaterName) {
        return toResponse(e, preResolvedBerthName, preResolvedCreatorName, preResolvedUpdaterName, null);
    }

    private PierResponse toResponse(Pier e, String preResolvedBerthName, String preResolvedCreatorName, String preResolvedUpdaterName, GisSpatialObject preResolvedSpatial) {
        GisGeometryType geomType = null;
        String coords = null;

        GisSpatialObject spatial = preResolvedSpatial;
        if (spatial == null && e.getSpatialId() != null) {
            spatial = gisSpatialObjectRepository.findById(e.getSpatialId()).orElse(null);
        }

        if (spatial != null) {
            geomType = spatial.getGeometryType();
            coords = spatial.getCoordinates();
        }

        String berthName = preResolvedBerthName;
        if (berthName == null && e.getBerthId() != null) {
            berthName = berthRepository.findById(e.getBerthId()).map(Berth::getBerthName).orElse(null);
        }

        String createdBy = preResolvedCreatorName != null ? preResolvedCreatorName : userResolverService.resolveName(e.getCreatedBy() != null ? e.getCreatedBy() : null);
        String updatedBy = preResolvedUpdaterName != null ? preResolvedUpdaterName : userResolverService.resolveName(e.getUpdatedBy() != null ? e.getUpdatedBy() : null);

        return PierResponse.builder()
                .id(e.getId()).pierCode(e.getPierCode()).pierName(e.getPierName())
                .berthId(e.getBerthId())
                .berthName(berthName)
                .length(e.getLength())
                .designLoad(e.getDesignLoad()).pierType(e.getPierType())
                .operationalFunction(e.getOperationalFunction())
                .operationalStatus(e.getOperationalStatus()).approvalStatus(e.getApprovalStatus())
                .orgUnitId(e.getOrgUnitId()).orgUnitName(orgUnitCacheService.getName(e.getOrgUnitId()))
                .mapSymbolId(e.getMapSymbolId())
                .spatialId(e.getSpatialId())
                .geometryType(geomType)
                .coordinates(coords)
                .createdBy(e.getCreatedBy())
                .updatedBy(e.getUpdatedBy())
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt())
                // ── Spec Group A: Basic info ──
                .portId(e.getPortId())
                .navigationChannelId(e.getNavigationChannelId())
                .province(e.getProvince())
                .detailedLocation(e.getDetailedLocation())
                .constructionGrade(e.getConstructionGrade())
                .structureType(e.getStructureType())
                .conditionStatus(e.getConditionStatus())
                // ── Spec Group B: Technical ──
                .width(e.getWidth())
                .currentWaterDepth(e.getCurrentWaterDepth())
                .designBedElevation(e.getDesignBedElevation())
                .publishedVesselDWT(e.getPublishedVesselDWT())
                // ── Spec Group C: Dates ──
                .maintenanceApprovalDate(e.getMaintenanceApprovalDate())
                .safetyAssessmentDate(e.getSafetyAssessmentDate())
                .lastInspectionDate(e.getLastInspectionDate())
                // ── Spec Group D: Quantities ──
                .operatingPierCount(e.getOperatingPierCount())
                .publishedPierCount(e.getPublishedPierCount())
                .investmentAgreementPierCount(e.getInvestmentAgreementPierCount())
                .cargoThroughput(e.getCargoThroughput())
                // ── Spec Group E: ATHH ──
                .receivesLargeVessel(e.getReceivesLargeVessel())
                .documentNumber(e.getDocumentNumber())
                .documentDate(e.getDocumentDate())
                // ── Spec Group F: Opening announcement ──
                .openingAnnouncementDate(e.getOpeningAnnouncementDate())
                .openingDecision(e.getOpeningDecision())
                .investmentAgreementDoc(e.getInvestmentAgreementDoc())
                // ── Spec Group G: GIS additional ──
                .waterAreaNeutralScope(e.getWaterAreaNeutralScope())
                .build();
    }

    private GisGeometryType parseGeometryType(String typeStr) {
        if (typeStr == null) return GisGeometryType.LINE;
        try {
            return GisGeometryType.valueOf(typeStr.toUpperCase());
        } catch (IllegalArgumentException ex) {
            return GisGeometryType.LINE;
        }
    }

    public String generatePierCode(UUID berthId) {
        Berth berth = berthRepository.findById(berthId)
            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng"));
        String berthCode = berth.getBerthCode();
        String prefix = berthCode + "-CC";
        List<Pier> existing = pierRepository.findByBerthIdAndDeletedAtIsNull(berthId);
        int maxNum = 0;
        for (Pier p : existing) {
            if (p.getPierCode() != null && p.getPierCode().startsWith(prefix)) {
                try {
                    int n = Integer.parseInt(p.getPierCode().substring(prefix.length()));
                    if (n > maxNum) maxNum = n;
                } catch (NumberFormatException ignored) {}
            }
        }
        return prefix + String.format("%02d", maxNum + 1);
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT) return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.POLYGON) return GisSpatialObjectType.POLYGON_OTHER;
        return GisSpatialObjectType.LINE_OTHER;
    }
}
