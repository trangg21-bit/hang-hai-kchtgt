package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.port.dto.stormshelter.AttachmentDto;
import com.hanghai.kchtg.port.dto.stormshelter.CreateStormShelterAreaRequest;
import com.hanghai.kchtg.port.dto.stormshelter.StormShelterMooringWaterAreaAnchorPointRequest;
import com.hanghai.kchtg.port.dto.stormshelter.StormShelterMooringWaterAreaAnchorPointResponse;
import com.hanghai.kchtg.port.dto.stormshelter.StormShelterMooringWaterAreaRequest;
import com.hanghai.kchtg.port.dto.stormshelter.StormShelterMooringWaterAreaResponse;
import com.hanghai.kchtg.port.dto.stormshelter.StormShelterAreaResponse;
import com.hanghai.kchtg.port.dto.stormshelter.UpdateStormShelterAreaRequest;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.entity.StormShelterArea;
import com.hanghai.kchtg.port.entity.StormShelterMooringWaterArea;
import com.hanghai.kchtg.port.entity.StormShelterMooringWaterAreaAnchorPoint;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.repository.StormShelterMooringWaterAreaAnchorPointRepository;
import com.hanghai.kchtg.port.repository.StormShelterMooringWaterAreaRepository;
import com.hanghai.kchtg.port.repository.StormShelterAreaRepository;
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

/**
 * Service for StormShelterArea (Khu tránh, trú bão) — parity với TransferAreaService.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StormShelterAreaService {

    private final StormShelterAreaRepository stormShelterAreaRepository;
    private final PortRepository portRepository;
    private final UserResolverService userResolverService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final PortCacheService portCacheService;
    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final StormShelterMooringWaterAreaRepository stormShelterMooringWaterAreaRepository;
    private final StormShelterMooringWaterAreaAnchorPointRepository stormShelterMooringWaterAreaAnchorPointRepository;
    private final ChangeHistoryService changeHistoryService;

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    @Transactional
    public StormShelterAreaResponse create(CreateStormShelterAreaRequest request) {
        Port port = portRepository.findById(request.getPortId())
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));

        if (port.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new IllegalArgumentException("Không thể tạo khu tránh, trú bão: cảng biển cha phải ở trạng thái được phê duyệt");
        }

        RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
                : RecordSecurityLevel.NORMAL;
        RecordSecurityLevel.validateAssignment(secLevel, "stormshelter", SecurityUtils.getCurrentUserPermissions(),
                SecurityUtils.isElevatedAdministrator());

        String code = generateStormShelterCode(request.getPortId());

        StormShelterArea entity = StormShelterArea.builder()
                .securityLevel(secLevel)
                .stormShelterCode(code)
                .stormShelterName(request.getStormShelterName())
                .portId(request.getPortId())
                .orgUnitId(port.getOrgUnitId())
                .navigationChannelId(request.getNavigationChannelId())
                .buoyStationId(request.getBuoyStationId())
                .classification(request.getClassification())
                .provinceId(request.getProvinceId())
                .detailedLocation(request.getDetailedLocation())
                .operationalStatus(request.getOperationalStatus())
                .shapeDescription(request.getShapeDescription())
                .area(request.getArea())
                .designWaterDepth(request.getDesignWaterDepth())
                .currentWaterDepth(request.getCurrentWaterDepth())
                .bottomElevationDesign(request.getBottomElevationDesign())
                .maxVesselDWT(request.getMaxVesselDWT())
                .activeStormShelterCount(request.getActiveStormShelterCount())
                .publishedStormShelterCount(request.getPublishedStormShelterCount())
                .underInvestmentStormShelterCount(request.getUnderInvestmentStormShelterCount())
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

        StormShelterArea saved = stormShelterAreaRepository.save(entity);
        persistGisAndMooring(saved, request.getGeometryType(), request.getCoordinates(),
                request.getLongitude(), request.getLatitude(), request.getMooringWaterAreas());
        // [TẠM TẮT GHI LỊCH SỬ] Bảng change_logs đã bị V20260825162500 drop; không ghi lịch sử (chuẩn Khu neo đậu)
        // changeHistoryService.recordChanges("StormShelterArea", saved.getId().toString(), "system", new StormShelterArea(), saved);
        evictAfterCommit();

        return toResponse(saved);
    }

    @Transactional
    public StormShelterAreaResponse update(UpdateStormShelterAreaRequest request) {
        StormShelterArea entity = stormShelterAreaRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu tránh, trú bão với id: " + request.getId()));

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null
                && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        // Chụp snapshot đầy đủ trước khi thay đổi để ghi lịch sử chi tiết (chuẩn Bến cảng)
        StormShelterArea snapshot = buildSnapshot(entity);

        if (request.getSecurityLevel() != null) {
            RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "stormshelter",
                    SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
            entity.setSecurityLevel(request.getSecurityLevel());
        }
        if (request.getStormShelterName() != null)
            entity.setStormShelterName(request.getStormShelterName());
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
        if (request.getClassification() != null)
            entity.setClassification(request.getClassification());
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
        if (request.getActiveStormShelterCount() != null)
            entity.setActiveStormShelterCount(request.getActiveStormShelterCount());
        if (request.getPublishedStormShelterCount() != null)
            entity.setPublishedStormShelterCount(request.getPublishedStormShelterCount());
        if (request.getUnderInvestmentStormShelterCount() != null)
            entity.setUnderInvestmentStormShelterCount(request.getUnderInvestmentStormShelterCount());
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

        StormShelterArea saved = stormShelterAreaRepository.save(entity);
        persistGisAndMooring(saved, request.getGeometryType(), coordinates,
                request.getLongitude(), request.getLatitude(), request.getMooringWaterAreas());

        // [TẠM TẮT GHI LỊCH SỬ] Bảng change_logs đã bị V20260825162500 drop; không ghi lịch sử (chuẩn Khu neo đậu)
        // changeHistoryService.recordChanges("StormShelterArea", saved.getId().toString(), "system", snapshot, saved);
        evictAfterCommit();

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public StormShelterAreaResponse getById(UUID id) {
        StormShelterArea entity = stormShelterAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu tránh, trú bão với id: " + id));
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public Page<StormShelterAreaResponse> findAll(int page, int size, UUID orgUnitId,
                                              String search, String stormShelterCode, String stormShelterName,
                                              UUID portId, UUID navigationChannelId, UUID buoyStationId,
                                              String classification, Integer provinceId,
                                              String operationalStatus, String approvalStatus,
                                              String updatedFrom, String updatedTo) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("submittedForApprovalAt"),
                Sort.Order.desc(EntityFields.CREATED_AT), Sort.Order.asc(EntityFields.ID)));
        ApprovalStatus approvalEnum = approvalStatus != null ? ApprovalStatus.fromString(approvalStatus) : null;
        OperationalStatus statusEnum = operationalStatus != null ? OperationalStatus.fromString(operationalStatus) : null;
        java.time.LocalDateTime updatedFromDt = parseLocalDateTime(updatedFrom);
        java.time.LocalDateTime updatedToDt = parseLocalDateTime(updatedTo);
        // Mở rộng cây đơn vị: chọn đơn vị cha → gồm cả khu tránh, trú bão của toàn bộ đơn vị con (hậu duệ), giống logic BerthService
        boolean includeAll = orgUnitId == null;
        List<UUID> orgUnitIds = orgUnitId != null ? orgUnitScopeService.resolveSubtreeIds(orgUnitId) : List.of();
        String searchTrim = search != null ? search.trim() : null;
        Page<StormShelterArea> result = stormShelterAreaRepository.searchStormShelterAreas(
                includeAll, orgUnitIds,
                searchTrim, stormShelterCode, stormShelterName, portId,
                navigationChannelId, buoyStationId, classification, provinceId,
                approvalEnum, statusEnum, false,
                updatedFromDt, updatedToDt,
                pageable);

        // Batch resolve tên cảng biển cha để tránh truy vấn từng bản ghi (chuẩn Bến cảng)
        java.util.List<UUID> parentIds = result.getContent().stream()
                .map(StormShelterArea::getPortId)
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
        StormShelterArea entity = stormShelterAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu tránh, trú bão với id: " + id));
        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT) {
            throw new IllegalArgumentException("Chỉ được xóa khu tránh, trú bão ở trạng thái Nháp");
        }
        long waterAreaCount = stormShelterMooringWaterAreaRepository.countByStormShelterAreaIdAndDeletedAtIsNull(id);
        if (waterAreaCount > 0) {
            throw new IllegalStateException("Không thể xóa: khu tránh, trú bão đang có " + waterAreaCount
                    + " phạm vi khu nước neo buộc tàu liên kết");
        }
        // Chụp snapshot trước khi xóa mềm để ghi lịch sử thay đổi (chuẩn Bến cảng)
        StormShelterArea snapshot = buildSnapshot(entity);
        entity.softDelete(SecurityUtils.getCurrentUserId());
        stormShelterAreaRepository.save(entity);
        // [TẠM TẮT GHI LỊCH SỬ] Bảng change_logs đã bị V20260825162500 drop; không ghi lịch sử (chuẩn Khu neo đậu)
        // changeHistoryService.recordChanges("StormShelterArea", entity.getId().toString(), "system", snapshot, entity);
        // changeHistoryService.insertChangeRecord("StormShelterArea", entity.getId(), "Trạng thái", null, "Đã xóa", "system");
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        evictAfterCommit();
        log.info("Soft-deleted StormShelterArea [{}] code={}", entity.getId(), entity.getStormShelterCode());
    }

    public String generateStormShelterCode(UUID portId) {
        Port port = portRepository.findById(portId)
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + portId));

        String portCode = port.getPortCode();
        String prefix = portCode + "-TTB-";
        List<StormShelterArea> existing = stormShelterAreaRepository.findByPortIdAndDeletedAtIsNull(portId);
        int maxNum = 0;
        for (StormShelterArea a : existing) {
            if (a.getStormShelterCode() != null && a.getStormShelterCode().startsWith(prefix)) {
                try {
                    int n = Integer.parseInt(a.getStormShelterCode().substring(prefix.length()));
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

    public StormShelterAreaResponse toResponse(StormShelterArea entity) {
        return toResponse(entity, null);
    }

    public StormShelterAreaResponse toResponse(StormShelterArea entity, String preResolvedPortName) {
        if (entity == null) return null;

        StormShelterAreaResponse response = StormShelterAreaResponse.builder()
                .id(entity.getId())
                .securityLevel(entity.getSecurityLevel())
                .stormShelterCode(entity.getStormShelterCode())
                .stormShelterName(entity.getStormShelterName())
                .portId(entity.getPortId())
                .portName(preResolvedPortName != null ? preResolvedPortName : portCacheService.getName(entity.getPortId()))
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))
                .navigationChannelId(entity.getNavigationChannelId())
                .buoyStationId(entity.getBuoyStationId())
                .classification(entity.getClassification())
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
                .activeStormShelterCount(entity.getActiveStormShelterCount())
                .publishedStormShelterCount(entity.getPublishedStormShelterCount())
                .underInvestmentStormShelterCount(entity.getUnderInvestmentStormShelterCount())
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

    private void parseLatLng(String coordinates, StormShelterAreaResponse response) {
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

    private List<StormShelterMooringWaterAreaResponse> toMooringWaterAreaResponses(UUID stormShelterAreaId) {
        return stormShelterMooringWaterAreaRepository.findByStormShelterAreaId(stormShelterAreaId).stream().map(wa -> {
            List<StormShelterMooringWaterAreaAnchorPointResponse> points = stormShelterMooringWaterAreaAnchorPointRepository
                    .findByStormShelterMooringWaterAreaId(wa.getId()).stream()
                    .map(p -> StormShelterMooringWaterAreaAnchorPointResponse.builder()
                            .id(p.getId()).name(p.getName()).latitude(p.getLatitude()).longitude(p.getLongitude())
                            .build())
                    .collect(Collectors.toList());
            return StormShelterMooringWaterAreaResponse.builder()
                    .id(wa.getId()).description(wa.getDescription()).geometryType(wa.getGeometryType())
                    .mapSymbolId(wa.getMapSymbolId()).coordinateSystem(wa.getCoordinateSystem())
                    .displayRule(wa.getDisplayRule()).anchorPoints(points)
                    .build();
        }).collect(Collectors.toList());
    }

    private void persistGisAndMooring(StormShelterArea saved, GisGeometryType geometryType, String coordinates,
                                      BigDecimal longitude, BigDecimal latitude,
                                      List<StormShelterMooringWaterAreaRequest> mooringWaterAreas) {
        String wkt = coordinates;
        if ((wkt == null || wkt.trim().isEmpty()) && longitude != null && latitude != null) {
            wkt = "POINT(" + longitude + " " + latitude + ")";
        }
        if (wkt != null && !wkt.trim().isEmpty()) {
            GisGeometryType geomType = geometryType != null ? geometryType : GisGeometryType.POINT;
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getSpatialId(), saved.getStormShelterName(), "STORM_SHELTER_" + saved.getStormShelterCode(),
                    geomType, GisSpatialObjectType.POLYGON_STORM_SHELTER, wkt, saved.getId(),
                    InfrastructureType.STORM_SHELTER_AREA);
            saved.setSpatialId(spatialObj.getId());
            stormShelterAreaRepository.save(saved);
        }
        replaceMooringWaterAreas(saved.getId(), mooringWaterAreas);
    }

    private void replaceMooringWaterAreas(UUID stormShelterAreaId, List<StormShelterMooringWaterAreaRequest> requests) {
        stormShelterMooringWaterAreaRepository.deleteAll(stormShelterMooringWaterAreaRepository.findByStormShelterAreaId(stormShelterAreaId));
        if (requests == null || requests.isEmpty()) return;
        for (StormShelterMooringWaterAreaRequest r : requests) {
            if (r.getDescription() == null || r.getDescription().isBlank()) continue;
            StormShelterMooringWaterArea wa = StormShelterMooringWaterArea.builder()
                    .stormShelterAreaId(stormShelterAreaId)
                    .description(r.getDescription().trim())
                    .geometryType(r.getGeometryType())
                    .mapSymbolId(r.getMapSymbolId())
                    .coordinateSystem(r.getCoordinateSystem())
                    .displayRule(r.getDisplayRule())
                    .build();
            StormShelterMooringWaterArea saved = stormShelterMooringWaterAreaRepository.save(wa);
            List<StormShelterMooringWaterAreaAnchorPoint> points = new ArrayList<>();
            if (r.getAnchorPoints() != null) {
                for (StormShelterMooringWaterAreaAnchorPointRequest p : r.getAnchorPoints()) {
                    if (p.getLatitude() == null || p.getLongitude() == null) continue;
                    points.add(StormShelterMooringWaterAreaAnchorPoint.builder()
                            .stormShelterMooringWaterAreaId(saved.getId())
                            .name(p.getName() != null ? p.getName().trim() : null)
                            .latitude(p.getLatitude())
                            .longitude(p.getLongitude())
                            .build());
                }
            }
            stormShelterMooringWaterAreaAnchorPointRepository.saveAll(points);
        }
    }

    private void applySaveAction(StormShelterArea entity, String action) {
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
    private StormShelterArea buildSnapshot(StormShelterArea e) {
        return StormShelterArea.builder()
                .securityLevel(e.getSecurityLevel())
                .stormShelterCode(e.getStormShelterCode())
                .stormShelterName(e.getStormShelterName())
                .portId(e.getPortId())
                .orgUnitId(e.getOrgUnitId())
                .navigationChannelId(e.getNavigationChannelId())
                .buoyStationId(e.getBuoyStationId())
                .classification(e.getClassification())
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
                .activeStormShelterCount(e.getActiveStormShelterCount())
                .publishedStormShelterCount(e.getPublishedStormShelterCount())
                .underInvestmentStormShelterCount(e.getUnderInvestmentStormShelterCount())
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
                .build();
    }

    private LocalDateTime parseLocalDateTime(String dt) {
        if (dt == null || dt.isBlank()) return null;
        try { return LocalDateTime.parse(dt); }
        catch (Exception e) { return null; }
    }
}
