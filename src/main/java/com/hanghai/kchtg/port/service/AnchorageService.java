package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.entity.OperationalStatusConverter;
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
import com.hanghai.kchtg.port.entity.Berth;
import com.hanghai.kchtg.port.entity.BuoyBerth;
import com.hanghai.kchtg.port.entity.MooringWaterArea;
import com.hanghai.kchtg.port.entity.MooringWaterAreaAnchorPoint;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.AnchorageRepository;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.repository.BuoyBerthRepository;
import com.hanghai.kchtg.port.repository.MooringWaterAreaAnchorPointRepository;
import com.hanghai.kchtg.port.repository.MooringWaterAreaRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.service.PortCacheService;
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
    private final BuoyBerthRepository buoyBerthRepository;
    private final UserRepository userRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final MooringWaterAreaRepository mooringWaterAreaRepository;
    private final MooringWaterAreaAnchorPointRepository mooringWaterAreaAnchorPointRepository;
    private final InfrastructureHistoryRepository historyRepository;

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    @Transactional
    public AnchorageResponse create(CreateAnchorageRequest request) {
        Port port = portRepository.findById(request.getPortId())
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));

        if (port.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new IllegalArgumentException("Không thể tạo khu neo đậu: cảng biển cha phải ở trạng thái được phê duyệt");
        }

        // RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
        //         : RecordSecurityLevel.NORMAL;
        // RecordSecurityLevel.validateAssignment(secLevel, "anchorage", SecurityUtils.getCurrentUserPermissions(),
        //         SecurityUtils.isElevatedAdministrator());

        String code = generateAnchorageCode(request.getPortId());

        Anchorage entity = Anchorage.builder()
                // .securityLevel(secLevel)
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
        // Ghi lịch sử thay đổi vào infrastructure_history với actor thật (chuẩn Cảng biển PortService).
        UUID operatorId = SecurityUtils.getCurrentUserId();
        String actorId = operatorId != null ? operatorId.toString() : "system";
        recordFieldChanges(new Anchorage(), saved, saved.getId(), actorId);
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

        // if (request.getSecurityLevel() != null) {
        //     RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "anchorage",
        //             SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
        //     entity.setSecurityLevel(request.getSecurityLevel());
        // }
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

        // Actor thật từ SecurityContext — nếu truyền "system", approvedBy = null và drawer hiện "—"
        UUID operatorId = SecurityUtils.getCurrentUserId();
        String actorId = operatorId != null ? operatorId.toString() : "system";
        boolean wasApproved = snapshot.getApprovalStatus() == ApprovalStatus.APPROVED
                || snapshot.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;

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

        Anchorage saved = anchorageRepository.save(entity);
        persistGisAndMooring(saved, request.getGeometryType(), coordinates,
                request.getLongitude(), request.getLatitude(), request.getMooringWaterAreas());

        // Chỉ ghi lịch sử khi hồ sơ đã được duyệt (chuẩn PortService: 2 dòng GIS riêng + summary khu nước).
        if (wasApproved) {
            if (coordinates != null && !coordinates.trim().isEmpty()) {
                GisGeometryType geomType = request.getGeometryType() != null
                        ? request.getGeometryType() : GisGeometryType.POINT;
                String newWkt = coordinates.trim();
                boolean wktChanged = oldWkt == null || !newWkt.equals(oldWkt.trim());
                if (wktChanged) {
                    insertHistoryRecord(saved.getId(), "Tọa độ GIS",
                            (oldWkt == null || oldWkt.trim().isEmpty()) ? "Chưa có" : oldWkt.trim(),
                            newWkt, actorId);
                }
                boolean typeChanged = request.getGeometryType() != null && oldGeomType != geomType;
                if (typeChanged) {
                    insertHistoryRecord(saved.getId(), "Loại đối tượng GIS",
                            oldGeomType != null ? geometryTypeLabel(oldGeomType) : "Chưa có",
                            geometryTypeLabel(geomType), actorId);
                }
            }
            // Field-level thay đổi theo từng trường (recordChanges bị tắt từ migration V20260825162500)
            recordFieldChanges(snapshot, saved, saved.getId(), actorId);

            // Summary "Khu nước neo buộc tàu" đọc được — không ghi Java toString rác của reflection
            String newMooringSummary = buildMooringWaterAreaSummary(
                    mooringWaterAreaRepository.findByAnchorageId(saved.getId()));
            if (!oldMooringSummary.equals(newMooringSummary)) {
                insertHistoryRecord(saved.getId(), "Khu nước neo buộc tàu",
                        oldMooringSummary.isEmpty() ? "Chưa có" : oldMooringSummary,
                        newMooringSummary.isEmpty() ? "Chưa có" : newMooringSummary, actorId);
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
        long waterAreaCount = mooringWaterAreaRepository.countByAnchorageIdAndDeletedAtIsNull(id);
        if (waterAreaCount > 0) {
            throw new IllegalStateException("Không thể xóa: khu neo đậu đang có " + waterAreaCount
                    + " phạm vi khu nước neo buộc tàu liên kết");
        }
        // Chụp snapshot trước khi xóa mềm để ghi lịch sử thay đổi (chuẩn Bến cảng)
        Anchorage snapshot = buildSnapshot(entity);
        entity.softDelete(SecurityUtils.getCurrentUserId());
        anchorageRepository.save(entity);
        // Ghi lịch sử xóa mềm vào infrastructure_history với actor thật (chuẩn Cảng biển).
        UUID operatorId = SecurityUtils.getCurrentUserId();
        String actorId = operatorId != null ? operatorId.toString() : "system";
        recordFieldChanges(snapshot, entity, entity.getId(), actorId);
        insertHistoryRecord(entity.getId(), "Trạng thái", null, "Đã xóa", actorId);
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
            if ("ANCHORAGE".equalsIgnoreCase(entityType)) {
                recordAnchorageAttachmentHistory(entityId, originalFilename,
                        InfrastructureHistoryStatus.ATTACHMENT_UPLOADED);
            }
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
        if ("ANCHORAGE".equalsIgnoreCase(entityType)) {
            recordAnchorageAttachmentHistory(entityId, attachment.getFileName(),
                    InfrastructureHistoryStatus.ATTACHMENT_DELETED);
        }
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
                .portName(preResolvedPortName != null ? preResolvedPortName : portCacheService.getName(entity.getPortId()))
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))
                .navigationChannelId(entity.getNavigationChannelId())
                .buoyStationId(entity.getBuoyStationId())
                .buoyStationName(resolveBuoyStationName(entity.getBuoyStationId(), buoyStationNameMap))
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
                .build();
    }

    private LocalDateTime parseLocalDateTime(String dt) {
        if (dt == null || dt.isBlank()) return null;
        try { return LocalDateTime.parse(dt); }
        catch (Exception e) { return null; }
    }

    // ── Lịch sử thay đổi (infrastructure_history — chuẩn Cảng biển sau migration V20260825162500) ──

    /** Nhãn hiển thị loại hình GIS theo chuẩn VTS CHK (dùng cho lịch sử thay đổi). */
    private static String geometryTypeLabel(GisGeometryType type) {
        if (type == null) return "Chưa có";
        return switch (type) {
            case POINT -> "Đối tượng điểm";
            case LINE -> "Đối tượng đường";
            case POLYGON -> "Đối tượng vùng";
        };
    }

    /**
     * Chèn 1 dòng lịch sử refType = ANCHORAGE_AREA.
     * Không dùng ChangeHistoryService.insertChangeRecord vì resolveInfrastructureType("Anchorage")
     * rơi vào default SEAPORT (thiếu mapping ANCHORAGE) → dòng không hiển thị ở drawer Khu neo đậu.
     */
    private void insertHistoryRecord(UUID entityId, String fieldName, String oldValue, String newValue, String actorId) {
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entityId)
                .refType(InfrastructureType.ANCHORAGE_AREA)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(InfrastructureHistoryStatus.UPDATED)
                .approvedBy(parseActorId(actorId))
                .approvedDate(LocalDateTime.now())
                .changedField(fieldName)
                .previousValue(oldValue)
                .newValue(newValue)
                .build());
    }

    /**
     * So sánh từng field giữa bản snapshot cũ và bản đã lưu, mỗi field thay đổi thành 1 dòng
     * infrastructure_history (cùng ngữ nghĩa recordChanges của change_logs trước migration
     * V20260825162500, nhưng refType = ANCHORAGE_AREA và changedBy = actor thật).
     */
    private void recordFieldChanges(Anchorage oldEntity, Anchorage newEntity, UUID entityId, String actorId) {
        if (oldEntity == null || newEntity == null) return;
        UUID actorUuid = parseActorId(actorId);
        for (java.lang.reflect.Field field : Anchorage.class.getDeclaredFields()) {
            if (isSkippedHistoryField(field.getName())) continue;
            field.setAccessible(true);
            try {
                Object oldValue = field.get(oldEntity);
                Object newValue = field.get(newEntity);
                if (!historyValuesEqual(oldValue, newValue)) {
                    historyRepository.save(InfrastructureHistory.builder()
                            .refId(entityId)
                            .refType(InfrastructureType.ANCHORAGE_AREA)
                            .approvalLevel(ApprovalLevel.LEVEL_0)
                            .status(InfrastructureHistoryStatus.UPDATED)
                            .approvedBy(actorUuid)
                            .approvedDate(LocalDateTime.now())
                            .changedField(field.getName())
                            .previousValue(historyFormatValue(oldValue))
                            .newValue(historyFormatValue(newValue))
                            .build());
                }
            } catch (IllegalAccessException e) {
                log.warn("Không đọc được field {} của Anchorage để ghi lịch sử: {}", field.getName(), e.getMessage());
            }
        }
    }

    private boolean isSkippedHistoryField(String name) {
        return EntityFields.ID.equals(name)
                || EntityFields.CREATED_AT.equals(name)
                || EntityFields.UPDATED_AT.equals(name)
                || EntityFields.DELETED_AT.equals(name)
                || EntityFields.CREATED_BY.equals(name)
                || EntityFields.UPDATED_BY.equals(name);
    }

    private boolean historyValuesEqual(Object a, Object b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        if (a instanceof Enum<?> ea && b instanceof Enum<?> eb) return ea == eb;
        if (a instanceof Number && b instanceof Number) {
            try {
                return new java.math.BigDecimal(a.toString()).compareTo(new java.math.BigDecimal(b.toString())) == 0;
            } catch (NumberFormatException e) {
                return ((Number) a).doubleValue() == ((Number) b).doubleValue();
            }
        }
        return a.equals(b);
    }

    private String historyFormatValue(Object value) {
        if (value == null) return "(null)";
        if (value instanceof LocalDateTime dt) return dt.toString();
        if (value instanceof Enum<?> e) return e.name();
        return value.toString();
    }

    private UUID parseActorId(String actorId) {
        if (actorId == null || actorId.isBlank() || "system".equals(actorId)) return null;
        try { return UUID.fromString(actorId); }
        catch (Exception e) { return null; }
    }

    /**
     * Summary đọc được của bảng con "Khu nước neo buộc tàu" (mooring_water_areas + điểm neo),
     * dùng cho lịch sử thay đổi — không ghi Java toString rác của reflection.
     */
    private String buildMooringWaterAreaSummary(List<MooringWaterArea> areas) {
        if (areas == null || areas.isEmpty()) return "";
        List<String> parts = new ArrayList<>();
        for (MooringWaterArea wa : areas) {
            String desc = (wa.getDescription() == null || wa.getDescription().isBlank())
                    ? "(khu nước không mô tả)" : wa.getDescription().trim();
            long pointCount = mooringWaterAreaAnchorPointRepository.findByMooringWaterAreaId(wa.getId()).size();
            parts.add(desc + " (" + pointCount + " điểm)");
        }
        return areas.size() + " khu nước: " + String.join("; ", parts);
    }

    /**
     * Ghi lịch sử file đính kèm Khu neo đậu (chuẩn Cảng biển DocumentService.recordPortAttachmentHistory:
     * status ATTACHMENT_UPLOADED / ATTACHMENT_DELETED, changedField "Tài liệu đính kèm").
     * Chỉ ghi khi entityType = "ANCHORAGE" và hồ sơ đã duyệt.
     */
    private void recordAnchorageAttachmentHistory(UUID anchorageId, String fileName,
                                                  InfrastructureHistoryStatus status) {
        try {
            Anchorage anchorage = anchorageRepository.findById(anchorageId).orElse(null);
            if (anchorage == null) return;
            ApprovalStatus approval = anchorage.getApprovalStatus();
            boolean wasApproved = approval == ApprovalStatus.APPROVED
                    || approval == ApprovalStatus.APPROVED_LEVEL2;
            if (!wasApproved) return;
            String name = fileName != null ? fileName : "không rõ tên";
            boolean uploaded = status == InfrastructureHistoryStatus.ATTACHMENT_UPLOADED;
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(anchorageId)
                    .refType(InfrastructureType.ANCHORAGE_AREA)
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(status)
                    .approvedBy(SecurityUtils.getCurrentUserId())
                    .approvedDate(LocalDateTime.now())
                    .reason((uploaded ? "Tải lên tài liệu đính kèm: " : "Xóa tài liệu đính kèm: ") + name)
                    .changedField("Tài liệu đính kèm")
                    .previousValue(uploaded ? "—" : name)
                    .newValue(uploaded ? name : "—")
                    .build());
            log.info("Đã ghi lịch sử {} file đính kèm của Khu neo đậu [{}]: {}",
                    uploaded ? "tải lên" : "xóa", anchorageId, name);
        } catch (Exception e) {
            log.warn("Không ghi được lịch sử file đính kèm Khu neo đậu [{}]: {}", anchorageId, e.getMessage());
        }
    }
}
