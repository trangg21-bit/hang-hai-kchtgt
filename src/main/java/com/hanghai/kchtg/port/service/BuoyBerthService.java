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

        String code = generateBuoyBerthCode(request.getPortId());

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

        BuoyBerth saved = buoyBerthRepository.save(entity);
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

        // Lịch sử GIS theo chuẩn Cảng biển — xác định trạng thái duyệt TRƯỚC khi mutation
        // (chỉ ghi lịch sử khi hồ sơ đã duyệt: APPROVED / APPROVED_LEVEL2).
        boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;
        String oldWkt = null;
        GisGeometryType oldGeomType = null;
        if (entity.getSpatialId() != null) {
            GisSpatialObject oldSpatial = gisSpatialObjectService.findById(entity.getSpatialId()).orElse(null);
            if (oldSpatial != null) {
                oldWkt = oldSpatial.getCoordinates();
                oldGeomType = oldSpatial.getGeometryType();
            }
        }

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null
                && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        Map<String, String> previousValues = new HashMap<>();
        Map<String, String> newValues = new HashMap<>();
        String prevApprovalLabel = approvalLabel(entity.getApprovalStatus());
        // captureChange(previousValues, newValues, "securityLevel", entity.getSecurityLevel(), request.getSecurityLevel());
        captureChange(previousValues, newValues, "buoyBerthName", entity.getBuoyBerthName(), request.getBuoyBerthName());
        captureChange(previousValues, newValues, "portId", entity.getPortId(), request.getPortId());
        captureChange(previousValues, newValues, "waterwayId", entity.getWaterwayId(), request.getWaterwayId());
        captureChange(previousValues, newValues, "classification", entity.getClassification(), request.getClassification());
        captureChange(previousValues, newValues, "provinceId", entity.getProvinceId(), request.getProvinceId());
        captureChange(previousValues, newValues, "detailedLocation", entity.getDetailedLocation(), request.getDetailedLocation());
        captureChange(previousValues, newValues, "operationalStatus", entity.getOperationalStatus(), request.getOperationalStatus());
        captureChange(previousValues, newValues, "operatingOrgId", entity.getOperatingOrgId(), request.getOperatingOrgId());
        captureChange(previousValues, newValues, "currentWaterDepth", entity.getCurrentWaterDepth(), request.getCurrentWaterDepth());
        captureChange(previousValues, newValues, "bottomElevationDesign", entity.getBottomElevationDesign(), request.getBottomElevationDesign());
        captureChange(previousValues, newValues, "maxVesselDWT", entity.getMaxVesselDWT(), request.getMaxVesselDWT());
        captureChange(previousValues, newValues, "plannedVesselDWT", entity.getPlannedVesselDWT(), request.getPlannedVesselDWT());
        captureChange(previousValues, newValues, "lastInspectionDate", entity.getLastInspectionDate(), request.getLastInspectionDate());
        captureChange(previousValues, newValues, "nextInspectionDate", entity.getNextInspectionDate(), request.getNextInspectionDate());
        captureChange(previousValues, newValues, "operationExpiryDate", entity.getOperationExpiryDate(), request.getOperationExpiryDate());
        captureChange(previousValues, newValues, "designCapacity", entity.getDesignCapacity(), request.getDesignCapacity());
        captureChange(previousValues, newValues, "activeBuoyBerthCount", entity.getActiveBuoyBerthCount(), request.getActiveBuoyBerthCount());
        captureChange(previousValues, newValues, "publishedBuoyBerthCount", entity.getPublishedBuoyBerthCount(), request.getPublishedBuoyBerthCount());
        captureChange(previousValues, newValues, "underInvestmentBuoyBerthCount", entity.getUnderInvestmentBuoyBerthCount(), request.getUnderInvestmentBuoyBerthCount());
        captureChange(previousValues, newValues, "cargoThroughput", entity.getCargoThroughput(), request.getCargoThroughput());
        captureChange(previousValues, newValues, "openingAnnouncementDate", entity.getOpeningAnnouncementDate(), request.getOpeningAnnouncementDate());
        captureChange(previousValues, newValues, "publicDecision", entity.getPublicDecision(), request.getPublicDecision());
        captureChange(previousValues, newValues, "investmentAgreement", entity.getInvestmentAgreement(), request.getInvestmentAgreement());
        captureChange(previousValues, newValues, "mooringWaterAreaScope", entity.getMooringWaterAreaScope(), request.getMooringWaterAreaScope());
        captureChange(previousValues, newValues, "mapSymbolId", entity.getMapSymbolId(), request.getMapSymbolId());
        captureChange(previousValues, newValues, "coordinateSystem", entity.getCoordinateSystem(), request.getCoordinateSystem());
        captureChange(previousValues, newValues, "displayRule", entity.getDisplayRule(), request.getDisplayRule());

        // if (request.getSecurityLevel() != null) {
        //     RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "buoyberth",
        //             SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
        //     entity.setSecurityLevel(request.getSecurityLevel());
        // }
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

        if (request.getSaveAction() != null) {
            applySaveAction(entity, request.getSaveAction());
        } else if (entity.getApprovalStatus() == ApprovalStatus.APPROVED) {
            // Khi chỉnh sửa: "Được phê duyệt" → quay về "Chờ cảng vụ duyệt" (APPROVED_LEVEL1)
            entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        }

        BuoyBerth saved = buoyBerthRepository.save(entity);
        persistGis(saved, request.getGeometryType(), coordinates,
                request.getLongitude(), request.getLatitude());
        String newApprovalLabel = approvalLabel(saved.getApprovalStatus());
        if (!Objects.equals(prevApprovalLabel, newApprovalLabel)) {
            previousValues.put("approvalStatus", prevApprovalLabel);
            newValues.put("approvalStatus", newApprovalLabel);
        }
        if (!previousValues.isEmpty()) {
            InfrastructureHistoryStatus histStatus = InfrastructureHistoryStatus.UPDATED;
            if (previousValues.size() == 1 && previousValues.containsKey("approvalStatus")) {
                if (saved.getApprovalStatus() == ApprovalStatus.APPROVED) histStatus = InfrastructureHistoryStatus.APPROVED;
                else if (saved.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL1) histStatus = InfrastructureHistoryStatus.PROPOSED;
                else if (saved.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2) histStatus = InfrastructureHistoryStatus.UNDER_REVIEW;
                else if (saved.getApprovalStatus() == ApprovalStatus.DRAFT) histStatus = InfrastructureHistoryStatus.DRAFT_SAVED;
            }
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(saved.getId())
                    .refType(InfrastructureType.BUOY_BERTH)
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(histStatus)
                    .approvedBy(SecurityUtils.getCurrentUserId())
                    .reason("Cập nhật thông tin bến phao")
                    .changedField(String.join(", ", previousValues.keySet()))
                    .previousValue(formatHistoryPairs(previousValues))
                    .newValue(formatHistoryPairs(newValues))
                    .build());
        }

        // Hồ sơ đã duyệt bị chỉnh sửa GIS → ghi 2 dòng lịch sử đọc được:
        // "Tọa độ GIS" (WKT cũ → WKT mới) + "Loại đối tượng GIS" (nhãn cũ → nhãn mới),
        // refType BUOY_BERTH, actor = user thật (không bao giờ chuỗi "system").
        if (wasApproved && coordinates != null && !coordinates.trim().isEmpty()) {
            String newWkt = coordinates.trim();
            if (oldWkt == null || !newWkt.equals(oldWkt.trim())) {
                historyRepository.save(InfrastructureHistory.builder()
                        .refId(saved.getId())
                        .refType(InfrastructureType.BUOY_BERTH)
                        .approvalLevel(ApprovalLevel.LEVEL_0)
                        .status(InfrastructureHistoryStatus.UPDATED)
                        .approvedBy(SecurityUtils.getCurrentUserId())
                        .changedField("Tọa độ GIS")
                        .previousValue((oldWkt == null || oldWkt.trim().isEmpty()) ? "Chưa có" : oldWkt.trim())
                        .newValue(newWkt)
                        .build());
            }
            if (request.getGeometryType() != null) {
                GisGeometryType newGeomType = request.getGeometryType();
                if (oldGeomType != newGeomType) {
                    historyRepository.save(InfrastructureHistory.builder()
                            .refId(saved.getId())
                            .refType(InfrastructureType.BUOY_BERTH)
                            .approvalLevel(ApprovalLevel.LEVEL_0)
                            .status(InfrastructureHistoryStatus.UPDATED)
                            .approvedBy(SecurityUtils.getCurrentUserId())
                            .changedField("Loại đối tượng GIS")
                            .previousValue(oldGeomType != null ? geometryTypeLabel(oldGeomType) : "Chưa có")
                            .newValue(geometryTypeLabel(newGeomType))
                            .build());
                }
            }
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
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("submittedForApprovalAt"),
                Sort.Order.desc(EntityFields.CREATED_AT), Sort.Order.asc(EntityFields.ID)));
        ApprovalStatus approvalEnum = approvalStatus != null ? ApprovalStatus.fromString(approvalStatus) : null;
        OperationalStatus statusEnum = operationalStatus != null ? OperationalStatus.fromString(operationalStatus) : null;
        java.time.LocalDateTime updatedFromDt = parseLocalDateTime(updatedFrom);
        java.time.LocalDateTime updatedToDt = parseLocalDateTime(updatedTo);
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
        historyRepository.save(InfrastructureHistory.builder()
                .refId(entity.getId())
                .refType(InfrastructureType.BUOY_BERTH)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(InfrastructureHistoryStatus.DELETED)
                .approvedBy(SecurityUtils.getCurrentUserId())
                .reason("Xóa bến phao")
                .changedField("Trạng thái phê duyệt")
                .newValue("Trạng thái phê duyệt=Đã xóa")
                .build());
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
        return prefix + String.format("%03d", maxNum + 1);
    }

    // ── Attachment methods ──────────────────────────────────────────────

    @Transactional
    public List<AttachmentDto> uploadAttachments(String entityType, UUID entityId, List<MultipartFile> files, UUID userId) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Không có file nào được chọn để tải lên");
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

        // Ghi lịch sử tải lên theo chuẩn Cảng biển — chỉ khi bến phao đã duyệt
        // (ATTACHMENT_UPLOADED, refType BUOY_BERTH, actor = user thật).
        BuoyBerth buoyBerth = buoyBerthRepository.findById(entityId).orElse(null);
        if (buoyBerth != null
                && (buoyBerth.getApprovalStatus() == ApprovalStatus.APPROVED
                    || buoyBerth.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2)) {
            for (Attachment saved : savedAttachments) {
                String name = saved.getFileName() != null ? saved.getFileName() : "không rõ tên";
                historyRepository.save(InfrastructureHistory.builder()
                        .refId(entityId)
                        .refType(InfrastructureType.BUOY_BERTH)
                        .approvalLevel(ApprovalLevel.LEVEL_0)
                        .status(InfrastructureHistoryStatus.ATTACHMENT_UPLOADED)
                        .approvedBy(SecurityUtils.getCurrentUserId())
                        .reason("Tải lên tài liệu đính kèm: " + name)
                        .changedField("Tài liệu đính kèm")
                        .previousValue("—")
                        .newValue(name)
                        .build());
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
        // Lấy tên file TRƯỚC khi xóa để ghi lịch sử (ATTACHMENT_DELETED).
        String fileName = attachment.getFileName();
        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath()));
        } catch (Exception e) {
            log.warn("Không thể xóa file: {}", attachment.getFilePath(), e);
        }
        attachmentRepository.delete(attachment);

        // Chỉ ghi lịch sử xóa file khi bến phao đã duyệt (refType BUOY_BERTH, actor = user thật).
        BuoyBerth buoyBerth = buoyBerthRepository.findById(entityId).orElse(null);
        if (buoyBerth != null
                && (buoyBerth.getApprovalStatus() == ApprovalStatus.APPROVED
                    || buoyBerth.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2)) {
            String name = fileName != null ? fileName : "không rõ tên";
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(entityId)
                    .refType(InfrastructureType.BUOY_BERTH)
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(InfrastructureHistoryStatus.ATTACHMENT_DELETED)
                    .approvedBy(SecurityUtils.getCurrentUserId())
                    .reason("Xóa tài liệu đính kèm: " + name)
                    .changedField("Tài liệu đính kèm")
                    .previousValue(name)
                    .newValue("—")
                    .build());
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

    private void persistGis(BuoyBerth saved, GisGeometryType geometryType, String coordinates,
                            BigDecimal longitude, BigDecimal latitude) {
        String wkt = coordinates;
        if ((wkt == null || wkt.trim().isEmpty()) && longitude != null && latitude != null) {
            wkt = "POINT(" + longitude + " " + latitude + ")";
        }
        if (wkt != null && !wkt.trim().isEmpty()) {
            GisGeometryType geomType = geometryType != null ? geometryType : GisGeometryType.POINT;
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getSpatialId(), saved.getBuoyBerthName(), "BUOY_BERTH_" + saved.getBuoyBerthCode(),
                    geomType, GisSpatialObjectType.POLYGON_BUOY_BERTH, wkt, saved.getId(),
                    InfrastructureType.BUOY_BERTH);
            saved.setSpatialId(spatialObj.getId());
            buoyBerthRepository.save(saved);
        }
    }

    private void applySaveAction(BuoyBerth entity, String action) {
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

    /** Nhãn hiển thị loại hình GIS theo chuẩn VTS CHK (dùng cho lịch sử thay đổi). */
    private static String geometryTypeLabel(GisGeometryType type) {
        if (type == null) return "Chưa có";
        return switch (type) {
            case POINT -> "Đối tượng điểm";
            case LINE -> "Đối tượng đường";
            case POLYGON -> "Đối tượng vùng";
        };
    }

    private static String approvalLabel(ApprovalStatus st) {
        if (st == null) return "";
        return switch (st) {
            case APPROVED_LEVEL1 -> "Chờ phê duyệt cấp Cảng vụ/Chi cục";
            case APPROVED_LEVEL2 -> "Chờ phê duyệt cấp cục";
            case APPROVED -> "Đã phê duyệt";
            case REJECTED_LEVEL1 -> "Từ chối cấp Cảng vụ/Chi cục";
            case REJECTED_LEVEL2 -> "Từ chối cấp cục";
            case DRAFT -> "Lưu tạm";
            default -> st.getLabel();
        };
    }

    private static void captureChange(Map<String, String> prev, Map<String, String> next,
                                      String field, Object oldVal, Object newVal) {
        if (newVal == null) return;
        String o = oldVal == null ? "(null)" : String.valueOf(oldVal);
        String n = String.valueOf(newVal);
        if (Objects.equals(o, n)) return;
        prev.put(field, o);
        next.put(field, n);
    }

    private static String formatHistoryPairs(Map<String, String> m) {
        return m.entrySet().stream()
                .map(e -> e.getKey() + "=" + e.getValue())
                .collect(Collectors.joining("; "));
    }

    public void evictAfterCommit() {
        portCacheService.evictAfterCommit();
    }

    private LocalDateTime parseLocalDateTime(String dt) {
        if (dt == null || dt.isBlank()) return null;
        try { return LocalDateTime.parse(dt); }
        catch (Exception e) { return null; }
    }
}
