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
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
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
    private final UserRepository userRepository;
    private final GisSpatialObjectRepository gisSpatialObjectRepository;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;

    @Transactional
    public PierResponse create(CreatePierRequest request) {
        FieldWriteGuard.validateObject(request);
        if (pierRepository.existsByPierCode(request.getPierCode())) {
            throw new IllegalArgumentException("Mã " + request.getPierCode() + " đã tồn tại");
        }
        if (pierRepository.existsByPierName(request.getPierName())) {
            throw new IllegalArgumentException("Tên cầu cảng \"" + request.getPierName() + "\" đã tồn tại");
        }

        Berth parent = berthRepository.findById(request.getBerthId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "Bến cảng không tồn tại: " + request.getBerthId()));

        if (parent.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new IllegalArgumentException("Bến cảng cha phải ở trạng thái đã phê duyệt (APPROVED)");
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
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType()
                    : GisGeometryType.LINE;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    request.getPierName(),
                    request.getPierCode(),
                    geomType,
                    objType,
                    request.getCoordinates(),
                    pierId,
                    InfrastructureType.PIER);
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
                .coordinateSystem(request.getCoordinateSystem())
                .displayRule(request.getDisplayRule())
                .build();

        // Handle saveAction the same way as Berth (DRAFT / SUBMIT / SAVE_AND_APPROVE /
        // APPROVED)
        String action = request.getSaveAction() != null ? request.getSaveAction() : "DRAFT";
        applySaveAction(entity, action);

        Pier saved = pierRepository.save(entity);

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
        return findAll(page, size, orgUnitId, null, null, null, null, null, null, null, null,
                null, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<PierResponse> findAll(int page, int size, UUID orgUnitId,
            String search, UUID berthId,
            String status, String approvalStatus) {
        return findAll(page, size, orgUnitId, search, null, null, berthId, null, (PierType) null, null, status, approvalStatus,
                null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<PierResponse> findAll(int page, int size, UUID orgUnitId,
            String search, String pierCode, String pierName, UUID berthId, UUID portId, PierType pierType, String province,
            String status, String approvalStatus, UUID navigationChannelId,
            Integer constructionGrade, Integer structureType, String operationalFunction,
            String updatedFrom, String updatedTo) {
        return findAll(page, size, orgUnitId, search, pierCode, pierName, berthId, portId, pierType, province,
                status, approvalStatus, navigationChannelId, constructionGrade, structureType,
                operationalFunction, updatedFrom, updatedTo, null);
    }

    private String mapSortProperty(String sortBy) {
        if (sortBy == null || sortBy.isBlank()) return null;
        return switch (sortBy.trim()) {
            case "pierCode", "code" -> "pierCode";
            case "pierName", "name" -> "pierName";
            case "pierType" -> "pierType";
            case "province", "provinceId" -> "province";
            case "status", "conditionStatus", "operationalStatus" -> "operationalStatus";
            case "approvalStatus" -> "approvalStatus";
            case "constructionGrade" -> "constructionGrade";
            case "structureType" -> "structureType";
            case "operationalFunction" -> "operationalFunction";
            case "updatedAt", "updatedByName" -> EntityFields.UPDATED_AT;
            case "createdAt", "createdDate" -> EntityFields.CREATED_AT;
            default -> null;
        };
    }

    @Transactional(readOnly = true)
    public Page<PierResponse> findAll(int page, int size, UUID orgUnitId,
            String search, String pierCode, String pierName, UUID berthId, UUID portId, PierType pierType, String province,
            String status, String approvalStatus, UUID navigationChannelId,
            Integer constructionGrade, Integer structureType, String operationalFunction,
            String updatedFrom, String updatedTo, Boolean isDeleted) {
        return findAll(page, size, orgUnitId, search, pierCode, pierName, berthId, portId, pierType, province,
                status, approvalStatus, navigationChannelId, constructionGrade, structureType,
                operationalFunction, updatedFrom, updatedTo, isDeleted, null, null);
    }

    @Transactional(readOnly = true)
    public Page<PierResponse> findAll(int page, int size, UUID orgUnitId,
            String search, String pierCode, String pierName, UUID berthId, UUID portId, PierType pierType, String province,
            String status, String approvalStatus, UUID navigationChannelId,
            Integer constructionGrade, Integer structureType, String operationalFunction,
            String updatedFrom, String updatedTo, Boolean isDeleted,
            String sortBy, String sortDir) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Sort sort = Sort.by(Sort.Order.desc(EntityFields.UPDATED_AT), Sort.Order.desc(EntityFields.CREATED_AT), Sort.Order.asc(EntityFields.ID));
        if (sortBy != null && !sortBy.isBlank()) {
            String property = mapSortProperty(sortBy);
            if (property != null) {
                Sort.Direction direction = "ASC".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
                sort = Sort.by(direction, property).and(sort);
            }
        }
        Pageable pageable = PageRequest.of(page, pageSize, sort);
        OperationalStatus statusEnum = status != null ? OperationalStatus.fromString(status) : null;
        boolean deletedOnly = "DELETED".equalsIgnoreCase(approvalStatus != null ? approvalStatus.trim() : null)
                || "ARCHIVED".equalsIgnoreCase(approvalStatus != null ? approvalStatus.trim() : null)
                || Boolean.TRUE.equals(isDeleted);
        ApprovalStatus approvalEnum = (approvalStatus != null && !approvalStatus.trim().isEmpty() && !deletedOnly)
                ? ApprovalStatus.fromString(approvalStatus)
                : null;
        LocalDateTime updatedFromDt = null;
        if (updatedFrom != null && !updatedFrom.trim().isEmpty()) {
            try {
                updatedFromDt = LocalDateTime.parse(updatedFrom.replace(" ", "T"));
            } catch (Exception e) {
                /* ignore */ }
        }
        LocalDateTime updatedToDt = null;
        if (updatedTo != null && !updatedTo.trim().isEmpty()) {
            try {
                updatedToDt = LocalDateTime.parse(updatedTo.replace(" ", "T"));
            } catch (Exception e) {
                /* ignore */ }
        }
        boolean includeAll = orgUnitId == null;
        List<UUID> orgUnitIds = orgUnitId != null ? orgUnitScopeService.resolveSubtreeIds(orgUnitId) : List.of();
        Page<Pier> pageResult = pierRepository.searchPiers(deletedOnly, approvalEnum, includeAll, orgUnitIds, search, pierCode, pierName, berthId, portId, pierType,
                province,
                statusEnum, navigationChannelId, constructionGrade, structureType,
                operationalFunction, updatedFromDt, updatedToDt, pageable);

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
                if (e.getCreatedBy() != null)
                    userUuids.add(e.getCreatedBy());
                if (e.getUpdatedBy() != null)
                    userUuids.add(e.getUpdatedBy());
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
                spatialMap.get(e.getSpatialId())));
    }

    @Transactional(readOnly = true)
    public PierResponse findByCode(String pierCode) {
        return toResponse(pierRepository.findByPierCode(pierCode)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với mã: " + pierCode)));
    }

    @Transactional
    public PierResponse update(UpdatePierRequest request) {
        FieldWriteGuard.validateObject(request);
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
                // ── Spec fields snapshot ──
                .portId(entity.getPortId())
                .navigationChannelId(entity.getNavigationChannelId())
                .province(entity.getProvince())
                .detailedLocation(entity.getDetailedLocation())
                .constructionGrade(entity.getConstructionGrade())
                .structureType(entity.getStructureType())
                .conditionStatus(entity.getConditionStatus())
                .width(entity.getWidth())
                .currentWaterDepth(entity.getCurrentWaterDepth())
                .designBedElevation(entity.getDesignBedElevation())
                .publishedVesselDWT(entity.getPublishedVesselDWT())
                .maintenanceApprovalDate(entity.getMaintenanceApprovalDate())
                .safetyAssessmentDate(entity.getSafetyAssessmentDate())
                .lastInspectionDate(entity.getLastInspectionDate())
                .operatingPierCount(entity.getOperatingPierCount())
                .publishedPierCount(entity.getPublishedPierCount())
                .investmentAgreementPierCount(entity.getInvestmentAgreementPierCount())
                .cargoThroughput(entity.getCargoThroughput())
                .receivesLargeVessel(entity.getReceivesLargeVessel())
                .documentNumber(entity.getDocumentNumber())
                .documentDate(entity.getDocumentDate())
                .openingAnnouncementDate(entity.getOpeningAnnouncementDate())
                .openingDecision(entity.getOpeningDecision())
                .investmentAgreementDoc(entity.getInvestmentAgreementDoc())
                .waterAreaNeutralScope(entity.getWaterAreaNeutralScope())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
                .spatialId(entity.getSpatialId())
                .submittedForApprovalAt(entity.getSubmittedForApprovalAt())
                .submittedForApprovalBy(entity.getSubmittedForApprovalBy())
                .portAuthorityApprovedAt(entity.getPortAuthorityApprovedAt())
                .portAuthorityApprovedBy(entity.getPortAuthorityApprovedBy())
                .departmentApprovedAt(entity.getDepartmentApprovedAt())
                .departmentApprovedBy(entity.getDepartmentApprovedBy())
                .portAuthorityApprovalContent(entity.getPortAuthorityApprovalContent())
                .departmentApprovalContent(entity.getDepartmentApprovalContent())
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
        entity.setLength(request.getLength());
        entity.setDesignLoad(request.getDesignLoad());
        entity.setPierType(request.getPierType());
        entity.setOperationalFunction(request.getOperationalFunction());
        if (request.getOperationalStatus() != null)
            entity.setOperationalStatus(request.getOperationalStatus());
        entity.setMapSymbolId(request.getMapSymbolId());
        entity.setCoordinateSystem(request.getCoordinateSystem());
        entity.setDisplayRule(request.getDisplayRule());
        entity.setPortId(request.getPortId());
        entity.setNavigationChannelId(request.getNavigationChannelId());
        entity.setProvince(request.getProvince());
        entity.setDetailedLocation(request.getDetailedLocation());
        entity.setConstructionGrade(request.getConstructionGrade());
        entity.setStructureType(request.getStructureType());
        if (request.getConditionStatus() != null)
            entity.setConditionStatus(request.getConditionStatus());
        entity.setWidth(request.getWidth());
        entity.setCurrentWaterDepth(request.getCurrentWaterDepth());
        entity.setDesignBedElevation(request.getDesignBedElevation());
        entity.setPublishedVesselDWT(request.getPublishedVesselDWT());
        entity.setMaintenanceApprovalDate(request.getMaintenanceApprovalDate());
        entity.setSafetyAssessmentDate(request.getSafetyAssessmentDate());
        entity.setLastInspectionDate(request.getLastInspectionDate());
        entity.setOperatingPierCount(request.getOperatingPierCount());
        entity.setPublishedPierCount(request.getPublishedPierCount());
        entity.setInvestmentAgreementPierCount(request.getInvestmentAgreementPierCount());
        entity.setCargoThroughput(request.getCargoThroughput());
        entity.setReceivesLargeVessel(request.getReceivesLargeVessel());
        entity.setDocumentNumber(request.getDocumentNumber());
        entity.setDocumentDate(request.getDocumentDate());
        entity.setOpeningAnnouncementDate(request.getOpeningAnnouncementDate());
        entity.setOpeningDecision(request.getOpeningDecision());
        entity.setInvestmentAgreementDoc(request.getInvestmentAgreementDoc());
        entity.setWaterAreaNeutralScope(request.getWaterAreaNeutralScope());

        // Lấy tọa độ + loại hình GIS cũ (WKT) trước khi createOrUpdate ghi đè spatial object
        // (chuẩn Cảng biển PortService.update — dùng cho lịch sử "Tọa độ GIS" / "Loại đối tượng GIS").
        String oldWkt = null;
        GisGeometryType oldGeomType = null;
        if (entity.getSpatialId() != null) {
            GisSpatialObject oldSpatial = gisSpatialObjectService.findById(entity.getSpatialId()).orElse(null);
            if (oldSpatial != null) {
                oldWkt = oldSpatial.getCoordinates();
                oldGeomType = oldSpatial.getGeometryType();
            }
        }

        if (request.getCoordinates() != null) {
            if (request.getCoordinates().trim().isEmpty()) {
                if (entity.getSpatialId() != null) {
                    gisSpatialObjectService.delete(entity.getSpatialId());
                    entity.setSpatialId(null);
                }
            } else {
                GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType()
                        : GisGeometryType.LINE;
                GisSpatialObjectType objType = getSpatialObjectType(geomType);
                GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        entity.getSpatialId(),
                        entity.getPierName(),
                        entity.getPierCode(),
                        geomType,
                        objType,
                        request.getCoordinates(),
                        entity.getId(),
                        InfrastructureType.PIER);
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
                        InfrastructureType.PIER);
            });
        }

        ApprovalStatus previousApprovalStatus = snapshot.getApprovalStatus();
        boolean wasApproved = previousApprovalStatus == ApprovalStatus.APPROVED
                || previousApprovalStatus == ApprovalStatus.APPROVED_LEVEL2;

        if (wasApproved) {
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
        } else if (request.getSaveAction() != null) {
            applySaveAction(entity, request.getSaveAction());
        }

        UUID operatorId = SecurityUtils.getCurrentUserId();
        String actorId = operatorId != null ? operatorId.toString() : "system";

        entity.setUpdatedAt(LocalDateTime.now());
        if (operatorId != null) {
            entity.setUpdatedBy(operatorId);
        }
        Pier saved = pierRepository.saveAndFlush(entity);

        if (wasApproved) {
            // Lịch sử vị trí theo chuẩn Cảng biển (PortService.update): 2 dòng riêng
            // "Tọa độ GIS" + "Loại đối tượng GIS", kèm actor thật (không phải "system").
            if (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty()) {
                GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType()
                        : GisGeometryType.LINE;
                String newWkt = request.getCoordinates().trim();
                boolean wktChanged = oldWkt == null || !com.hanghai.kchtg.common.util.WktCoordinateUtils.coordinatesEqual(newWkt, oldWkt);
                if (wktChanged) {
                    changeHistoryService.insertChangeRecord("Pier", saved.getId(), "Tọa độ GIS",
                            (oldWkt == null || oldWkt.trim().isEmpty()) ? "Chưa có" : oldWkt.trim(),
                            newWkt, actorId);
                }
                boolean typeChanged = request.getGeometryType() != null && oldGeomType != geomType;
                if (typeChanged) {
                    changeHistoryService.insertChangeRecord("Pier", saved.getId(), "Loại đối tượng GIS",
                            oldGeomType != null ? geometryTypeLabel(oldGeomType) : "Chưa có",
                            geometryTypeLabel(geomType), actorId);
                }
            }

            changeHistoryService.recordChanges("Pier", saved.getId().toString(),
                    actorId, snapshot, saved);
        }

        log.info("Updated Pier [{}] code={}", saved.getId(), saved.getPierCode());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        Pier entity = pierRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cầu cảng với id: " + id));
        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT) {
            throw new IllegalArgumentException("Chỉ được xóa cầu cảng ở trạng thái Nháp");
        }

        if (entity.getDeletedAt() != null) {
            throw new IllegalStateException("Cầu cảng đã bị xóa trước đó");
        }

        // Chụp snapshot trước khi xóa mềm để ghi lịch sử thay đổi (chuẩn Cảng biển)
        Pier.builder()
                .pierCode(entity.getPierCode())
                .pierName(entity.getPierName()).berthId(entity.getBerthId())
                .length(entity.getLength()).designLoad(entity.getDesignLoad())
                .pierType(entity.getPierType()).operationalFunction(entity.getOperationalFunction())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
                .orgUnitId(entity.getOrgUnitId())
                .mapSymbolId(entity.getMapSymbolId())
                .portId(entity.getPortId())
                .navigationChannelId(entity.getNavigationChannelId())
                .province(entity.getProvince())
                .detailedLocation(entity.getDetailedLocation())
                .constructionGrade(entity.getConstructionGrade())
                .structureType(entity.getStructureType())
                .conditionStatus(entity.getConditionStatus())
                .width(entity.getWidth())
                .currentWaterDepth(entity.getCurrentWaterDepth())
                .designBedElevation(entity.getDesignBedElevation())
                .publishedVesselDWT(entity.getPublishedVesselDWT())
                .maintenanceApprovalDate(entity.getMaintenanceApprovalDate())
                .safetyAssessmentDate(entity.getSafetyAssessmentDate())
                .lastInspectionDate(entity.getLastInspectionDate())
                .operatingPierCount(entity.getOperatingPierCount())
                .publishedPierCount(entity.getPublishedPierCount())
                .investmentAgreementPierCount(entity.getInvestmentAgreementPierCount())
                .cargoThroughput(entity.getCargoThroughput())
                .receivesLargeVessel(entity.getReceivesLargeVessel())
                .documentNumber(entity.getDocumentNumber())
                .documentDate(entity.getDocumentDate())
                .openingAnnouncementDate(entity.getOpeningAnnouncementDate())
                .openingDecision(entity.getOpeningDecision())
                .investmentAgreementDoc(entity.getInvestmentAgreementDoc())
                .waterAreaNeutralScope(entity.getWaterAreaNeutralScope())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
                .spatialId(entity.getSpatialId())
                .submittedForApprovalAt(entity.getSubmittedForApprovalAt())
                .submittedForApprovalBy(entity.getSubmittedForApprovalBy())
                .portAuthorityApprovedAt(entity.getPortAuthorityApprovedAt())
                .portAuthorityApprovedBy(entity.getPortAuthorityApprovedBy())
                .departmentApprovedAt(entity.getDepartmentApprovedAt())
                .departmentApprovedBy(entity.getDepartmentApprovedBy())
                .portAuthorityApprovalContent(entity.getPortAuthorityApprovalContent())
                .departmentApprovalContent(entity.getDepartmentApprovalContent())
                .build();
        entity.softDelete(SecurityUtils.getCurrentUserId());
        entity.setApprovalStatus(ApprovalStatus.ARCHIVED);
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        pierRepository.save(entity);
        log.info("Soft-deleted Pier [{}] code={}", entity.getId(), entity.getPierCode());
    }

    private PierResponse toResponse(Pier e) {
        return toResponse(e, null, null, null, null);
    }

    private PierResponse toResponse(Pier e, String preResolvedBerthName, String preResolvedCreatorName,
            String preResolvedUpdaterName, GisSpatialObject preResolvedSpatial) {
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

        PierResponse response = PierResponse.builder()
                .id(e.getId())
                .pierCode(e.getPierCode()).pierName(e.getPierName())
                .berthId(e.getBerthId())
                .berthName(berthName)
                .length(e.getLength())
                .designLoad(e.getDesignLoad()).pierType(e.getPierType())
                .operationalFunction(e.getOperationalFunction())
                .operationalStatus(e.getOperationalStatus())
                .approvalStatus(e.getDeletedAt() != null ? ApprovalStatus.ARCHIVED : e.getApprovalStatus())
                .orgUnitId(e.getOrgUnitId()).orgUnitName(orgUnitCacheService.getName(e.getOrgUnitId()))
                .mapSymbolId(e.getMapSymbolId())
                .spatialId(e.getSpatialId())
                .geometryType(geomType)
                .coordinates(coords)
                .createdBy(e.getCreatedBy())
                .updatedBy(e.getUpdatedBy())
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt())
                .deletedAt(e.getDeletedAt()).deletedBy(e.getDeletedBy())
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
                .coordinateSystem(e.getCoordinateSystem())
                .displayRule(e.getDisplayRule())
                .submittedForApprovalAt(e.getSubmittedForApprovalAt())
                .submittedForApprovalBy(e.getSubmittedForApprovalBy())
                .portAuthorityApprovedAt(e.getPortAuthorityApprovedAt())
                .portAuthorityApprovedBy(e.getPortAuthorityApprovedBy())
                .departmentApprovedAt(e.getDepartmentApprovedAt())
                .departmentApprovedBy(e.getDepartmentApprovedBy())
                .portAuthorityApprovalContent(e.getPortAuthorityApprovalContent())
                .departmentApprovalContent(e.getDepartmentApprovalContent())
                .build();

        parseLatLng(coords, response);
        return response;
    }

    private void parseLatLng(String coordinates, PierResponse response) {
        if (coordinates == null || !coordinates.startsWith("POINT(")) return;
        try {
            String inner = coordinates.substring(6, coordinates.length() - 1).trim();
            String[] parts = inner.split("\\s+");
            if (parts.length == 2) {
                response.setLongitude(new BigDecimal(parts[0]));
                response.setLatitude(new BigDecimal(parts[1]));
            }
        } catch (Exception ignored) { }
    }

    /** Nhãn hiển thị loại hình GIS theo chuẩn VTS CHK (dùng cho lịch sử thay đổi). */
    private static String geometryTypeLabel(GisGeometryType type) {
        if (type == null) return "Chưa có";
        return switch (type) {
            case POINT -> "Đối tượng điểm";
            case LINE -> "Đối tượng đường";
            case POLYGON -> "Đối tượng vùng";
        };
    }

    private void applySaveAction(Pier entity, String action) {
        switch (action) {
            case "DRAFT":
                entity.setApprovalStatus(ApprovalStatus.DRAFT);
                break;
            case "SUBMIT":
                entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
                entity.setSubmittedForApprovalAt(LocalDateTime.now());
                entity.setSubmittedForApprovalBy(
                        SecurityUtils.getCurrentUserId() != null ? SecurityUtils.getCurrentUserId().toString() : null);
                break;
            case "APPROVED":
            case "SAVE_AND_APPROVE":
                entity.setApprovalStatus(ApprovalStatus.APPROVED);
                entity.setSubmittedForApprovalAt(LocalDateTime.now());
                entity.setSubmittedForApprovalBy(
                        SecurityUtils.getCurrentUserId() != null ? SecurityUtils.getCurrentUserId().toString() : null);
                entity.setPortAuthorityApprovedAt(LocalDateTime.now());
                entity.setPortAuthorityApprovedBy(
                        SecurityUtils.getCurrentUserId() != null ? SecurityUtils.getCurrentUserId().toString() : null);
                entity.setDepartmentApprovedAt(LocalDateTime.now());
                entity.setDepartmentApprovedBy(
                        SecurityUtils.getCurrentUserId() != null ? SecurityUtils.getCurrentUserId().toString() : null);
                break;
            default:
                entity.setApprovalStatus(ApprovalStatus.DRAFT);
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
                    if (n > maxNum)
                        maxNum = n;
                } catch (NumberFormatException ignored) {
                }
            }
        }
        return prefix + String.format("%02d", maxNum + 1);
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT)
            return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.POLYGON)
            return GisSpatialObjectType.POLYGON_OTHER;
        return GisSpatialObjectType.LINE_OTHER;
    }
}
