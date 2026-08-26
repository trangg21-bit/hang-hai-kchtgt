package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatusConverter;
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
import com.hanghai.kchtg.port.entity.Berth;
import com.hanghai.kchtg.port.entity.MooringWaterArea;
import com.hanghai.kchtg.port.entity.MooringWaterAreaAnchorPoint;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.AnchorageRepository;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.repository.MooringWaterAreaAnchorPointRepository;
import com.hanghai.kchtg.port.repository.MooringWaterAreaRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.service.PortCacheService;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.security.RecordSecurityLevel;
import com.hanghai.kchtg.security.SecurityUtils;
import com.hanghai.kchtg.user.repository.UserRepository;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnchorageService {

    private final AnchorageRepository anchorageRepository;
    private final PortRepository portRepository;
    private final UserResolverService userResolverService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final PortCacheService portCacheService;
    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final MooringWaterAreaRepository mooringWaterAreaRepository;
    private final MooringWaterAreaAnchorPointRepository mooringWaterAreaAnchorPointRepository;
    private final ChangeHistoryService changeHistoryService;

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    @Transactional
    public AnchorageResponse create(CreateAnchorageRequest request) {
        Port port = portRepository.findById(request.getPortId())
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));

        if (port.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new IllegalArgumentException("Không thể tạo khu neo đậu: cảng biển cha phải ở trạng thái được phê duyệt");
        }

        RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
                : RecordSecurityLevel.NORMAL;
        RecordSecurityLevel.validateAssignment(secLevel, "anchorage", SecurityUtils.getCurrentUserPermissions(),
                SecurityUtils.isElevatedAdministrator());

        String code = generateAnchorageCode(request.getPortId());

        Anchorage entity = Anchorage.builder()
                .securityLevel(secLevel)
                .anchorageCode(code)
                .anchorageName(request.getAnchorageName())
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

        String action = request.getSaveAction() != null ? request.getSaveAction() : "DRAFT";
        applySaveAction(entity, action);

        Anchorage saved = anchorageRepository.save(entity);
        persistGisAndMooring(saved, request.getGeometryType(), request.getCoordinates(),
                request.getLongitude(), request.getLatitude(), request.getMooringWaterAreas());
        // [TẠM TẮT GHI LỊCH SỬ] Bảng change_logs đã bị V20260825162500 drop; user yêu cầu Khu neo đậu không ghi lịch sử
        // changeHistoryService.recordChanges("Anchorage", saved.getId().toString(), "system", new Anchorage(), saved);
        evictAfterCommit();

        return toResponse(saved);
    }

    @Transactional
    public AnchorageResponse update(UpdateAnchorageRequest request) {
        Anchorage entity = anchorageRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu neo đậu với id: " + request.getId()));

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null
                && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        // Chụp snapshot đầy đủ trước khi thay đổi để ghi lịch sử chi tiết (chuẩn Bến cảng)
        Anchorage snapshot = buildSnapshot(entity);

        if (request.getSecurityLevel() != null) {
            RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "anchorage",
                    SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
            entity.setSecurityLevel(request.getSecurityLevel());
        }
        if (request.getAnchorageName() != null)
            entity.setAnchorageName(request.getAnchorageName());
        if (request.getPortId() != null) {
            Port parent = portRepository.findById(request.getPortId())
                    .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));
            entity.setPortId(request.getPortId());
            entity.setOrgUnitId(parent.getOrgUnitId());
        } else if (entity.getOrgUnitId() == null && entity.getPortId() != null) {
            portRepository.findById(entity.getPortId()).ifPresent(p -> entity.setOrgUnitId(p.getOrgUnitId()));
        }
        if (request.getNavigationChannelId() != null)
            entity.setNavigationChannelId(request.getNavigationChannelId());
        if (request.getBuoyStationId() != null)
            entity.setBuoyStationId(request.getBuoyStationId());
        if (request.getProvinceId() != null)
            entity.setProvinceId(request.getProvinceId());
        if (request.getDetailedLocation() != null)
            entity.setDetailedLocation(request.getDetailedLocation());
        if (request.getOperationalStatus() != null)
            entity.setOperationalStatus(request.getOperationalStatus());
        if (request.getShapeDescription() != null)
            entity.setShapeDescription(request.getShapeDescription());
        if (request.getArea() != null)
            entity.setArea(request.getArea());
        if (request.getDesignWaterDepth() != null)
            entity.setDesignWaterDepth(request.getDesignWaterDepth());
        if (request.getCurrentWaterDepth() != null)
            entity.setCurrentWaterDepth(request.getCurrentWaterDepth());
        if (request.getBottomElevationDesign() != null)
            entity.setBottomElevationDesign(request.getBottomElevationDesign());
        if (request.getMaxVesselDWT() != null)
            entity.setMaxVesselDWT(request.getMaxVesselDWT());
        if (request.getActiveAnchorageCount() != null)
            entity.setActiveAnchorageCount(request.getActiveAnchorageCount());
        if (request.getPublishedAnchorageCount() != null)
            entity.setPublishedAnchorageCount(request.getPublishedAnchorageCount());
        if (request.getUnderInvestmentAnchorageCount() != null)
            entity.setUnderInvestmentAnchorageCount(request.getUnderInvestmentAnchorageCount());
        if (request.getRemarks() != null)
            entity.setRemarks(request.getRemarks());
        if (request.getOpeningAnnouncementDate() != null)
            entity.setOpeningAnnouncementDate(request.getOpeningAnnouncementDate());
        if (request.getPublicDecision() != null)
            entity.setPublicDecision(request.getPublicDecision());
        if (request.getInvestmentAgreement() != null)
            entity.setInvestmentAgreement(request.getInvestmentAgreement());
        entity.setMapSymbolId(request.getMapSymbolId());
        if (request.getCoordinateSystem() != null)
            entity.setCoordinateSystem(request.getCoordinateSystem());
        if (request.getDisplayRule() != null)
            entity.setDisplayRule(request.getDisplayRule());

        if (request.getSaveAction() != null) {
            applySaveAction(entity, request.getSaveAction());
        } else if (entity.getApprovalStatus() == ApprovalStatus.APPROVED) {
            // Khi chỉnh sửa: "Được phê duyệt" → quay về "Chờ cảng vụ duyệt" (APPROVED_LEVEL1)
            entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        }

        Anchorage saved = anchorageRepository.save(entity);
        persistGisAndMooring(saved, request.getGeometryType(), coordinates,
                request.getLongitude(), request.getLatitude(), request.getMooringWaterAreas());

        // [TẠM TẮT GHI LỊCH SỬ] Bảng change_logs đã bị V20260825162500 drop; user yêu cầu Khu neo đậu không ghi lịch sử
        // changeHistoryService.recordChanges("Anchorage", saved.getId().toString(), "system", snapshot, saved);
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
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("submittedForApprovalAt"),
                Sort.Order.desc(EntityFields.CREATED_AT), Sort.Order.asc(EntityFields.ID)));
        ApprovalStatus approvalEnum = approvalStatus != null ? ApprovalStatus.fromString(approvalStatus) : null;
        OperationalStatus statusEnum = operationalStatus != null ? OperationalStatus.fromString(operationalStatus) : null;
        java.time.LocalDateTime updatedFromDt = parseLocalDateTime(updatedFrom);
        java.time.LocalDateTime updatedToDt = parseLocalDateTime(updatedTo);
        // Mở rộng cây đơn vị: chọn đơn vị cha → gồm cả khu neo đậu của toàn bộ đơn vị con (hậu duệ), giống logic BerthService
        boolean includeAll = orgUnitId == null;
        List<UUID> orgUnitIds = orgUnitId != null ? orgUnitScopeService.resolveSubtreeIds(orgUnitId) : List.of();
        String searchTrim = search != null ? search.trim() : null;
        Page<Anchorage> result = anchorageRepository.searchAnchorages(
                includeAll, orgUnitIds,
                searchTrim, anchorageCode, anchorageName, portId, navigationChannelId, buoyStationId,
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
        return result.map(e -> toResponse(e, parentNameMap.get(e.getPortId())));
    }

    @Transactional
    public void softDelete(UUID id) {
        Anchorage entity = anchorageRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu neo đậu với id: " + id));
        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT) {
            throw new IllegalArgumentException("Chỉ được xóa khu neo đậu ở trạng thái Nháp");
        }
        long waterAreaCount = mooringWaterAreaRepository.countByAnchorageIdAndDeletedAtIsNull(id);
        if (waterAreaCount > 0) {
            throw new IllegalStateException("Không thể xóa: khu neo đậu đang có " + waterAreaCount
                    + " phạm vi khu nước neo buộc tàu liên kết");
        }
        // Chụp snapshot trước khi xóa mềm để ghi lịch sử thay đổi (chuẩn Bến cảng)
        Anchorage snapshot = buildSnapshot(entity);
        entity.softDelete(SecurityUtils.getCurrentUserId());
        anchorageRepository.save(entity);
        // [TẠM TẮT GHI LỊCH SỬ] Bảng change_logs đã bị V20260825162500 drop; user yêu cầu Khu neo đậu không ghi lịch sử
        // changeHistoryService.recordChanges("Anchorage", entity.getId().toString(), "system", snapshot, entity);
        // changeHistoryService.insertChangeRecord("Anchorage", entity.getId(), "Trạng thái", null, "Đã xóa", "system");
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        evictAfterCommit();
        log.info("Soft-deleted Anchorage [{}] code={}", entity.getId(), entity.getAnchorageCode());
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
        return prefix + String.format("%03d", maxNum + 1);
    }

    // ── Attachment methods ──────────────────────────────────────────────

    @Transactional
    public List<AttachmentDto> uploadAttachments(String entityType, UUID entityId, List<MultipartFile> files, UUID userId) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Không có file nào được chọn để tải lên");
        }
        long existingCount = attachmentRepository.countByEntityTypeAndEntityId(entityType, entityId);
        if (existingCount + files.size() > 10) {
            throw new IllegalArgumentException("Tối đa 10 file đính kèm");
        }

        java.nio.file.Path basePath = java.nio.file.Paths.get(attachmentPath).toAbsolutePath().normalize();
        java.util.List<Attachment> savedAttachments = new java.util.ArrayList<>();

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
        }
        return savedAttachments.stream().map(this::toAttachmentDto).collect(java.util.stream.Collectors.toList());
    }

    public List<AttachmentDto> listAttachments(String entityType, UUID entityId) {
        return attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc(entityType, entityId)
                .stream().map(this::toAttachmentDto).collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void deleteAttachment(String entityType, UUID entityId, UUID attachmentId, UUID userId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
        if (!attachment.getEntityId().equals(entityId)) {
            throw new IllegalArgumentException("File không thuộc entity này");
        }
        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
        } catch (Exception e) {
            log.warn("Không thể xóa file: {}", attachment.getFilePath(), e);
        }
        attachmentRepository.delete(attachment);
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

    public AnchorageResponse toResponse(Anchorage entity) {
        return toResponse(entity, null);
    }

    public AnchorageResponse toResponse(Anchorage entity, String preResolvedPortName) {
        if (entity == null) return null;

        AnchorageResponse response = AnchorageResponse.builder()
                .id(entity.getId())
                .securityLevel(entity.getSecurityLevel())
                .anchorageCode(entity.getAnchorageCode())
                .anchorageName(entity.getAnchorageName())
                .portId(entity.getPortId())
                .portName(preResolvedPortName != null ? preResolvedPortName : portCacheService.getName(entity.getPortId()))
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))
                .navigationChannelId(entity.getNavigationChannelId())
                .buoyStationId(entity.getBuoyStationId())
                .provinceId(entity.getProvinceId())
                .detailedLocation(entity.getDetailedLocation())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
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
                .portAuthorityApprovedAt(entity.getPortAuthorityApprovedAt())
                .portAuthorityApprovedBy(entity.getPortAuthorityApprovedBy())
                .portAuthorityApprovalContent(entity.getPortAuthorityApprovalContent())
                .departmentApprovedAt(entity.getDepartmentApprovedAt())
                .departmentApprovedBy(entity.getDepartmentApprovedBy())
                .departmentApprovalContent(entity.getDepartmentApprovalContent())
                .rejectionReason(entity.getRejectionReason())
                // Audit
                .createdBy(entity.getCreatedBy())
                .updatedBy(entity.getUpdatedBy())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();

        if (entity.getSpatialId() != null) {
            response.setSpatialId(entity.getSpatialId());
            gisSpatialObjectService.findById(entity.getSpatialId()).ifPresent(spatialObj -> {
                if (spatialObj.getGeometryType() != null) {
                    response.setGeometryType(spatialObj.getGeometryType());
                }
                response.setCoordinates(spatialObj.getCoordinates());
                parseLatLng(spatialObj.getCoordinates(), response);
            });
        }
        response.setMooringWaterAreas(toMooringWaterAreaResponses(entity.getId()));

        return response;
    }

    private void parseLatLng(String coordinates, AnchorageResponse response) {
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
                                      List<MooringWaterAreaRequest> mooringWaterAreas) {
        String wkt = coordinates;
        if ((wkt == null || wkt.trim().isEmpty()) && longitude != null && latitude != null) {
            wkt = "POINT(" + longitude + " " + latitude + ")";
        }
        if (wkt != null && !wkt.trim().isEmpty()) {
            GisGeometryType geomType = geometryType != null ? geometryType : GisGeometryType.POINT;
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getSpatialId(), saved.getAnchorageName(), "ANCHORAGE_" + saved.getAnchorageCode(),
                    geomType, GisSpatialObjectType.POLYGON_ANCHORAGE, wkt, saved.getId(),
                    InfrastructureType.ANCHORAGE_AREA);
            saved.setSpatialId(spatialObj.getId());
            anchorageRepository.save(saved);
        }
        replaceMooringWaterAreas(saved.getId(), mooringWaterAreas);
    }

    private void replaceMooringWaterAreas(UUID anchorageId, List<MooringWaterAreaRequest> requests) {
        mooringWaterAreaRepository.deleteAll(mooringWaterAreaRepository.findByAnchorageId(anchorageId));
        if (requests == null || requests.isEmpty()) return;
        for (MooringWaterAreaRequest r : requests) {
            if (r.getDescription() == null || r.getDescription().isBlank()) continue;
            MooringWaterArea wa = MooringWaterArea.builder()
                    .anchorageId(anchorageId)
                    .description(r.getDescription().trim())
                    .geometryType(r.getGeometryType())
                    .mapSymbolId(r.getMapSymbolId())
                    .coordinateSystem(r.getCoordinateSystem())
                    .displayRule(r.getDisplayRule())
                    .build();
            MooringWaterArea saved = mooringWaterAreaRepository.save(wa);
            List<MooringWaterAreaAnchorPoint> points = new ArrayList<>();
            if (r.getAnchorPoints() != null) {
                for (MooringWaterAreaAnchorPointRequest p : r.getAnchorPoints()) {
                    if (p.getLatitude() == null || p.getLongitude() == null) continue;
                    points.add(MooringWaterAreaAnchorPoint.builder()
                            .mooringWaterAreaId(saved.getId())
                            .name(p.getName() != null ? p.getName().trim() : null)
                            .latitude(p.getLatitude())
                            .longitude(p.getLongitude())
                            .build());
                }
            }
            mooringWaterAreaAnchorPointRepository.saveAll(points);
        }
    }

  private void applySaveAction(Anchorage entity, String action) {
    switch (action) {
      case "DRAFT":
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
        break;
      case "SUBMIT":
        entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        entity.setSubmittedForApprovalAt(LocalDateTime.now());
        entity.setSubmittedForApprovalBy(SecurityUtils.getCurrentUserId().toString());
        break;
      case "APPROVED":
      case "SAVE_AND_APPROVE":
        entity.setApprovalStatus(ApprovalStatus.APPROVED);
        entity.setSubmittedForApprovalAt(LocalDateTime.now());
        entity.setSubmittedForApprovalBy(SecurityUtils.getCurrentUserId().toString());
        entity.setPortAuthorityApprovedAt(LocalDateTime.now());
        entity.setPortAuthorityApprovedBy(SecurityUtils.getCurrentUserId().toString());
        entity.setDepartmentApprovedAt(LocalDateTime.now());
        entity.setDepartmentApprovedBy(SecurityUtils.getCurrentUserId().toString());
        break;
      default:
        entity.setApprovalStatus(ApprovalStatus.DRAFT);
    }
  }

    public void evictAfterCommit() {
        portCacheService.evictAfterCommit();
    }

    /**
     * Chụp snapshot đầy đủ để ghi lịch sử thay đổi (chuẩn Bến cảng).
     */
    private Anchorage buildSnapshot(Anchorage e) {
        return Anchorage.builder()
                .securityLevel(e.getSecurityLevel())
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
                .build();
    }

    private LocalDateTime parseLocalDateTime(String dt) {
        if (dt == null || dt.isBlank()) return null;
        try { return LocalDateTime.parse(dt); }
        catch (Exception e) { return null; }
    }
}
