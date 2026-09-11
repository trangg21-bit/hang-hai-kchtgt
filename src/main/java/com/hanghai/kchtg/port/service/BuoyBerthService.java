package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.entity.OperatingUnit;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.repository.OperatingUnitRepository;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.port.dto.buoyberth.AttachmentDto;
import com.hanghai.kchtg.port.dto.buoyberth.BuoyBerthResponse;
import com.hanghai.kchtg.port.dto.buoyberth.CreateBuoyBerthRequest;
import com.hanghai.kchtg.port.dto.buoyberth.UpdateBuoyBerthRequest;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.entity.BuoyBerth;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.repository.BuoyBerthRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for BuoyBerth (Bến phao) — parity với StormShelterAreaService.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BuoyBerthService {

    private final BuoyBerthRepository buoyBerthRepository;
    private final PortRepository portRepository;
    private final UserResolverService userResolverService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final PortCacheService portCacheService;
    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final ChangeHistoryService changeHistoryService;
    private final InfrastructureHistoryRepository historyRepository;
    private final OperatingUnitRepository operatingUnitRepository;

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    @Transactional
    public BuoyBerthResponse create(CreateBuoyBerthRequest request) {
        Port port = portRepository.findById(request.getPortId())
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));

        if (port.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new IllegalArgumentException("Không thể tạo bến phao: cảng biển cha phải ở trạng thái được phê duyệt");
        }

        // RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
        //         : RecordSecurityLevel.NORMAL;
        // RecordSecurityLevel.validateAssignment(secLevel, "buoyberth", SecurityUtils.getCurrentUserPermissions(),
        //         SecurityUtils.isElevatedAdministrator());

        String code = (request.getBuoyBerthCode() != null && !request.getBuoyBerthCode().trim().isEmpty() && !buoyBerthRepository.existsByBuoyBerthCode(request.getBuoyBerthCode().trim()))
                ? request.getBuoyBerthCode().trim()
                : generateBuoyBerthCode(request.getPortId());

        BuoyBerth entity = BuoyBerth.builder()
                // .securityLevel(secLevel)
                .buoyBerthCode(code)
                .buoyBerthName(request.getBuoyBerthName())
                .portId(request.getPortId())
                .orgUnitId(port.getOrgUnitId())
                .waterwayId(request.getWaterwayId())
                .classification(request.getClassification())
                .provinceId(request.getProvinceId())
                .detailedLocation(request.getDetailedLocation())
                .operationalStatus(request.getOperationalStatus())
                .operatingOrgId(request.getOperatingOrgId())
                .currentWaterDepth(request.getCurrentWaterDepth())
                .bottomElevationDesign(request.getBottomElevationDesign())
                .maxVesselDWT(request.getMaxVesselDWT())
                .plannedVesselDWT(request.getPlannedVesselDWT())
                .lastInspectionDate(request.getLastInspectionDate())
                .nextInspectionDate(request.getNextInspectionDate())
                .operationExpiryDate(request.getOperationExpiryDate())
                .designCapacity(request.getDesignCapacity())
                .activeBuoyBerthCount(request.getActiveBuoyBerthCount())
                .publishedBuoyBerthCount(request.getPublishedBuoyBerthCount())
                .underInvestmentBuoyBerthCount(request.getUnderInvestmentBuoyBerthCount())
                .cargoThroughput(request.getCargoThroughput())
                .openingAnnouncementDate(request.getOpeningAnnouncementDate())
                .publicDecision(request.getPublicDecision())
                .investmentAgreement(request.getInvestmentAgreement())
                .mooringWaterAreaScope(request.getMooringWaterAreaScope())
                .mapSymbolId(request.getMapSymbolId())
                .coordinateSystem(request.getCoordinateSystem())
                .displayRule(request.getDisplayRule())
                .build();

        String action = request.getSaveAction() != null ? request.getSaveAction() : "DRAFT";
        applySaveAction(entity, action);

        UUID operatorId = SecurityUtils.getCurrentUserId();
        entity.setUpdatedAt(LocalDateTime.now());
        if (operatorId != null) {
            entity.setUpdatedBy(operatorId);
        }
        BuoyBerth saved = buoyBerthRepository.saveAndFlush(entity);
        persistGis(saved, request.getGeometryType(), request.getCoordinates(),
                request.getLongitude(), request.getLatitude());
        // Chỉ CHỈNH SỬA mới ghi lịch sử — tạo mới không ghi (quyết định nghiệp vụ 2026-08-28)
        evictAfterCommit();

        return toResponse(saved);
    }

    @Transactional
    public BuoyBerthResponse update(UpdateBuoyBerthRequest request) {
        BuoyBerth entity = buoyBerthRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến phao với id: " + request.getId()));

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null
                && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        // Chụp snapshot đầy đủ trước khi thay đổi để ghi lịch sử chi tiết (chuẩn Bến cảng / Cầu cảng)
        BuoyBerth snapshot = buildSnapshot(entity);

        // Lấy tọa độ + loại hình GIS cũ (WKT) trước khi persistGis ghi đè spatial object
        String oldWkt = null;
        GisGeometryType oldGeomType = null;
        if (snapshot.getSpatialId() != null) {
            GisSpatialObject oldSpatial = gisSpatialObjectService.findById(snapshot.getSpatialId()).orElse(null);
            if (oldSpatial != null) {
                oldWkt = oldSpatial.getCoordinates();
                oldGeomType = oldSpatial.getGeometryType();
            }
        }

        if (request.getBuoyBerthName() != null)
            entity.setBuoyBerthName(request.getBuoyBerthName());
        if (request.getPortId() != null) {
            Port parent = portRepository.findById(request.getPortId())
                    .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));
            entity.setPortId(request.getPortId());
            entity.setOrgUnitId(parent.getOrgUnitId());
        } else if (entity.getOrgUnitId() == null && entity.getPortId() != null) {
            portRepository.findById(entity.getPortId()).ifPresent(p -> entity.setOrgUnitId(p.getOrgUnitId()));
        }
        if (request.getWaterwayId() != null)
            entity.setWaterwayId(request.getWaterwayId());
        if (request.getClassification() != null)
            entity.setClassification(request.getClassification());
        if (request.getProvinceId() != null)
            entity.setProvinceId(request.getProvinceId());
        if (request.getDetailedLocation() != null)
            entity.setDetailedLocation(request.getDetailedLocation());
        if (request.getOperationalStatus() != null)
            entity.setOperationalStatus(request.getOperationalStatus());
        if (request.getOperatingOrgId() != null)
            entity.setOperatingOrgId(request.getOperatingOrgId());
        if (request.getCurrentWaterDepth() != null)
            entity.setCurrentWaterDepth(request.getCurrentWaterDepth());
        if (request.getBottomElevationDesign() != null)
            entity.setBottomElevationDesign(request.getBottomElevationDesign());
        if (request.getMaxVesselDWT() != null)
            entity.setMaxVesselDWT(request.getMaxVesselDWT());
        if (request.getPlannedVesselDWT() != null)
            entity.setPlannedVesselDWT(request.getPlannedVesselDWT());
        if (request.getLastInspectionDate() != null)
            entity.setLastInspectionDate(request.getLastInspectionDate());
        if (request.getNextInspectionDate() != null)
            entity.setNextInspectionDate(request.getNextInspectionDate());
        if (request.getOperationExpiryDate() != null)
            entity.setOperationExpiryDate(request.getOperationExpiryDate());
        if (request.getDesignCapacity() != null)
            entity.setDesignCapacity(request.getDesignCapacity());
        if (request.getActiveBuoyBerthCount() != null)
            entity.setActiveBuoyBerthCount(request.getActiveBuoyBerthCount());
        if (request.getPublishedBuoyBerthCount() != null)
            entity.setPublishedBuoyBerthCount(request.getPublishedBuoyBerthCount());
        if (request.getUnderInvestmentBuoyBerthCount() != null)
            entity.setUnderInvestmentBuoyBerthCount(request.getUnderInvestmentBuoyBerthCount());
        if (request.getCargoThroughput() != null)
            entity.setCargoThroughput(request.getCargoThroughput());
        if (request.getOpeningAnnouncementDate() != null)
            entity.setOpeningAnnouncementDate(request.getOpeningAnnouncementDate());
        if (request.getPublicDecision() != null)
            entity.setPublicDecision(request.getPublicDecision());
        if (request.getInvestmentAgreement() != null)
            entity.setInvestmentAgreement(request.getInvestmentAgreement());
        if (request.getMooringWaterAreaScope() != null)
            entity.setMooringWaterAreaScope(request.getMooringWaterAreaScope());
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

        UUID operatorId = SecurityUtils.getCurrentUserId();
        String actorId = operatorId != null ? operatorId.toString() : "system";

        entity.setUpdatedAt(LocalDateTime.now());
        if (operatorId != null) {
            entity.setUpdatedBy(operatorId);
        }
        BuoyBerth saved = buoyBerthRepository.saveAndFlush(entity);
        persistGis(saved, request.getGeometryType(), coordinates,
                request.getLongitude(), request.getLatitude());

        // Chỉ ghi lịch sử khi hồ sơ đã được duyệt (chuẩn Cầu cảng / Cảng biển).
        if (wasApproved) {
            if (coordinates != null && !coordinates.trim().isEmpty()) {
                GisGeometryType geomType = request.getGeometryType() != null
                        ? request.getGeometryType() : GisGeometryType.POINT;
                String newWkt = coordinates.trim();
                boolean wktChanged = oldWkt == null || !newWkt.equals(oldWkt.trim());
                if (wktChanged) {
                    changeHistoryService.insertChangeRecord("BuoyBerth", saved.getId(), "Tọa độ GIS",
                            (oldWkt == null || oldWkt.trim().isEmpty()) ? null : oldWkt.trim(),
                            newWkt, actorId);
                }
                boolean typeChanged = request.getGeometryType() != null && oldGeomType != geomType;
                if (typeChanged) {
                    changeHistoryService.insertChangeRecord("BuoyBerth", saved.getId(), "Loại đối tượng GIS",
                            oldGeomType != null ? geometryTypeLabel(oldGeomType) : null,
                            geometryTypeLabel(geomType), actorId);
                }
            }

            changeHistoryService.recordChanges("BuoyBerth", saved.getId().toString(),
                    actorId, snapshot, saved);
        }
        evictAfterCommit();

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public BuoyBerthResponse getById(UUID id) {
        BuoyBerth entity = buoyBerthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến phao với id: " + id));
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public Page<BuoyBerthResponse> findAll(int page, int size, UUID orgUnitId,
                                           String search, String buoyBerthCode, String buoyBerthName,
                                           UUID portId, UUID waterwayId, String classification,
                                           Integer provinceId,
                                           String operationalStatus, String approvalStatus,
                                           String updatedFrom, String updatedTo) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc(EntityFields.UPDATED_AT),
                Sort.Order.desc(EntityFields.CREATED_AT), Sort.Order.asc(EntityFields.ID)));
        ApprovalStatus approvalEnum = approvalStatus != null ? ApprovalStatus.fromString(approvalStatus) : null;
        OperationalStatus statusEnum = operationalStatus != null ? OperationalStatus.fromString(operationalStatus) : null;
        java.time.LocalDateTime updatedFromDt = parseLocalDateTime(updatedFrom);
        java.time.LocalDateTime updatedToDt = parseUpdatedTo(updatedTo);
        // Mở rộng cây đơn vị: chọn đơn vị cha → gồm cả bến phao của toàn bộ đơn vị con (hậu duệ)
        boolean includeAll = orgUnitId == null;
        List<UUID> orgUnitIds = orgUnitId != null ? orgUnitScopeService.resolveSubtreeIds(orgUnitId) : List.of();
        String searchTrim = search != null ? search.trim() : null;
        Page<BuoyBerth> result = buoyBerthRepository.searchBuoyBerths(
                includeAll, orgUnitIds,
                searchTrim, buoyBerthCode, buoyBerthName, portId,
                waterwayId, classification, provinceId,
                approvalEnum, statusEnum, false,
                updatedFromDt, updatedToDt,
                pageable);

        // Batch resolve tên cảng biển cha để tránh truy vấn từng bản ghi
        java.util.List<UUID> parentIds = result.getContent().stream()
                .map(BuoyBerth::getPortId)
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
        BuoyBerth entity = buoyBerthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến phao với id: " + id));
        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT) {
            throw new IllegalArgumentException("Chỉ được xóa bến phao ở trạng thái Nháp");
        }
        entity.softDelete(SecurityUtils.getCurrentUserId());
        buoyBerthRepository.save(entity);
        // Không ghi lịch sử khi xóa bản ghi Nháp (chuẩn Cảng biển / Bến cảng / Cầu cảng).
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        evictAfterCommit();
        log.info("Soft-deleted BuoyBerth [{}] code={}", entity.getId(), entity.getBuoyBerthCode());
    }

    public String generateBuoyBerthCode(UUID portId) {
        Port port = portRepository.findById(portId)
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + portId));

        String portCode = port.getPortCode();
        String prefix = portCode + "-BP-";
        List<BuoyBerth> existing = buoyBerthRepository.findByPortIdAndDeletedAtIsNull(portId);
        int maxNum = 0;
        for (BuoyBerth a : existing) {
            if (a.getBuoyBerthCode() != null && a.getBuoyBerthCode().startsWith(prefix)) {
                try {
                    int n = Integer.parseInt(a.getBuoyBerthCode().substring(prefix.length()));
                    if (n > maxNum) maxNum = n;
                } catch (NumberFormatException ignored) {}
            }
        }
        int nextNum = maxNum + 1;
        String candidate = prefix + String.format("%03d", nextNum);
        while (buoyBerthRepository.existsByBuoyBerthCode(candidate)) {
            nextNum++;
            candidate = prefix + String.format("%03d", nextNum);
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

        // Snapshot sau khi upload
        List<Attachment> allAtts = attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc(entityType, entityId);
        String newFilesSummary = allAtts.stream()
                .map(Attachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));

        // Ghi lịch sử tải lên theo chuẩn Cầu cảng / Cảng biển
        if (!savedAttachments.isEmpty()) {
            String mergedNames = savedAttachments.stream().map(Attachment::getFileName).collect(java.util.stream.Collectors.joining(", "));
            recordBuoyBerthAttachmentHistory(entityId, oldFilesSummary, newFilesSummary, mergedNames,
                    InfrastructureHistoryStatus.ATTACHMENT_UPLOADED, userId, skipHistory);
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
        // Lấy tên file TRƯỚC khi xóa để ghi lịch sử (ATTACHMENT_DELETED).
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

        // Ghi lịch sử xóa file theo chuẩn Cầu cảng / Cảng biển
        recordBuoyBerthAttachmentHistory(entityId, oldFilesSummary, newFilesSummary, fileName,
                InfrastructureHistoryStatus.ATTACHMENT_DELETED, userId, skipHistory);
    }

    public void deleteAttachment(String entityType, UUID entityId, UUID attachmentId, UUID userId) {
        deleteAttachment(entityType, entityId, attachmentId, userId, null);
    }

    /**
     * Ghi lịch sử thay đổi file đính kèm của Bến phao theo chuẩn snapshot bảng — chỉ khi bến phao đã duyệt.
     */
    private void recordBuoyBerthAttachmentHistory(UUID buoyBerthId, String oldFilesSummary, String newFilesSummary,
                                                  String affectedFileName, InfrastructureHistoryStatus status, UUID userId, Boolean skipHistory) {
        try {
            if (Boolean.TRUE.equals(skipHistory)) {
                return;
            }
            if (buoyBerthId == null || historyRepository == null) {
                return;
            }
            BuoyBerth buoyBerth = buoyBerthRepository.findById(buoyBerthId).orElse(null);
            if (buoyBerth == null || (buoyBerth.getApprovalStatus() != ApprovalStatus.APPROVED
                    && buoyBerth.getApprovalStatus() != ApprovalStatus.APPROVED_LEVEL2)) {
                return;
            }
            // Guard: Thêm mới không ghi lịch sử đính kèm
            if (buoyBerth.getCreatedAt() != null && buoyBerth.getUpdatedAt() != null
                    && (buoyBerth.getCreatedAt().isEqual(buoyBerth.getUpdatedAt())
                    || java.time.Duration.between(buoyBerth.getCreatedAt(), buoyBerth.getUpdatedAt()).abs().toSeconds() <= 2)) {
                return;
            }

            String oldVal = (oldFilesSummary == null || oldFilesSummary.isBlank()) ? null : oldFilesSummary.trim();
            String newVal = (newFilesSummary == null || newFilesSummary.isBlank()) ? null : newFilesSummary.trim();
            if (java.util.Objects.equals(oldVal, newVal)) {
                return;
            }

            boolean uploaded = status == InfrastructureHistoryStatus.ATTACHMENT_UPLOADED;
            UUID actorId = userId != null ? userId : SecurityUtils.getCurrentUserId();
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(buoyBerthId)
                    .refType(InfrastructureType.BUOY_BERTH)
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(status)
                    .approvedBy(actorId)
                    .approvedDate(LocalDateTime.now())
                    .reason((uploaded ? "Tải lên tài liệu đính kèm: " : "Xóa tài liệu đính kèm: ") + affectedFileName)
                    .changedField("File đính kèm")
                    .previousValue(oldVal)
                    .newValue(newVal)
                    .build());
            log.info("[BuoyBerthService] Đã ghi lịch sử {} file đính kèm của Bến phao [{}]: [{}] -> [{}]",
                    uploaded ? "tải lên" : "xóa", buoyBerthId, oldVal, newVal);
        } catch (Exception e) {
            log.warn("Không thể ghi lịch sử đính kèm cho bến phao {}: {}", buoyBerthId, e.getMessage());
        }
    }

    private void recordBuoyBerthAttachmentHistory(UUID buoyBerthId, String oldFilesSummary, String newFilesSummary,
                                                  String affectedFileName, InfrastructureHistoryStatus status, UUID userId) {
        recordBuoyBerthAttachmentHistory(buoyBerthId, oldFilesSummary, newFilesSummary, affectedFileName, status, userId, null);
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

    public BuoyBerthResponse toResponse(BuoyBerth entity) {
        return toResponse(entity, null);
    }

    public BuoyBerthResponse toResponse(BuoyBerth entity, String preResolvedPortName) {
        if (entity == null) return null;

        BuoyBerthResponse response = BuoyBerthResponse.builder()
                .id(entity.getId())
                // .securityLevel(entity.getSecurityLevel())
                .buoyBerthCode(entity.getBuoyBerthCode())
                .buoyBerthName(entity.getBuoyBerthName())
                .portId(entity.getPortId())
                .portName(preResolvedPortName != null ? preResolvedPortName : portCacheService.getName(entity.getPortId()))
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))
                .waterwayId(entity.getWaterwayId())
                .classification(entity.getClassification())
                .provinceId(entity.getProvinceId())
                .detailedLocation(entity.getDetailedLocation())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
                .operatingOrgId(entity.getOperatingOrgId())
                .operatingOrgName(resolveOperatingOrgName(entity.getOperatingOrgId()))
                // Technical & survey fields
                .currentWaterDepth(entity.getCurrentWaterDepth())
                .bottomElevationDesign(entity.getBottomElevationDesign())
                .maxVesselDWT(entity.getMaxVesselDWT())
                .plannedVesselDWT(entity.getPlannedVesselDWT())
                .lastInspectionDate(entity.getLastInspectionDate())
                .nextInspectionDate(entity.getNextInspectionDate())
                .operationExpiryDate(entity.getOperationExpiryDate())
                .designCapacity(entity.getDesignCapacity())
                .activeBuoyBerthCount(entity.getActiveBuoyBerthCount())
                .publishedBuoyBerthCount(entity.getPublishedBuoyBerthCount())
                .underInvestmentBuoyBerthCount(entity.getUnderInvestmentBuoyBerthCount())
                .cargoThroughput(entity.getCargoThroughput())
                // Publication fields
                .openingAnnouncementDate(entity.getOpeningAnnouncementDate())
                .publicDecision(entity.getPublicDecision())
                .investmentAgreement(entity.getInvestmentAgreement())
                .mooringWaterAreaScope(entity.getMooringWaterAreaScope())
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

        return response;
    }

    private void parseLatLng(String coordinates, BuoyBerthResponse response) {
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

    private String resolveOperatingOrgName(UUID operatingOrgId) {
        if (operatingOrgId == null) return null;
        return operatingUnitRepository.findById(operatingOrgId)
                .map(OperatingUnit::getName)
                .orElse(null);
    }

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT)
            return GisSpatialObjectType.POINT_OTHER;
        if (geomType == GisGeometryType.LINE)
            return GisSpatialObjectType.LINE_OTHER;
        return GisSpatialObjectType.POLYGON_BUOY_BERTH;
    }

    private void persistGis(BuoyBerth saved, GisGeometryType geometryType, String coordinates,
                            BigDecimal longitude, BigDecimal latitude) {
        String wkt = coordinates;
        if ((wkt == null || wkt.trim().isEmpty()) && longitude != null && latitude != null) {
            wkt = "POINT(" + longitude + " " + latitude + ")";
        }
        if (wkt != null && !wkt.trim().isEmpty()) {
            GisGeometryType geomType = geometryType != null ? geometryType : GisGeometryType.POINT;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getSpatialId(), saved.getBuoyBerthName(), "BUOY_BERTH_" + saved.getBuoyBerthCode(),
                    geomType, objType, wkt, saved.getId(),
                    InfrastructureType.BUOY_BERTH);
            saved.setSpatialId(spatialObj.getId());
            buoyBerthRepository.save(saved);
        } else if (saved.getSpatialId() != null) {
            gisSpatialObjectService.delete(saved.getSpatialId());
            saved.setSpatialId(null);
            buoyBerthRepository.save(saved);
        }
    }

    private void applySaveAction(BuoyBerth entity, String action) {
        String actorId = SecurityUtils.getCurrentUserId() != null
                ? SecurityUtils.getCurrentUserId().toString() : null;
        switch (action) {
            case "DRAFT":
                entity.setApprovalStatus(ApprovalStatus.DRAFT);
                break;
            case "SUBMIT":
                entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
                entity.setSubmittedForApprovalAt(LocalDateTime.now());
                entity.setSubmittedForApprovalBy(actorId);
                entity.setPortAuthorityApprovedAt(null);
                entity.setPortAuthorityApprovedBy(null);
                entity.setPortAuthorityApprovalContent(null);
                entity.setDepartmentApprovedAt(null);
                entity.setDepartmentApprovedBy(null);
                entity.setDepartmentApprovalContent(null);
                entity.setRejectionReason(null);
                break;
            case "APPROVED":
            case "SAVE_AND_APPROVE":
                entity.setApprovalStatus(ApprovalStatus.APPROVED);
                entity.setSubmittedForApprovalAt(LocalDateTime.now());
                entity.setSubmittedForApprovalBy(actorId);
                entity.setPortAuthorityApprovedAt(LocalDateTime.now());
                entity.setPortAuthorityApprovedBy(actorId);
                entity.setDepartmentApprovedAt(LocalDateTime.now());
                entity.setDepartmentApprovedBy(actorId);
                break;
            default:
                entity.setApprovalStatus(ApprovalStatus.DRAFT);
        }
    }

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
     * Chụp snapshot đầy đủ để ghi lịch sử thay đổi (chuẩn Bến cảng / Cầu cảng).
     */
    private BuoyBerth buildSnapshot(BuoyBerth e) {
        return BuoyBerth.builder()
                // .securityLevel(e.getSecurityLevel())
                .buoyBerthCode(e.getBuoyBerthCode())
                .buoyBerthName(e.getBuoyBerthName())
                .portId(e.getPortId())
                .orgUnitId(e.getOrgUnitId())
                .waterwayId(e.getWaterwayId())
                .classification(e.getClassification())
                .provinceId(e.getProvinceId())
                .detailedLocation(e.getDetailedLocation())
                .operationalStatus(e.getOperationalStatus())
                .approvalStatus(e.getApprovalStatus())
                .operatingOrgId(e.getOperatingOrgId())
                .currentWaterDepth(e.getCurrentWaterDepth())
                .bottomElevationDesign(e.getBottomElevationDesign())
                .maxVesselDWT(e.getMaxVesselDWT())
                .plannedVesselDWT(e.getPlannedVesselDWT())
                .lastInspectionDate(e.getLastInspectionDate())
                .nextInspectionDate(e.getNextInspectionDate())
                .operationExpiryDate(e.getOperationExpiryDate())
                .designCapacity(e.getDesignCapacity())
                .activeBuoyBerthCount(e.getActiveBuoyBerthCount())
                .publishedBuoyBerthCount(e.getPublishedBuoyBerthCount())
                .underInvestmentBuoyBerthCount(e.getUnderInvestmentBuoyBerthCount())
                .cargoThroughput(e.getCargoThroughput())
                .openingAnnouncementDate(e.getOpeningAnnouncementDate())
                .publicDecision(e.getPublicDecision())
                .investmentAgreement(e.getInvestmentAgreement())
                .mooringWaterAreaScope(e.getMooringWaterAreaScope())
                .mapSymbolId(e.getMapSymbolId())
                .coordinateSystem(e.getCoordinateSystem())
                .displayRule(e.getDisplayRule())
                .spatialId(e.getSpatialId())
                .submittedForApprovalAt(e.getSubmittedForApprovalAt())
                .submittedForApprovalBy(e.getSubmittedForApprovalBy())
                .portAuthorityApprovedAt(e.getPortAuthorityApprovedAt())
                .portAuthorityApprovedBy(e.getPortAuthorityApprovedBy())
                .portAuthorityApprovalContent(e.getPortAuthorityApprovalContent())
                .departmentApprovedAt(e.getDepartmentApprovedAt())
                .departmentApprovedBy(e.getDepartmentApprovedBy())
                .departmentApprovalContent(e.getDepartmentApprovalContent())
                .rejectionReason(e.getRejectionReason())
                .build();
    }

    public void evictAfterCommit() {
        portCacheService.evictAfterCommit();
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
