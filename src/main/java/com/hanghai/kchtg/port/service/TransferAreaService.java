package com.hanghai.kchtg.port.service;

import com.hanghai.kchtg.common.entity.ApprovalStatus;
import com.hanghai.kchtg.common.entity.EntityFields;
import com.hanghai.kchtg.common.entity.InfrastructureHistory;
import com.hanghai.kchtg.common.entity.OperationalStatus;
import com.hanghai.kchtg.common.enums.ApprovalLevel;
import com.hanghai.kchtg.common.enums.InfrastructureHistoryStatus;
import com.hanghai.kchtg.common.repository.InfrastructureHistoryRepository;
import com.hanghai.kchtg.common.service.InfrastructureApprovalService;
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
public class TransferAreaService {

    private final TransferAreaRepository transferAreaRepository;
    private final PortRepository portRepository;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final PortCacheService portCacheService;
    private final AttachmentRepository attachmentRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final TransferAreaMooringWaterAreaRepository transferAreaMooringWaterAreaRepository;
    private final TransferAreaMooringWaterAreaAnchorPointRepository transferAreaMooringWaterAreaAnchorPointRepository;
    private final InfrastructureHistoryRepository historyRepository;
    private final com.hanghai.kchtg.port.service.shared.ChangeHistoryService changeHistoryService;
    private final InfrastructureApprovalService approvalService;

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
        boolean hasGeomCreate = request.getGeometryType() != null;
        boolean hasCoordsCreate = (request.getCoordinates() != null && !request.getCoordinates().trim().isEmpty())
                || (request.getLongitude() != null && request.getLatitude() != null);
        persistGisAndMooring(saved, request.getGeometryType(), request.getCoordinates(),
                request.getLongitude(), request.getLatitude(), request.getMooringWaterAreas(), false, hasGeomCreate && hasCoordsCreate);
        evictAfterCommit();

        return toResponse(saved);
    }

    @Transactional
    public TransferAreaResponse update(UpdateTransferAreaRequest request) {
        TransferArea entity = transferAreaRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy khu chuyển tải với id: " + request.getId()));
        if (entity.getDeletedAt() != null || entity.getDeletedBy() != null) {
            throw new IllegalStateException("Không thể chỉnh sửa khu chuyển tải đã bị xóa");
        }
        UUID operatorId = SecurityUtils.getCurrentUserId();
        approvalService.assertCanEdit(entity, operatorId, InfrastructureType.TRANSSHIPMENT_AREA);

        String coordinates = trimToNull(request.getCoordinates());
        if (coordinates == null && request.getLongitude() != null && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        // Chụp snapshot đầy đủ trước khi thay đổi để ghi lịch sử chi tiết (chuẩn Bến cảng)
        TransferArea snapshot = buildSnapshot(entity);

        // if (request.getSecurityLevel() != null) {
        //     RecordSecurityLevel.validateAssignment(request.getSecurityLevel(), "transferarea",
        //             SecurityUtils.getCurrentUserPermissions(), SecurityUtils.isElevatedAdministrator());
        //     entity.setSecurityLevel(request.getSecurityLevel());
        // }
        if (request.isFieldPresent("transferAreaName")) {
            String trimmedName = trimToNull(request.getTransferAreaName());
            if (trimmedName == null || trimmedName.isEmpty()) {
                throw new IllegalArgumentException("Tên khu chuyển tải không được để trống");
            }
            entity.setTransferAreaName(trimmedName);
        }
        if (request.isFieldPresent("portId")) {
            if (request.getPortId() != null) {
                Port parent = portRepository.findById(request.getPortId())
                        .orElseThrow(() -> new EntityNotFoundException("Cảng biển không tồn tại: " + request.getPortId()));
                entity.setPortId(request.getPortId());
            } else {
                entity.setPortId(null);
            }
        }
        if (request.isFieldPresent("orgUnitId"))
            entity.setOrgUnitId(request.getOrgUnitId());
        // Suy ra đơn vị quản lý từ cảng biển CHỈ KHI bản ghi vẫn chưa có đơn vị — đặt SAU khối
        // orgUnitId để giá trị client gửi luôn thắng. Trước đây dòng setOrgUnitId nằm trong nhánh
        // portId (chạy TRƯỚC khối orgUnitId), mà frontend luôn gửi portId mỗi lần lưu, nên đơn vị
        // quản lý bị ghi đè âm thầm: người dùng sửa/xóa đơn vị nhưng bản ghi "không hề thay đổi".
        if (entity.getOrgUnitId() == null && entity.getPortId() != null) {
            portRepository.findById(entity.getPortId()).ifPresent(p -> entity.setOrgUnitId(p.getOrgUnitId()));
        }
        if (request.isFieldPresent("provinceId"))
            entity.setProvinceId(request.getProvinceId());
        if (request.isFieldPresent("detailedLocation"))
            entity.setDetailedLocation(trimToNull(request.getDetailedLocation()));
        if (request.isFieldPresent("operationalFunctions"))
            entity.setOperationalFunctions(trimToNull(request.getOperationalFunctions()));
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
        if (request.isFieldPresent("activeTransferCount"))
            entity.setActiveTransferCount(request.getActiveTransferCount());
        if (request.isFieldPresent("publishedTransferCount"))
            entity.setPublishedTransferCount(request.getPublishedTransferCount());
        if (request.isFieldPresent("underInvestmentTransferCount"))
            entity.setUnderInvestmentTransferCount(request.getUnderInvestmentTransferCount());
        if (request.isFieldPresent("remarks"))
            entity.setRemarks(trimToNull(request.getRemarks()));
        if (request.isFieldPresent("openingAnnouncementDate"))
            entity.setOpeningAnnouncementDate(request.getOpeningAnnouncementDate());
        if (request.isFieldPresent("publicDecision"))
            entity.setPublicDecision(trimToNull(request.getPublicDecision()));
        if (request.isFieldPresent("investmentAgreement"))
            entity.setInvestmentAgreement(trimToNull(request.getInvestmentAgreement()));
        if (request.isFieldPresent("activityStartDate"))
            entity.setActivityStartDate(request.getActivityStartDate());
        if (request.isFieldPresent("activityEndDate"))
            entity.setActivityEndDate(request.getActivityEndDate());

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
            ApprovalStatus targetStatus = request.getApprovalStatus();
            if (targetStatus == null && request.getSaveAction() != null) {
                targetStatus = "SUBMIT".equalsIgnoreCase(request.getSaveAction()) ? ApprovalStatus.APPROVED_LEVEL1 : ApprovalStatus.DRAFT;
            }
            approvalService.handleApprovedRecordEdit(entity, InfrastructureType.TRANSSHIPMENT_AREA, targetStatus, operatorId);
        } else if (request.getSaveAction() != null) {
            applySaveAction(entity, request.getSaveAction());
        } else if (request.getApprovalStatus() != null) {
            entity.setApprovalStatus(request.getApprovalStatus());
        }

        // Actor thật từ SecurityContext — nếu truyền "system", approvedBy = null và drawer hiện "—"
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
        persistGisAndMooring(saved, geomType, coordinates,
                request.getLongitude(), request.getLatitude(), request.getMooringWaterAreas(), shouldClearLocation, hasGeometryType && hasCoordinates);

        // Chỉ ghi lịch sử khi hồ sơ đã được duyệt (chuẩn PortService: 2 dòng GIS riêng + summary khu nước).
        if (wasApproved) {
            if (hasGeometryType && hasCoordinates) {
                GisGeometryType effectiveGeomType = geomType != null
                        ? geomType : GisGeometryType.POINT;
                String newWkt = coordinates.trim();
                boolean wktChanged = oldWkt == null || !com.hanghai.kchtg.common.util.WktCoordinateUtils.coordinatesEqual(newWkt, oldWkt);
                if (wktChanged) {
                    changeHistoryService.insertChangeRecord("TransferArea", saved.getId(), "Tọa độ GIS",
                            (oldWkt == null || oldWkt.trim().isEmpty()) ? "Chưa có" : oldWkt.trim(),
                            newWkt, actorId);
                }
                boolean typeChanged = geomType != null && oldGeomType != geomType;
                if (typeChanged) {
                    changeHistoryService.insertChangeRecord("TransferArea", saved.getId(), "Loại đối tượng GIS",
                            oldGeomType != null ? geometryTypeLabel(oldGeomType) : "Chưa có",
                            geometryTypeLabel(geomType), actorId);
                }
            } else if (shouldClearLocation && (oldWkt != null || oldGeomType != null)) {
                if (oldWkt != null && !oldWkt.trim().isEmpty()) {
                    changeHistoryService.insertChangeRecord("TransferArea", saved.getId(), "Tọa độ GIS",
                            oldWkt.trim(), "Chưa có", actorId);
                }
                if (oldGeomType != null) {
                    changeHistoryService.insertChangeRecord("TransferArea", saved.getId(), "Loại đối tượng GIS",
                            geometryTypeLabel(oldGeomType), "Chưa có", actorId);
                }
            }

            changeHistoryService.recordChanges("TransferArea", saved.getId().toString(),
                    actorId, snapshot, saved);

            // Summary "Khu nước neo buộc tàu" đọc được — không ghi Java toString rác của reflection
            String newMooringSummary = buildMooringWaterAreaSummary(
                    transferAreaMooringWaterAreaRepository.findByTransferAreaId(saved.getId()));
            if (!oldMooringSummary.equals(newMooringSummary)) {
                changeHistoryService.insertChangeRecord("TransferArea", saved.getId(), "mooringWaterAreas",
                        oldMooringSummary.isEmpty() ? null : oldMooringSummary,
                        newMooringSummary.isEmpty() ? null : newMooringSummary, actorId);
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
        return findAll(page, size, orgUnitId, search, transferAreaCode, transferAreaName,
                portId, provinceId, operationalFunctions, operationalStatus, approvalStatus, updatedFrom, updatedTo, null, null);
    }

    @Transactional(readOnly = true)
    public Page<TransferAreaResponse> findAll(int page, int size, UUID orgUnitId,
                                              String search, String transferAreaCode, String transferAreaName,
                                              UUID portId, Integer provinceId, String operationalFunctions,
                                              String operationalStatus, String approvalStatus,
                                              String updatedFrom, String updatedTo,
                                              String sortBy, String sortDir) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Sort sort = Sort.by(Sort.Order.desc(EntityFields.UPDATED_AT),
                Sort.Order.desc(EntityFields.CREATED_AT),
                Sort.Order.asc(EntityFields.ID));
        if (sortBy != null && !sortBy.isBlank()) {
            String property = mapSortProperty(sortBy);
            if (property != null) {
                Sort.Direction direction = "ASC".equalsIgnoreCase(sortDir) ? Sort.Direction.ASC : Sort.Direction.DESC;
                sort = Sort.by(direction, property).and(sort);
            }
        }
        Pageable pageable = PageRequest.of(page, pageSize, sort);
        ApprovalStatus approvalEnum = approvalStatus != null ? ApprovalStatus.fromString(approvalStatus) : null;
        OperationalStatus statusEnum = operationalStatus != null ? OperationalStatus.fromString(operationalStatus) : null;
        java.time.LocalDateTime updatedFromDt = parseLocalDateTime(updatedFrom);
        java.time.LocalDateTime updatedToDt = parseUpdatedTo(updatedTo);
        // Mở rộng cây đơn vị: chọn đơn vị cha → gồm cả khu chuyển tải của toàn bộ đơn vị con (hậu duệ), giống logic BerthService
        boolean includeAll = orgUnitId == null;
        List<UUID> orgUnitIds = orgUnitId != null ? orgUnitScopeService.resolveSubtreeIds(orgUnitId) : List.of();
        String searchTrim = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String codeTrim = (transferAreaCode != null && !transferAreaCode.trim().isEmpty()) ? transferAreaCode.trim() : null;
        String nameTrim = (transferAreaName != null && !transferAreaName.trim().isEmpty()) ? transferAreaName.trim() : null;
        Page<TransferArea> result = transferAreaRepository.searchTransferAreas(
                includeAll, orgUnitIds,
                searchTrim, codeTrim, nameTrim, portId,
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

        UUID operatorId = SecurityUtils.getCurrentUserId();

        entity.softDelete(operatorId);
        entity.setApprovalStatus(ApprovalStatus.ARCHIVED);
        transferAreaRepository.save(entity);

        // Xóa mềm các khu nước neo buộc tàu con (cascade soft-delete)
        List<TransferAreaMooringWaterArea> waterAreas = transferAreaMooringWaterAreaRepository.findByTransferAreaId(id);
        for (TransferAreaMooringWaterArea wa : waterAreas) {
            wa.softDelete(operatorId);
            transferAreaMooringWaterAreaRepository.save(wa);
        }

        // Không ghi lịch sử khi xóa bản ghi Nháp (chuẩn Cảng biển / Bến cảng / Cầu cảng).
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        evictAfterCommit();
        log.info("Soft-deleted TransferArea [{}] code={}", entity.getId(), entity.getTransferAreaCode());
    }

    private String mapSortProperty(String sortBy) {
        if (sortBy == null) return null;
        switch (sortBy.trim()) {
            case "transferAreaCode":
            case "code":
                return "transferAreaCode";
            case "transferAreaName":
            case "name":
                return "transferAreaName";
            case "portId":
                return "portId";
            case "provinceId":
            case "province":
                return "provinceId";
            case "operationalFunctions":
                return "operationalFunctions";
            case "operationalStatus":
                return "operationalStatus";
            case "approvalStatus":
                return "approvalStatus";
            case "orgUnitId":
                return "orgUnitId";
            case "area":
                return "area";
            case "maxVesselDWT":
            case "maxVesselDwt":
                return "maxVesselDWT";
            case "submittedForApprovalAt":
                return "submittedForApprovalAt";
            case "portAuthorityApprovedAt":
                return "portAuthorityApprovedAt";
            case "departmentApprovedAt":
                return "departmentApprovedAt";
            case "createdAt":
                return "createdAt";
            case "updatedAt":
                return "updatedAt";
            default:
                return null;
        }
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

        if ("TRANSFER_AREA".equalsIgnoreCase(entityType) && !uploadedFilenames.isEmpty()) {
            recordTransferAreaAttachmentHistory(entityId, oldFilesSummary, newFilesSummary, String.join(", ", uploadedFilenames),
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
        if ("TRANSFER_AREA".equalsIgnoreCase(entityType)) {
            recordTransferAreaAttachmentHistory(entityId, oldFilesSummary, newFilesSummary, fileName,
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
                .approvalStatus(entity.getDeletedAt() != null ? ApprovalStatus.ARCHIVED : entity.getApprovalStatus())
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
                .deletedAt(entity.getDeletedAt())
                .deletedBy(entity.getDeletedBy())
                .build();

        UUID spatialId = entity.getSpatialId();
        GisSpatialObject spatialObj = null;
        if (spatialId != null) {
            spatialObj = gisSpatialObjectService.findById(spatialId).orElse(null);
        }
        if (spatialObj == null && entity.getId() != null) {
            spatialObj = gisSpatialObjectService.findByRef(entity.getId(), InfrastructureType.TRANSSHIPMENT_AREA).orElse(null);
            if (spatialObj != null) {
                entity.setSpatialId(spatialObj.getId());
                transferAreaRepository.save(entity);
            }
        }
        if (spatialObj != null) {
            response.setSpatialId(spatialObj.getId());
            GisGeometryType gt = spatialObj.getGeometryType();
            if (gt == null && spatialObj.getCoordinates() != null) {
                String clean = spatialObj.getCoordinates().trim().replaceFirst("(?i)^SRID=\\d+;", "").trim().toUpperCase();
                if (clean.startsWith("POLYGON")) gt = GisGeometryType.POLYGON;
                else if (clean.startsWith("LINESTRING") || clean.startsWith("LINE")) gt = GisGeometryType.LINE;
                else gt = GisGeometryType.POINT;
            }
            response.setGeometryType(gt != null ? gt : GisGeometryType.POINT);
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

    private void parseLatLng(String coordinates, TransferAreaResponse response) {
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
                int start = trimmed.indexOf("((") >= 0 ? trimmed.indexOf("((") + 2 : trimmed.indexOf('(') + 1;
                while (start < trimmed.length() && (trimmed.charAt(start) == '(' || Character.isWhitespace(trimmed.charAt(start)))) {
                    start++;
                }
                int end = trimmed.indexOf(',', start);
                if (end < 0) end = trimmed.indexOf(')', start);
                if (start > 0 && end > start) {
                    String[] parts = trimmed.substring(start, end).trim().split("\\s+");
                    if (parts.length >= 2) {
                        response.setLongitude(new BigDecimal(parts[0]));
                        response.setLatitude(new BigDecimal(parts[1]));
                    }
                }
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

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT) {
            return GisSpatialObjectType.POINT_OTHER;
        } else if (geomType == GisGeometryType.LINE) {
            return GisSpatialObjectType.LINE_OTHER;
        }
        return GisSpatialObjectType.POLYGON_TRANSSHIPMENT;
    }

    private void persistGisAndMooring(TransferArea saved, GisGeometryType geometryType, String coordinates,
                                      BigDecimal longitude, BigDecimal latitude,
                                      List<TransferAreaMooringWaterAreaRequest> mooringWaterAreas,
                                      boolean shouldClear, boolean shouldUpdate) {
        if (shouldUpdate) {
            String wkt = coordinates;
            if ((wkt == null || wkt.trim().isEmpty()) && longitude != null && latitude != null) {
                wkt = "POINT(" + longitude + " " + latitude + ")";
            }
            GisGeometryType geomType = geometryType;
            if (geomType == null && wkt != null && !wkt.trim().isEmpty()) {
                String clean = wkt.trim().replaceFirst("(?i)^SRID=\\d+;", "").trim().toUpperCase();
                if (clean.startsWith("POLYGON")) geomType = GisGeometryType.POLYGON;
                else if (clean.startsWith("LINESTRING") || clean.startsWith("LINE")) geomType = GisGeometryType.LINE;
                else geomType = GisGeometryType.POINT;
            }
            if (geomType != null && wkt != null && !wkt.trim().isEmpty()) {
                UUID currentSpatialId = saved.getSpatialId();
                if (currentSpatialId == null && saved.getId() != null) {
                    currentSpatialId = gisSpatialObjectService.findByRef(saved.getId(), InfrastructureType.TRANSSHIPMENT_AREA)
                            .map(GisSpatialObject::getId)
                            .orElse(null);
                }
                GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                        currentSpatialId, saved.getTransferAreaName(), "TRANSFER_AREA_" + saved.getTransferAreaCode(),
                        geomType, getSpatialObjectType(geomType), wkt, saved.getId(),
                        InfrastructureType.TRANSSHIPMENT_AREA);
                saved.setSpatialId(spatialObj.getId());
                transferAreaRepository.saveAndFlush(saved);
            }
        } else if (shouldClear) {
            if (saved.getSpatialId() != null) {
                gisSpatialObjectService.delete(saved.getSpatialId());
            }
            if (saved.getId() != null) {
                gisSpatialObjectService.findByRef(saved.getId(), InfrastructureType.TRANSSHIPMENT_AREA)
                        .ifPresent(sp -> gisSpatialObjectService.delete(sp.getId()));
            }
            saved.setSpatialId(null);
            transferAreaRepository.saveAndFlush(saved);
        }
        if (mooringWaterAreas != null) {
            replaceMooringWaterAreas(saved.getId(), mooringWaterAreas);
        }
    }

    private void replaceMooringWaterAreas(UUID transferAreaId, List<TransferAreaMooringWaterAreaRequest> requests) {
        if (requests == null) return;
        List<TransferAreaMooringWaterArea> existing = transferAreaMooringWaterAreaRepository.findByTransferAreaId(transferAreaId);
        for (TransferAreaMooringWaterArea wa : existing) {
            transferAreaMooringWaterAreaAnchorPointRepository.deleteAll(transferAreaMooringWaterAreaAnchorPointRepository.findByTransferAreaMooringWaterAreaId(wa.getId()));
        }
        transferAreaMooringWaterAreaRepository.deleteAll(existing);
        if (requests.isEmpty()) return;

        for (TransferAreaMooringWaterAreaRequest r : requests) {
            if (r == null) continue;
            String desc = (r.getDescription() != null && !r.getDescription().isBlank())
                    ? r.getDescription().trim() : null;
            boolean hasPoints = r.getAnchorPoints() != null && r.getAnchorPoints().stream()
                    .anyMatch(p -> p != null && p.getLatitude() != null && p.getLongitude() != null);
            if (desc == null && r.getGeometryType() == null && r.getMapSymbolId() == null && !hasPoints) {
                continue;
            }
            TransferAreaMooringWaterArea wa = TransferAreaMooringWaterArea.builder()
                    .transferAreaId(transferAreaId)
                    .description(desc)
                    .geometryType(r.getGeometryType())
                    .mapSymbolId(r.getMapSymbolId())
                    .coordinateSystem(r.getCoordinateSystem())
                    .displayRule(r.getDisplayRule())
                    .build();
            TransferAreaMooringWaterArea saved = transferAreaMooringWaterAreaRepository.save(wa);
            List<TransferAreaMooringWaterAreaAnchorPoint> points = new ArrayList<>();
            if (r.getAnchorPoints() != null) {
                for (TransferAreaMooringWaterAreaAnchorPointRequest p : r.getAnchorPoints()) {
                    if (p == null || p.getLatitude() == null || p.getLongitude() == null) continue;
                    points.add(TransferAreaMooringWaterAreaAnchorPoint.builder()
                            .transferAreaMooringWaterAreaId(saved.getId())
                            .name(p.getName() != null ? p.getName().trim() : null)
                            .latitude(p.getLatitude())
                            .longitude(p.getLongitude())
                            .build());
                }
            }
            if (!points.isEmpty()) {
                transferAreaMooringWaterAreaAnchorPointRepository.saveAll(points);
            }
        }
    }

    private void applySaveAction(TransferArea entity, String action) {
        UUID curUserId = SecurityUtils.getCurrentUserId();
        String currentUserId = curUserId != null ? curUserId.toString() : null;
        LocalDateTime now = LocalDateTime.now();
        switch (action) {
            case "DRAFT":
                entity.setApprovalStatus(ApprovalStatus.DRAFT);
                break;
            case "SUBMIT":
                entity.setSubmittedForApprovalAt(now);
                entity.setSubmittedForApprovalBy(currentUserId);
                entity.setRejectionReason(null);
                if (curUserId != null && approvalService.isDepartmentLevelUser(curUserId)) {
                    entity.setApprovalStatus(ApprovalStatus.APPROVED_LEVEL1);
                    entity.setPortAuthorityApprovedAt(now);
                    entity.setPortAuthorityApprovedBy(currentUserId);
                    entity.setLevel1ApprovalContent("Cấp Cục gửi trực tiếp");
                } else {
                    entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
                }
                break;
            case "APPROVED":
            case "SAVE_AND_APPROVE":
                entity.setApprovalStatus(ApprovalStatus.APPROVED);
                entity.setSubmittedForApprovalAt(now);
                entity.setSubmittedForApprovalBy(currentUserId);
                entity.setPortAuthorityApprovedAt(now);
                entity.setPortAuthorityApprovedBy(currentUserId);
                entity.setDepartmentApprovedAt(now);
                entity.setDepartmentApprovedBy(currentUserId);
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
        if (type == null) return null;
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
    String buildMooringWaterAreaSummary(List<TransferAreaMooringWaterArea> areas) {
        if (areas == null || areas.isEmpty()) return "";
        List<String> parts = new ArrayList<>();
        for (int i = 0; i < areas.size(); i++) {
            TransferAreaMooringWaterArea wa = areas.get(i);
            String desc = (wa.getDescription() != null && !wa.getDescription().isBlank())
                    ? wa.getDescription().trim() : ("Khu nước " + (i + 1));
            List<TransferAreaMooringWaterAreaAnchorPoint> points =
                    transferAreaMooringWaterAreaAnchorPointRepository.findByTransferAreaMooringWaterAreaId(wa.getId());
            String geometryLabel = switch (wa.getGeometryType() == null ? "" : wa.getGeometryType().trim().toUpperCase()) {
                case "POINT" -> "Đối tượng điểm";
                case "LINE" -> "Đối tượng đường";
                case "POLYGON" -> "Đối tượng vùng";
                default -> "Chưa xác định";
            };
            String coordinateSystemLabel = switch (wa.getCoordinateSystem() == null ? 0 : wa.getCoordinateSystem()) {
                case 1 -> "WGS-84";
                case 2 -> "VN-2000";
                default -> "Chưa xác định";
            };
            String pointSummary;
            if (points.isEmpty()) {
                pointSummary = "0 điểm";
            } else {
                String ptDetails = points.stream()
                        .map(p -> (p.getName() != null && !p.getName().isBlank() ? p.getName().trim() : "Điểm neo")
                                + (p.getLatitude() != null && p.getLongitude() != null ? " [" + p.getLatitude() + ", " + p.getLongitude() + "]" : ""))
                        .collect(Collectors.joining(", "));
                pointSummary = points.size() + " điểm: " + ptDetails;
            }
            parts.add(desc + " [Loại: " + geometryLabel + "; Hệ quy chiếu: " + coordinateSystemLabel
                    + "; Quy tắc hiển thị: "
                    + (wa.getDisplayRule() == null || wa.getDisplayRule().isBlank() ? "Chưa xác định" : wa.getDisplayRule().trim())
                    + "; " + pointSummary + "]");
        }
        return areas.size() + " khu nước: " + String.join("; ", parts);
    }

    /**
     * Ghi lịch sử file đính kèm Khu chuyển tải theo chuẩn snapshot bảng — chỉ khi hồ sơ đã duyệt.
     */
    private void recordTransferAreaAttachmentHistory(UUID transferAreaId, String oldFilesSummary, String newFilesSummary,
                                                      String affectedFileName, InfrastructureHistoryStatus status, Boolean skipHistory) {
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

            String oldVal = (oldFilesSummary == null || oldFilesSummary.isBlank()) ? null : oldFilesSummary.trim();
            String newVal = (newFilesSummary == null || newFilesSummary.isBlank()) ? null : newFilesSummary.trim();
            if (java.util.Objects.equals(oldVal, newVal)) {
                return;
            }

            boolean uploaded = status == InfrastructureHistoryStatus.ATTACHMENT_UPLOADED;
            historyRepository.save(InfrastructureHistory.builder()
                    .refId(transferAreaId)
                    .refType(InfrastructureType.TRANSSHIPMENT_AREA)
                    .approvalLevel(ApprovalLevel.LEVEL_0)
                    .status(status)
                    .approvedBy(SecurityUtils.getCurrentUserId())
                    .approvedDate(LocalDateTime.now())
                    .changedField("File đính kèm")
                    .previousValue(oldVal)
                    .newValue(newVal)
                    .build());
            log.info("Đã ghi lịch sử {} file đính kèm của Khu chuyển tải [{}]: [{}] -> [{}]",
                    uploaded ? "tải lên" : "xóa", transferAreaId, oldVal, newVal);
        } catch (Exception e) {
            log.warn("Không ghi được lịch sử file đính kèm Khu chuyển tải [{}]: {}", transferAreaId, e.getMessage());
        }
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

    private static String trimToNull(String value) {
        return (value != null && !value.trim().isEmpty()) ? value.trim() : null;
    }
}
