package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.port.dto.transferarea.AttachmentDto;
import com.hanghai.kchtg.port.dto.transferarea.CreateTransferAreaRequest;
import com.hanghai.kchtg.port.dto.transferarea.TransferAreaMooringWaterAreaAnchorPointRequest;
import com.hanghai.kchtg.port.dto.transferarea.TransferAreaMooringWaterAreaAnchorPointResponse;
import com.hanghai.kchtg.port.dto.transferarea.TransferAreaMooringWaterAreaRequest;
import com.hanghai.kchtg.port.dto.transferarea.TransferAreaMooringWaterAreaResponse;
import com.hanghai.kchtg.port.dto.transferarea.TransferAreaResponse;
import com.hanghai.kchtg.port.dto.transferarea.UpdateTransferAreaRequest;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.entity.TransferArea;
import com.hanghai.kchtg.port.entity.TransferAreaMooringWaterArea;
import com.hanghai.kchtg.port.entity.TransferAreaMooringWaterAreaAnchorPoint;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.repository.TransferAreaMooringWaterAreaAnchorPointRepository;
import com.hanghai.kchtg.port.repository.TransferAreaMooringWaterAreaRepository;
import com.hanghai.kchtg.port.repository.TransferAreaRepository;
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
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class TransferAreaService {

    private final TransferAreaRepository transferAreaRepository;
    private final PortRepository portRepository;
    private final UserResolverService userResolverService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final PortCacheService portCacheService;
    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final TransferAreaMooringWaterAreaRepository transferAreaMooringWaterAreaRepository;
    private final TransferAreaMooringWaterAreaAnchorPointRepository transferAreaMooringWaterAreaAnchorPointRepository;
    private final InfrastructureHistoryRepository historyRepository;
    private final com.hanghai.kchtg.port.service.shared.ChangeHistoryService changeHistoryService;

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    @Transactional
    public TransferAreaResponse create(CreateTransferAreaRequest request) {
        Port port = portRepository.findById(request.getPortId())
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));

        if (port.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new IllegalArgumentException("Không thể tạo khu chuyển tải: cảng biển cha phải ở trạng thái được phê duyệt");
        }

        // RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
        //         : RecordSecurityLevel.NORMAL;
        // RecordSecurityLevel.validateAssignment(secLevel, "transferArea", SecurityUtils.getCurrentUserPermissions(),
        //         SecurityUtils.isElevatedAdministrator());

        String code = generateTransferAreaCode(request.getPortId());

        TransferArea entity = TransferArea.builder()
                // .securityLevel(secLevel)
                .transferAreaCode(code)
                .transferAreaName(request.getTransferAreaName())
                .portId(request.getPortId())
                .orgUnitId(port.getOrgUnitId())
                .provinceId(request.getProvinceId())
                .detailedLocation(request.getDetailedLocation())
                .operationalFunctions(request.getOperationalFunctions())
                .operationalStatus(request.getOperationalStatus())
                .shapeDescription(request.getShapeDescription())
                .area(request.getArea())
                .designWaterDepth(request.getDesignWaterDepth())
                .currentWaterDepth(request.getCurrentWaterDepth())
                .bottomElevationDesign(request.getBottomElevationDesign())
                .maxVesselDWT(request.getMaxVesselDWT())
                .activeTransferCount(request.getActiveTransferCount())
                .publishedTransferCount(request.getPublishedTransferCount())
                .underInvestmentTransferCount(request.getUnderInvestmentTransferCount())
                .remarks(request.getRemarks())
                .openingAnnouncementDate(request.getOpeningAnnouncementDate())
                .publicDecision(request.getPublicDecision())
                .investmentAgreement(request.getInvestmentAgreement())
                .activityStartDate(request.getActivityStartDate())
                .activityEndDate(request.getActivityEndDate())
                .mapSymbolId(request.getMapSymbolId())
                .coordinateSystem(request.getCoordinateSystem())
                .displayRule(request.getDisplayRule())
                .build();

        LocalDateTime now = LocalDateTime.now();
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        String action = request.getSaveAction() != null ? request.getSaveAction() : "DRAFT";
        applySaveAction(entity, action);

        TransferArea saved = transferAreaRepository.saveAndFlush(entity);
        persistGisAndMooring(saved, request.getGeometryType(), request.getCoordinates(),
                request.getLongitude(), request.getLatitude(), request.getMooringWaterAreas());
        evictAfterCommit();

        return toResponse(saved);
    }

    @Transactional
    public TransferAreaResponse update(UpdateTransferAreaRequest request) {
        TransferArea entity = transferAreaRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu chuyển tải với id: " + request.getId()));

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null
                && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        // Chụp snapshot đầy đủ trước khi thay đổi để ghi lịch sử chi tiết (chuẩn Bến cảng)
        TransferArea snapshot = buildSnapshot(entity);

        // if (request.getSecurityLevel() != null) {
        //     RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "transferarea",
        //             SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
        //     entity.setSecurityLevel(request.getSecurityLevel());
        // }
        if (request.getTransferAreaName() != null)
            entity.setTransferAreaName(request.getTransferAreaName());
        if (request.getPortId() != null) {
            Port parent = portRepository.findById(request.getPortId())
                    .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));
            entity.setPortId(request.getPortId());
            entity.setOrgUnitId(parent.getOrgUnitId());
        } else if (entity.getOrgUnitId() == null && entity.getPortId() != null) {
            portRepository.findById(entity.getPortId()).ifPresent(p -> entity.setOrgUnitId(p.getOrgUnitId()));
        }
        if (request.getProvinceId() != null)
            entity.setProvinceId(request.getProvinceId());
        if (request.getDetailedLocation() != null)
            entity.setDetailedLocation(request.getDetailedLocation());
        if (request.getOperationalFunctions() != null)
            entity.setOperationalFunctions(request.getOperationalFunctions());
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
        if (request.getActiveTransferCount() != null)
            entity.setActiveTransferCount(request.getActiveTransferCount());
        if (request.getPublishedTransferCount() != null)
            entity.setPublishedTransferCount(request.getPublishedTransferCount());
        if (request.getUnderInvestmentTransferCount() != null)
            entity.setUnderInvestmentTransferCount(request.getUnderInvestmentTransferCount());
        if (request.getRemarks() != null)
            entity.setRemarks(request.getRemarks());
        if (request.getOpeningAnnouncementDate() != null)
            entity.setOpeningAnnouncementDate(request.getOpeningAnnouncementDate());
        if (request.getPublicDecision() != null)
            entity.setPublicDecision(request.getPublicDecision());
        if (request.getInvestmentAgreement() != null)
            entity.setInvestmentAgreement(request.getInvestmentAgreement());
        if (request.getActivityStartDate() != null)
            entity.setActivityStartDate(request.getActivityStartDate());
        if (request.getActivityEndDate() != null)
            entity.setActivityEndDate(request.getActivityEndDate());
        entity.setMapSymbolId(request.getMapSymbolId());
        if (request.getCoordinateSystem() != null)
            entity.setCoordinateSystem(request.getCoordinateSystem());
        if (request.getDisplayRule() != null)
            entity.setDisplayRule(request.getDisplayRule());

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
                transferAreaMooringWaterAreaRepository.findByTransferAreaId(entity.getId()));

        entity.setUpdatedAt(LocalDateTime.now());
        if (operatorId != null) {
            entity.setUpdatedBy(operatorId);
        }

        TransferArea saved = transferAreaRepository.saveAndFlush(entity);
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
                    changeHistoryService.insertChangeRecord("TransferArea", saved.getId(), "Tọa độ GIS",
                            (oldWkt == null || oldWkt.trim().isEmpty()) ? "Chưa có" : oldWkt.trim(),
                            newWkt, actorId);
                }
                boolean typeChanged = request.getGeometryType() != null && oldGeomType != geomType;
                if (typeChanged) {
                    changeHistoryService.insertChangeRecord("TransferArea", saved.getId(), "Loại đối tượng GIS",
                            oldGeomType != null ? geometryTypeLabel(oldGeomType) : "Chưa có",
                            geometryTypeLabel(geomType), actorId);
                }
            }

            changeHistoryService.recordChanges("TransferArea", saved.getId().toString(),
                    actorId, snapshot, saved);

            // Summary "Khu nước neo buộc tàu" đọc được — không ghi Java toString rác của reflection
            String newMooringSummary = buildMooringWaterAreaSummary(
                    transferAreaMooringWaterAreaRepository.findByTransferAreaId(saved.getId()));
            if (!oldMooringSummary.equals(newMooringSummary)) {
                changeHistoryService.insertChangeRecord("TransferArea", saved.getId(), "Khu nước neo buộc tàu",
                        oldMooringSummary.isEmpty() ? "Chưa có" : oldMooringSummary,
                        newMooringSummary.isEmpty() ? "Chưa có" : newMooringSummary, actorId);
            }
        }
        evictAfterCommit();

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public TransferAreaResponse getById(UUID id) {
        TransferArea entity = transferAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu chuyển tải với id: " + id));
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public Page<TransferAreaResponse> findAll(int page, int size, UUID orgUnitId,
                                              String search, String transferAreaCode, String transferAreaName,
                                              UUID portId, Integer provinceId, String operationalFunctions,
                                              String operationalStatus, String approvalStatus,
                                              String updatedFrom, String updatedTo) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize,
                Sort.by(Sort.Order.desc(EntityFields.UPDATED_AT),
                        Sort.Order.desc(EntityFields.CREATED_AT),
                        Sort.Order.asc(EntityFields.ID)));
        ApprovalStatus approvalEnum = approvalStatus != null ? ApprovalStatus.fromString(approvalStatus) : null;
        OperationalStatus statusEnum = operationalStatus != null ? OperationalStatus.fromString(operationalStatus) : null;
        java.time.LocalDateTime updatedFromDt = parseLocalDateTime(updatedFrom);
        java.time.LocalDateTime updatedToDt = parseUpdatedTo(updatedTo);
        // Mở rộng cây đơn vị: chọn đơn vị cha → gồm cả khu chuyển tải của toàn bộ đơn vị con (hậu duệ), giống logic BerthService
        boolean includeAll = orgUnitId == null;
        List<UUID> orgUnitIds = orgUnitId != null ? orgUnitScopeService.resolveSubtreeIds(orgUnitId) : List.of();
        String searchTrim = search != null ? search.trim() : null;
        Page<TransferArea> result = transferAreaRepository.searchTransferAreas(
                includeAll, orgUnitIds,
                searchTrim, transferAreaCode, transferAreaName, portId,
                provinceId, operationalFunctions, approvalEnum, statusEnum, false,
                updatedFromDt, updatedToDt,
                pageable);

        // Batch resolve tên cảng biển cha để tránh truy vấn từng bản ghi (chuẩn Bến cảng)
        java.util.List<UUID> parentIds = result.getContent().stream()
                .map(TransferArea::getPortId)
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
        TransferArea entity = transferAreaRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu chuyển tải với id: " + id));
        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT) {
            throw new IllegalArgumentException("Chỉ được xóa khu chuyển tải ở trạng thái Nháp");
        }
        if (entity.getDeletedAt() != null) {
            throw new IllegalStateException("Khu chuyển tải đã bị xóa trước đó");
        }

        // Chụp snapshot trước khi xóa mềm để ghi lịch sử thay đổi (chuẩn Cầu cảng)
        TransferArea snapshot = buildSnapshot(entity);
        UUID operatorId = SecurityUtils.getCurrentUserId();
        String actorId = operatorId != null ? operatorId.toString() : "system";

        entity.softDelete(operatorId);
        transferAreaRepository.save(entity);

        // Xóa mềm các khu nước neo buộc tàu con (cascade soft-delete)
        List<TransferAreaMooringWaterArea> waterAreas = transferAreaMooringWaterAreaRepository.findByTransferAreaId(id);
        for (TransferAreaMooringWaterArea wa : waterAreas) {
            wa.softDelete(operatorId);
            transferAreaMooringWaterAreaRepository.save(wa);
        }

        // Ghi lịch sử xóa mềm vào infrastructure_history với actor thật (chuẩn Cảng biển / Cầu cảng).
        changeHistoryService.recordChanges("TransferArea", entity.getId().toString(), actorId, snapshot, entity);
        changeHistoryService.insertChangeRecord("TransferArea", entity.getId(), "Trạng thái", null, "Đã xóa", actorId);
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        evictAfterCommit();
        log.info("Soft-deleted TransferArea [{}] code={}", entity.getId(), entity.getTransferAreaCode());
    }

    public String generateTransferAreaCode(UUID portId) {
        Port port = portRepository.findById(portId)
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + portId));

        String portCode = port.getPortCode();
        String prefix = portCode + "-CT-";
        List<TransferArea> existing = transferAreaRepository.findByPortIdAndDeletedAtIsNull(portId);
        int maxNum = 0;
        for (TransferArea a : existing) {
            if (a.getTransferAreaCode() != null && a.getTransferAreaCode().startsWith(prefix)) {
                try {
                    int n = Integer.parseInt(a.getTransferAreaCode().substring(prefix.length()));
                    if (n > maxNum) maxNum = n;
                } catch (NumberFormatException ignored) {}
            }
        }
        int num = maxNum + 1;
        String candidate = prefix + String.format("%03d", num);
        while (transferAreaRepository.existsByTransferAreaCode(candidate)) {
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
        if ("TRANSFER_AREA".equalsIgnoreCase(entityType) && !uploadedFilenames.isEmpty()) {
            recordTransferAreaAttachmentHistory(entityId, String.join(", ", uploadedFilenames),
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

    public Attachment getAttachment(String entityType, UUID entityId, UUID attachmentId) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
        if (!attachment.getEntityId().equals(entityId)) {
            throw new IllegalArgumentException("File không thuộc entity này");
        }
        return attachment;
    }

    @Transactional
    public void deleteAttachment(String entityType, UUID entityId, UUID attachmentId, UUID userId, Boolean skipHistory) {
        Attachment attachment = attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file: " + attachmentId));
        if (!attachment.getEntityId().equals(entityId)) {
            throw new IllegalArgumentException("File không thuộc entity này");
        }
        String fileName = attachment.getFileName();
        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
        } catch (Exception e) {
            log.warn("Không thể xóa file: {}", attachment.getFilePath(), e);
        }
        attachmentRepository.delete(attachment);
        if ("TRANSFER_AREA".equalsIgnoreCase(entityType)) {
            recordTransferAreaAttachmentHistory(entityId, fileName,
                    InfrastructureHistoryStatus.ATTACHMENT_DELETED, skipHistory);
        }
    }

    public void deleteAttachment(String entityType, UUID entityId, UUID attachmentId, UUID userId) {
        deleteAttachment(entityType, entityId, attachmentId, userId, null);
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

    public TransferAreaResponse toResponse(TransferArea entity) {
        return toResponse(entity, null);
    }

    public TransferAreaResponse toResponse(TransferArea entity, String preResolvedPortName) {
        if (entity == null) return null;

        TransferAreaResponse response = TransferAreaResponse.builder()
                .id(entity.getId())
                // .securityLevel(entity.getSecurityLevel())
                .transferAreaCode(entity.getTransferAreaCode())
                .transferAreaName(entity.getTransferAreaName())
                .portId(entity.getPortId())
                .portName(preResolvedPortName != null ? preResolvedPortName : portCacheService.getName(entity.getPortId()))
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))
                .provinceId(entity.getProvinceId())
                .detailedLocation(entity.getDetailedLocation())
                .operationalFunctions(entity.getOperationalFunctions())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
                // Technical fields
                .shapeDescription(entity.getShapeDescription())
                .area(entity.getArea())
                .designWaterDepth(entity.getDesignWaterDepth())
                .currentWaterDepth(entity.getCurrentWaterDepth())
                .bottomElevationDesign(entity.getBottomElevationDesign())
                .maxVesselDWT(entity.getMaxVesselDWT())
                .activeTransferCount(entity.getActiveTransferCount())
                .publishedTransferCount(entity.getPublishedTransferCount())
                .underInvestmentTransferCount(entity.getUnderInvestmentTransferCount())
                .remarks(entity.getRemarks())
                // Publication fields
                .openingAnnouncementDate(entity.getOpeningAnnouncementDate())
                .publicDecision(entity.getPublicDecision())
                .investmentAgreement(entity.getInvestmentAgreement())
                // Activity period fields
                .activityStartDate(entity.getActivityStartDate())
                .activityEndDate(entity.getActivityEndDate())
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

    private void parseLatLng(String coordinates, TransferAreaResponse response) {
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

    private List<TransferAreaMooringWaterAreaResponse> toMooringWaterAreaResponses(UUID transferAreaId) {
        return transferAreaMooringWaterAreaRepository.findByTransferAreaId(transferAreaId).stream().map(wa -> {
            List<TransferAreaMooringWaterAreaAnchorPointResponse> points = transferAreaMooringWaterAreaAnchorPointRepository
                    .findByTransferAreaMooringWaterAreaId(wa.getId()).stream()
                    .map(p -> TransferAreaMooringWaterAreaAnchorPointResponse.builder()
                            .id(p.getId()).name(p.getName()).latitude(p.getLatitude()).longitude(p.getLongitude())
                            .build())
                    .collect(Collectors.toList());
            return TransferAreaMooringWaterAreaResponse.builder()
                    .id(wa.getId()).description(wa.getDescription()).geometryType(wa.getGeometryType())
                    .mapSymbolId(wa.getMapSymbolId()).coordinateSystem(wa.getCoordinateSystem())
                    .displayRule(wa.getDisplayRule()).anchorPoints(points)
                    .build();
        }).collect(Collectors.toList());
    }

    private void persistGisAndMooring(TransferArea saved, GisGeometryType geometryType, String coordinates,
                                      BigDecimal longitude, BigDecimal latitude,
                                      List<TransferAreaMooringWaterAreaRequest> mooringWaterAreas) {
        String wkt = coordinates;
        if ((wkt == null || wkt.trim().isEmpty()) && longitude != null && latitude != null) {
            wkt = "POINT(" + longitude + " " + latitude + ")";
        }
        if (wkt != null && !wkt.trim().isEmpty()) {
            GisGeometryType geomType = geometryType != null ? geometryType : GisGeometryType.POINT;
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getSpatialId(), saved.getTransferAreaName(), "TRANSFER_AREA_" + saved.getTransferAreaCode(),
                    geomType, GisSpatialObjectType.POLYGON_TRANSSHIPMENT, wkt, saved.getId(),
                    InfrastructureType.TRANSSHIPMENT_AREA);
            saved.setSpatialId(spatialObj.getId());
            transferAreaRepository.save(saved);
        }
        replaceMooringWaterAreas(saved.getId(), mooringWaterAreas);
    }

    private void replaceMooringWaterAreas(UUID transferAreaId, List<TransferAreaMooringWaterAreaRequest> requests) {
        transferAreaMooringWaterAreaRepository.deleteAll(transferAreaMooringWaterAreaRepository.findByTransferAreaId(transferAreaId));
        if (requests == null || requests.isEmpty()) return;
        for (TransferAreaMooringWaterAreaRequest r : requests) {
            if (r.getDescription() == null || r.getDescription().isBlank()) continue;
            TransferAreaMooringWaterArea wa = TransferAreaMooringWaterArea.builder()
                    .transferAreaId(transferAreaId)
                    .description(r.getDescription().trim())
                    .geometryType(r.getGeometryType())
                    .mapSymbolId(r.getMapSymbolId())
                    .coordinateSystem(r.getCoordinateSystem())
                    .displayRule(r.getDisplayRule())
                    .build();
            TransferAreaMooringWaterArea saved = transferAreaMooringWaterAreaRepository.save(wa);
            List<TransferAreaMooringWaterAreaAnchorPoint> points = new ArrayList<>();
            if (r.getAnchorPoints() != null) {
                for (TransferAreaMooringWaterAreaAnchorPointRequest p : r.getAnchorPoints()) {
                    if (p.getLatitude() == null || p.getLongitude() == null) continue;
                    points.add(TransferAreaMooringWaterAreaAnchorPoint.builder()
                            .transferAreaMooringWaterAreaId(saved.getId())
                            .name(p.getName() != null ? p.getName().trim() : null)
                            .latitude(p.getLatitude())
                            .longitude(p.getLongitude())
                            .build());
                }
            }
            transferAreaMooringWaterAreaAnchorPointRepository.saveAll(points);
        }
    }

    private void applySaveAction(TransferArea entity, String action) {
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

    public void evictAfterCommit() {
        portCacheService.evictAfterCommit();
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
     * Summary đọc được của bảng con "Khu nước neo buộc tàu" (transfer_area_mooring_water_areas + điểm neo),
     * dùng cho lịch sử thay đổi — không ghi Java toString rác của reflection.
     */
    private String buildMooringWaterAreaSummary(List<TransferAreaMooringWaterArea> areas) {
        if (areas == null || areas.isEmpty()) return "";
        List<String> parts = new ArrayList<>();
        for (TransferAreaMooringWaterArea wa : areas) {
            String desc = (wa.getDescription() == null || wa.getDescription().isBlank())
                    ? "(khu nước không mô tả)" : wa.getDescription().trim();
            long pointCount = transferAreaMooringWaterAreaAnchorPointRepository.findByTransferAreaMooringWaterAreaId(wa.getId()).size();
            parts.add(desc + " (" + pointCount + " điểm)");
        }
        return areas.size() + " khu nước: " + String.join("; ", parts);
    }

    /**
     * Ghi lịch sử file đính kèm Khu chuyển tải (chuẩn Cảng biển DocumentService.recordPortAttachmentHistory:
     * status ATTACHMENT_UPLOADED / ATTACHMENT_DELETED, changedField "Tài liệu đính kèm").
     * Chỉ ghi khi entityType = "TRANSFER_AREA" và hồ sơ đã duyệt. Thêm mới không ghi.
     */
    private void recordTransferAreaAttachmentHistory(UUID transferAreaId, String fileName,
                                                     InfrastructureHistoryStatus status, Boolean skipHistory) {
        try {
            if (Boolean.TRUE.equals(skipHistory)) return;
            TransferArea transferArea = transferAreaRepository.findById(transferAreaId).orElse(null);
            if (transferArea == null) return;
            ApprovalStatus approval = transferArea.getApprovalStatus();
            boolean wasApproved = approval == ApprovalStatus.APPROVED
                    || approval == ApprovalStatus.APPROVED_LEVEL2;
            if (!wasApproved) return;
            // Guard: Thêm mới không ghi lịch sử đính kèm
            if (transferArea.getCreatedAt() != null && transferArea.getUpdatedAt() != null
                    && (transferArea.getCreatedAt().isEqual(transferArea.getUpdatedAt())
                    || java.time.Duration.between(transferArea.getCreatedAt(), transferArea.getUpdatedAt()).abs().toSeconds() <= 2)) {
                return;
            }
            String name = fileName != null ? fileName : "không rõ tên";
            boolean uploaded = status == InfrastructureHistoryStatus.ATTACHMENT_UPLOADED;
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(transferAreaId)
                    .refType(InfrastructureType.TRANSSHIPMENT_AREA)
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(status)
                    .approvedBy(SecurityUtils.getCurrentUserId())
                    .approvedDate(LocalDateTime.now())
                    .reason((uploaded ? "Tải lên tài liệu đính kèm: " : "Xóa tài liệu đính kèm: ") + name)
                    .changedField("Tài liệu đính kèm")
                    .previousValue(uploaded ? "—" : name)
                    .newValue(uploaded ? name : "—")
                    .build());
            log.info("Đã ghi lịch sử {} file đính kèm của Khu chuyển tải [{}]: {}",
                    uploaded ? "tải lên" : "xóa", transferAreaId, name);
        } catch (Exception e) {
            log.warn("Không ghi được lịch sử file đính kèm Khu chuyển tải [{}]: {}", transferAreaId, e.getMessage());
        }
    }

    private void recordTransferAreaAttachmentHistory(UUID transferAreaId, String fileName,
                                                     InfrastructureHistoryStatus status) {
        recordTransferAreaAttachmentHistory(transferAreaId, fileName, status, null);
    }

    /**
     * Chụp snapshot đầy đủ để ghi lịch sử thay đổi (chuẩn Bến cảng).
     */
    private TransferArea buildSnapshot(TransferArea e) {
        return TransferArea.builder()
                // .securityLevel(e.getSecurityLevel())
                .transferAreaCode(e.getTransferAreaCode())
                .transferAreaName(e.getTransferAreaName())
                .portId(e.getPortId())
                .orgUnitId(e.getOrgUnitId())
                .provinceId(e.getProvinceId())
                .detailedLocation(e.getDetailedLocation())
                .operationalFunctions(e.getOperationalFunctions())
                .operationalStatus(e.getOperationalStatus())
                .approvalStatus(e.getApprovalStatus())
                .shapeDescription(e.getShapeDescription())
                .area(e.getArea())
                .designWaterDepth(e.getDesignWaterDepth())
                .currentWaterDepth(e.getCurrentWaterDepth())
                .bottomElevationDesign(e.getBottomElevationDesign())
                .maxVesselDWT(e.getMaxVesselDWT())
                .activeTransferCount(e.getActiveTransferCount())
                .publishedTransferCount(e.getPublishedTransferCount())
                .underInvestmentTransferCount(e.getUnderInvestmentTransferCount())
                .remarks(e.getRemarks())
                .openingAnnouncementDate(e.getOpeningAnnouncementDate())
                .publicDecision(e.getPublicDecision())
                .investmentAgreement(e.getInvestmentAgreement())
                .activityStartDate(e.getActivityStartDate())
                .activityEndDate(e.getActivityEndDate())
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
}
