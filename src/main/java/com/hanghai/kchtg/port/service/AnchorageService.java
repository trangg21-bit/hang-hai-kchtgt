package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.port.dto.anchorage.AnchorageResponse;
import com.hanghai.kchtg.port.dto.anchorage.AttachmentDto;
import com.hanghai.kchtg.port.dto.anchorage.CreateAnchorageRequest;
import com.hanghai.kchtg.port.dto.anchorage.MooringWaterAreaAnchorPointRequest;
import com.hanghai.kchtg.port.dto.anchorage.MooringWaterAreaAnchorPointResponse;
import com.hanghai.kchtg.port.dto.anchorage.MooringWaterAreaRequest;
import com.hanghai.kchtg.port.dto.anchorage.MooringWaterAreaResponse;
import com.hanghai.kchtg.port.dto.anchorage.UpdateAnchorageRequest;
import com.hanghai.kchtg.port.entity.Anchorage;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.entity.BuoyBerth;
import com.hanghai.kchtg.port.entity.MooringWaterArea;
import com.hanghai.kchtg.port.entity.MooringWaterAreaAnchorPoint;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.AnchorageRepository;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.repository.BuoyBerthRepository;
import com.hanghai.kchtg.port.repository.MooringWaterAreaAnchorPointRepository;
import com.hanghai.kchtg.port.repository.MooringWaterAreaRepository;
import com.hanghai.kchtg.navigationchannel.entity.NavigationChannel;
import com.hanghai.kchtg.navigationchannel.repository.NavigationChannelRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.security.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.JpaSort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnchorageService {

    private final AnchorageRepository anchorageRepository;
    private final PortRepository portRepository;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final PortCacheService portCacheService;
    private final AttachmentRepository attachmentRepository;
    private final BuoyBerthRepository buoyBerthRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final NavigationChannelRepository navigationChannelRepository;
    private final MooringWaterAreaRepository mooringWaterAreaRepository;
    private final MooringWaterAreaAnchorPointRepository mooringWaterAreaAnchorPointRepository;
    private final InfrastructureHistoryRepository historyRepository;
    private final ChangeHistoryService changeHistoryService;
    private final UserResolverService userResolverService;

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    @Transactional
    public AnchorageResponse create(CreateAnchorageRequest request) {
        Port port = portRepository.findById(request.getPortId())
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));

        if (port.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new IllegalArgumentException("Không thể tạo khu neo đậu: cảng biển cha phải ở trạng thái được phê duyệt");
        }

        if (request.getAnchorageName() == null || request.getAnchorageName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên khu neo đậu không được để trống");
        }
        String trimmedName = request.getAnchorageName().trim();
        if (anchorageRepository.existsByAnchorageName(trimmedName)) {
            throw new IllegalArgumentException("Tên khu neo đậu \"" + trimmedName + "\" đã tồn tại");
        }

        // RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
        //         : RecordSecurityLevel.NORMAL;
        // RecordSecurityLevel.validateAssignment(secLevel, "anchorage", SecurityUtils.getCurrentUserPermissions(),
        //         SecurityUtils.isElevatedAdministrator());

        String code = generateAnchorageCode(request.getPortId());

        Anchorage entity = Anchorage.builder()
                // .securityLevel(secLevel)
                .anchorageCode(code)
                .anchorageName(trimmedName)
                .portId(request.getPortId())
                .orgUnitId(port.getOrgUnitId())
                .navigationChannelId(request.getNavigationChannelId())
                .buoyStationId(request.getBuoyStationId())
                .provinceId(request.getProvinceId())
                .detailedLocation(request.getDetailedLocation())
                .operationalStatus(request.getOperationalStatus())
                .shapeDescription(request.getShapeDescription())
                .area(request.getArea())
                .designWaterDepth(request.getDesignWaterDepth())
                .currentWaterDepth(request.getCurrentWaterDepth())
                .bottomElevationDesign(request.getBottomElevationDesign())
                .maxVesselDWT(request.getMaxVesselDWT())
                .activeAnchorageCount(request.getActiveAnchorageCount())
                .publishedAnchorageCount(request.getPublishedAnchorageCount())
                .underInvestmentAnchorageCount(request.getUnderInvestmentAnchorageCount())
                .remarks(request.getRemarks())
                .openingAnnouncementDate(request.getOpeningAnnouncementDate())
                .publicDecision(request.getPublicDecision())
                .investmentAgreement(request.getInvestmentAgreement())
                .mapSymbolId(request.getMapSymbolId())
                .coordinateSystem(request.getCoordinateSystem())
                .displayRule(request.getDisplayRule())
                .build();

        LocalDateTime now = LocalDateTime.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        String action = request.getSaveAction() != null ? request.getSaveAction() : "DRAFT";
        applySaveAction(entity, action);

        Anchorage saved = anchorageRepository.saveAndFlush(entity);
        boolean hasGeomCreate = request.getGeometryType() != null;
        boolean hasCoordsCreate = (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty())
                || (request.getLongitude() != null && request.getLatitude() != null);
        persistGisAndMooring(saved, request.getGeometryType(), request.getCoordinates(),
                request.getLongitude(), request.getLatitude(), request.getMooringWaterAreas(), false, hasGeomCreate && hasCoordsCreate);
        evictAfterCommit();

        return toResponse(saved);
    }

    @Transactional
    public AnchorageResponse update(UpdateAnchorageRequest request) {
        Anchorage entity = anchorageRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu neo đậu với id: " + request.getId()));
        if (entity.getDeletedAt() != null || entity.getDeletedBy() != null) {
            throw new IllegalStateException("Không thể chỉnh sửa khu neo đậu đã bị xóa");
        }

        String coordinates = trimToNull(request.getCoordinates());
        if (coordinates == null && request.getLongitude() != null && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        // Chụp snapshot đầy đủ trước khi thay đổi để ghi lịch sử chi tiết (chuẩn Bến cảng)
        Anchorage snapshot = buildSnapshot(entity);

        // if (request.getSecurityLevel() != null) {
        //     RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "anchorage",
        //             SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
        //     entity.setSecurityLevel(request.getSecurityLevel());
        // }
        if (request.isFieldPresent("anchorageName")) {
            String trimmedName = trimToNull(request.getAnchorageName());
            if (trimmedName == null || trimmedName.isEmpty()) {
                throw new IllegalArgumentException("Tên khu neo đậu không được để trống");
            }
            if (!trimmedName.equalsIgnoreCase(entity.getAnchorageName())
                    && anchorageRepository.existsByAnchorageNameAndIdNot(trimmedName, entity.getId())) {
                throw new IllegalArgumentException("Tên khu neo đậu \"" + trimmedName + "\" đã tồn tại");
            }
            entity.setAnchorageName(trimmedName);
        }
        if (request.isFieldPresent("portId")) {
            if (request.getPortId() != null) {
                Port parent = portRepository.findById(request.getPortId())
                        .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));
                entity.setPortId(request.getPortId());
                entity.setOrgUnitId(parent.getOrgUnitId());
            } else {
                entity.setPortId(null);
            }
        } else if (entity.getOrgUnitId() == null && entity.getPortId() != null) {
            portRepository.findById(entity.getPortId()).ifPresent(p -> entity.setOrgUnitId(p.getOrgUnitId()));
        }
        if (request.isFieldPresent("orgUnitId"))
            entity.setOrgUnitId(request.getOrgUnitId());
        if (request.isFieldPresent("navigationChannelId"))
            entity.setNavigationChannelId(request.getNavigationChannelId());
        if (request.isFieldPresent("buoyStationId"))
            entity.setBuoyStationId(request.getBuoyStationId());
        if (request.isFieldPresent("provinceId"))
            entity.setProvinceId(request.getProvinceId());
        if (request.isFieldPresent("detailedLocation"))
            entity.setDetailedLocation(trimToNull(request.getDetailedLocation()));
        if (request.isFieldPresent("operationalStatus"))
            entity.setOperationalStatus(request.getOperationalStatus());
        if (request.isFieldPresent("shapeDescription"))
            entity.setShapeDescription(trimToNull(request.getShapeDescription()));
        if (request.isFieldPresent("area"))
            entity.setArea(request.getArea());
        if (request.isFieldPresent("designWaterDepth"))
            entity.setDesignWaterDepth(trimToNull(request.getDesignWaterDepth()));
        if (request.isFieldPresent("currentWaterDepth"))
            entity.setCurrentWaterDepth(trimToNull(request.getCurrentWaterDepth()));
        if (request.isFieldPresent("bottomElevationDesign"))
            entity.setBottomElevationDesign(trimToNull(request.getBottomElevationDesign()));
        if (request.isFieldPresent("maxVesselDWT"))
            entity.setMaxVesselDWT(trimToNull(request.getMaxVesselDWT()));
        if (request.isFieldPresent("activeAnchorageCount"))
            entity.setActiveAnchorageCount(request.getActiveAnchorageCount());
        if (request.isFieldPresent("publishedAnchorageCount"))
            entity.setPublishedAnchorageCount(request.getPublishedAnchorageCount());
        if (request.isFieldPresent("underInvestmentAnchorageCount"))
            entity.setUnderInvestmentAnchorageCount(request.getUnderInvestmentAnchorageCount());
        if (request.isFieldPresent("remarks"))
            entity.setRemarks(trimToNull(request.getRemarks()));
        if (request.isFieldPresent("openingAnnouncementDate"))
            entity.setOpeningAnnouncementDate(request.getOpeningAnnouncementDate());
        if (request.isFieldPresent("publicDecision"))
            entity.setPublicDecision(trimToNull(request.getPublicDecision()));
        if (request.isFieldPresent("investmentAgreement"))
            entity.setInvestmentAgreement(trimToNull(request.getInvestmentAgreement()));

        GisGeometryType geomType = request.getGeometryType();
        if (geomType == null && coordinates != null && !coordinates.isBlank()) {
            String clean = coordinates.trim().replaceFirst("(?i)^SRID=\\d+;", "").trim().toUpperCase();
            if (clean.startsWith("POLYGON")) {
                geomType = GisGeometryType.POLYGON;
            } else if (clean.startsWith("LINESTRING") || clean.startsWith("LINE")) {
                geomType = GisGeometryType.LINE;
            } else {
                geomType = GisGeometryType.POINT;
            }
        }

        boolean hasCoordinates = coordinates != null && !coordinates.isBlank();
        boolean hasGeometryType = geomType != null;
        boolean shouldClearLocation = (request.isFieldPresent("coordinates") || request.isFieldPresent("geometryType"))
                && !hasCoordinates
                && (request.getGeometryType() == null);

        if (shouldClearLocation) {
            entity.setMapSymbolId(null);
            entity.setCoordinateSystem(null);
            entity.setDisplayRule(null);
        } else if (hasGeometryType && hasCoordinates) {
            entity.setMapSymbolId(request.getMapSymbolId());
            entity.setCoordinateSystem(request.getCoordinateSystem() != null ? request.getCoordinateSystem() : 1);
            entity.setDisplayRule(request.getDisplayRule() != null ? request.getDisplayRule() : 1);
        }

        ApprovalStatus previousApprovalStatus = snapshot.getApprovalStatus();
        boolean wasApproved = previousApprovalStatus == ApprovalStatus.APPROVED
                || previousApprovalStatus == ApprovalStatus.APPROVED_LEVEL2;

        if (wasApproved) {
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
        } else if (request.getSaveAction() != null) {
            applySaveAction(entity, request.getSaveAction());
        }

        // Actor thật từ SecurityContext — nếu truyền "system", approvedBy = null và drawer hiện "—"
        UUID operatorId = SecurityUtils.getCurrentUserId();
        String actorId = operatorId != null ? operatorId.toString() : "system";

        // Tọa độ + loại hình GIS cũ (WKT) trước khi persistGisAndMooring ghi đè spatial object
        GisGeometryType oldGeomType = null;
        String oldWkt = null;
        if (snapshot.getSpatialId() != null) {
            GisSpatialObject oldSpatial = gisSpatialObjectService.findById(snapshot.getSpatialId()).orElse(null);
            if (oldSpatial != null) {
                oldWkt = oldSpatial.getCoordinates();
                oldGeomType = oldSpatial.getGeometryType();
            }
        }
        // Summary "Khu nước neo buộc tàu" cũ trước khi replaceMooringWaterAreas xóa + chèn lại
        String oldMooringSummary = buildMooringWaterAreaSummary(
                mooringWaterAreaRepository.findByAnchorageId(entity.getId()));

        entity.setUpdatedAt(LocalDateTime.now());
        if (operatorId != null) {
            entity.setUpdatedBy(operatorId);
        }

        Anchorage saved = anchorageRepository.saveAndFlush(entity);
        persistGisAndMooring(saved, geomType, coordinates,
                request.getLongitude(), request.getLatitude(), request.getMooringWaterAreas(), shouldClearLocation, hasGeometryType && hasCoordinates);

        // Chỉ ghi lịch sử khi hồ sơ đã được duyệt (chuẩn PortService: 2 dòng GIS riêng + summary khu nước).
        if (wasApproved) {
            if (hasGeometryType && hasCoordinates) {
                GisGeometryType effectiveGeomType = geomType != null ? geomType : GisGeometryType.POINT;
                String newWkt = coordinates.trim();
                boolean wktChanged = oldWkt == null || !com.hanghai.kchtg.common.util.WktCoordinateUtils.coordinatesEqual(newWkt, oldWkt);
                if (wktChanged) {
                    changeHistoryService.insertChangeRecord("Anchorage", saved.getId(), "Tọa độ GIS",
                            (oldWkt == null || oldWkt.trim().isEmpty()) ? "Chưa có" : oldWkt.trim(),
                            newWkt, actorId);
                }
                boolean typeChanged = oldGeomType != null && oldGeomType != effectiveGeomType;
                if (typeChanged) {
                    changeHistoryService.insertChangeRecord("Anchorage", saved.getId(), "Loại đối tượng GIS",
                            oldGeomType != null ? geometryTypeLabel(oldGeomType) : "Chưa có",
                            geometryTypeLabel(effectiveGeomType), actorId);
                }
            } else if (shouldClearLocation && (oldWkt != null || oldGeomType != null)) {
                if (oldWkt != null && !oldWkt.trim().isEmpty()) {
                    changeHistoryService.insertChangeRecord("Anchorage", saved.getId(), "Tọa độ GIS",
                            oldWkt.trim(), "Chưa có", actorId);
                }
                if (oldGeomType != null) {
                    changeHistoryService.insertChangeRecord("Anchorage", saved.getId(), "Loại đối tượng GIS",
                            geometryTypeLabel(oldGeomType), "Chưa có", actorId);
                }
            }

            changeHistoryService.recordChanges("Anchorage", saved.getId().toString(),
                    actorId, snapshot, saved);

            // Summary "Khu nước neo buộc tàu" đọc được — không ghi Java toString rác của reflection
            String newMooringSummary = buildMooringWaterAreaSummary(
                    mooringWaterAreaRepository.findByAnchorageId(saved.getId()));
            if (!oldMooringSummary.equals(newMooringSummary)) {
                changeHistoryService.insertChangeRecord("Anchorage", saved.getId(), "Khu nước neo buộc tàu",
                        oldMooringSummary.isEmpty() ? null : oldMooringSummary,
                        newMooringSummary.isEmpty() ? null : newMooringSummary, actorId);
            }
        }
        evictAfterCommit();

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public AnchorageResponse getById(UUID id) {
        Anchorage entity = anchorageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu neo đậu với id: " + id));
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public Page<AnchorageResponse> findAll(int page, int size, UUID orgUnitId,
                                           String search, String anchorageCode, String anchorageName,
                                           UUID portId, UUID navigationChannelId, UUID buoyStationId,
                                           Integer provinceId,
                                           String operationalStatus, String approvalStatus,
                                           String updatedFrom, String updatedTo) {
        return findAll(page, size, orgUnitId, search, anchorageCode, anchorageName, portId, navigationChannelId, buoyStationId, provinceId, operationalStatus, approvalStatus, updatedFrom, updatedTo, null);
    }

    @Transactional(readOnly = true)
    public Page<AnchorageResponse> findAll(int page, int size, UUID orgUnitId,
                                           String search, String anchorageCode, String anchorageName,
                                           UUID portId, UUID navigationChannelId, UUID buoyStationId,
                                           Integer provinceId,
                                           String operationalStatus, String approvalStatus,
                                           String updatedFrom, String updatedTo,
                                           Boolean isDeleted) {
        return findAll(page, size, orgUnitId, search, anchorageCode, anchorageName,
                portId, navigationChannelId, buoyStationId, provinceId,
                operationalStatus, approvalStatus, updatedFrom, updatedTo, isDeleted, null, null);
    }

    @Transactional(readOnly = true)
    public Page<AnchorageResponse> findAll(int page, int size, UUID orgUnitId,
                                           String search, String anchorageCode, String anchorageName,
                                           UUID portId, UUID navigationChannelId, UUID buoyStationId,
                                           Integer provinceId,
                                           String operationalStatus, String approvalStatus,
                                           String updatedFrom, String updatedTo,
                                           Boolean isDeleted,
                                           String sortBy, String sortDir) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Sort defaultSort = JpaSort.unsafe(Sort.Direction.DESC, "a.updatedAt")
                .and(JpaSort.unsafe(Sort.Direction.DESC, "a.createdAt"))
                .and(JpaSort.unsafe(Sort.Direction.ASC, "a.id"));
        Sort sort = defaultSort;
        if (sortBy != null && !sortBy.isBlank()) {
            String property = mapSortProperty(sortBy);
            if (property != null) {
                Sort.Direction direction = "ASC".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
                sort = JpaSort.unsafe(direction, property).and(defaultSort);
            }
        }
        Pageable pageable = PageRequest.of(page, pageSize, sort);
        boolean deletedOnly = "DELETED".equalsIgnoreCase(approvalStatus != null ? approvalStatus.trim() : null)
                || "ARCHIVED".equalsIgnoreCase(approvalStatus != null ? approvalStatus.trim() : null)
                || Boolean.TRUE.equals(isDeleted);
        ApprovalStatus approvalEnum = (approvalStatus != null && !approvalStatus.trim().isEmpty() && !deletedOnly)
                ? ApprovalStatus.fromString(approvalStatus)
                : null;
        Boolean isDeletedFilter = deletedOnly ? Boolean.TRUE : isDeleted;
        OperationalStatus statusEnum = operationalStatus != null ? OperationalStatus.fromString(operationalStatus) : null;
        java.time.LocalDateTime updatedFromDt = parseLocalDateTime(updatedFrom);
        java.time.LocalDateTime updatedToDt = parseUpdatedTo(updatedTo);
        // Mở rộng cây đơn vị: chọn đơn vị cha → gồm cả khu neo đậu của toàn bộ đơn vị con (hậu duệ), giống logic BerthService
        boolean includeAll = orgUnitId == null;
        List<UUID> orgUnitIds = orgUnitId != null ? orgUnitScopeService.resolveSubtreeIds(orgUnitId) : List.of();
        String searchTrim = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String codeTrim = (anchorageCode != null && !anchorageCode.trim().isEmpty()) ? anchorageCode.trim() : null;
        String nameTrim = (anchorageName != null && !anchorageName.trim().isEmpty()) ? anchorageName.trim() : null;
        Page<Anchorage> result = anchorageRepository.searchAnchorages(
                isDeletedFilter,
                includeAll, orgUnitIds,
                searchTrim, codeTrim, nameTrim, portId, navigationChannelId, buoyStationId,
                provinceId, approvalEnum, statusEnum, false,
                updatedFromDt, updatedToDt,
                pageable);

        // Batch resolve tên cảng biển cha để tránh truy vấn từng bản ghi (chuẩn Bến cảng)
        java.util.List<UUID> parentIds = result.getContent().stream()
                .map(Anchorage::getPortId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        java.util.Map<UUID, String> parentNameMap = new java.util.HashMap<>();
        if (!parentIds.isEmpty()) {
            portRepository.findAllById(parentIds).forEach(cb -> parentNameMap.put(cb.getId(), cb.getPortName()));
        }
        // Batch resolve tên bến phao (Thuộc bến phao) để tránh truy vấn từng bản ghi
        java.util.List<UUID> buoyStationIds = result.getContent().stream()
                .map(Anchorage::getBuoyStationId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(Collectors.toList());
        java.util.Map<UUID, String> buoyStationNameMap = new java.util.HashMap<>();
        if (!buoyStationIds.isEmpty()) {
            buoyBerthRepository.findAllById(buoyStationIds).forEach(bb -> buoyStationNameMap.put(bb.getId(), bb.getBuoyBerthName()));
        }
        return result.map(e -> toResponse(e, parentNameMap.get(e.getPortId()), buoyStationNameMap));
    }

    @Transactional
    public void softDelete(UUID id) {
        Anchorage entity = anchorageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu neo đậu với id: " + id));
        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT) {
            throw new IllegalArgumentException("Chỉ được xóa khu neo đậu ở trạng thái Nháp");
        }
        if (entity.getDeletedAt() != null) {
            throw new IllegalStateException("Khu neo đậu đã bị xóa trước đó");
        }

        UUID operatorId = SecurityUtils.getCurrentUserId();

        entity.softDelete(operatorId);
        entity.setApprovalStatus(ApprovalStatus.ARCHIVED);
        anchorageRepository.save(entity);

        // Xóa mềm các khu nước neo buộc tàu con (cascade soft-delete)
        List<MooringWaterArea> waterAreas = mooringWaterAreaRepository.findByAnchorageId(id);
        for (MooringWaterArea wa : waterAreas) {
            wa.softDelete(operatorId);
            mooringWaterAreaRepository.save(wa);
        }

        // Không ghi lịch sử khi xóa bản ghi Nháp (chuẩn Cảng biển / Bến cảng / Cầu cảng).
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        evictAfterCommit();
        log.info("Soft-deleted Anchorage [{}] code={}", entity.getId(), entity.getAnchorageCode());
    }

    private String mapSortProperty(String sortBy) {
        if (sortBy == null) return null;
        switch (sortBy.trim()) {
            case "anchorageCode":
            case "code":
                return "LOWER(a.anchorageCode)";
            case "anchorageName":
            case "name":
                return "LOWER(a.anchorageName)";
            case "portId":
            case "portName":
                return "LOWER(p.portName)";
            case "navigationChannelId":
            case "navigationChannelName":
            case "waterway":
            case "waterwayName":
                return "LOWER(nc.channelName)";
            case "buoyStationId":
            case "buoyStationName":
            case "buoyBerthName":
                return "LOWER(bb.buoyBerthName)";
            case "provinceId":
            case "provinceName":
            case "province":
                return "LOWER(pv.name)";
            case "orgUnitId":
            case "orgUnitName":
                return "LOWER(o.name)";
            case "operationalStatus":
                return "a.operationalStatus";
            case "approvalStatus":
                return "a.approvalStatus";
            case "area":
                return "a.area";
            case "maxVesselDWT":
            case "maxVesselDwt":
                return "a.maxVesselDWT";
            case "submittedForApprovalAt":
                return "a.submittedForApprovalAt";
            case "portAuthorityApprovedAt":
                return "a.portAuthorityApprovedAt";
            case "departmentApprovedAt":
                return "a.departmentApprovedAt";
            case "createdAt":
                return "a.createdAt";
            case "updatedAt":
                return "a.updatedAt";
            default:
                return null;
        }
    }

    public String generateAnchorageCode(UUID portId) {
        Port port = portRepository.findById(portId)
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + portId));

        String portCode = port.getPortCode();
        String prefix = portCode + "-ND-";
        List<Anchorage> existing = anchorageRepository.findByPortIdAndDeletedAtIsNull(portId);
        int maxNum = 0;
        for (Anchorage a : existing) {
            if (a.getAnchorageCode() != null && a.getAnchorageCode().startsWith(prefix)) {
                try {
                    int n = Integer.parseInt(a.getAnchorageCode().substring(prefix.length()));
                    if (n > maxNum) maxNum = n;
                } catch (NumberFormatException ignored) {}
            }
        }
        int num = maxNum + 1;
        String candidate = prefix + String.format("%03d", num);
        while (anchorageRepository.existsByAnchorageCode(candidate)) {
            num++;
            candidate = prefix + String.format("%03d", num);
        }
        return candidate;
    }

    // ── Attachment methods ──────────────────────────────────────────────

    @Transactional
    public List<AttachmentDto> uploadAttachments(String entityType, UUID entityId, List<MultipartFile> files, UUID userId, Boolean skipHistory) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Không có file nào được chọn để tải lên");
        }

        // Snapshot trước khi upload
        List<Attachment> existingAtts = attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc(entityType, entityId);
        String oldFilesSummary = existingAtts.stream()
                .map(Attachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));

        java.nio.file.Path basePath = java.nio.file.Paths.get(attachmentPath).toAbsolutePath().normalize();
        java.util.List<Attachment> savedAttachments = new java.util.ArrayList<>();
        java.util.List<String> uploadedFilenames = new java.util.ArrayList<>();

        for (MultipartFile file : files) {
            String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
            String storageFileName = System.currentTimeMillis() + "_" + originalFilename;

            try {
                java.nio.file.Path dir = basePath.resolve(entityType).resolve(entityId.toString());
                java.nio.file.Files.createDirectories(dir);
                java.nio.file.Path filePath = dir.resolve(storageFileName);
                file.transferTo(filePath.toFile());
            } catch (Exception e) {
                log.error("Failed to save file: {}/{}/{}/{}", basePath, entityType, entityId, storageFileName, e);
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
            savedAttachments.add(attachmentRepository.save(attachment));
            if (!"unknown".equals(originalFilename) && !originalFilename.isBlank()) {
                uploadedFilenames.add(originalFilename.trim());
            }
        }

        // Snapshot sau khi upload
        List<Attachment> allAtts = attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc(entityType, entityId);
        String newFilesSummary = allAtts.stream()
                .map(Attachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));

        if ("ANCHORAGE".equalsIgnoreCase(entityType) && !uploadedFilenames.isEmpty()) {
            recordAnchorageAttachmentHistory(entityId, oldFilesSummary, newFilesSummary, String.join(", ", uploadedFilenames),
                    InfrastructureHistoryStatus.ATTACHMENT_UPLOADED, skipHistory);
        }
        return savedAttachments.stream().map(this::toAttachmentDto).collect(java.util.stream.Collectors.toList());
    }

    public List<AttachmentDto> uploadAttachments(String entityType, UUID entityId, List<MultipartFile> files, UUID userId) {
        return uploadAttachments(entityType, entityId, files, userId, null);
    }

    public List<AttachmentDto> listAttachments(String entityType, UUID entityId) {
        return attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc(entityType, entityId)
                .stream().map(this::toAttachmentDto).collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void deleteAttachment(String entityType, UUID entityId, UUID attachmentId, UUID userId, Boolean skipHistory) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
        if (!attachment.getEntityId().equals(entityId)) {
            throw new IllegalArgumentException("File không thuộc entity này");
        }
        String fileName = attachment.getFileName();

        List<Attachment> existingAtts = attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc(entityType, entityId);
        String oldFilesSummary = existingAtts.stream()
                .map(Attachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));

        String newFilesSummary = existingAtts.stream()
                .filter(att -> !att.getId().equals(attachmentId))
                .map(Attachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));

        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
        } catch (Exception e) {
            log.warn("Không thể xóa file: {}", attachment.getFilePath(), e);
        }
        attachmentRepository.delete(attachment);
        if ("ANCHORAGE".equalsIgnoreCase(entityType)) {
            recordAnchorageAttachmentHistory(entityId, oldFilesSummary, newFilesSummary, fileName,
                    InfrastructureHistoryStatus.ATTACHMENT_DELETED, skipHistory);
        }
    }

    public void deleteAttachment(String entityType, UUID entityId, UUID attachmentId, UUID userId) {
        deleteAttachment(entityType, entityId, attachmentId, userId, null);
    }

    public Attachment getAttachment(String entityType, UUID entityId, UUID attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
        if (!attachment.getEntityId().equals(entityId)) {
            throw new IllegalArgumentException("File không thuộc entity này");
        }
        return attachment;
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

    // ── Conversion ─────────────────────────────────────────────────────

    private String resolveBuoyStationName(UUID buoyStationId, java.util.Map<UUID, String> nameMap) {
        if (buoyStationId == null) return null;
        if (nameMap != null) {
            String name = nameMap.get(buoyStationId);
            if (name != null) return name;
        }
        return buoyBerthRepository.findById(buoyStationId).map(BuoyBerth::getBuoyBerthName).orElse(null);
    }

    private String resolveNavigationChannelName(UUID navigationChannelId) {
        if (navigationChannelId == null) return null;
        return navigationChannelRepository.findById(navigationChannelId)
                .map(NavigationChannel::getChannelName)
                .orElseGet(() -> gisSpatialObjectService.findById(navigationChannelId)
                        .map(GisSpatialObject::getName)
                        .orElse(null));
    }

    private String resolvePortName(UUID portId) {
        if (portId == null) return null;
        String name = portCacheService.getName(portId);
        if (name != null) return name;
        return portRepository.findById(portId)
                .map(Port::getPortName)
                .orElseGet(() -> gisSpatialObjectService.findById(portId)
                        .map(GisSpatialObject::getName)
                        .orElse(null));
    }

    public AnchorageResponse toResponse(Anchorage entity) {
        return toResponse(entity, null, null);
    }

    public AnchorageResponse toResponse(Anchorage entity, String preResolvedPortName) {
        return toResponse(entity, preResolvedPortName, null);
    }

    public AnchorageResponse toResponse(Anchorage entity, String preResolvedPortName, java.util.Map<UUID, String> buoyStationNameMap) {
        if (entity == null) return null;

        AnchorageResponse response = AnchorageResponse.builder()
                .id(entity.getId())
                // .securityLevel(entity.getSecurityLevel())
                .anchorageCode(entity.getAnchorageCode())
                .anchorageName(entity.getAnchorageName())
                .portId(entity.getPortId())
                .portName(preResolvedPortName != null ? preResolvedPortName : resolvePortName(entity.getPortId()))
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))
                .navigationChannelId(entity.getNavigationChannelId())
                .waterway(resolveNavigationChannelName(entity.getNavigationChannelId()))
                .buoyStationId(entity.getBuoyStationId())
                .buoyStationName(resolveBuoyStationName(entity.getBuoyStationId(), buoyStationNameMap))
                .provinceId(entity.getProvinceId())
                .detailedLocation(entity.getDetailedLocation())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getDeletedAt() != null ? ApprovalStatus.ARCHIVED : entity.getApprovalStatus())
                // Technical fields
                .shapeDescription(entity.getShapeDescription())
                .area(entity.getArea())
                .designWaterDepth(entity.getDesignWaterDepth())
                .currentWaterDepth(entity.getCurrentWaterDepth())
                .bottomElevationDesign(entity.getBottomElevationDesign())
                .maxVesselDWT(entity.getMaxVesselDWT())
                .activeAnchorageCount(entity.getActiveAnchorageCount())
                .publishedAnchorageCount(entity.getPublishedAnchorageCount())
                .underInvestmentAnchorageCount(entity.getUnderInvestmentAnchorageCount())
                .remarks(entity.getRemarks())
                // Publication fields
                .openingAnnouncementDate(entity.getOpeningAnnouncementDate())
                .publicDecision(entity.getPublicDecision())
                .investmentAgreement(entity.getInvestmentAgreement())
                // GIS fields
                .mapSymbolId(entity.getMapSymbolId())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
                // Approval tracking
                .activityStatus(entity.getActivityStatus())
                .submittedForApprovalAt(entity.getSubmittedForApprovalAt())
                .submittedForApprovalBy(entity.getSubmittedForApprovalBy())
                .submittedForApprovalByName(resolveUserName(entity.getSubmittedForApprovalBy()))
                .portAuthorityApprovedAt(entity.getPortAuthorityApprovedAt())
                .portAuthorityApprovedBy(entity.getPortAuthorityApprovedBy())
                .portAuthorityApprovedByName(resolveUserName(entity.getPortAuthorityApprovedBy()))
                .portAuthorityApprovalContent(entity.getPortAuthorityApprovalContent())
                .departmentApprovedAt(entity.getDepartmentApprovedAt())
                .departmentApprovedBy(entity.getDepartmentApprovedBy())
                .departmentApprovedByName(resolveUserName(entity.getDepartmentApprovedBy()))
                .departmentApprovalContent(entity.getDepartmentApprovalContent())
                .rejectionReason(entity.getRejectionReason())
                // Audit
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .createdByName(userResolverService.resolveName(entity.getCreatedBy()))
                .updatedByName(userResolverService.resolveName(entity.getUpdatedBy()))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .deletedAt(entity.getDeletedAt())
                .deletedBy(entity.getDeletedBy())
                .build();

        UUID spatialId = entity.getSpatialId();
        GisSpatialObject spatialObj = null;
        if (spatialId != null) {
            spatialObj = gisSpatialObjectService.findById(spatialId).orElse(null);
        }
        if (spatialObj == null && entity.getId() != null) {
            spatialObj = gisSpatialObjectService.findByRef(entity.getId(), InfrastructureType.ANCHORAGE_AREA).orElse(null);
            if (spatialObj != null) {
                entity.setSpatialId(spatialObj.getId());
                anchorageRepository.save(entity);
            }
        }
        if (spatialObj != null) {
            response.setSpatialId(spatialObj.getId());
            if (spatialObj.getGeometryType() != null) {
                response.setGeometryType(spatialObj.getGeometryType());
            } else if (spatialObj.getCoordinates() != null) {
                String clean = spatialObj.getCoordinates().trim().replaceFirst("(?i)^SRID=\\d+;", "").trim().toUpperCase();
                if (clean.startsWith("POLYGON")) {
                    response.setGeometryType(GisGeometryType.POLYGON);
                } else if (clean.startsWith("LINESTRING") || clean.startsWith("LINE")) {
                    response.setGeometryType(GisGeometryType.LINE);
                } else {
                    response.setGeometryType(GisGeometryType.POINT);
                }
            }
            response.setCoordinates(spatialObj.getCoordinates());
            parseLatLng(spatialObj.getCoordinates(), response);
            if (response.getCoordinateSystem() == null) {
                response.setCoordinateSystem(1);
            }
            if (response.getDisplayRule() == null) {
                response.setDisplayRule(1);
            }
        }
        response.setMooringWaterAreas(toMooringWaterAreaResponses(entity.getId()));

        return response;
    }

    private String resolveUserName(String userId) {
        if (userId == null || userId.isBlank()) return null;
        try {
            return userResolverService.resolveName(UUID.fromString(userId.trim()));
        } catch (IllegalArgumentException ex) {
            return userId.trim();
        }
    }

    private void parseLatLng(String coordinates, AnchorageResponse response) {
        if (coordinates == null || coordinates.isBlank()) return;
        try {
            String trimmed = coordinates.trim().replaceFirst("(?i)^SRID=\\d+;", "").trim();
            if (trimmed.toUpperCase().startsWith("POINT")) {
                int start = trimmed.indexOf('(') + 1;
                int end = trimmed.indexOf(')', start);
                if (start > 0 && end > start) {
                    String[] parts = trimmed.substring(start, end).trim().split("\\s+");
                    if (parts.length >= 2) {
                        response.setLongitude(new BigDecimal(parts[0]));
                        response.setLatitude(new BigDecimal(parts[1]));
                    }
                }
            } else if (trimmed.toUpperCase().startsWith("LINESTRING")) {
                int start = trimmed.indexOf('(') + 1;
                int end = trimmed.indexOf(',', start);
                if (end < 0) end = trimmed.indexOf(')', start);
                if (start > 0 && end > start) {
                    String[] parts = trimmed.substring(start, end).trim().split("\\s+");
                    if (parts.length >= 2) {
                        response.setLongitude(new BigDecimal(parts[0]));
                        response.setLatitude(new BigDecimal(parts[1]));
                    }
                }
            } else if (trimmed.toUpperCase().startsWith("POLYGON")) {
                int start = trimmed.indexOf("((") + 2;
                int end = trimmed.indexOf(',', start);
                if (end < 0) end = trimmed.indexOf("))", start);
                if (start > 1 && end > start) {
                    String[] parts = trimmed.substring(start, end).trim().split("\\s+");
                    if (parts.length >= 2) {
                        response.setLongitude(new BigDecimal(parts[0]));
                        response.setLatitude(new BigDecimal(parts[1]));
                    }
                }
            }
        } catch (Exception ignored) { }
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT) {
            return GisSpatialObjectType.POINT_OTHER;
        } else if (geomType == GisGeometryType.LINE) {
            return GisSpatialObjectType.LINE_OTHER;
        }
        return GisSpatialObjectType.POLYGON_ANCHORAGE;
    }

    private List<MooringWaterAreaResponse> toMooringWaterAreaResponses(UUID anchorageId) {
        return mooringWaterAreaRepository.findByAnchorageId(anchorageId).stream().map(wa -> {
            List<MooringWaterAreaAnchorPointResponse> points = mooringWaterAreaAnchorPointRepository
                    .findByMooringWaterAreaId(wa.getId()).stream()
                    .map(p -> MooringWaterAreaAnchorPointResponse.builder()
                            .id(p.getId()).name(p.getName()).latitude(p.getLatitude()).longitude(p.getLongitude())
                            .build())
                    .collect(Collectors.toList());
            return MooringWaterAreaResponse.builder()
                    .id(wa.getId()).description(wa.getDescription()).geometryType(wa.getGeometryType())
                    .mapSymbolId(wa.getMapSymbolId()).coordinateSystem(wa.getCoordinateSystem())
                    .displayRule(wa.getDisplayRule()).anchorPoints(points)
                    .build();
        }).collect(Collectors.toList());
    }

    private void persistGisAndMooring(Anchorage saved, GisGeometryType geometryType, String coordinates,
                                      BigDecimal longitude, BigDecimal latitude,
                                      List<MooringWaterAreaRequest> mooringWaterAreas,
                                      boolean shouldClear, boolean shouldUpdate) {
        if (shouldUpdate) {
            String wkt = coordinates;
            if (wkt != null) {
                wkt = wkt.trim().replaceFirst("(?i)^SRID=\\d+;", "").trim();
            }
            if ((wkt == null || wkt.trim().isEmpty()) && longitude != null && latitude != null) {
                wkt = "POINT(" + longitude + " " + latitude + ")";
            }
            if (geometryType != null && wkt != null && !wkt.trim().isEmpty()) {
                GisGeometryType geomType = geometryType;
                UUID currentSpatialId = saved.getSpatialId();
                if (currentSpatialId == null && saved.getId() != null) {
                    currentSpatialId = gisSpatialObjectService.findByRef(saved.getId(), InfrastructureType.ANCHORAGE_AREA)
                            .map(GisSpatialObject::getId)
                            .orElse(null);
                }
                GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        currentSpatialId, saved.getAnchorageName(), "ANCHORAGE_" + saved.getAnchorageCode(),
                        geomType, getSpatialObjectType(geomType), wkt, saved.getId(),
                        InfrastructureType.ANCHORAGE_AREA);
                saved.setSpatialId(spatialObj.getId());
                anchorageRepository.saveAndFlush(saved);
            }
        } else if (shouldClear) {
            if (saved.getSpatialId() != null) {
                gisSpatialObjectService.delete(saved.getSpatialId());
            }
            if (saved.getId() != null) {
                gisSpatialObjectService.findByRef(saved.getId(), InfrastructureType.ANCHORAGE_AREA)
                        .ifPresent(sp -> gisSpatialObjectService.delete(sp.getId()));
            }
            saved.setSpatialId(null);
            anchorageRepository.saveAndFlush(saved);
        }
        if (mooringWaterAreas != null) {
            replaceMooringWaterAreas(saved.getId(), mooringWaterAreas);
        }
    }

    private void replaceMooringWaterAreas(UUID anchorageId, List<MooringWaterAreaRequest> requests) {
        if (requests == null) return;
        List<MooringWaterArea> existing = mooringWaterAreaRepository.findByAnchorageId(anchorageId);
        for (MooringWaterArea wa : existing) {
            mooringWaterAreaAnchorPointRepository.deleteAll(mooringWaterAreaAnchorPointRepository.findByMooringWaterAreaId(wa.getId()));
        }
        mooringWaterAreaRepository.deleteAll(existing);
        if (requests.isEmpty()) return;

        for (MooringWaterAreaRequest r : requests) {
            if (r == null) continue;
            String desc = (r.getDescription() != null && !r.getDescription().isBlank())
                    ? r.getDescription().trim() : null;
            boolean hasPoints = r.getAnchorPoints() != null && r.getAnchorPoints().stream()
                    .anyMatch(p -> p != null && p.getLatitude() != null && p.getLongitude() != null);
            if (desc == null && r.getGeometryType() == null && r.getMapSymbolId() == null && !hasPoints) {
                continue;
            }
            MooringWaterArea wa = MooringWaterArea.builder()
                    .anchorageId(anchorageId)
                    .description(desc)
                    .geometryType(r.getGeometryType())
                    .mapSymbolId(r.getMapSymbolId())
                    .coordinateSystem(r.getCoordinateSystem())
                    .displayRule(r.getDisplayRule())
                    .build();
            MooringWaterArea saved = mooringWaterAreaRepository.save(wa);
            List<MooringWaterAreaAnchorPoint> points = new ArrayList<>();
            if (r.getAnchorPoints() != null) {
                for (MooringWaterAreaAnchorPointRequest p : r.getAnchorPoints()) {
                    if (p == null || p.getLatitude() == null || p.getLongitude() == null) continue;
                    points.add(MooringWaterAreaAnchorPoint.builder()
                            .mooringWaterAreaId(saved.getId())
                            .name(p.getName() != null ? p.getName().trim() : null)
                            .latitude(p.getLatitude())
                            .longitude(p.getLongitude())
                            .build());
                }
            }
            if (!points.isEmpty()) {
                mooringWaterAreaAnchorPointRepository.saveAll(points);
            }
        }
    }

  private void applySaveAction(Anchorage entity, String action) {
    String currentUserId = SecurityUtils.getCurrentUserId() != null ? SecurityUtils.getCurrentUserId().toString() : "system";
    switch (action) {
      case "DRAFT":
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        break;
      case "SUBMIT":
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        entity.setSubmittedForApprovalAt(LocalDateTime.now());
        entity.setSubmittedForApprovalBy(currentUserId);
        entity.setRejectionReason(null);
        break;
      case "APPROVED":
      case "SAVE_AND_APPROVE":
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setSubmittedForApprovalAt(LocalDateTime.now());
        entity.setSubmittedForApprovalBy(currentUserId);
        entity.setPortAuthorityApprovedAt(LocalDateTime.now());
        entity.setPortAuthorityApprovedBy(currentUserId);
        entity.setDepartmentApprovedAt(LocalDateTime.now());
        entity.setDepartmentApprovedBy(currentUserId);
        break;
      default:
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
    }
  }

  private static String trimToNull(String value) {
      return (value != null && !value.trim().isEmpty()) ? value.trim() : null;
  }

  public void evictAfterCommit() {
        portCacheService.evictAfterCommit();
    }

    /**
     * Chụp snapshot đầy đủ để ghi lịch sử thay đổi (chuẩn Bến cảng).
     */
    private Anchorage buildSnapshot(Anchorage e) {
        return Anchorage.builder()
                // .securityLevel(e.getSecurityLevel())
                .anchorageCode(e.getAnchorageCode())
                .anchorageName(e.getAnchorageName())
                .portId(e.getPortId())
                .orgUnitId(e.getOrgUnitId())
                .navigationChannelId(e.getNavigationChannelId())
                .buoyStationId(e.getBuoyStationId())
                .provinceId(e.getProvinceId())
                .detailedLocation(e.getDetailedLocation())
                .operationalStatus(e.getOperationalStatus())
                .approvalStatus(e.getApprovalStatus())
                .shapeDescription(e.getShapeDescription())
                .area(e.getArea())
                .designWaterDepth(e.getDesignWaterDepth())
                .currentWaterDepth(e.getCurrentWaterDepth())
                .bottomElevationDesign(e.getBottomElevationDesign())
                .maxVesselDWT(e.getMaxVesselDWT())
                .activeAnchorageCount(e.getActiveAnchorageCount())
                .publishedAnchorageCount(e.getPublishedAnchorageCount())
                .underInvestmentAnchorageCount(e.getUnderInvestmentAnchorageCount())
                .remarks(e.getRemarks())
                .openingAnnouncementDate(e.getOpeningAnnouncementDate())
                .publicDecision(e.getPublicDecision())
                .investmentAgreement(e.getInvestmentAgreement())
                .mapSymbolId(e.getMapSymbolId())
                .coordinateSystem(e.getCoordinateSystem())
                .displayRule(e.getDisplayRule())
                .spatialId(e.getSpatialId())
                .submittedForApprovalAt(e.getSubmittedForApprovalAt())
                .submittedForApprovalBy(e.getSubmittedForApprovalBy())
                .portAuthorityApprovedAt(e.getPortAuthorityApprovedAt())
                .portAuthorityApprovedBy(e.getPortAuthorityApprovedBy())
                .departmentApprovedAt(e.getDepartmentApprovedAt())
                .departmentApprovedBy(e.getDepartmentApprovedBy())
                .rejectionReason(e.getRejectionReason())
                .activityStatus(e.getActivityStatus())
                .createdBy(e.getCreatedBy())
                .updatedBy(e.getUpdatedBy())
                .createdAt(e.getCreatedAt())
                .updatedAt(e.getUpdatedAt())
                .deletedAt(e.getDeletedAt())
                .deletedBy(e.getDeletedBy())
                .build();
    }

    private LocalDateTime parseLocalDateTime(String dt) {
        if (dt == null || dt.isBlank()) return null;
        String s = dt.trim();
        try {
            if (s.length() == 10) {
                return java.time.LocalDate.parse(s).atStartOfDay();
            }
            if (s.contains(" ")) {
                s = s.replace(" ", "T");
            }
            if (s.endsWith("Z")) {
                return java.time.Instant.parse(s).atZone(java.time.ZoneId.systemDefault()).toLocalDateTime();
            }
            if (s.contains("+") || (s.length() > 19 && s.indexOf('-', 10) > 0)) {
                return java.time.OffsetDateTime.parse(s).toLocalDateTime();
            }
            return LocalDateTime.parse(s);
        } catch (Exception e) {
            try {
                return LocalDateTime.parse(dt.trim(), java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            } catch (Exception ex) {
                return null;
            }
        }
    }

    private LocalDateTime parseUpdatedTo(String dt) {
        if (dt == null || dt.isBlank()) return null;
        String s = dt.trim();
        try {
            if (s.length() == 10) {
                return java.time.LocalDate.parse(s).atTime(23, 59, 59, 999_999_999);
            }
            LocalDateTime ldt = parseLocalDateTime(s);
            if (ldt != null && ldt.getNano() == 0) {
                return ldt.withNano(999_999_999);
            }
            return ldt;
        } catch (Exception e) {
            return null;
        }
    }

    // ── Lịch sử thay đổi (infrastructure_history — chuẩn Cảng biển sau migration V20260825162500) ──

    /** Nhãn hiển thị loại hình GIS theo chuẩn VTS CHK (dùng cho lịch sử thay đổi). */
    private static String geometryTypeLabel(GisGeometryType type) {
        if (type == null) return null;
        return switch (type) {
            case POINT -> "Đối tượng điểm";
            case LINE -> "Đối tượng đường";
            case POLYGON -> "Đối tượng vùng";
        };
    }

    /**
     * Summary đọc được của bảng con "Khu nước neo buộc tàu" (mooring_water_areas + điểm neo),
     * dùng cho lịch sử thay đổi — không ghi Java toString rác của reflection.
     */
    private String buildMooringWaterAreaSummary(List<MooringWaterArea> areas) {
        if (areas == null || areas.isEmpty()) return "";
        List<String> parts = new ArrayList<>();
        for (int i = 0; i < areas.size(); i++) {
            MooringWaterArea wa = areas.get(i);
            String desc = (wa.getDescription() != null && !wa.getDescription().isBlank())
                    ? wa.getDescription().trim() : ("Khu nước " + (i + 1));
            List<MooringWaterAreaAnchorPoint> points =
                    mooringWaterAreaAnchorPointRepository.findByMooringWaterAreaId(wa.getId());
            if (points.isEmpty()) {
                parts.add(desc + " (0 điểm)");
            } else {
                String ptDetails = points.stream()
                        .map(p -> (p.getName() != null && !p.getName().isBlank() ? p.getName().trim() : "Điểm neo")
                                + (p.getLatitude() != null && p.getLongitude() != null ? " [" + p.getLatitude() + ", " + p.getLongitude() + "]" : ""))
                        .collect(Collectors.joining(", "));
                parts.add(desc + " (" + points.size() + " điểm: " + ptDetails + ")");
            }
        }
        return areas.size() + " khu nước: " + String.join("; ", parts);
    }

    /**
     * Ghi lịch sử file đính kèm Khu neo đậu theo chuẩn snapshot bảng — chỉ khi hồ sơ đã duyệt.
     */
    private void recordAnchorageAttachmentHistory(UUID anchorageId, String oldFilesSummary, String newFilesSummary,
                                                  String affectedFileName, InfrastructureHistoryStatus status, Boolean skipHistory) {
        try {
            if (Boolean.TRUE.equals(skipHistory)) return;
            Anchorage anchorage = anchorageRepository.findById(anchorageId).orElse(null);
            if (anchorage == null) return;
            ApprovalStatus approval = anchorage.getApprovalStatus();
            boolean wasApproved = approval == ApprovalStatus.APPROVED
                    || approval == ApprovalStatus.APPROVED_LEVEL2;
            if (!wasApproved) return;
            // Guard: Thêm mới không ghi lịch sử đính kèm
            if (anchorage.getCreatedAt() != null && anchorage.getUpdatedAt() != null
                    && (anchorage.getCreatedAt().isEqual(anchorage.getUpdatedAt())
                    || java.time.Duration.between(anchorage.getCreatedAt(), anchorage.getUpdatedAt()).abs().toSeconds() <= 2)) {
                return;
            }

            String oldVal = (oldFilesSummary == null || oldFilesSummary.isBlank()) ? null : oldFilesSummary.trim();
            String newVal = (newFilesSummary == null || newFilesSummary.isBlank()) ? null : newFilesSummary.trim();
            if (java.util.Objects.equals(oldVal, newVal)) {
                return;
            }

            boolean uploaded = status == InfrastructureHistoryStatus.ATTACHMENT_UPLOADED;
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(anchorageId)
                    .refType(InfrastructureType.ANCHORAGE_AREA)
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(status)
                    .approvedBy(SecurityUtils.getCurrentUserId())
                    .approvedDate(LocalDateTime.now())
                    .changedField("File đính kèm")
                    .previousValue(oldVal)
                    .newValue(newVal)
                    .build());
            log.info("Đã ghi lịch sử {} file đính kèm của Khu neo đậu [{}]: [{}] -> [{}]",
                    uploaded ? "tải lên" : "xóa", anchorageId, oldVal, newVal);
        } catch (Exception e) {
            log.warn("Không ghi được lịch sử file đính kèm Khu neo đậu [{}]: {}", anchorageId, e.getMessage());
        }
    }

}
