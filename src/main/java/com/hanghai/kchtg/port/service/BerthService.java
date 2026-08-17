package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.EntityFields;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.gis.search.dto.InfrastructureType;
import com.hanghai.kchtg.gis.spatial.entity.GisGeometryType;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObject;
import com.hanghai.kchtg.gis.spatial.entity.GisSpatialObjectType;
import com.hanghai.kchtg.gis.spatial.service.GisSpatialObjectService;
import com.hanghai.kchtg.port.dto.berth.BerthResponse;
import com.hanghai.kchtg.port.dto.berth.CreateBerthRequest;
import com.hanghai.kchtg.port.dto.berth.UpdateBerthRequest;
import com.hanghai.kchtg.port.entity.Berth;
import com.hanghai.kchtg.port.entity.BerthType;
import com.hanghai.kchtg.port.entity.Port;
import com.hanghai.kchtg.port.repository.BerthRepository;
import com.hanghai.kchtg.port.repository.PierRepository;
import com.hanghai.kchtg.port.repository.PortRepository;
import com.hanghai.kchtg.port.service.shared.AuditLogService;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.port.service.PortCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.dto.berth.AttachmentDto;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.time.LocalDateTime;

/**
 * Service core for Berth CRUD operations.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BerthService {

    private final BerthRepository berthRepository;
    private final PortRepository portRepository;
    private final PierRepository pierRepository;
    private final ChangeHistoryService changeHistoryService;
    private final AuditLogService auditLogService;
    private final UserResolverService userResolverService;
    private final UserRepository userRepository;
    private final PortCacheService portCacheService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final AttachmentRepository attachmentRepository;

    @Value("${app.upload.attachment-path:uploads/attachments}")
    private String attachmentPath;

    @Transactional
    public BerthResponse create(CreateBerthRequest request) {
        Port parent = portRepository.findById(request.getPortId())
                .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));

        if (parent.getApprovalStatus() != ApprovalStatus.APPROVED) {
            throw new IllegalArgumentException(
                    "Không thể tạo bến cảng: cảng biển cha phải ở trạng thái được phê duyệt");
        }

        String code = generateBerthCode(request.getPortId());
        Berth entity = Berth.builder()
                .berthCode(code).berthName(request.getBerthName())
                .portId(request.getPortId()).waterway(request.getWaterway())
                .length(request.getLength()).width(request.getWidth())
                .berthType(request.getBerthType()).channelDepth(request.getChannelDepth())
                .operationalFunction(request.getOperationalFunction())
                .operationalStatus(request.getOperationalStatus())
                .orgUnitId(parent.getOrgUnitId())
                .mapSymbolId(request.getMapSymbolId())
                // Extended fields
                .provinceId(request.getProvinceId())
                .detailedLocation(request.getDetailedLocation())
                .coordinateSystem(request.getCoordinateSystem())
                .displayRule(request.getDisplayRule())
                .operator(request.getOperator())
                .totalArea(request.getTotalArea())
                .designThroughput(request.getDesignThroughput())
                .currentThroughput(request.getCurrentThroughput())
                .maxVesselSize(request.getMaxVesselSize())
                .plannedThroughput(request.getPlannedThroughput())
                .latestCargoVolume(request.getLatestCargoVolume())
                .openingAnnouncementDate(request.getOpeningAnnouncementDate())
                .openingDecision(request.getOpeningDecision())
                .investmentAgreement(request.getInvestmentAgreement())
                .structureType(request.getStructureType())
                .build();

        String action = request.getSaveAction() != null ? request.getSaveAction() : "DRAFT";
        applySaveAction(entity, action);

        Berth saved = berthRepository.save(entity);

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (coordinates != null && !coordinates.trim().isEmpty()) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
            GisSpatialObjectType objType = GisSpatialObjectType.POINT_PORT;
            UUID refId = saved.getId();
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    saved.getBerthName(),
                    "BERTH_" + saved.getBerthCode(),
                    geomType,
                    objType,
                    coordinates,
                    refId,
                    InfrastructureType.PORT_TERMINAL
            );
            saved.setSpatialId(spatialObj.getId());
            saved = berthRepository.save(saved);
        }

        log.info("Created Berth [{}] code={}", saved.getId(), saved.getBerthCode());
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public BerthResponse getById(UUID id) {
        return toResponse(berthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<BerthResponse> findAll(int page, int size, UUID orgUnitId) {
        return findAll(page, size, orgUnitId, null, null, null, null, null, null, null, null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<BerthResponse> findAll(int page, int size, UUID orgUnitId,
            String berthCode, String berthName, UUID portId,
            String waterway, String berthType,
            String operationalStatus, String approvalStatus, String search,
            Integer structureType, String operationalFunction,
            Integer provinceId, String updatedFrom, String updatedTo) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize, Sort.by(Sort.Order.desc("submittedForApprovalAt"), Sort.Order.desc(EntityFields.CREATED_AT), Sort.Order.asc(EntityFields.ID)));
        OperationalStatus statusEnum = operationalStatus != null ? OperationalStatus.fromString(operationalStatus)
                : null;
        ApprovalStatus approvalEnum = approvalStatus != null ? ApprovalStatus.fromString(approvalStatus)
                : null;
        BerthType berthTypeEnum = null;
        if (berthType != null && !berthType.trim().isEmpty()) {
            try {
                berthTypeEnum = BerthType.valueOf(berthType.trim().toUpperCase());
            } catch (IllegalArgumentException e) {
                // ignore
            }
        }
        java.time.LocalDateTime updatedFromDt = null;
        if (updatedFrom != null && !updatedFrom.trim().isEmpty()) {
            try {
                updatedFromDt = java.time.LocalDateTime.parse(updatedFrom.replace(" ", "T"));
            } catch (Exception e) { /* ignore */ }
        }
        java.time.LocalDateTime updatedToDt = null;
        if (updatedTo != null && !updatedTo.trim().isEmpty()) {
            try {
                updatedToDt = java.time.LocalDateTime.parse(updatedTo.replace(" ", "T"));
            } catch (Exception e) { /* ignore */ }
        }
        Page<Berth> pageResult = berthRepository.searchBerths(orgUnitId, search, berthCode, berthName, portId,
                waterway, berthTypeEnum, approvalEnum, statusEnum, false,
                structureType, operationalFunction, provinceId, updatedFromDt, updatedToDt, pageable);

        java.util.List<UUID> parentIds = pageResult.getContent().stream()
                .map(Berth::getPortId)
                .filter(java.util.Objects::nonNull)
                .distinct()
                .collect(java.util.stream.Collectors.toList());

        java.util.Map<UUID, String> parentNameMap = new java.util.HashMap<>();
        if (!parentIds.isEmpty()) {
            portRepository.findAllById(parentIds).forEach(cb -> {
                parentNameMap.put(cb.getId(), cb.getPortName());
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

        return pageResult.map(e -> toResponse(e,
                parentNameMap.get(e.getPortId()),
                userNamesMap.get(e.getCreatedBy()),
                userNamesMap.get(e.getUpdatedBy())
        ));
    }

    @Transactional(readOnly = true)
    public BerthResponse findByCode(String berthCode) {
        return toResponse(berthRepository.findByBerthCode(berthCode)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với mã: " + berthCode)));
    }

    @Transactional(readOnly = true)
    public List<Berth> findByPortId(UUID portId) {
        return berthRepository.findByPortIdAndDeletedAtIsNull(portId);
    }

    @Transactional
    public BerthResponse update(UpdateBerthRequest request) {
        Berth entity = berthRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + request.getId()));

        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        Berth snapshot = Berth.builder()
                .berthCode(entity.getBerthCode())
                .berthName(entity.getBerthName()).portId(entity.getPortId())
                .waterway(entity.getWaterway())
                .length(entity.getLength())
                .width(entity.getWidth()).berthType(entity.getBerthType())
                .channelDepth(entity.getChannelDepth()).operationalFunction(entity.getOperationalFunction())
                .operationalStatus(entity.getOperationalStatus())
                .approvalStatus(entity.getApprovalStatus())
                .orgUnitId(entity.getOrgUnitId())
                .mapSymbolId(entity.getMapSymbolId())
                // Extended fields snapshot
                .provinceId(entity.getProvinceId())
                .detailedLocation(entity.getDetailedLocation())
                .coordinateSystem(entity.getCoordinateSystem())
                .displayRule(entity.getDisplayRule())
                .operator(entity.getOperator())
                .totalArea(entity.getTotalArea())
                .designThroughput(entity.getDesignThroughput())
                .currentThroughput(entity.getCurrentThroughput())
                .maxVesselSize(entity.getMaxVesselSize())
                .plannedThroughput(entity.getPlannedThroughput())
                .latestCargoVolume(entity.getLatestCargoVolume())
                .openingAnnouncementDate(entity.getOpeningAnnouncementDate())
                .openingDecision(entity.getOpeningDecision())
                .investmentAgreement(entity.getInvestmentAgreement())
                .structureType(entity.getStructureType())
                .spatialId(entity.getSpatialId())
                // Approval tracking fields
                .submittedForApprovalAt(entity.getSubmittedForApprovalAt())
                .submittedForApprovalBy(entity.getSubmittedForApprovalBy())
                .portAuthorityApprovedAt(entity.getPortAuthorityApprovedAt())
                .portAuthorityApprovedBy(entity.getPortAuthorityApprovedBy())
                .departmentApprovedAt(entity.getDepartmentApprovedAt())
                .departmentApprovedBy(entity.getDepartmentApprovedBy())
                .rejectionReason(entity.getRejectionReason())
                .activityStatus(entity.getActivityStatus())
                .build();

        if (request.getBerthName() != null)
            entity.setBerthName(request.getBerthName());
        if (request.getPortId() != null) {
            entity.setPortId(request.getPortId());
            Port parent = portRepository.findById(request.getPortId())
                    .orElseThrow(
                            () -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));
            entity.setOrgUnitId(parent.getOrgUnitId());

            pierRepository.findByBerthIdAndDeletedAtIsNull(entity.getId()).forEach(cc -> {
                cc.setOrgUnitId(parent.getOrgUnitId());
                pierRepository.save(cc);
            });
        } else if (entity.getOrgUnitId() == null && entity.getPortId() != null) {
            portRepository.findById(entity.getPortId()).ifPresent(p -> {
                entity.setOrgUnitId(p.getOrgUnitId());

                pierRepository.findByBerthIdAndDeletedAtIsNull(entity.getId()).forEach(cc -> {
                    cc.setOrgUnitId(p.getOrgUnitId());
                    pierRepository.save(cc);
                });
            });
        }
        if (request.getWaterway() != null)
            entity.setWaterway(request.getWaterway());

        if (request.getLength() != null)
            entity.setLength(request.getLength());
        if (request.getWidth() != null)
            entity.setWidth(request.getWidth());
        if (request.getBerthType() != null)
            entity.setBerthType(request.getBerthType());
        if (request.getChannelDepth() != null)
            entity.setChannelDepth(request.getChannelDepth());
        if (request.getOperationalFunction() != null)
            entity.setOperationalFunction(request.getOperationalFunction());
        if (request.getOperationalStatus() != null)
            entity.setOperationalStatus(request.getOperationalStatus());
        // Extended fields
        if (request.getProvinceId() != null)
            entity.setProvinceId(request.getProvinceId());
        if (request.getDetailedLocation() != null)
            entity.setDetailedLocation(request.getDetailedLocation());
        if (request.getCoordinateSystem() != null)
            entity.setCoordinateSystem(request.getCoordinateSystem());
        if (request.getDisplayRule() != null)
            entity.setDisplayRule(request.getDisplayRule());
        if (request.getOperator() != null)
            entity.setOperator(request.getOperator());
        if (request.getTotalArea() != null)
            entity.setTotalArea(request.getTotalArea());
        if (request.getDesignThroughput() != null)
            entity.setDesignThroughput(request.getDesignThroughput());
        if (request.getCurrentThroughput() != null)
            entity.setCurrentThroughput(request.getCurrentThroughput());
        if (request.getMaxVesselSize() != null)
            entity.setMaxVesselSize(request.getMaxVesselSize());
        if (request.getPlannedThroughput() != null)
            entity.setPlannedThroughput(request.getPlannedThroughput());
        if (request.getLatestCargoVolume() != null)
            entity.setLatestCargoVolume(request.getLatestCargoVolume());
        if (request.getOpeningAnnouncementDate() != null)
            entity.setOpeningAnnouncementDate(request.getOpeningAnnouncementDate());
        if (request.getOpeningDecision() != null)
            entity.setOpeningDecision(request.getOpeningDecision());
        if (request.getInvestmentAgreement() != null)
            entity.setInvestmentAgreement(request.getInvestmentAgreement());
        if (request.getStructureType() != null)
            entity.setStructureType(request.getStructureType());
        entity.setMapSymbolId(request.getMapSymbolId());
        if (request.getSaveAction() != null) {
            applySaveAction(entity, request.getSaveAction());
        } else if (entity.getApprovalStatus() == ApprovalStatus.APPROVED) {
            // Khi chỉnh sửa: "Được phê duyệt" → quay về "Chờ cảng vụ duyệt" (APPROVED_LEVEL1)
            entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
        }

        Berth saved = berthRepository.save(entity);

        if (coordinates != null && !coordinates.trim().isEmpty()) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType() : GisGeometryType.POINT;
            GisSpatialObjectType objType = GisSpatialObjectType.POINT_PORT;
            UUID refId = saved.getId();
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getSpatialId(),
                    saved.getBerthName(),
                    "BERTH_" + saved.getBerthCode(),
                    geomType,
                    objType,
                    coordinates,
                    refId,
                    InfrastructureType.PORT_TERMINAL
            );
            saved.setSpatialId(spatialObj.getId());
            saved = berthRepository.save(saved);
        }

        // Record field-level change history
        changeHistoryService.recordChanges("Berth", saved.getId().toString(), "system", snapshot, saved);

        log.info("Updated Berth [{}] code={}", saved.getId(), saved.getBerthCode());
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(UUID id) {
        Berth entity = berthRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy bến cảng với id: " + id));
        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT) {
            throw new IllegalArgumentException("Chỉ được xóa bến cảng ở trạng thái Nháp");
        }
        long pierCount = pierRepository.countByBerthIdAndDeletedAtIsNull(id);
        if (pierCount > 0) {
            throw new IllegalStateException("Không thể xóa: bến cảng đang có " + pierCount + " cầu cảng liên kết");
        }
        entity.softDelete(SecurityUtils.getCurrentUserId());
        berthRepository.save(entity);
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        log.info("Soft-deleted Berth [{}] code={}", entity.getId(), entity.getBerthCode());
    }

    private BerthResponse toResponse(Berth e) {
        return toResponse(e, null, null, null);
    }

    private BerthResponse toResponse(Berth e, String preResolvedPortName) {
        return toResponse(e, preResolvedPortName, null, null);
    }

    private BerthResponse toResponse(Berth e, String preResolvedPortName, String preResolvedCreatorName, String preResolvedUpdaterName) {
        String portName = preResolvedPortName;
        if (portName == null && e.getPortId() != null) {
            portName = portCacheService.getName(e.getPortId());
        }

        String createdBy = preResolvedCreatorName != null ? preResolvedCreatorName : userResolverService.resolveName(e.getCreatedBy());
        String updatedBy = preResolvedUpdaterName != null ? preResolvedUpdaterName : userResolverService.resolveName(e.getUpdatedBy());

        BigDecimal latitude = null;
        BigDecimal longitude = null;
        if (e.getSpatialId() != null) {
            Optional<GisSpatialObject> spatialObjOpt = gisSpatialObjectService.findById(e.getSpatialId());
            if (spatialObjOpt.isPresent()) {
                String coords = spatialObjOpt.get().getCoordinates();
                try {
                    String clean = coords.replace("POINT", "").replace("(", "").replace(")", "").trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        longitude = new BigDecimal(parts[0]);
                        latitude = new BigDecimal(parts[1]);
                    }
                } catch (Exception ex) {
                    // ignore
                }
            }
        }

        BerthResponse.BerthResponseBuilder builder = BerthResponse.builder()
                .id(e.getId()).berthCode(e.getBerthCode()).berthName(e.getBerthName())
                .portId(e.getPortId())
                .portName(portName)
                .waterway(e.getWaterway())
                .width(e.getWidth()).berthType(e.getBerthType())
                .channelDepth(e.getChannelDepth()).operationalFunction(e.getOperationalFunction())
                .operationalStatus(e.getOperationalStatus())
                .approvalStatus(e.getApprovalStatus()).orgUnitId(e.getOrgUnitId()).orgUnitName(orgUnitCacheService.getName(e.getOrgUnitId()))
                .mapSymbolId(e.getMapSymbolId())
                .latitude(latitude)
                .longitude(longitude)
                // Extended fields
                .provinceId(e.getProvinceId())
                .detailedLocation(e.getDetailedLocation())
                .coordinateSystem(e.getCoordinateSystem())
                .displayRule(e.getDisplayRule())
                .operator(e.getOperator())
                .totalArea(e.getTotalArea())
                .designThroughput(e.getDesignThroughput())
                .currentThroughput(e.getCurrentThroughput())
                .maxVesselSize(e.getMaxVesselSize())
                .plannedThroughput(e.getPlannedThroughput())
                .latestCargoVolume(e.getLatestCargoVolume())
                .openingAnnouncementDate(e.getOpeningAnnouncementDate())
                .openingDecision(e.getOpeningDecision())
                .investmentAgreement(e.getInvestmentAgreement())
                .structureType(e.getStructureType())
                .createdBy(e.getCreatedBy())
                .updatedBy(e.getUpdatedBy())
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt())
                // Two-level approval fields
                .activityStatus(e.getActivityStatus())
                .submittedForApprovalAt(e.getSubmittedForApprovalAt())
                .submittedForApprovalBy(e.getSubmittedForApprovalBy())
                .portAuthorityApprovedAt(e.getPortAuthorityApprovedAt())
                .portAuthorityApprovedBy(e.getPortAuthorityApprovedBy())
                .departmentApprovedAt(e.getDepartmentApprovedAt())
                .departmentApprovedBy(e.getDepartmentApprovedBy())
                .rejectionReason(e.getRejectionReason());

        if (e.getSpatialId() != null) {
            builder.spatialId(e.getSpatialId());
            gisSpatialObjectService.findById(e.getSpatialId()).ifPresent(spatialObj -> {
                builder.geometryType(spatialObj.getGeometryType());
                builder.coordinates(spatialObj.getCoordinates());
            });
        }
        return builder.build();
    }

    public String generateBerthCode(UUID portId) {
        Port port = portRepository.findById(portId)
            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng biển"));
        String portCode = port.getPortCode();
        String prefix = portCode + "-B";
        List<Berth> existing = berthRepository.findByPortIdAndDeletedAtIsNull(portId);
        int maxNum = 0;
        for (Berth b : existing) {
            if (b.getBerthCode() != null && b.getBerthCode().startsWith(prefix)) {
                try {
                    int n = Integer.parseInt(b.getBerthCode().substring(prefix.length()));
                    if (n > maxNum) maxNum = n;
                } catch (NumberFormatException ignored) {}
            }
        }
        return prefix + String.format("%02d", maxNum + 1);
    }

    private void applySaveAction(Berth entity, String action) {
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
    // ── Attachment operations ──────────────────────────────────────────

    @Transactional
    public List<AttachmentDto> uploadAttachments(String entityType, UUID entityId, List<MultipartFile> files, UUID userId) {
        long existingCount = attachmentRepository.countByEntityTypeAndEntityId(entityType, entityId);
        if (existingCount + files.size() > 10) {
            throw new IllegalArgumentException("Tối đa 10 file đính kèm");
        }

        List<Attachment> savedAttachments = new java.util.ArrayList<>();
        java.nio.file.Path basePath = java.nio.file.Paths.get(attachmentPath).toAbsolutePath().normalize();
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
            String storagePath = basePath.resolve(entityType).resolve(entityId.toString()).resolve(storageFileName).toString();

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
        try { java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(attachment.getFilePath())); }
        catch (Exception e) { log.warn("Không thể xóa file: {}", attachment.getFilePath(), e); }
        attachmentRepository.delete(attachment);
    }

    private AttachmentDto toAttachmentDto(Attachment entity) {
        AttachmentDto dto = new AttachmentDto();
        dto.setId(entity.getId()); dto.setEntityType(entity.getEntityType()); dto.setEntityId(entity.getEntityId());
        dto.setFileName(entity.getFileName()); dto.setFilePath(entity.getFilePath());
        dto.setFileSize(entity.getFileSize()); dto.setContentType(entity.getContentType());
        dto.setUploadedBy(entity.getUploadedBy()); dto.setUploadedAt(entity.getUploadedAt());
        return dto;
    }
}
