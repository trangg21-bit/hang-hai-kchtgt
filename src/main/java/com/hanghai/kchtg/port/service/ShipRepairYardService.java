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
import com.hanghai.kchtg.port.dto.shiprepairyard.AttachmentDto;
import com.hanghai.kchtg.port.dto.shiprepairyard.CreateShipRepairYardRequest;
import com.hanghai.kchtg.port.dto.shiprepairyard.ShipRepairYardResponse;
import com.hanghai.kchtg.port.dto.shiprepairyard.UpdateShipRepairYardRequest;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.entity.Pier;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.entity.ShipRepairYard;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.repository.ShipRepairYardRepository;
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

import java.lang.reflect.Field;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for ShipRepairYard (Cơ sở sửa chữa, đóng tàu) — parity với BuoyBerthService.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShipRepairYardService {

    private final ShipRepairYardRepository shipRepairYardRepository;
    private final PortRepository portRepository;
    private final PierRepository pierRepository;
    private final UserResolverService userResolverService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final PortCacheService portCacheService;
    private final AttachmentRepository attachmentRepository;
    private final UserRepository userRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final ChangeHistoryService changeHistoryService;
    private final InfrastructureHistoryRepository historyRepository;

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    @Transactional
    public ShipRepairYardResponse create(CreateShipRepairYardRequest request) {
        Port port = portRepository.findById(request.getPortId())
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));

        if (port.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new IllegalArgumentException("Không thể tạo cơ sở sửa chữa, đóng tàu: cảng biển cha phải ở trạng thái được phê duyệt");
        }

        // RecordSecurityLevel secLevel = request.getSecurityLevel() != null ? request.getSecurityLevel()
        //         : RecordSecurityLevel.NORMAL;
        // RecordSecurityLevel.validateAssignment(secLevel, "shiprepairyard", SecurityUtils.getCurrentUserPermissions(),
        //         SecurityUtils.isElevatedAdministrator());

        String code = generateShipRepairYardCode(request.getPortId());

        ShipRepairYard entity = ShipRepairYard.builder()
        // .securityLevel(secLevel)
                .shipRepairYardCode(code)
                .shipRepairYardName(request.getShipRepairYardName())
                .portId(request.getPortId())
                .pierId(request.getPierId())
                .orgUnitId(port.getOrgUnitId())
                .provinceId(request.getProvinceId())
                .detailedLocation(request.getDetailedLocation())
                .operationalStatus(request.getOperationalStatus())
                .usageFunction(request.getUsageFunction())
                .workshopArea(request.getWorkshopArea())
                .vesselType(request.getVesselType())
                .vesselDwt(request.getVesselDwt())
                .businessType(request.getBusinessType())
                .activity(request.getActivity())
                .slipwayCount(request.getSlipwayCount())
                .remarks(request.getRemarks())
                .mapSymbolId(request.getMapSymbolId())
                .coordinateSystem(request.getCoordinateSystem())
                .displayRule(request.getDisplayRule())
                .build();

        String action = request.getSaveAction() != null ? request.getSaveAction() : "DRAFT";
        applySaveAction(entity, action);

        ShipRepairYard saved = shipRepairYardRepository.save(entity);
        persistGis(saved, request.getGeometryType(), request.getCoordinates(),
                request.getLongitude(), request.getLatitude());
        // [TẠM TẮT GHI LỊCH SỬ] Bảng change_logs đã bị V20260825162500 drop; không ghi lịch sử (chuẩn Khu neo đậu)
        evictAfterCommit();

        return toResponse(saved);
    }

    @Transactional
    public ShipRepairYardResponse update(UpdateShipRepairYardRequest request) {
        ShipRepairYard entity = shipRepairYardRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cơ sở sửa chữa, đóng tàu với id: " + request.getId()));

        // ── Lịch sử thay đổi (chuẩn Cảng biển PortService.update) ──────
        // Chụp preImage (trạng thái cũ) TRƯỚC khi mutate. Chỉ ghi lịch sử khi hồ sơ
        // ĐÃ duyệt (APPROVED / APPROVED_LEVEL2) trước lần sửa này.
        boolean wasApproved = entity.getApprovalStatus() == ApprovalStatus.APPROVED
                || entity.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;
        ShipRepairYard preImage = snapshotHistoryFields(entity);
        // WKT + loại hình GIS cũ phải đọc TRƯỚC khi persistGis ghi đè spatial object.
        String oldWkt = null;
        GisGeometryType oldGeomType = null;
        if (preImage.getSpatialId() != null) {
            GisSpatialObject oldSpatial = gisSpatialObjectService.findById(preImage.getSpatialId()).orElse(null);
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

        // if (request.getSecurityLevel() != null) {
        //     RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "shiprepairyard",
        //             SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
        //     entity.setSecurityLevel(request.getSecurityLevel());
        // }
        if (request.getShipRepairYardName() != null)
            entity.setShipRepairYardName(request.getShipRepairYardName());
        if (request.getPortId() != null) {
            Port parent = portRepository.findById(request.getPortId())
                    .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));
            entity.setPortId(request.getPortId());
            entity.setOrgUnitId(parent.getOrgUnitId());
        } else if (entity.getOrgUnitId() == null && entity.getPortId() != null) {
            portRepository.findById(entity.getPortId()).ifPresent(p -> entity.setOrgUnitId(p.getOrgUnitId()));
        }
        if (request.getPierId() != null)
            entity.setPierId(request.getPierId());
        if (request.getProvinceId() != null)
            entity.setProvinceId(request.getProvinceId());
        if (request.getDetailedLocation() != null)
            entity.setDetailedLocation(request.getDetailedLocation());
        if (request.getOperationalStatus() != null)
            entity.setOperationalStatus(request.getOperationalStatus());
        if (request.getUsageFunction() != null)
            entity.setUsageFunction(request.getUsageFunction());
        if (request.getWorkshopArea() != null)
            entity.setWorkshopArea(request.getWorkshopArea());
        if (request.getVesselType() != null)
            entity.setVesselType(request.getVesselType());
        if (request.getVesselDwt() != null)
            entity.setVesselDwt(request.getVesselDwt());
        if (request.getBusinessType() != null)
            entity.setBusinessType(request.getBusinessType());
        if (request.getActivity() != null)
            entity.setActivity(request.getActivity());
        if (request.getSlipwayCount() != null)
            entity.setSlipwayCount(request.getSlipwayCount());
        if (request.getRemarks() != null)
            entity.setRemarks(request.getRemarks());
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

        ShipRepairYard saved = shipRepairYardRepository.save(entity);
        persistGis(saved, request.getGeometryType(), coordinates,
                request.getLongitude(), request.getLatitude());

        // ── Ghi lịch sử thay đổi (chuẩn Cảng biển PortService.update) ──
        // Chỉ ghi khi hồ sơ ĐÃ duyệt (APPROVED / APPROVED_LEVEL2) trước lần sửa này.
        // Actor LUÔN là user thật (real UUID từ SecurityContext) — KHÔNG BAO GIỜ truyền
        // "system": ChangeHistoryService fallback auth.getName() = username → approvedBy
        // null → drawer hiện "—".
        if (wasApproved) {
            UUID actorId = currentActorId();
            if (coordinates != null && !coordinates.trim().isEmpty()) {
                String newWkt = coordinates.trim();
                boolean wktChanged = oldWkt == null || !newWkt.equals(oldWkt.trim());
                GisGeometryType geomType = request.getGeometryType() != null
                        ? request.getGeometryType() : GisGeometryType.POINT;
                boolean typeChanged = request.getGeometryType() != null && oldGeomType != geomType;
                if (wktChanged) {
                    saveShipRepairYardHistoryRow(saved.getId(), InfrastructureHistoryStatus.UPDATED, "Tọa độ GIS",
                            (oldWkt == null || oldWkt.trim().isEmpty()) ? "Chưa có" : oldWkt.trim(),
                            newWkt, null, actorId);
                }
                if (typeChanged) {
                    saveShipRepairYardHistoryRow(saved.getId(), InfrastructureHistoryStatus.UPDATED, "Loại đối tượng GIS",
                            oldGeomType != null ? geometryTypeLabel(oldGeomType) : "Chưa có",
                            geometryTypeLabel(geomType), null, actorId);
                }
            }
            // Field-level cho các trường khác — key khớp historyFieldLabels phía frontend.
            recordFieldLevelHistory(preImage, saved, actorId);
        }

        evictAfterCommit();

        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public ShipRepairYardResponse getById(UUID id) {
        ShipRepairYard entity = shipRepairYardRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cơ sở sửa chữa, đóng tàu với id: " + id));
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public Page<ShipRepairYardResponse> findAll(int page, int size, UUID orgUnitId,
                                                String search, String shipRepairYardCode, String shipRepairYardName,
                                                UUID portId, UUID pierId,
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
        // Mở rộng cây đơn vị: chọn đơn vị cha → gồm cả cơ sở của toàn bộ đơn vị con (hậu duệ)
        boolean includeAll = orgUnitId == null;
        List<UUID> orgUnitIds = orgUnitId != null ? orgUnitScopeService.resolveSubtreeIds(orgUnitId) : List.of();
        String searchTrim = search != null ? search.trim() : null;
        Page<ShipRepairYard> result = shipRepairYardRepository.searchShipRepairYards(
                includeAll, orgUnitIds,
                searchTrim, shipRepairYardCode, shipRepairYardName, portId,
                pierId, provinceId,
                approvalEnum, statusEnum, false,
                updatedFromDt, updatedToDt,
                pageable);

        // Batch resolve tên cảng biển cha để tránh truy vấn từng bản ghi
        java.util.List<UUID> parentIds = result.getContent().stream()
                .map(ShipRepairYard::getPortId)
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
        ShipRepairYard entity = shipRepairYardRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cơ sở sửa chữa, đóng tàu với id: " + id));
        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT) {
            throw new IllegalArgumentException("Chỉ được xóa cơ sở sửa chữa, đóng tàu ở trạng thái Nháp");
        }
        entity.softDelete(SecurityUtils.getCurrentUserId());
        shipRepairYardRepository.save(entity);
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        evictAfterCommit();
        log.info("Soft-deleted ShipRepairYard [{}] code={}", entity.getId(), entity.getShipRepairYardCode());
    }

    public String generateShipRepairYardCode(UUID portId) {
        Port port = portRepository.findById(portId)
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + portId));

        String portCode = port.getPortCode();
        String prefix = portCode + "-SCDT-";
        List<ShipRepairYard> existing = shipRepairYardRepository.findByPortIdAndDeletedAtIsNull(portId);
        int maxNum = 0;
        for (ShipRepairYard a : existing) {
            if (a.getShipRepairYardCode() != null && a.getShipRepairYardCode().startsWith(prefix)) {
                try {
                    int n = Integer.parseInt(a.getShipRepairYardCode().substring(prefix.length()));
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
            // Lịch sử "Tài liệu đính kèm" — chỉ khi hồ sơ đã duyệt (chuẩn Cảng biển)
            recordAttachmentHistory(entityType, entityId, originalFilename,
                    InfrastructureHistoryStatus.ATTACHMENT_UPLOADED);
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
        // Lịch sử "Tài liệu đính kèm" — chỉ khi hồ sơ đã duyệt (chuẩn Cảng biển)
        recordAttachmentHistory(entityType, entityId, attachment.getFileName(),
                InfrastructureHistoryStatus.ATTACHMENT_DELETED);
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

    public ShipRepairYardResponse toResponse(ShipRepairYard entity) {
        return toResponse(entity, null);
    }

    public ShipRepairYardResponse toResponse(ShipRepairYard entity, String preResolvedPortName) {
        if (entity == null) return null;

        ShipRepairYardResponse response = ShipRepairYardResponse.builder()
                .id(entity.getId())
                // .securityLevel(entity.getSecurityLevel())
                .shipRepairYardCode(entity.getShipRepairYardCode())
                .shipRepairYardName(entity.getShipRepairYardName())
                .portId(entity.getPortId())
                .portName(preResolvedPortName != null ? preResolvedPortName : portCacheService.getName(entity.getPortId()))
                .pierId(entity.getPierId())
                .pierName(resolvePierName(entity.getPierId()))
                .orgUnitId(entity.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(entity.getOrgUnitId()))
                .provinceId(entity.getProvinceId())
                .detailedLocation(entity.getDetailedLocation())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
                // Thông tin đặc thù CSSCĐT
                .usageFunction(entity.getUsageFunction())
                .workshopArea(entity.getWorkshopArea())
                .vesselType(entity.getVesselType())
                .vesselDwt(entity.getVesselDwt())
                .businessType(entity.getBusinessType())
                .activity(entity.getActivity())
                .slipwayCount(entity.getSlipwayCount())
                .remarks(entity.getRemarks())
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

    private void parseLatLng(String coordinates, ShipRepairYardResponse response) {
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

    private String resolvePierName(UUID pierId) {
        if (pierId == null) return null;
        return pierRepository.findById(pierId)
                .map(Pier::getPierName)
                .orElse(null);
    }

    // ── Ghi lịch sử thay đổi (chuẩn Cảng biển) ────────────────────────

    /** Các trường field-level — key khớp historyFieldLabels phía frontend ShipRepairYard. */
    private static final List<String> HISTORY_FIELD_NAMES = List.of(
            ShipRepairYard.Fields.shipRepairYardCode,
            ShipRepairYard.Fields.shipRepairYardName,
            ShipRepairYard.Fields.portId,
            ShipRepairYard.Fields.pierId,
            ShipRepairYard.Fields.provinceId,
            ShipRepairYard.Fields.detailedLocation,
            ShipRepairYard.Fields.operationalStatus,
            ShipRepairYard.Fields.usageFunction,
            ShipRepairYard.Fields.workshopArea,
            ShipRepairYard.Fields.vesselType,
            ShipRepairYard.Fields.vesselDwt,
            ShipRepairYard.Fields.businessType,
            ShipRepairYard.Fields.activity,
            ShipRepairYard.Fields.slipwayCount,
            ShipRepairYard.Fields.remarks,
            ShipRepairYard.Fields.mapSymbolId,
            ShipRepairYard.Fields.coordinateSystem,
            ShipRepairYard.Fields.displayRule);

    /** preImage snapshot: các trường theo dõi + spatialId (để đọc WKT/loại hình GIS cũ). */
    private static final List<String> SNAPSHOT_FIELD_NAMES;
    static {
        List<String> names = new java.util.ArrayList<>(HISTORY_FIELD_NAMES);
        names.add(ShipRepairYard.Fields.spatialId);
        SNAPSHOT_FIELD_NAMES = List.copyOf(names);
    }

    /** Chụp bản sao entity trước khi mutate để diff lịch sử. */
    private ShipRepairYard snapshotHistoryFields(ShipRepairYard entity) {
        ShipRepairYard snapshot = new ShipRepairYard();
        for (String fieldName : SNAPSHOT_FIELD_NAMES) {
            try {
                Field field = entity.getClass().getDeclaredField(fieldName);
                field.setAccessible(true);
                field.set(snapshot, field.get(entity));
            } catch (ReflectiveOperationException e) {
                log.warn("Không snapshot được trường {} của ShipRepairYard: {}", fieldName, e.getMessage());
            }
        }
        return snapshot;
    }

    /** Diff field-level giữa preImage và entity sau khi lưu — chỉ ghi trường thực sự đổi. */
    private void recordFieldLevelHistory(ShipRepairYard preImage, ShipRepairYard saved, UUID actorId) {
        for (String fieldName : HISTORY_FIELD_NAMES) {
            Object oldValue = readHistoryField(preImage, fieldName);
            Object newValue = readHistoryField(saved, fieldName);
            if (historyValuesEqual(oldValue, newValue)) {
                continue;
            }
            saveShipRepairYardHistoryRow(saved.getId(), InfrastructureHistoryStatus.UPDATED, fieldName,
                    historyFormatValue(oldValue), historyFormatValue(newValue), null, actorId);
        }
    }

    private static Object readHistoryField(Object entity, String fieldName) {
        try {
            Field field = entity.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            return field.get(entity);
        } catch (ReflectiveOperationException e) {
            return null;
        }
    }

    private static boolean historyValuesEqual(Object a, Object b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        if (a instanceof Enum<?> ea && b instanceof Enum<?> eb) return ea == eb;
        if (a instanceof List<?> la && b instanceof List<?> lb) return la.equals(lb);
        if (a instanceof Number && b instanceof Number) {
            try {
                return new java.math.BigDecimal(a.toString())
                        .compareTo(new java.math.BigDecimal(b.toString())) == 0;
            } catch (NumberFormatException e) {
                return ((Number) a).doubleValue() == ((Number) b).doubleValue();
            }
        }
        return a.equals(b);
    }

    private static String historyFormatValue(Object value) {
        if (value == null) return "(null)";
        if (value instanceof LocalDateTime dt) return dt.toString();
        if (value instanceof Enum<?> e) return e.name();
        return value.toString();
    }

    /**
     * Ghi 1 dòng infrastructure_history với refType = SHIP_REPAIR_YARD.
     * KHÔNG đi qua ChangeHistoryService.insertChangeRecord/recordChanges vì
     * resolveInfrastructureType chưa có nhánh SHIP_REPAIR_YARD → rơi vào mặc định
     * SEAPORT, làm getHistory trả rỗng.
     */
    private void saveShipRepairYardHistoryRow(UUID refId, InfrastructureHistoryStatus status,
                                              String changedField, String previousValue,
                                              String newValue, String reason, UUID actorId) {
        try {
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(refId)
                    .refType(InfrastructureType.SHIP_REPAIR_YARD)
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(status)
                    .approvedBy(actorId)
                    .approvedDate(LocalDateTime.now())
                    .reason(reason)
                    .changedField(changedField)
                    .previousValue(previousValue)
                    .newValue(newValue)
                    .build());
        } catch (Exception e) {
            log.warn("Không ghi được lịch sử ShipRepairYard [{}] field={}: {}", refId, changedField, e.getMessage());
        }
    }

    /** Actor thật từ SecurityContext — không bao giờ truyền "system". */
    private static UUID currentActorId() {
        UUID actorId = SecurityUtils.getCurrentUserId();
        if (actorId != null) return actorId;
        org.springframework.security.core.Authentication auth =
                org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getName() != null && !"anonymousUser".equals(auth.getName())) {
            try {
                return UUID.fromString(auth.getName());
            } catch (IllegalArgumentException ignored) {
                // username (không phải UUID) — không đủ dữ liệu để gán actor; để null.
            }
        }
        return null;
    }

    /** Nhãn hiển thị loại hình GIS (chuẩn VTS CHK — dùng cho lịch sử thay đổi). */
    private static String geometryTypeLabel(GisGeometryType type) {
        if (type == null) return "Chưa có";
        return switch (type) {
            case POINT -> "Đối tượng điểm";
            case LINE -> "Đối tượng đường";
            case POLYGON -> "Đối tượng vùng";
        };
    }

    /**
     * Ghi lịch sử "Tài liệu đính kèm" của ShipRepairYard (chuẩn Cảng biển
     * DocumentService.recordPortAttachmentHistory) — chỉ khi hồ sơ đã duyệt.
     */
    private void recordAttachmentHistory(String entityType, UUID entityId, String fileName,
                                         InfrastructureHistoryStatus status) {
        try {
            if (entityType == null || !InfrastructureType.SHIP_REPAIR_YARD.name().equalsIgnoreCase(entityType)) {
                return;
            }
            ShipRepairYard yard = shipRepairYardRepository.findById(entityId).orElse(null);
            if (yard == null) {
                return;
            }
            ApprovalStatus approval = yard.getApprovalStatus();
            boolean wasApproved = approval == ApprovalStatus.APPROVED
                    || approval == ApprovalStatus.APPROVED_LEVEL2;
            if (!wasApproved) {
                return;
            }
            String name = fileName != null ? fileName : "không rõ tên";
            boolean uploaded = status == InfrastructureHistoryStatus.ATTACHMENT_UPLOADED;
            saveShipRepairYardHistoryRow(entityId, status, "Tài liệu đính kèm",
                    uploaded ? "—" : name,
                    uploaded ? name : "—",
                    (uploaded ? "Tải lên tài liệu đính kèm: " : "Xóa tài liệu đính kèm: ") + name,
                    currentActorId());
        } catch (Exception e) {
            log.warn("Không ghi được lịch sử file đính kèm ShipRepairYard (entityType={}, entityId={}): {}",
                    entityType, entityId, e.getMessage());
        }
    }

    private void persistGis(ShipRepairYard saved, GisGeometryType geometryType, String coordinates,
                            BigDecimal longitude, BigDecimal latitude) {
        String wkt = coordinates;
        if ((wkt == null || wkt.trim().isEmpty()) && longitude != null && latitude != null) {
            wkt = "POINT(" + longitude + " " + latitude + ")";
        }
        if (wkt != null && !wkt.trim().isEmpty()) {
            GisGeometryType geomType = geometryType != null ? geometryType : GisGeometryType.POINT;
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getSpatialId(), saved.getShipRepairYardName(), "SHIP_REPAIR_YARD_" + saved.getShipRepairYardCode(),
                    geomType, GisSpatialObjectType.POLYGON_SHIP_REPAIR_YARD, wkt, saved.getId(),
                    InfrastructureType.SHIP_REPAIR_YARD);
            saved.setSpatialId(spatialObj.getId());
            shipRepairYardRepository.save(saved);
        }
    }

    private void applySaveAction(ShipRepairYard entity, String action) {
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

    private LocalDateTime parseLocalDateTime(String dt) {
        if (dt == null || dt.isBlank()) return null;
        try { return LocalDateTime.parse(dt); }
        catch (Exception e) { return null; }
    }
}
