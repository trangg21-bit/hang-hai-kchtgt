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
import com.hanghai.kchtg.orgunit.service.OrgUnitCacheService;
import com.hanghai.kchtg.orgunit.service.OrgUnitScopeService;
import com.hanghai.kchtg.port.dto.dryport.CreateDryPortRequest;
import com.hanghai.kchtg.port.dto.dryport.DryPortResponse;
import com.hanghai.kchtg.port.dto.dryport.UpdateDryPortRequest;
import com.hanghai.kchtg.port.entity.DryPort;
import com.hanghai.kchtg.port.repository.DryPortRepository;
import com.hanghai.kchtg.port.service.shared.AuditLogService;
import com.hanghai.kchtg.port.service.shared.ChangeHistoryService;
import com.hanghai.kchtg.port.service.shared.UserResolverService;
import com.hanghai.kchtg.fieldvisibility.guard.FieldWriteGuard;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.hanghai.kchtg.port.dto.berth.AttachmentDto;
import com.hanghai.kchtg.port.entity.Attachment;
import com.hanghai.kchtg.port.repository.AttachmentRepository;
import org.springframework.beans.factory.annotation.Value;
import java.util.stream.Collectors;

/**
 * Service core for DryPort (Cảng cạn) CRUD operations.
 * Covers F-026 (create), F-027 (update), F-028 (soft-delete).
 * <p>
 * Business rules:
 * - Code (dryPortCode) is auto-generated CC-XXXXXX, immutable after creation
 * - Draft mode: only code + name required, approvalStatus=NHAP
 * - Submit mode: 6 mandatory fields checked → PENDING
 * - Approve mode: requires dryport:approve → APPROVED immediately
 * </p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DryPortService {

    private final DryPortRepository dryPortRepository;
    private final ChangeHistoryService changeHistoryService;
    private final AuditLogService auditLogService;
    private final UserResolverService userResolverService;
    private final UserRepository userRepository;
    private final InfrastructureHistoryRepository historyRepository;
    private final GisSpatialObjectService gisSpatialObjectService;
    private final OrgUnitCacheService orgUnitCacheService;
    private final OrgUnitScopeService orgUnitScopeService;
    private final AttachmentRepository attachmentRepository;

    @Value("${file.upload-dir:uploads}")
    private String uploadPath;

    // ── GENERATE CODE ───────────────────────────────────────────

    /**
     * Sinh mã cảng cạn tự động theo định dạng CC-XXXXXX (6 số).
     */
    @Transactional(readOnly = true)
    public String generateCode() {
        // Query max code from DB
        String maxCode = dryPortRepository.findMaxCode().orElse(null);
        int nextNumber = 1;
        if (maxCode != null && maxCode.startsWith("CC-")) {
            try {
                String numPart = maxCode.substring(3);
                nextNumber = Integer.parseInt(numPart) + 1;
            } catch (NumberFormatException e) {
                log.warn("Mã cảng cạn không đúng định dạng CC-XXXXXX: {}, bắt đầu từ 1", maxCode);
            }
        }
        String code = String.format("CC-%06d", nextNumber);
        log.info("Sinh mã cảng cạn: {}", code);
        return code;
    }

    // ── CREATE ──────────────────────────────────────────────────

    @Transactional
    public DryPortResponse create(CreateDryPortRequest request) {
        FieldWriteGuard.validateObject(request);
        String action = request.getSaveAction();
        if (action == null || action.trim().isEmpty()) {
            action = "submit";
        }
        if (!"draft".equals(action) && !"submit".equals(action) && !"approve".equals(action)) {
            throw new IllegalArgumentException(
                    "Action không hợp lệ: " + action + ". Chỉ chấp nhận 'draft', 'submit' hoặc 'approve'");
        }

        boolean isDraft = "draft".equals(action);
        boolean isApprove = "approve".equals(action);

        // Validate mandatory fields for non-draft
        if (!isDraft) {
            validateMandatoryFields(request.getOrgUnitId(), request.getDryPortName(),
                    request.getProvinceId(), request.getDetailedLocation(),
                    request.getTeuCapacity(), request.getPortStatus());
        }

        // Auto-generate code or validate format
        String dryPortCode = request.getDryPortCode();
        if (dryPortCode == null || dryPortCode.trim().isEmpty()) {
            dryPortCode = generateCode();
            log.info("Auto-generated dry port code: {}", dryPortCode);
        } else if (!dryPortCode.matches("^CC-\\d{6}$")) {
            throw new IllegalArgumentException("Mã cảng cạn không hợp lệ");
        }

        if (dryPortRepository.existsByDryPortCode(dryPortCode)) {
            throw new IllegalArgumentException("Mã " + dryPortCode + " đã tồn tại");
        }

        DryPort entity = DryPort.builder()
                .dryPortCode(dryPortCode)
                .dryPortName(request.getDryPortName())
                .provinceId(request.getProvinceId())
                .orgUnitId(request.getOrgUnitId())
                // General info
                .operatingUnit(request.getOperatingUnit())
                .region(request.getRegion())
                .detailedLocation(request.getDetailedLocation())
                .transportCorridor(request.getTransportCorridor())
                .area(request.getArea())
                .warehouseArea(request.getWarehouseArea())
                .yardArea(request.getYardArea())
                .teuCapacity(request.getTeuCapacity())
                .connectionMode(request.getConnectionMode())
                .portStatus(request.getPortStatus() != null ? request.getPortStatus() : 0)
                .operationalStatus(request.getOperationalStatus())
                .remarks(request.getRemarks())
                // Approval
                .approvalStatus(isDraft ? ApprovalStatus.DRAFT
                        : isApprove ? ApprovalStatus.APPROVED : ApprovalStatus.PENDING_APPROVAL)
                // GIS
                .mapSymbolId(request.getMapSymbolId())
                .coordinateSystem(request.getCoordinateSystem())
                .displayRule(request.getDisplayRule())
                // Announcement
                .announcementTime(request.getAnnouncementTime())
                .announcementDecisionNumber(request.getAnnouncementDecisionNumber())
                .announcementDecisionDate(request.getAnnouncementDecisionDate())
                .announcementOrg(request.getAnnouncementOrg())
                .build();

        DryPort saved = dryPortRepository.save(entity);

        // Actor thật từ SecurityContext — nếu truyền "system", ChangeHistoryService
        // fallback auth.getName() (= username, không phải UUID) → approvedBy null → drawer hiện "—"
        UUID operatorId = SecurityUtils.getCurrentUserId();
        String actorId = operatorId != null ? operatorId.toString() : "system";

        // Spatial sync
        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null
                && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (coordinates != null && !coordinates.trim().isEmpty()) {
            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType()
                    : GisGeometryType.POINT;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    null,
                    saved.getDryPortName(),
                    "DRYPORT_" + saved.getDryPortCode(),
                    geomType,
                    objType,
                    coordinates,
                    saved.getId(),
                    InfrastructureType.DRY_PORT);
            saved.setSpatialId(spatialObj.getId());
            saved = dryPortRepository.save(saved);
        }

        // If approve action, write audit log
        if (isApprove) {
            auditLogService.writeAuditLog(
                    actorId,
                    "DRYPORT_CREATE_APPROVE",
                    "Tạo mới và phê duyệt cảng cạn: " + saved.getDryPortCode(),
                    null);
        }

        log.info("Created DryPort [{}] code={} action={}", saved.getId(), saved.getDryPortCode(), action);
        return toResponse(saved);
    }

    // ── READ ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DryPortResponse getById(UUID id) {
        return toResponse(dryPortRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + id)));
    }

    @Transactional(readOnly = true)
    public Page<DryPortResponse> findAll(int page, int size, UUID orgUnitId) {
        return findAll(page, size, orgUnitId, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<DryPortResponse> findAll(int page, int size, UUID orgUnitId, Integer provinceId,
            String search, String status, String approvalStatus) {
        return findAll(page, size, orgUnitId, provinceId, search, status, approvalStatus,
                null, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public Page<DryPortResponse> findAll(int page, int size, UUID orgUnitId, Integer provinceId,
            String search, String status, String approvalStatus, String region, Integer portStatus,
            String updatedFrom, String updatedTo, String code, String transportCorridor) {
        int pageSize = Math.min(Math.max(size, 1), 5000);
        Pageable pageable = PageRequest.of(page, pageSize,
                Sort.by(Sort.Order.desc(EntityFields.UPDATED_AT), Sort.Order.desc(EntityFields.CREATED_AT), Sort.Order.asc(EntityFields.ID)));
        OperationalStatus statusEnum = status != null ? OperationalStatus.fromString(status) : null;
        ApprovalStatus approvalEnum = approvalStatus != null ? ApprovalStatus.fromString(approvalStatus) : null;
        LocalDateTime updatedFromDt = null;
        if (updatedFrom != null && !updatedFrom.trim().isEmpty()) {
            try {
                updatedFromDt = LocalDateTime.parse(updatedFrom.replace(" ", "T"));
            } catch (Exception e) {
                /* ignore */
            }
        }
        LocalDateTime updatedToDt = null;
        if (updatedTo != null && !updatedTo.trim().isEmpty()) {
            try {
                updatedToDt = LocalDateTime.parse(updatedTo.replace(" ", "T"));
            } catch (Exception e) {
                /* ignore */
            }
        }
        // Mở rộng cây đơn vị: chọn đơn vị cha → gồm cả cảng cạn của toàn bộ đơn vị con (hậu duệ) — giống bến cảng
        boolean includeAll = orgUnitId == null;
        List<UUID> orgUnitIds = orgUnitId != null ? orgUnitScopeService.resolveSubtreeIds(orgUnitId) : List.of();
        Page<DryPort> pageResult = dryPortRepository.searchDryPorts(includeAll, orgUnitIds, provinceId, search, statusEnum,
                approvalEnum, code, transportCorridor, region, portStatus, updatedFromDt, updatedToDt, pageable);

        java.util.Set<UUID> userUuids = new java.util.HashSet<>();
        pageResult.getContent().forEach(e -> {
            try {
                if (e.getCreatedBy() != null)
                    userUuids.add(e.getCreatedBy());
                if (e.getUpdatedBy() != null)
                    userUuids.add(e.getUpdatedBy());
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

        return pageResult
                .map(e -> toResponse(e, userNamesMap.get(e.getCreatedBy()), userNamesMap.get(e.getUpdatedBy())));
    }

    @Transactional(readOnly = true)
    public DryPortResponse findByCode(String dryPortCode) {
        return toResponse(dryPortRepository.findByDryPortCode(dryPortCode)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với mã: " + dryPortCode)));
    }

    // ── UPDATE ──────────────────────────────────────────────────

    @Transactional
    public DryPortResponse update(UpdateDryPortRequest request) {
        FieldWriteGuard.validateObject(request);
        DryPort entity = dryPortRepository.findById(request.getId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + request.getId()));

        String action = request.getSaveAction();
        boolean isSubmit = "submit".equals(action);
        boolean isApprove = "approve".equals(action);

        // Validate mandatory fields for submit/approve
        if (isSubmit || isApprove) {
            UUID orgUnitId = request.getOrgUnitId() != null ? request.getOrgUnitId() : entity.getOrgUnitId();
            String name = request.getDryPortName() != null ? request.getDryPortName() : entity.getDryPortName();
            Integer provinceId = request.getProvinceId() != null ? request.getProvinceId() : entity.getProvinceId();
            String detailedLocation = request.getDetailedLocation() != null ? request.getDetailedLocation()
                    : entity.getDetailedLocation();
            java.math.BigDecimal teuCapacity = request.getTeuCapacity() != null ? request.getTeuCapacity()
                    : entity.getTeuCapacity();
            Integer portStatus = request.getPortStatus() != null ? request.getPortStatus() : entity.getPortStatus();
            validateMandatoryFields(orgUnitId, name, provinceId, detailedLocation, teuCapacity, portStatus);
        }

        // Capture pre-mutation snapshot
        DryPort snapshot = captureSnapshot(entity);
        log.info("DryPort update: snapshot captured for id={}, name={}", entity.getId(), entity.getDryPortName());

        // Update mutable fields — code is immutable
        if (request.getDryPortName() != null)
            entity.setDryPortName(request.getDryPortName());
        if (request.getProvinceId() != null)
            entity.setProvinceId(request.getProvinceId());
        if (request.getOrgUnitId() != null)
            entity.setOrgUnitId(request.getOrgUnitId());
        // General info
        if (request.getOperatingUnit() != null)
            entity.setOperatingUnit(request.getOperatingUnit());
        if (request.getRegion() != null)
            entity.setRegion(request.getRegion());
        if (request.getDetailedLocation() != null)
            entity.setDetailedLocation(request.getDetailedLocation());
        if (request.getTransportCorridor() != null)
            entity.setTransportCorridor(request.getTransportCorridor());
        if (request.getArea() != null)
            entity.setArea(request.getArea());
        if (request.getWarehouseArea() != null)
            entity.setWarehouseArea(request.getWarehouseArea());
        if (request.getYardArea() != null)
            entity.setYardArea(request.getYardArea());
        if (request.getTeuCapacity() != null)
            entity.setTeuCapacity(request.getTeuCapacity());
        if (request.getConnectionMode() != null)
            entity.setConnectionMode(request.getConnectionMode());
        if (request.getPortStatus() != null)
            entity.setPortStatus(request.getPortStatus());
        if (request.getOperationalStatus() != null)
            entity.setOperationalStatus(request.getOperationalStatus());
        if (request.getRemarks() != null)
            entity.setRemarks(request.getRemarks());
        // Announcement
        if (request.getAnnouncementTime() != null)
            entity.setAnnouncementTime(request.getAnnouncementTime());
        if (request.getAnnouncementDecisionNumber() != null)
            entity.setAnnouncementDecisionNumber(request.getAnnouncementDecisionNumber());
        if (request.getAnnouncementDecisionDate() != null)
            entity.setAnnouncementDecisionDate(request.getAnnouncementDecisionDate());
        if (request.getAnnouncementOrg() != null)
            entity.setAnnouncementOrg(request.getAnnouncementOrg());
        // GIS
        entity.setMapSymbolId(request.getMapSymbolId());
        if (request.getCoordinateSystem() != null)
            entity.setCoordinateSystem(request.getCoordinateSystem());
        if (request.getDisplayRule() != null)
            entity.setDisplayRule(request.getDisplayRule());

        // Set approval status
        ApprovalStatus previousApprovalStatus = snapshot.getApprovalStatus();
        boolean wasApproved = previousApprovalStatus == ApprovalStatus.APPROVED
                || previousApprovalStatus == ApprovalStatus.APPROVED_LEVEL2;

        if (wasApproved) {
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
        } else if (isSubmit) {
            entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        } else if (isApprove) {
            entity.setApprovalStatus(ApprovalStatus.APPROVED);
            UUID currentUserId = SecurityUtils.getCurrentUserId();
            auditLogService.writeAuditLog(
                    currentUserId != null ? currentUserId.toString() : "system",
                    "DRYPORT_UPDATE_APPROVE",
                    "Cập nhật và phê duyệt cảng cạn: " + entity.getDryPortCode(),
                    null);
        }

        DryPort saved = dryPortRepository.save(entity);

        // Actor thật từ SecurityContext — nếu truyền "system", ChangeHistoryService
        // fallback auth.getName() (= username, không phải UUID) → approvedBy null → drawer hiện "—"
        UUID operatorId = SecurityUtils.getCurrentUserId();
        String actorId = operatorId != null ? operatorId.toString() : "system";

        // Spatial sync
        String coordinates = request.getCoordinates();
        if ((coordinates == null || coordinates.trim().isEmpty()) && request.getLongitude() != null
                && request.getLatitude() != null) {
            coordinates = "POINT(" + request.getLongitude() + " " + request.getLatitude() + ")";
        }

        if (coordinates != null && !coordinates.trim().isEmpty()) {
            // Lấy tọa độ + loại hình cũ (WKT) từ pre-image (snapshot) trước khi
            // createOrUpdate ghi đè spatial object (chuẩn PortService update).
            GisGeometryType oldGeomType = null;
            String oldWkt = null;
            if (snapshot.getSpatialId() != null) {
                GisSpatialObject oldSpatial = gisSpatialObjectService.findById(snapshot.getSpatialId())
                        .orElse(null);
                if (oldSpatial != null) {
                    oldWkt = oldSpatial.getCoordinates();
                    oldGeomType = oldSpatial.getGeometryType();
                }
            }

            GisGeometryType geomType = request.getGeometryType() != null ? request.getGeometryType()
                    : GisGeometryType.POINT;
            GisSpatialObjectType objType = getSpatialObjectType(geomType);
            GisSpatialObject spatialObj = gisSpatialObjectService.createOrUpdate(
                    saved.getSpatialId(),
                    saved.getDryPortName(),
                    "DRYPORT_" + saved.getDryPortCode(),
                    geomType,
                    objType,
                    coordinates,
                    saved.getId(),
                    InfrastructureType.DRY_PORT);
            saved.setSpatialId(spatialObj.getId());
            saved = dryPortRepository.save(saved);

            // Lịch sử vị trí theo chuẩn Cảng biển: 2 dòng riêng "Tọa độ GIS" +
            // "Loại đối tượng GIS", kèm approvedBy = user thật (chỉ khi hồ sơ đã duyệt).
            if (wasApproved) {
                String newWkt = coordinates.trim();
                boolean wktChanged = oldWkt == null || !newWkt.equals(oldWkt.trim());
                boolean typeChanged = request.getGeometryType() != null && oldGeomType != geomType;
                if (wktChanged) {
                    changeHistoryService.insertChangeRecord("DryPort", saved.getId(), "Tọa độ GIS",
                            (oldWkt == null || oldWkt.trim().isEmpty()) ? "Chưa có" : oldWkt.trim(),
                            newWkt, actorId);
                }
                if (typeChanged) {
                    changeHistoryService.insertChangeRecord("DryPort", saved.getId(), "Loại đối tượng GIS",
                            oldGeomType != null ? geometryTypeLabel(oldGeomType) : "Chưa có",
                            geometryTypeLabel(geomType), actorId);
                }
            }
        }

        if (wasApproved) {
            java.util.List<String> changed = changeHistoryService.recordChanges("DryPort", saved.getId().toString(),
                    actorId, snapshot, saved);
            log.info("DryPort update: recorded {} changed fields for id={}: {}", changed.size(), saved.getId(), changed);
        }

        log.info("Updated DryPort [{}] code={} action={}", saved.getId(), saved.getDryPortCode(),
                action != null ? action : "default");
        return toResponse(saved);
    }

    // ── SUBMIT (from list page F-083) ─────────────────────────────

    @Transactional
    public DryPortResponse submit(UUID id) {
        DryPort entity = dryPortRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + id));

        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT) {
            throw new IllegalStateException("Chỉ có thể gửi phê duyệt bản ghi ở trạng thái Nháp");
        }

        validateMandatoryFields(entity.getOrgUnitId(), entity.getDryPortName(),
                entity.getProvinceId(), entity.getDetailedLocation(),
                entity.getTeuCapacity(), entity.getPortStatus());

        DryPort snapshot = captureSnapshot(entity);
        entity.setApprovalStatus(ApprovalStatus.PENDING_APPROVAL);
        DryPort saved = dryPortRepository.save(entity);
        UUID operatorId = SecurityUtils.getCurrentUserId();
        String actorId = operatorId != null ? operatorId.toString() : "system";
        changeHistoryService.recordChanges("DryPort", saved.getId().toString(), actorId, snapshot, saved);
        log.info("Submitted DryPort [{}] for approval", saved.getId());
        return toResponse(saved);
    }

    // ── DELETE ──────────────────────────────────────────────────

    @Transactional
    public void softDelete(UUID id) {
        DryPort entity = dryPortRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn với id: " + id));
        if (entity.getApprovalStatus() != ApprovalStatus.DRAFT) {
            throw new IllegalArgumentException("Chỉ được xóa cảng cạn ở trạng thái Nháp");
        }
        DryPort snapshot = captureSnapshot(entity);
        UUID operatorId = SecurityUtils.getCurrentUserId();
        String actorId = operatorId != null ? operatorId.toString() : "system";
        entity.softDelete(operatorId);
        dryPortRepository.save(entity);
        if (entity.getSpatialId() != null) {
            gisSpatialObjectService.delete(entity.getSpatialId());
        }
        log.info("Soft-deleted DryPort [{}] code={}", entity.getId(), entity.getDryPortCode());
    }

    // ── SOFT-DELETE RESTORE (giống cảng biển) ──────────────────

    /**
     * Khôi phục cảng cạn đã xóa mềm.
     * Chỉ restore nếu deletedAt không null và trong vòng 90 ngày.
     * Sử dụng native query để bypass @SQLRestriction.
     */
    @Transactional
    public DryPortResponse restore(UUID id) {
        // Tìm cảng cạn đã xóa (native query bypasses @SQLRestriction)
        Object[] deletedInfo = dryPortRepository.findDeletedDryPortById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy cảng cạn đã xóa với id: " + id));

        LocalDateTime deletedAt = (LocalDateTime) deletedInfo[1];

        // Kiểm tra 90 ngày
        if (deletedAt.isBefore(LocalDateTime.now().minusDays(90))) {
            throw new IllegalArgumentException(
                    "Cảng cạn đã bị xóa quá 90 ngày (từ " + deletedAt + "), không thể khôi phục");
        }

        // Thực hiện restore
        int updated = dryPortRepository.restoreDryPortById(id);
        if (updated == 0) {
            throw new IllegalStateException("Không thể khôi phục cảng cạn: không tìm thấy bản ghi đã xóa");
        }

        // Tải lại entity đã khôi phục (now deleted_at = NULL, @SQLRestriction matches)
        DryPort restored = dryPortRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không thể tải cảng cạn sau khi khôi phục"));

        log.info("Restored DryPort [{}] code={}", restored.getId(), restored.getDryPortCode());
        return toResponse(restored);
    }

    // ── VALIDATION ──────────────────────────────────────────────

    private void validateMandatoryFields(UUID orgUnitId, String name, Integer provinceId,
            String detailedLocation, java.math.BigDecimal teuCapacity,
            Integer portStatus) {
        java.util.List<String> missing = new java.util.ArrayList<>();
        if (orgUnitId == null)
            missing.add("Đơn vị quản lý");
        if (name == null || name.trim().isEmpty())
            missing.add("Tên cảng cạn");
        if (provinceId == null)
            missing.add("Tỉnh/TP");
        if (detailedLocation == null || detailedLocation.trim().isEmpty())
            missing.add("Địa chỉ chi tiết");
        if (teuCapacity == null)
            missing.add("Công suất khai thác (TEU)");
        if (portStatus == null)
            missing.add("Tình trạng");
        if (!missing.isEmpty()) {
            throw new IllegalArgumentException(
                    "Vui lòng hoàn thiện thông tin trước khi gửi. Thiếu: " + String.join(", ", missing));
        }
    }

    // ── SNAPSHOT ────────────────────────────────────────────────

    private DryPort captureSnapshot(DryPort e) {
        return DryPort.builder()
                .dryPortCode(e.getDryPortCode()).dryPortName(e.getDryPortName())
                .provinceId(e.getProvinceId()).orgUnitId(e.getOrgUnitId())
                .operatingUnit(e.getOperatingUnit()).region(e.getRegion())
                .detailedLocation(e.getDetailedLocation()).transportCorridor(e.getTransportCorridor())
                .area(e.getArea()).warehouseArea(e.getWarehouseArea()).yardArea(e.getYardArea())
                .teuCapacity(e.getTeuCapacity()).connectionMode(e.getConnectionMode())
                .portStatus(e.getPortStatus()).operationalStatus(e.getOperationalStatus())
                .remarks(e.getRemarks())
                .announcementTime(e.getAnnouncementTime()).announcementDecisionNumber(e.getAnnouncementDecisionNumber())
                .announcementDecisionDate(e.getAnnouncementDecisionDate()).announcementOrg(e.getAnnouncementOrg())
                .mapSymbolId(e.getMapSymbolId())
                .coordinateSystem(e.getCoordinateSystem()).displayRule(e.getDisplayRule())
                .approvalStatus(e.getApprovalStatus()).spatialId(e.getSpatialId())
                .build();
    }

    // ── RESPONSE MAPPING ─────────────────────────────────────────

    private DryPortResponse toResponse(DryPort e) {
        return toResponse(e, null, null);
    }

    private DryPortResponse toResponse(DryPort e, String preResolvedCreatorName, String preResolvedUpdaterName) {
        String createdBy = preResolvedCreatorName != null ? preResolvedCreatorName
                : userResolverService.resolveName(e.getCreatedBy());
        String updatedBy = preResolvedUpdaterName != null ? preResolvedUpdaterName
                : userResolverService.resolveName(e.getUpdatedBy());

        DryPortResponse.DryPortResponseBuilder builder = DryPortResponse.builder()
                .id(e.getId())
                .dryPortCode(e.getDryPortCode()).dryPortName(e.getDryPortName())
                .provinceId(e.getProvinceId()).orgUnitId(e.getOrgUnitId())
                .orgUnitName(orgUnitCacheService.getName(e.getOrgUnitId()))
                // General info
                .operatingUnit(e.getOperatingUnit()).region(e.getRegion())
                .detailedLocation(e.getDetailedLocation()).transportCorridor(e.getTransportCorridor())
                .area(e.getArea()).warehouseArea(e.getWarehouseArea()).yardArea(e.getYardArea())
                .teuCapacity(e.getTeuCapacity()).connectionMode(e.getConnectionMode())
                .portStatus(e.getPortStatus()).operationalStatus(e.getOperationalStatus())
                .remarks(e.getRemarks())
                // Announcement
                .announcementTime(e.getAnnouncementTime()).announcementDecisionNumber(e.getAnnouncementDecisionNumber())
                .announcementDecisionDate(e.getAnnouncementDecisionDate()).announcementOrg(e.getAnnouncementOrg())
                // GIS
                .coordinateSystem(e.getCoordinateSystem()).displayRule(e.getDisplayRule())
                .mapSymbolId(e.getMapSymbolId())
                // Audit
                .approvalStatus(e.getApprovalStatus())
                .createdBy(e.getCreatedBy()).updatedBy(e.getUpdatedBy())
                .createdAt(e.getCreatedAt()).updatedAt(e.getUpdatedAt());

        if (e.getSpatialId() != null) {
            builder.spatialId(e.getSpatialId());
            gisSpatialObjectService.findById(e.getSpatialId()).ifPresent(spatialObj -> {
                builder.geometryType(spatialObj.getGeometryType());
                builder.coordinates(spatialObj.getCoordinates());
                try {
                    String clean = spatialObj.getCoordinates().replace("POINT", "").replace("(", "").replace(")", "")
                            .trim();
                    String[] parts = clean.split("\\s+");
                    if (parts.length == 2) {
                        builder.longitude(new java.math.BigDecimal(parts[0]));
                        builder.latitude(new java.math.BigDecimal(parts[1]));
                    }
                } catch (Exception ex) {
                    // ignore
                }
            });
        }
        return builder.build();
    }

    // ── Attachment operations (chuẩn Cảng biển / Bến cảng) ──────────────────────────

    @Transactional
    public List<AttachmentDto> uploadAttachmentsGeneric(UUID dryPortId, List<MultipartFile> files, UUID userId, Boolean skipHistory) {
        List<Attachment> saved = new ArrayList<>();
        List<String> uploadedFileNames = new ArrayList<>();
        java.nio.file.Path basePath = java.nio.file.Paths.get(uploadPath).toAbsolutePath().normalize();

        // 1. Summary danh sách file cũ trước khi upload (bảng file đính kèm)
        List<Attachment> existingAtts = attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("DRY_PORT", dryPortId);
        List<String> fileListBefore = existingAtts.stream()
                .map(Attachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.toList());
        String oldFilesSummary = String.join(", ", fileListBefore);

        for (MultipartFile f : files) {
            String fn = f.getOriginalFilename() != null ? f.getOriginalFilename() : "unknown";
            String storageFileName = System.currentTimeMillis() + "_" + fn;
            java.nio.file.Path dir = basePath.resolve("DRY_PORT").resolve(dryPortId.toString());
            java.nio.file.Path filePath = dir.resolve(storageFileName);
            try {
                java.nio.file.Files.createDirectories(dir);
                f.transferTo(filePath.toFile());
            } catch (Exception e) {
                throw new RuntimeException("Không thể lưu: " + fn);
            }
            String sp = filePath.toString();
            Attachment a = new Attachment();
            a.setEntityType("DRY_PORT");
            a.setEntityId(dryPortId);
            a.setFileName(fn);
            a.setFilePath(sp);
            a.setFileSize(f.getSize());
            a.setContentType(f.getContentType());
            a.setUploadedBy(userId);
            saved.add(attachmentRepository.save(a));
            uploadedFileNames.add(fn);
        }

        // 2. Summary danh sách file mới sau khi upload (bảng file đính kèm đầy đủ)
        List<String> fileListAfter = new ArrayList<>(fileListBefore);
        for (String fn : uploadedFileNames) {
            if (fn != null && !fn.isBlank() && !fileListAfter.contains(fn.trim())) {
                fileListAfter.add(fn.trim());
            }
        }
        String newFilesSummary = String.join(", ", fileListAfter);

        if (!uploadedFileNames.isEmpty()) {
            recordAttachmentHistory(dryPortId, userId, oldFilesSummary, newFilesSummary, String.join(", ", uploadedFileNames),
                    InfrastructureHistoryStatus.ATTACHMENT_UPLOADED, skipHistory);
        }
        return saved.stream().map(this::toAttachmentDto).collect(Collectors.toList());
    }

    public List<AttachmentDto> uploadAttachmentsGeneric(UUID dryPortId, List<MultipartFile> files, UUID userId) {
        return uploadAttachmentsGeneric(dryPortId, files, userId, null);
    }

    public List<AttachmentDto> listAttachmentsGeneric(UUID dryPortId) {
        return attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("DRY_PORT", dryPortId)
                .stream().map(this::toAttachmentDto).collect(Collectors.toList());
    }

    @Transactional
    public void deleteAttachmentGeneric(UUID dryPortId, UUID attId, UUID userId, Boolean skipHistory) {
        Attachment a = attachmentRepository.findById(attId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy: " + attId));

        // 1. Summary danh sách file trước khi xóa
        List<Attachment> existingAtts = attachmentRepository.findByEntityTypeAndEntityIdOrderByUploadedAtDesc("DRY_PORT", dryPortId);
        String oldFilesSummary = existingAtts.stream()
                .map(Attachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));

        // 2. Summary danh sách file sau khi xóa
        String newFilesSummary = existingAtts.stream()
                .filter(att -> !att.getId().equals(attId))
                .map(Attachment::getFileName)
                .filter(fn -> fn != null && !fn.isBlank())
                .map(String::trim)
                .collect(Collectors.joining(", "));

        try {
            java.nio.file.Files.deleteIfExists(java.nio.file.Paths.get(a.getFilePath()));
        } catch (Exception e) {
            log.warn("Xóa file thất bại: {}", a.getFilePath());
        }
        attachmentRepository.delete(a);
        recordAttachmentHistory(dryPortId, userId, oldFilesSummary, newFilesSummary, a.getFileName(),
                InfrastructureHistoryStatus.ATTACHMENT_DELETED, skipHistory);
    }

    public void deleteAttachmentGeneric(UUID dryPortId, UUID attId, UUID userId) {
        deleteAttachmentGeneric(dryPortId, attId, userId, null);
    }

    public Attachment getAttachmentGeneric(UUID dryPortId, UUID attId) {
        Attachment a = attachmentRepository.findById(attId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy file đính kèm: " + attId));
        boolean owned = a.getEntityType() != null && a.getEntityType().equals("DRY_PORT") && dryPortId.equals(a.getEntityId());
        if (!owned) {
            throw new EntityNotFoundException("File đính kèm không thuộc Cảng cạn này");
        }
        return a;
    }

    private AttachmentDto toAttachmentDto(Attachment e) {
        AttachmentDto d = new AttachmentDto();
        d.setId(e.getId());
        d.setEntityType(e.getEntityType());
        d.setEntityId(e.getEntityId());
        d.setFileName(e.getFileName());
        d.setFilePath(e.getFilePath());
        d.setFileSize(e.getFileSize());
        d.setContentType(e.getContentType());
        d.setUploadedBy(e.getUploadedBy());
        d.setUploadedAt(e.getUploadedAt());
        return d;
    }

    private void recordAttachmentHistory(UUID dryPortId, UUID userId, String oldFilesSummary, String newFilesSummary,
            String affectedFileName, InfrastructureHistoryStatus status, Boolean skipHistory) {
        if (Boolean.TRUE.equals(skipHistory)) return;
        if (userId == null || historyRepository == null) return;
        DryPort dryPort = dryPortRepository.findById(dryPortId).orElse(null);
        if (dryPort == null) return;
        boolean approved = dryPort.getApprovalStatus() == ApprovalStatus.APPROVED
                || dryPort.getApprovalStatus() == ApprovalStatus.APPROVED_LEVEL2;
        if (!approved) return;

        String oldVal = (oldFilesSummary == null || oldFilesSummary.isBlank()) ? null : oldFilesSummary.trim();
        String newVal = (newFilesSummary == null || newFilesSummary.isBlank()) ? null : newFilesSummary.trim();
        if (java.util.Objects.equals(oldVal, newVal)) {
            return;
        }

        boolean uploaded = status == InfrastructureHistoryStatus.ATTACHMENT_UPLOADED;
        historyRepository.save(InfrastructureHistory.builder()
                .refId(dryPortId)
                .refType(InfrastructureType.DRY_PORT)
                .approvalLevel(ApprovalLevel.LEVEL_0)
                .status(status)
                .approvedBy(userId)
                .approvedDate(LocalDateTime.now())
                .reason((uploaded ? "Tải lên tài liệu đính kèm: " : "Xóa tài liệu đính kèm: ") + affectedFileName)
                .changedField("File đính kèm")
                .previousValue(oldVal)
                .newValue(newVal)
                .build());
        log.info("[DryPortService] Đã ghi lịch sử {} file đính kèm của Cảng cạn [{}]: [{}] -> [{}]",
                uploaded ? "tải lên" : "xóa", dryPortId, oldVal, newVal);
    }

    @Transactional
    public void uploadAttachments(UUID id, List<MultipartFile> files, UUID userId, Boolean skipHistory) {
        uploadAttachmentsGeneric(id, files, userId, skipHistory);
    }

    @Transactional
    public void uploadAttachments(UUID id, List<MultipartFile> files, UUID userId) {
        uploadAttachmentsGeneric(id, files, userId, null);
    }

    @Transactional
    public void deleteAttachment(UUID id, UUID attId, Boolean skipHistory) {
        UUID userId = SecurityUtils.getCurrentUserId();
        deleteAttachmentGeneric(id, attId, userId, skipHistory);
    }

    @Transactional
    public void deleteAttachment(UUID id, UUID attId) {
        deleteAttachment(id, attId, null);
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

    private GisSpatialObjectType getSpatialObjectType(GisGeometryType geomType) {
        if (geomType == GisGeometryType.POINT)
            return GisSpatialObjectType.POINT_PORT;
        if (geomType == GisGeometryType.LINE)
            return GisSpatialObjectType.LINE_OTHER;
        return GisSpatialObjectType.POLYGON_OTHER;
    }
}
